"use client";

import { useEffect, useState, useRef } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WS_NAMESPACES, WS_EVENTS } from "@/constants/websocket.constants";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic.js";
import { TranscriptDisplayRef } from "@/components/calls/transcript-display";

const CallInterface = dynamic(
  () => import("@/components/call/call-interface"),
  { ssr: false }
);
interface QueuePosition {
  position: number;
  estimatedMinutes: number;
}

interface Call {
  id: string;
  customer: {
    firstName: string;
    lastName: string;
  };
  representative: {
    id: string;
    firstName: string;
    lastName: string;
  };
  startTime: string;
}

export default function CustomerDashboard() {
  const [queueInfo, setQueueInfo] = useState<QueuePosition | null>(null);
  const [isInQueue, setIsInQueue] = useState(false);
  const queueSocket = useWebSocket(WS_NAMESPACES.QUEUE);
  const callSocket = useWebSocket(WS_NAMESPACES.CALLS);
  const { toast } = useToast();
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const transcriptRef = useRef<TranscriptDisplayRef>(null);

  useEffect(() => {
    if (!queueSocket.socket) return;

    queueSocket.socket.on(WS_EVENTS.QUEUE.POSITION_UPDATE, (data) => {
      setQueueInfo({
        position: data.position,
        estimatedMinutes: data.estimatedWaitTime,
      });
    });

    queueSocket.socket.on(WS_EVENTS.QUEUE.YOUR_TURN, async (data) => {
      toast({
        title: "It's Your Turn!",
        description: data.message,
      });
      setIsInQueue(false);
      setQueueInfo(null);

      // Get active call details
      try {
        const response = await apiClient.get("/calls/active");
        if (response.ok) {
          const callData = await response.json();
          setCurrentCall(callData);
        }
      } catch (error) {
        console.error("Failed to get call details:", error);
      }
    });

    return () => {
      queueSocket.socket?.off(WS_EVENTS.QUEUE.POSITION_UPDATE);
      queueSocket.socket?.off(WS_EVENTS.QUEUE.YOUR_TURN);
    };
  }, [queueSocket.socket, toast]);
  useEffect(() => {
    if (!callSocket.socket) return;

    callSocket.socket.on(WS_EVENTS.CALLS.CALL_ENDED, () => {
      setCurrentCall(null);
    });
  }, [callSocket.socket]);

  const joinQueue = async () => {
    try {
      const response = await apiClient.post("/queue/join", {});
      if (response.ok) {
        const data = await response.json();
        setIsInQueue(true);
        setQueueInfo({
          position: data.position,
          estimatedMinutes: data.estimatedWaitTime,
        });
      }
    } catch (error) {
      console.error("Failed to join queue:", error);
      toast({
        title: "Error",
        description: "Failed to join queue. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEndCall = async () => {
    if (!currentCall) return;

    try {
      const response = await apiClient.put(`/calls/${currentCall.id}/end`, {
        notes: "",
      });
      if (response.ok) {
        setCurrentCall(null);
        toast({
          title: "Call Ended",
          description: "The call has ended successfully",
        });
      }
    } catch (error) {
      console.error("Failed to end call:", error);
      toast({
        title: "Error",
        description: "Failed to end call",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Customer Service</h1>
      {currentCall ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected with Representative</CardTitle>
              <CardDescription>
                Speaking with {currentCall.representative.firstName}{" "}
                {currentCall.representative.lastName}
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            <CallInterface
              callId={currentCall.id}
              isRep={false}
              targetUserId={currentCall.representative.id}
              onEndCall={handleEndCall}
              onTranscriptReceived={(userId: string, transcript: string) => {
                transcriptRef.current?.addTranscript(userId, transcript);
              }}
            />
          </div>
        </div>
      ) : !isInQueue ? (
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

      {(!queueSocket.isConnected || !callSocket.isConnected) && (
        <div className="fixed bottom-4 right-4">
          <Card className="bg-destructive text-destructive-foreground">
            <CardContent className="p-4">
              <p>Disconnected from server. Reconnecting...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
