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
