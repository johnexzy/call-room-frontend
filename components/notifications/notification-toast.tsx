'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { NotificationType } from '@/types/notification';
import { WS_NAMESPACES } from '@/constants/websocket.constants';

export function NotificationToast() {
  const { toast } = useToast();
  const socket = useWebSocket(WS_NAMESPACES.NOTIFICATIONS);
    
  useEffect(() => {
    if (!socket) return;

    socket.socket?.on('notification', (notification) => {
      const title = notification.title;
      let variant: 'default' | 'destructive' = 'default';

      switch (notification.type) {
        case NotificationType.CALL_READY:
          variant = 'default';
          break;
        case NotificationType.CALL_MISSED:
          variant = 'destructive';
          break;
      }

      toast({
        title,
        description: notification.message,
        variant,
      });
    });

    return () => {
      socket.socket?.off('notification');
    };
  }, [socket, toast]);

  return null;
} 