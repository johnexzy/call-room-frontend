"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WS_NAMESPACES } from "@/constants/websocket.constants";
import { useToast } from "@/hooks/use-toast";
import { AgoraService } from '@/lib/agora-service';
import { apiClient } from '@/lib/api-client';

interface CallInterfaceProps {
  callId: string;
  isRepresentative?: boolean;
  targetUserId?: string;
  onEndCall?: () => void;
}

export function CallInterface({
  callId,
  targetUserId,
  onEndCall,
}: Readonly<CallInterfaceProps>) {
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const agoraRef = useRef<AgoraService | null>(null);
  const { socket } = useWebSocket(WS_NAMESPACES.CALLS);
  const { toast } = useToast();

  useEffect(() => {
    if (!socket?.connected || !targetUserId) return;

    const initializeCall = async () => {
      try {
        // Get token from your backend
        const response = await apiClient.get(`/calls/${callId}/token`);
        if (!response.ok) throw new Error('Failed to get token');
        
        const { token, channel } = await response.json();
        
        agoraRef.current = new AgoraService();
        await agoraRef.current.join(channel, token, targetUserId);
        setIsConnecting(false);
      } catch (error) {
        console.error('Failed to initialize call:', error);
        toast({
          title: 'Error',
          description: 'Failed to connect to call',
          variant: 'destructive',
        });
      }
    };

    initializeCall();

    return () => {
      agoraRef.current?.leave();
    };
  }, [socket, targetUserId, callId]);

  const handleMuteToggle = async () => {
    if (!agoraRef.current) return;
    
    try {
      await agoraRef.current.muteAudio(!isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-center space-x-4">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            onClick={handleMuteToggle}
          >
            {isMuted ? "Unmute" : "Mute"}
          </Button>
          <Button variant="destructive" onClick={onEndCall}>
            End Call
          </Button>
        </div>

        {isConnecting && (
          <div className="text-center text-muted-foreground">
            Connecting call...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
