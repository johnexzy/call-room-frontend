"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_NAMESPACES } from '@/constants/websocket.constants';
import Cookies from 'js-cookie';

interface WebSocketContextType {
  sockets: {
    [key in typeof WS_NAMESPACES[keyof typeof WS_NAMESPACES]]?: Socket;
  };
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  sockets: {},
  isConnected: false,
});

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [sockets, setSockets] = useState<WebSocketContextType['sockets']>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) return;

    // Initialize all required sockets
    const newSockets: WebSocketContextType['sockets'] = {};
    Object.values(WS_NAMESPACES).forEach((namespace) => {
      const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/${namespace}`, {
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        setIsConnected(true);
        console.log(`Connected to ${namespace} namespace`);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log(`Disconnected from ${namespace} namespace`);
      });

      newSockets[namespace] = socket;
    });

    setSockets(newSockets);

    const DEBUG = process.env.NODE_ENV === 'development';

    if (DEBUG) {
      Object.entries(newSockets).forEach(([namespace, socket]) => {
        socket?.onAny((event, ...args) => {
          console.log(`[${namespace}] ${event}:`, args);
        });
      });
    }

    return () => {
      Object.values(newSockets).forEach((socket) => {
        socket?.disconnect();
      });
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ sockets, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  return useContext(WebSocketContext);
} 