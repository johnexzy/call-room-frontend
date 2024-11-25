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

    const newSockets: WebSocketContextType['sockets'] = {};
    Object.values(WS_NAMESPACES).forEach((namespace) => {
      const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/${namespace}`, {
        auth: { 
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        setIsConnected(true);
        console.log(`Connected to ${namespace} namespace`);
      });

      socket.on('connect_error', (error) => {
        console.error(`Connection error for ${namespace}:`, error);
        setIsConnected(false);
      });

      socket.on('disconnect', (reason) => {
        console.log(`Disconnected from ${namespace}:`, reason);
        setIsConnected(false);
      });

      newSockets[namespace] = socket;
    });

    setSockets(newSockets);

    return () => {
      Object.values(newSockets).forEach((socket) => {
        if (socket?.connected) {
          socket.disconnect();
        }
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