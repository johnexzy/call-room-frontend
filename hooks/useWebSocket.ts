"use client";

import { useWebSocketContext } from '@/contexts/websocket-context';
import { WS_NAMESPACES } from '@/constants/websocket.constants';

type NamespaceType = typeof WS_NAMESPACES[keyof typeof WS_NAMESPACES];

export function useWebSocket(namespace: NamespaceType) {
  const { sockets, isConnected } = useWebSocketContext();
  return { socket: sockets[namespace], isConnected };
} 