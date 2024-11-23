"use client";

import { io } from "socket.io-client";
import { WS_NAMESPACES } from "@/constants/websocket.constants";

export const analyticsSocket = io(
  `${process.env.NEXT_PUBLIC_WS_URL}/${WS_NAMESPACES.ANALYTICS}`,
  {
    autoConnect: false,
  }
);
