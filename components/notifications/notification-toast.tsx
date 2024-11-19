'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/app/hooks/useWebSocket';
import { NotificationType } from '@/types/notification';

export function NotificationToast() {
  const { toast } = useToast();
  const socket = useWebSocket('notifications');

  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (notification) => {
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
      socket.off('notification');
    };
  }, [socket, toast]);

  return null;
} 