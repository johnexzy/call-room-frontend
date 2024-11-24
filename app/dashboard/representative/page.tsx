"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { WS_NAMESPACES, WS_EVENTS } from "@/constants/websocket.constants";
import { CallInterface } from "@/components/call/call-interface";
import { SentimentAnalyzer } from "@/components/calls/sentiment-analyzer";
import { CallRecorder } from "@/components/calls/call-recorder";
import { NetworkStats } from "@/components/calls/network-stats";
import { CallNotes } from "@/components/calls/call-notes";
import { JourneyTimeline } from "@/components/customer/journey-timeline";
import { KnowledgeBase } from "@/components/knowledge/knowledge-base";
import { CallSummary } from "@/components/calls/call-summary";
import { NextSteps } from "@/components/calls/next-steps";

interface Call {
  id: string;
  customer: {
    firstName: string;
    lastName: string;
    id: string;
  };
  startTime: string;
  status: string;
}

export default function RepresentativeDashboard() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const socket = useWebSocket(WS_NAMESPACES.CALLS);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.socket?.on(WS_EVENTS.CALLS.CALL_ASSIGNED, (call: Call) => {
      setCurrentCall(call);
      toast({
        title: "New Call Assigned",
        description: `Call from ${call.customer.firstName} ${call.customer.lastName}`,
      });
    });

    return () => {
      socket.socket?.off(WS_EVENTS.CALLS.CALL_ASSIGNED);
    };
  }, [socket, toast]);

  const loadInitialData = async () => {
    try {
      const [availabilityResponse, activeCallResponse] = await Promise.all([
        apiClient.get("/users/me/availability"),
        apiClient.get("/calls/active"),
      ]);

      if (availabilityResponse.ok) {
        const { isAvailable } = await availabilityResponse.json();
        setIsAvailable(isAvailable);
      }

      if (activeCallResponse.ok) {
        const activeCall = await activeCallResponse.json();
        setCurrentCall(activeCall);
      }
    } catch (error) {
      // console.error("Failed to load initial data:", error);
      // toast({
      //   title: "Error",
      //   description: "Failed to load dashboard data",
      //   variant: "destructive",
      // });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvailabilityChange = async (checked: boolean) => {
    try {
      const response = await apiClient.put("/users/me/availability", {
        isAvailable: checked,
      });

      if (response.ok) {
        setIsAvailable(checked);
        toast({
          title: checked ? "Now Available" : "Now Unavailable",
          description: checked
            ? "You are now available for calls"
            : "You are now unavailable for calls",
        });
      }
    } catch (error) {
      console.error("Failed to update availability:", error);
      toast({
        title: "Error",
        description: "Failed to update availability",
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
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Failed to end call:", error);
      toast({
        title: "Error",
        description: "Failed to end call",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Representative Dashboard</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {isAvailable ? "Available" : "Unavailable"}
          </span>
          <Switch
            checked={isAvailable}
            onCheckedChange={handleAvailabilityChange}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
        {currentCall ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Call</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="text-lg font-medium">
                    {currentCall.customer.firstName}{" "}
                    {currentCall.customer.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="text-lg font-medium">
                    {new Date(currentCall.startTime).toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <CallInterface
                callId={currentCall.id}
                targetUserId={currentCall.customer.id}
                onEndCall={handleEndCall}
                isRepresentative={true}
              />
              <div className="space-y-6">
                <SentimentAnalyzer callId={currentCall.id} />
                <NetworkStats callId={currentCall.id} />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <CallSummary callId={currentCall.id} />
              <NextSteps context={`Customer: ${currentCall.customer.firstName} ${currentCall.customer.lastName}`} />
            </div>

            <JourneyTimeline customerId={currentCall.customer.id} />

            <div className="grid gap-6 md:grid-cols-2">
              <CallRecorder callId={currentCall.id} isActive={true} />
              <CallNotes callId={currentCall.id} isActive={true} />
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {isAvailable ? "Waiting for Calls" : "Currently Unavailable"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {isAvailable
                  ? "You will be notified when a customer is assigned to you."
                  : "Toggle availability to start receiving calls."}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <KnowledgeBase />
        </div>
      </div>

      {!socket && (
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
