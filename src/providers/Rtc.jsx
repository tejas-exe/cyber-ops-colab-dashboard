import { createContext, useCallback, useContext, useMemo, useRef } from "react";

export const RtcContext = createContext(null);

export const useRtc = () => {
  return useContext(RtcContext);
};

export const RtcProvider = (props) => {
  const onTrackRef = useRef(null);
  const onIceCandidateRef = useRef(null);

  const peer = useMemo(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
          ],
        },
      ],
    });

    pc.ontrack = (e) => {
      if (onTrackRef.current && e.streams?.[0]) {
        onTrackRef.current(e.streams[0]);
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && onIceCandidateRef.current) {
        onIceCandidateRef.current(e.candidate);
      }
    };
    return pc;
  }, []);

  //! ── functions ───────────────────────────────────────────
  const createOffer = async () => {
    if (
      peer.signalingState !== "stable" &&
      peer.localDescription?.type === "offer"
    ) {
      return peer.localDescription;
    }
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async (offer) => {
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  };

  const offerAccepted = async (ans) => {
    if (!ans) return;

    const isDuplicateAnswer =
      peer.currentRemoteDescription?.type === "answer" &&
      peer.currentRemoteDescription?.sdp === ans.sdp;

    if (isDuplicateAnswer) return;

    if (peer.signalingState !== "have-local-offer") {
      return;
    }

    await peer.setRemoteDescription(ans);
  };

  const addLocalStream = useCallback(
    (stream) => {
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    },
    [peer],
  );

  const addIceCandidate = useCallback(
    async (candidate) => {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    },
    [peer],
  );

  return (
    <RtcContext.Provider
      value={{
        peer,
        createOffer,
        createAnswer,
        offerAccepted,
        addLocalStream,
        addIceCandidate,
        onIceCandidateRef,
        onTrackRef,
      }}
    >
      {props.children}
    </RtcContext.Provider>
  );
};
