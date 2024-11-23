"use client";

import { WS_NAMESPACES } from "@/constants/websocket.constants";
import { io } from "socket.io-client";

export const queueSocket = io(`${process.env.NEXT_PUBLIC_WS_URL}/${WS_NAMESPACES.QUEUE}`, {
  autoConnect: false,
});
  