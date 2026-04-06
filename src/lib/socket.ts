import { io } from "socket.io-client";

export const socket = io(process.env.VITE_SOCKET_URL || "http://localhost:3001");
