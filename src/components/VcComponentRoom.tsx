import { useCallback, useEffect, useRef, useState } from "react";
import VcWrapper from "./VcWrapper";
import { useSockets } from "../providers/Socket";
import { useRtc } from "../providers/Rtc";

//!
const VideoTile = ({ stream, muted = false, label = "" }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 8,
        overflow: "hidden",
        background: "#1a1a1a",
      }}
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        style={{ width: "100%", display: "block" }}
      />
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
  const localStreamRef = useRef(null);

  const socket = useSockets();
  const {
    createOffer,
    createAnswer,
    offerAccepted,
    addIceCandidate,
    addLocalStream,
    onTrackRef,
    onIceCandidateRef,
  } = useRtc();

  const handelMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      addLocalStream(stream);
    } catch (error) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
      setLocalStream(stream);
      addLocalStream(stream);
    }
  };

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
    handelMediaStream();
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  //! SOCKET EVENTS
  const handleOnlineUserCount = (data) => {
    setOlCount(data.particepents);
  };

  const handleUserJoined = useCallback(async () => {
    const offer = await createOffer();
    socket.emit("call-offer", { workSpaceId: workspaceId, offer, userId });
  }, [createOffer, socket, userId, workspaceId]);

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
    handleUserJoined,
    socket,
    workspaceId,
  ]);
  //!-----------------------------------XXXX-------------------------------------------
  return (
    <VcWrapper
      workspaceName={"Test Vc"}
      onClose={() => {
        socket.emit("leave-video-room", { workSpaceId: workspaceId });
        onClose();
      }}
      participents={`0${olCount}`}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: remoteStream ? "1fr 1fr" : "1fr",
          gap: 8,
          padding: 8,
        }}
      >
        {localStream && <VideoTile stream={localStream} muted label="You" />}
        {remoteStream && <VideoTile stream={remoteStream} label="Peer" />}
      </div>
    </VcWrapper>
  );
};

export default VcComponentRoom;
