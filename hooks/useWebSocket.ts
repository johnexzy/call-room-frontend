import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { useToast } from './use-toast';
import { WS_NAMESPACES } from '@/constants/websocket.constants';

type NamespaceType = typeof WS_NAMESPACES[keyof typeof WS_NAMESPACES];

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5200';

export function useWebSocket(namespace: NamespaceType) {
  const socket = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const connect = useCallback(() => {
    const token = Cookies.get('token');
    if (!token) {
      console.error('No authentication token found');
      return null;
    }

    const newSocket = io(`${WS_BASE_URL}/${namespace}`, {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log(`Connected to ${namespace} WebSocket`);
      setIsConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to server. Retrying...',
        variant: 'destructive',
      });
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    return newSocket;
  }, [namespace, toast]);

  useEffect(() => {
    socket.current = connect();

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
        setIsConnected(false);
      }
    };
  }, [connect]);

  return { socket: socket.current, isConnected };
} 