import React, { useEffect, useRef, useState } from "react";
import { X, Video, VideoOff, Mic, MicOff, ScreenShare, PhoneOff, Users, Settings, Maximize2 } from "lucide-react";
import VcWrapper from "./VcWrapper";
import { socket } from "../sockets/socket";

const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun.l.google.com:5349" },
    { urls: "stun:stun1.l.google.com:3478" },
    { urls: "stun:stun1.l.google.com:5349" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:5349" },
    { urls: "stun:stun3.l.google.com:3478" },
    { urls: "stun:stun3.l.google.com:5349" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:5349" }
];

const VideoRoom = ({ workspaceName, onClose, workspaceId, userId }) => {
    //  to keep the track of stram and who is in it
    const [remoteStreams, setRemoteStreams] = useState([]);
    const [userOnCall, setUserOncall] = useState(1)
    const localVideoRef = useRef(null);       // ref to our own <video> element
    const localStreamRef = useRef(null);      // our camera/mic stream
    const peerConnections = useRef({});       // { socketId: RTCPeerConnection }

    useEffect(() => {
        let stream;
        const start = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
            } catch (err) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: false,
                        audio: true
                    });

                } catch (error) {
                    console.log("ERROR:", error);

                }
            }

            if (stream) {
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            }

            socket.emit("video-join", { workSpaceId: workspaceId, userId });
        };
        start();

        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };

    }, [])


    useEffect(() => {

        const creatPeerConnection = (remoteSocketId) => {
            // set up your own pear on server 
            const pc = new RTCPeerConnection({ iceServers: iceServers })
            // when pear is redy send this detail to the user 

            pc.onicecandidate = ({ candidate }) => {
                socket.emit("video-ice-candidate", {
                    to: remoteSocketId,
                    candidate,
                    workSpaceId: workspaceId
                });
            }

            //  set others streem on to you device 

            pc.ontrack = ({ streams }) => {
                setRemoteStreams((prev) => {
                    const exists = prev.find(r => r.socketId === remoteSocketId);
                    if (exists) {
                        return prev.map((item) => (item.socketId === remoteSocketId ? { ...item, stream: streams[0] }
                            : item))
                    }
                    return [...prev, { socketId: remoteSocketId, stream: streams[0] }];
                })
            }


            localStreamRef.current?.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
            peerConnections.current[remoteSocketId] = pc;
            return pc;

        }

        socket.on("video-existing-peers", async (existingUsers) => {
            const peersToConnect = existingUsers.filter(u => u.socketId !== socket.id);
            setUserOncall(peersToConnect.length + 1)
            for (let i = 0; i < peersToConnect.length; i++) {
                const pc = creatPeerConnection(peersToConnect[i].socketId);

                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);

                    socket.emit("video-offer", {
                        to: peersToConnect[i].socketId,
                        offer,
                        workSpaceId: workspaceId,
                        from: socket.id
                    });
                } catch (err) {
                    console.error("Error creating offer:", err);
                }
            }
        })

        socket.on("video-offer", async (payload) => {
            const { from, offer, to } = payload;
            if (to !== socket.id || from === socket.id) return;

            let pc = peerConnections.current[from];
            if (!pc) pc = creatPeerConnection(from);

            // If we're already in a signaling state, ignore duplicate offers
            if (pc.signalingState !== "stable") return;

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.emit("video-answer", {
                    to: from,
                    answer,
                    workSpaceId: workspaceId,
                    from: socket.id
                });
            } catch (err) {
                console.error("Error handling video-offer:", err);
            }
        })


        socket.on("video-answer", async ({ from, answer }) => {
            const pc = peerConnections.current[from];
            if (pc && pc.signalingState === "have-local-offer") {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                } catch (err) {
                    console.error("Error setting remote answer:", err);
                }
            }
        });

        socket.on("video-peer-joined", ({ socketId }) => {
            setUserOncall(prev => prev + 1);
            creatPeerConnection(socketId);
            // just create the connection object and wait
            // their offer will arrive via the video-offer event below
        });

        // ── we received an ICE candidate from someone ──
        socket.on("video-ice-candidate", async ({ from, candidate }) => {
            const pc = peerConnections.current[from];
            if (pc && candidate) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("Error adding ICE candidate:", err);
                }
            }
        });


        socket.on("video-peer-left", ({ socketId }) => {
            setUserOncall(prev => Math.max(1, prev - 1));
            peerConnections.current[socketId]?.close();
            delete peerConnections.current[socketId];
            setRemoteStreams(prev => prev.filter(r => r.socketId !== socketId));
        });

        return () => {
            socket.emit("video-leave", { workSpaceId: workspaceId });
            socket.off("video-existing-peers");
            socket.off("video-peer-joined");
            socket.off("video-offer");
            socket.off("video-answer");
            socket.off("video-ice-candidate");
            socket.off("video-peer-left");
            setUserOncall(1)
            Object.values(peerConnections.current).forEach(pc => pc.close());
            peerConnections.current = {};
        };

    }, [workspaceId]);


    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isAudioMuted, setIsAudioMuted] = useState(false);

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = isVideoMuted;
            });
            setIsVideoMuted(!isVideoMuted);
        }
    };

    const toggleAudio = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = isAudioMuted;
            });
            setIsAudioMuted(!isAudioMuted);
        }
    };

    return (
        <VcWrapper workspaceName={workspaceName} onClose={onClose} participents={userOnCall}>
            <div className="video-room-shell" style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                padding: "24px",
                height: "100%",
                overflow: "hidden",
                position: "relative"
            }}>
                <style>{`
                  @media (max-width: 768px) {
                    .video-room-shell {
                      gap: 0.75rem !important;
                      padding: 0.75rem !important;
                    }
                    .video-room-grid {
                      grid-template-columns: 1fr !important;
                      gap: 0.75rem !important;
                      padding-bottom: 84px !important;
                    }
                    .video-room-controls {
                      bottom: 10px !important;
                      left: 10px !important;
                      right: 10px !important;
                      transform: none !important;
                      justify-content: space-between;
                      gap: 8px !important;
                      padding: 10px 12px !important;
                      border-radius: 14px !important;
                    }
                    .video-room-controls button {
                      height: 42px !important;
                    }
                    .video-room-end-btn {
                      padding: 0 14px !important;
                      font-size: 0.82rem;
                    }
                    .video-room-label {
                      left: 10px !important;
                      bottom: 10px !important;
                      padding: 6px 10px !important;
                      font-size: 0.74rem !important;
                    }
                  }
                `}</style>
                <div className="video-room-grid" style={{
                    flex: 1,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "20px",
                    overflowY: "auto",
                    paddingBottom: "100px", // space for floating controls
                    scrollbarWidth: "none"
                }}>
                    {/* Local Video Area */}
                    <div style={{
                        position: "relative",
                        borderRadius: "24px",
                        overflow: "hidden",
                        background: "rgba(15,23,42,0.6)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                        aspectRatio: "16/9"
                    }}>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transform: "scaleX(-1)",
                                opacity: isVideoMuted ? 0 : 1,
                                transition: "opacity 0.3s ease"
                            }}
                        />
                        {isVideoMuted && (
                            <div style={{
                                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                                background: "#1e293b", color: "#64748b"
                            }}>
                                <VideoOff size={48} />
                            </div>
                        )}
                        <div className="video-room-label" style={{
                            position: "absolute", bottom: "20px", left: "20px",
                            padding: "8px 16px", background: "rgba(0,0,0,0.6)",
                            backdropFilter: "blur(12px)", borderRadius: "12px",
                            color: "#fff", fontSize: "0.85rem", fontWeight: 600,
                            border: "1px solid rgba(255,255,255,0.1)",
                            display: "flex", alignItems: "center", gap: "8px"
                        }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                            You (Host)
                        </div>
                    </div>

                    {/* Remote Streams */}
                    {remoteStreams.map((rs) => (
                        <RemoteVideo key={rs.socketId} stream={rs.stream} socketId={rs.socketId} />
                    ))}
                </div>

                {/* Floating Controls Overlay */}
                <div className="video-room-controls" style={{
                    position: "absolute",
                    bottom: "32px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    padding: "16px 32px",
                    background: "rgba(15,23,42,0.8)",
                    backdropFilter: "blur(20px)",
                    borderRadius: "24px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
                    zIndex: 100
                }}>
                    <button
                        onClick={toggleAudio}
                        style={{
                            width: "48px", height: "48px", borderRadius: "16px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: isAudioMuted ? "#ef4444" : "rgba(255,255,255,0.05)",
                            color: "white", border: "none", cursor: "pointer", transition: "all 0.2s ease"
                        }}
                    >
                        {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    <button
                        onClick={toggleVideo}
                        style={{
                            width: "48px", height: "48px", borderRadius: "16px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: isVideoMuted ? "#ef4444" : "rgba(255,255,255,0.05)",
                            color: "white", border: "none", cursor: "pointer", transition: "all 0.2s ease"
                        }}
                    >
                        {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>

                    <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)" }} />

                    <button
                        onClick={onClose}
                        className="video-room-end-btn"
                        style={{
                            padding: "0 24px", height: "48px", borderRadius: "16px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            gap: "8px", background: "#f43f5e", color: "white",
                            border: "none", cursor: "pointer", fontWeight: 600, transition: "all 0.2s ease"
                        }}
                    >
                        <PhoneOff size={20} />
                        End Call
                    </button>
                </div>
            </div>
        </VcWrapper>
    );
};

const RemoteVideo = ({ stream, socketId }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div style={{
            position: "relative",
            borderRadius: "24px",
            overflow: "hidden",
            background: "rgba(15,23,42,0.6)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            aspectRatio: "16/9"
        }}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div className="video-room-label" style={{
                position: "absolute", bottom: "20px", left: "20px",
                padding: "8px 16px", background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(12px)", borderRadius: "12px",
                color: "#fff", fontSize: "0.85rem", fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", gap: "8px"
            }}>
                Participant
            </div>
        </div>
    );
};

export default VideoRoom;
