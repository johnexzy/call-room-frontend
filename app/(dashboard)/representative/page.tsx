"use client";

import { useEffect, useState, Suspense } from "react";
import { useWebSocket } from "@/app/hooks/useWebSocket";
import { apiClient } from "@/app/lib/api-client";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CallInterface } from "@/components/call/call-interface";

interface ActiveCall {
  id: string;
  customerId: string;
  customerName: string;
  startTime: Date;
}

export default function RepresentativeDashboard() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const socket = useWebSocket("notifications");

  useEffect(() => {
    if (socket) {
      socket.on("notification", (notification) => {
        if (notification.type === "call_ready") {
          setActiveCall({
            id: notification.data.callId,
            customerId: notification.data.customerId,
            customerName: notification.data.customerName,
            startTime: new Date(),
          });
        }
      });
    }
  }, [socket]);

  const handleAvailabilityChange = async () => {
    try {
      const response = await apiClient.put("/users/availability", {
        isAvailable: !isAvailable,
      });
      if (response.ok) {
        setIsAvailable(!isAvailable);
      }
    } catch (error) {
      console.error("Failed to update availability:", error);
    }
  };

  const handleEndCall = async () => {
    if (!activeCall) return;

    try {
      await apiClient.post(`/calls/end/${activeCall.id}`, {});
      setActiveCall(null);
    } catch (error) {
      console.error("Failed to end call:", error);
    }
  };

  if (!socket) {
    return <DashboardSkeleton />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<DashboardSkeleton />}>
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Representative Dashboard</h1>
            <div className="flex items-center space-x-2">
              <Switch
                checked={isAvailable}
                onCheckedChange={handleAvailabilityChange}
              />
              <Label>Available for Calls</Label>
            </div>
          </div>

          {activeCall ? (
            <div className="space-y-6">
              <CallInterface callId={activeCall.id} onEndCall={handleEndCall} />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Active Calls</CardTitle>
                <CardDescription>
                  {isAvailable
                    ? "Waiting for the next customer..."
                    : "Set yourself as available to receive calls"}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
