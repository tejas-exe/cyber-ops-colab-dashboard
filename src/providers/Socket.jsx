import React, { useContext, useMemo } from "react"
import { io } from "socket.io-client";

const SocketContext = React.createContext(null)
const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:3000";
export const SocketProvider = (props) => {

    const socket = useMemo(() => {
        return io(socketUrl, {
            withCredentials: true,
            transports: ["websocket", "polling"],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
    }, [])



    return (
        <SocketContext.Provider value={socket}>
            {props.children}
        </SocketContext.Provider>
    )
}

export const useSockets = () => {
    return useContext(SocketContext)
}