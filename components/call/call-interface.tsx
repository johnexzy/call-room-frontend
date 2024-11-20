/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WebRTCService } from "@/lib/webrtc-service";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WS_NAMESPACES } from "@/constants/websocket.constants";
import { useToast } from "@/hooks/use-toast";

interface CallInterfaceProps {
  callId: string;
  isRepresentative?: boolean;
  onEndCall?: () => void;
}

export function CallInterface({
  callId,
  isRepresentative = false,
  onEndCall,
}: Readonly<CallInterfaceProps>) {
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const webrtcRef = useRef<WebRTCService | null>(null);
  const { socket } = useWebSocket(WS_NAMESPACES.CALLS);
  const { toast } = useToast();

  useEffect(() => {
    if (!socket) return;

    // Handle incoming WebRTC signaling messages
    socket.on('call-offer', async ({ offer, fromUserId }) => {
      if (!webrtcRef.current) return;
      try {
        const answer = await webrtcRef.current.handleOffer(offer);
        socket.emit('call-answer', {
          targetUserId: fromUserId,
          answer,
          callId,
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    socket.on('call-answer', async ({ answer }) => {
      if (!webrtcRef.current) return;
      try {
        await webrtcRef.current.handleAnswer(answer);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    socket.on('ice-candidate', async ({ candidate, fromUserId }) => {
      if (!webrtcRef.current) return;
      try {
        await webrtcRef.current.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    // Initialize WebRTC connection
    const initializeCall = async () => {
      try {
        webrtcRef.current = new WebRTCService(socket);
        const localStream = await webrtcRef.current.startLocalStream();

        if (localAudioRef.current && localStream) {
          localAudioRef.current.srcObject = localStream;
        }

        // If representative, create and send offer
        if (isRepresentative) {
          const offer = await webrtcRef.current.createOffer();
          socket.emit('call-offer', {
            targetUserId: callId, // This should be the customer's ID
            offer,
            callId,
          });
        }

        // Handle ICE candidates
        webrtcRef.current.onIceCandidate = (candidate) => {
          socket.emit('ice-candidate', {
            targetUserId: isRepresentative ? callId : 'representative-id', // Need to get the correct ID
            candidate,
            callId,
          });
        };
      } catch (error) {
        console.error('Error initializing call:', error);
        toast({
          title: 'Call Setup Failed',
          description: 'Failed to access microphone. Please check permissions.',
          variant: 'destructive',
        });
      }
    };

    initializeCall();

    return () => {
      socket.off('call-offer');
      socket.off('call-answer');
      socket.off('ice-candidate');
      webrtcRef.current?.cleanup();
    };
  }, [socket, callId, isRepresentative, toast]);

  const handleRemoteStream = (event: Event) => {
    const { detail: stream } = event as CustomEvent<MediaStream>;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
    }
  };

  const toggleMute = () => {
    const localStream = localAudioRef.current?.srcObject as MediaStream;
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const handleEndCall = () => {
    webrtcRef.current?.cleanup();
    onEndCall?.();
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-center space-x-4">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            onClick={toggleMute}
          >
            {isMuted ? "Unmute" : "Mute"}
          </Button>
          <Button variant="destructive" onClick={handleEndCall}>
            End Call
          </Button>
        </div>

        {isConnecting && (
          <div className="text-center text-muted-foreground">
            Connecting call...
          </div>
        )}

        <audio ref={localAudioRef} autoPlay muted />
        <audio ref={remoteAudioRef} autoPlay />
      </CardContent>
    </Card>
  );
}
