import { useEffect, useState } from "react";
import VcWrapper from "./VcWrapper";
import { useSockets } from "../providers/Socket";


const VcComponentRoom = ({ onClose, workspaceId, userId }) => {
   
    const [olCount, setOlCount] = useState(0);
    const socket = useSockets()
    useEffect(() => {

        const handleOnlineUserCount = (data) => {
            console.log("online-user-count received");
            console.log(data);

            setOlCount(data.particepents);
        };

        const handleUserJoined = (data) => {
            console.log("user joined", data);
        };

        socket.on("online-user-count", handleOnlineUserCount);
        socket.on("user-joined", handleUserJoined);

        return () => {

        };

    }, [socket]);

    return (
        <VcWrapper
            workspaceName={"Test Vc"}
            onClose={()=>{
                socket.emit("leave-video-room" ,{workSpaceId:workspaceId})
                onClose()
            }}
            participents={`0${olCount}`}
        >
            <h1>Hello</h1>
        </VcWrapper>
    );
};

export default VcComponentRoom;