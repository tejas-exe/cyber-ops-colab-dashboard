import { useCallback, useEffect, useState } from "react";
import VcWrapper from "./VcWrapper";
import { useSockets } from "../providers/Socket";
import { useRtc } from "../providers/Rtc";

const VcComponentRoom = ({ onClose, workspaceId, userId }) => {
  const [olCount, setOlCount] = useState(0);
  const socket = useSockets();
  const { createOffer, createAnswer, offerAccepted } = useRtc();

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

  const handelOfferAccepted = useCallback(async (data) => {
    const { ans } = data;
    await offerAccepted(ans);
  }, [offerAccepted]);

  useEffect(() => {
    socket.on("online-user-count", handleOnlineUserCount);
    socket.on("user-joined", handleUserJoined);
    socket.on("incoming-offer", handelIncomingOffer);
    socket.on("offer-accepted", handelOfferAccepted);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("online-user-count", handleOnlineUserCount);
      socket.off("incoming-offer", handelIncomingOffer);
      socket.off("offer-accepted", handelOfferAccepted);
    };
  }, [handelIncomingOffer, handelOfferAccepted, handleUserJoined, socket, workspaceId]);

  return (
    <VcWrapper
      workspaceName={"Test Vc"}
      onClose={() => {
        socket.emit("leave-video-room", { workSpaceId: workspaceId });
        onClose();
      }}
      participents={`0${olCount}`}
    >
      <h1>Hello</h1>
    </VcWrapper>
  );
};

export default VcComponentRoom;
