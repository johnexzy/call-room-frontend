import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(namespace: string = '') {
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    socket.current = io(`http://localhost:5200/${namespace}`, {
      auth: {
        token: `Bearer ${token}`,
      },
    });

    socket.current.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.current.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [namespace]);

  return socket.current;
} 