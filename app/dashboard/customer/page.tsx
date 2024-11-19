'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/app/hooks/useWebSocket';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface QueuePosition {
  position: number;
  estimatedMinutes: number;
}

export default function CustomerDashboard() {
  const [queueInfo, setQueueInfo] = useState<QueuePosition | null>(null);
  const [isInQueue, setIsInQueue] = useState(false);
  const socket = useWebSocket('notifications');

  useEffect(() => {
    if (socket) {
      socket.on('notification', (notification) => {
        if (notification.type === 'queue_update') {
          setQueueInfo({
            position: notification.data.position,
            estimatedMinutes: notification.data.estimatedWaitTime,
          });
        }
      });
    }
  }, [socket]);

  const joinQueue = async () => {
    try {
      const response = await apiClient.post('/queue/join', {});
      if (response.ok) {
        const data = await response.json();
        setIsInQueue(true);
        setQueueInfo({
          position: data.position,
          estimatedMinutes: data.estimatedWaitTime,
        });
      }
    } catch (error) {
      console.error('Failed to join queue:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Customer Service Queue</h1>

      {!isInQueue ? (
        <Card>
          <CardHeader>
            <CardTitle>Join Queue</CardTitle>
            <CardDescription>
              Connect with our customer service representatives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={joinQueue} className="w-full">
              Join Queue Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Queue Position</CardTitle>
            <CardDescription>
              Please wait while we connect you with a representative
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-center">
              Position: {queueInfo?.position}
            </div>
            <div className="text-center text-muted-foreground">
              Estimated wait time: {queueInfo?.estimatedMinutes} minutes
            </div>
            <Button variant="outline" className="w-full">
              Request Callback
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 