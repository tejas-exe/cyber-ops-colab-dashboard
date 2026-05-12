import { useCallback, useEffect, useRef, useState, CSSProperties } from "react";
import {
  Expand,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import VcWrapper from "./VcWrapper";
import { useSockets } from "../providers/Socket";
import { useRtc } from "../providers/Rtc";
import ScreenShareControls from "./Video/VCControls";

const tileStyle: CSSProperties = {
  position: "relative",
  borderRadius: 8,
  overflow: "hidden",
  background: "#1a1a1a",
};

const VideoTile = ({
  stream,
  muted = false,
  label = "",
  placeholder = "",
  onToggleFocus,
  isFocused = false,
  canToggleFocus = false,
}) => {
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
    <div
      style={{
        ...tileStyle,
        border: isFocused
          ? "1px solid rgba(99,102,241,0.7)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isFocused ? "0 0 0 1px rgba(99,102,241,0.4)" : "none",
      }}
    >
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
      {canToggleFocus && (
        <button
          type="button"
          onClick={onToggleFocus}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 30,
            height: 30,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(2,6,23,0.72)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
          aria-label={isFocused ? `Restore ${label} tile` : `Enlarge ${label} tile`}
          title={isFocused ? "Restore size" : "Enlarge participant"}
        >
          {isFocused ? <Minimize2 size={15} /> : <Expand size={15} />}
        </button>
      )}
    </div>
  );
};

const VcComponentRoom = ({
  onClose,
  workspaceId,
  userId,
  workspaceName,
  chatPanel,
}) => {
  const [olCount, setOlCount] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaMessage, setMediaMessage] = useState("Connecting media...");
  const [focusedTile, setFocusedTile] = useState<"local" | "remote" | null>(
    null,
  );
  const [chatOpen, setChatOpen] = useState(Boolean(chatPanel));

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

  useEffect(() => {
    setChatOpen(Boolean(chatPanel));
  }, [chatPanel]);

  useEffect(() => {
    if (!remoteStream && focusedTile === "remote") {
      setFocusedTile(null);
    }
  }, [focusedTile, remoteStream]);

  const ensureReceiverTracks = useCallback(() => {
    const transceivers = peer.getTransceivers?.() || [];
    const hasAudio = transceivers.some(
      (t) =>
        t?.sender?.track?.kind === "audio" ||
        t?.receiver?.track?.kind === "audio",
    );
    const hasVideo = transceivers.some(
      (t) =>
        t?.sender?.track?.kind === "video" ||
        t?.receiver?.track?.kind === "video",
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
          .find(
            (s) =>
              s?.track?.kind === track.kind && s.track?.readyState !== "ended",
          );

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
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setMediaMessage("Camera and microphone connected");
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        setMediaMessage("Joined with microphone only");
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          setMediaMessage("Joined with camera only");
        } catch {
          setMediaMessage(
            "Joined without camera/microphone (listen-only mode)",
          );
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
    const videoSender = peer
      .getSenders()
      .find((sender) => sender.track?.kind === "video");

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

      const videoSender = peer
        .getSenders()
        .find((sender) => sender.track?.kind === "video");

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
      workspaceName={workspaceName}
      onClose={() => {
        socket.emit("leave-video-room", { workSpaceId: workspaceId });
        onClose();
      }}
      participents={`0${olCount}`}
    >
      <style>{`
        @media (max-width: 1100px) {
          .vc-room-layout {
            grid-template-columns: 1fr !important;
          }
          .vc-chat-panel {
            min-height: 260px !important;
          }
          .vc-chat-open-btn {
            right: 14px !important;
            bottom: 14px !important;
          }
        }
      `}</style>
      <div
        className="vc-room-layout"
        style={{
          flex: 1,
          width: "100%",
          minHeight: 0,
          display: "grid",
          gap: 12,
          gridTemplateColumns:
            chatPanel && chatOpen ? "minmax(0, 1fr) 360px" : "1fr",
          position: "relative",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: "100%",
            minHeight: 0,
          }}
        >
          <ScreenShareControls
            mediaMessage={mediaMessage}
            isScreenSharing={isScreenSharing}
            startScreenShare={startScreenShare}
            stopScreenShare={stopScreenShare}
          />
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns:
                remoteStream && focusedTile === null ? "1fr 1fr" : "1fr",
              gap: 8,
              padding: 8,
              minHeight: 0,
            }}
          >
            {focusedTile !== "remote" && (
              <VideoTile
                stream={localStream}
                muted
                label={isScreenSharing ? "You (Screen)" : "You"}
                placeholder="No camera/mic available. You are still connected."
                canToggleFocus
                isFocused={focusedTile === "local"}
                onToggleFocus={() =>
                  setFocusedTile((prev) => (prev === "local" ? null : "local"))
                }
              />
            )}
            {remoteStream && focusedTile !== "local" && (
              <VideoTile
                stream={remoteStream}
                label="Peer"
                canToggleFocus
                isFocused={focusedTile === "remote"}
                onToggleFocus={() =>
                  setFocusedTile((prev) =>
                    prev === "remote" ? null : "remote",
                  )
                }
              />
            )}
          </div>
        </div>

        {chatPanel && chatOpen && (
          <div
            className="vc-chat-panel"
            style={{ minHeight: 0, height: "100%", position: "relative" }}
          >
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                zIndex: 2,
                width: 30,
                height: 30,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(2,6,23,0.72)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
              }}
              aria-label="Close chat panel"
              title="Close chat"
            >
              <PanelRightClose size={16} />
            </button>
            {chatPanel}
          </div>
        )}
        {chatPanel && !chatOpen && (
          <button
            type="button"
            className="vc-chat-open-btn"
            onClick={() => setChatOpen(true)}
            style={{
              position: "absolute",
              right: 18,
              bottom: 18,
              zIndex: 3,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(2,6,23,0.78)",
              color: "#fff",
              borderRadius: 12,
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              backdropFilter: "blur(10px)",
            }}
          >
            <PanelRightOpen size={16} />
            Open Chat
          </button>
        )}
      </div>
    </VcWrapper>
  );
};

export default VcComponentRoom;
