import { createContext, useContext, useMemo } from "react";

export const RtcContext = createContext(null);

export const useRtc = () => {
  return useContext(RtcContext);
};

export const RtcProvider = (props) => {
  const peer = useMemo(() => {
    return new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
          ],
        },
      ],
    });
  }, []);

  const createOffer = async () => {
    if (peer.signalingState !== "stable" && peer.localDescription?.type === "offer") {
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
  return (
    <RtcContext.Provider
      value={{ peer, createOffer, createAnswer, offerAccepted }}
    >
      {props.children}
    </RtcContext.Provider>
  );
};
