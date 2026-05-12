import { useCallback, useEffect, useRef, useState, CSSProperties } from "react";
import VcWrapper from "./VcWrapper";
import { useSockets } from "../providers/Socket";
import { useRtc } from "../providers/Rtc";

const tileStyle: CSSProperties = {
  position: "relative",
  borderRadius: 8,
  overflow: "hidden",
  background: "#1a1a1a",
};

const VideoTile = ({ stream, muted = false, label = "", placeholder = "" }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream || null;
      const playPromise = ref.current.play?.();
      if (playPromise?.catch) {
        playPromise.catch(() => {});
      }
    }
  }, [stream]);

  return (
    <div style={tileStyle}>
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        style={{
          width: "100%",
          display: "block",
          minHeight: 220,
          objectFit: "cover",
          background: "#0b1220",
        }}
      />
      {!stream && placeholder && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.75)",
            fontSize: 13,
            background: "linear-gradient(135deg, #0f172a 0%, #111827 100%)",
          }}
        >
          {placeholder}
        </div>
      )}
      {label && (
        <span
          style={{
            position: "absolute",
            bottom: 6,
            left: 8,
            color: "#fff",
            fontSize: 12,
            background: "rgba(0,0,0,0.5)",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

const VcComponentRoom = ({ onClose, workspaceId, userId }) => {
  const [olCount, setOlCount] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaMessage, setMediaMessage] = useState("Connecting media...");

  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pendingOfferRef = useRef(false);
  const rtcReadyRef = useRef(false);

  const socket = useSockets();
  const {
    peer,
    createOffer,
    createAnswer,
    offerAccepted,
    addIceCandidate,
    onTrackRef,
    onIceCandidateRef,
  } = useRtc();

  const ensureReceiverTracks = useCallback(() => {
    const transceivers = peer.getTransceivers?.() || [];
    const hasAudio = transceivers.some(
      (t) => t?.sender?.track?.kind === "audio" || t?.receiver?.track?.kind === "audio",
    );
    const hasVideo = transceivers.some(
      (t) => t?.sender?.track?.kind === "video" || t?.receiver?.track?.kind === "video",
    );

    if (!hasAudio) {
      peer.addTransceiver("audio", { direction: "recvonly" });
    }
    if (!hasVideo) {
      peer.addTransceiver("video", { direction: "recvonly" });
    }
  }, [peer]);

  const attachStreamToPeer = useCallback(
    async (stream) => {
      if (!stream) return;

      const tracks = stream.getTracks();
      for (const track of tracks) {
        const sender = peer
          .getSenders()
          .find((s) => s?.track?.kind === track.kind && s.track?.readyState !== "ended");

        if (sender) {
          await sender.replaceTrack(track);
        } else {
          peer.addTrack(track, stream);
        }
      }
    },
    [peer],
  );

  const handleMediaStream = useCallback(async () => {
    let stream = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaMessage("Camera and microphone connected");
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        setMediaMessage("Joined with microphone only");
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          setMediaMessage("Joined with camera only");
        } catch {
          setMediaMessage("Joined without camera/microphone (listen-only mode)");
        }
      }
    }

    if (stream) {
      localStreamRef.current = stream;
      setLocalStream(stream);
      await attachStreamToPeer(stream);
    } else {
      localStreamRef.current = null;
      setLocalStream(null);
    }
  }, [attachStreamToPeer]);

  const createRoomOffer = useCallback(async () => {
    if (!rtcReadyRef.current) {
      pendingOfferRef.current = true;
      return;
    }

    pendingOfferRef.current = false;
    const offer = await createOffer();
    socket.emit("call-offer", { workSpaceId: workspaceId, offer, userId });
  }, [createOffer, socket, userId, workspaceId]);

  const stopScreenShare = useCallback(async () => {
    const shareStream = screenStreamRef.current;
    if (!shareStream) return;

    shareStream.getTracks().forEach((track) => {
      if (track.readyState !== "ended") track.stop();
    });
    screenStreamRef.current = null;
    setIsScreenSharing(false);

    const cameraTrack = localStreamRef.current?.getVideoTracks?.()[0];
    const videoSender = peer.getSenders().find((sender) => sender.track?.kind === "video");

    if (videoSender && cameraTrack) {
      await videoSender.replaceTrack(cameraTrack);
      setLocalStream(localStreamRef.current);
      setMediaMessage("Returned to camera");
      return;
    }

    if (!localStreamRef.current) {
      setLocalStream(null);
      setMediaMessage("Screen sharing stopped");
    }
  }, [peer]);

  const startScreenShare = useCallback(async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) {
        displayStream.getTracks().forEach((track) => track.stop());
        return;
      }

      const videoSender = peer.getSenders().find((sender) => sender.track?.kind === "video");

      if (videoSender) {
        await videoSender.replaceTrack(screenTrack);
      } else {
        peer.addTrack(screenTrack, displayStream);
      }

      screenTrack.onended = () => {
        void stopScreenShare();
      };

      screenStreamRef.current = displayStream;
      setIsScreenSharing(true);
      setLocalStream(displayStream);
      setMediaMessage("Screen sharing active");
    } catch {
      setMediaMessage("Screen share was cancelled or blocked");
    }
  }, [peer, stopScreenShare]);

  useEffect(() => {
    onTrackRef.current = (stream) => {
      setRemoteStream(stream);
    };

    onIceCandidateRef.current = (candidate) => {
      socket.emit("ice-candidate", { candidate, workSpaceId: workspaceId });
    };

    return () => {
      onTrackRef.current = null;
      onIceCandidateRef.current = null;
    };
  }, [onTrackRef, onIceCandidateRef, socket, workspaceId]);

  useEffect(() => {
    let active = true;

    const initRtc = async () => {
      ensureReceiverTracks();
      await handleMediaStream();

      if (!active) return;
      rtcReadyRef.current = true;

      if (pendingOfferRef.current) {
        await createRoomOffer();
      }
    };

    void initRtc();

    return () => {
      active = false;
      rtcReadyRef.current = false;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      screenStreamRef.current = null;
    };
  }, [createRoomOffer, ensureReceiverTracks, handleMediaStream]);

  const handleOnlineUserCount = useCallback((data) => {
    setOlCount(data.particepents || 0);
  }, []);

  const handleUserJoined = useCallback(async () => {
    await createRoomOffer();
  }, [createRoomOffer]);

  const handelIncomingOffer = useCallback(
    async (data) => {
      const { from, offer, workSpaceId } = data;
      const ans = await createAnswer(offer);
      socket.emit("offer-accepted", { to: from, ans, workSpaceId });
    },
    [createAnswer, socket],
  );

  const handelOfferAccepted = useCallback(
    async (data) => {
      const { ans } = data;
      await offerAccepted(ans);
    },
    [offerAccepted],
  );

  const handleIceCandidate = useCallback(
    async (data) => {
      const { candidate } = data;
      if (candidate) await addIceCandidate(candidate);
    },
    [addIceCandidate],
  );

  useEffect(() => {
    socket.on("online-user-count", handleOnlineUserCount);
    socket.on("user-joined", handleUserJoined);
    socket.on("incoming-offer", handelIncomingOffer);
    socket.on("offer-accepted", handelOfferAccepted);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("online-user-count", handleOnlineUserCount);
      socket.off("incoming-offer", handelIncomingOffer);
      socket.off("offer-accepted", handelOfferAccepted);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [
    handelIncomingOffer,
    handelOfferAccepted,
    handleIceCandidate,
    handleOnlineUserCount,
    handleUserJoined,
    socket,
  ]);

  return (
    <VcWrapper
      workspaceName={"Test Vc"}
      onClose={() => {
        socket.emit("leave-video-room", { workSpaceId: workspaceId });
        onClose();
      }}
      participents={`0${olCount}`}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{mediaMessage}</span>
          <button
            type="button"
            onClick={() => {
              if (isScreenSharing) {
                void stopScreenShare();
              } else {
                void startScreenShare();
              }
            }}
            style={{
              background: isScreenSharing ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              borderRadius: 10,
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {isScreenSharing ? "Stop Sharing" : "Share Screen"}
          </button>
        </div>

        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: remoteStream ? "1fr 1fr" : "1fr",
            gap: 8,
            padding: 8,
            minHeight: 0,
          }}
        >
          <VideoTile
            stream={localStream}
            muted
            label={isScreenSharing ? "You (Screen)" : "You"}
            placeholder="No camera/mic available. You are still connected."
          />
          {remoteStream && <VideoTile stream={remoteStream} label="Peer" />}
        </div>
      </div>
    </VcWrapper>
  );
};

export default VcComponentRoom;
