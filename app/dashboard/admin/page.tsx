"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Overview } from "@/components/analytics/overview";
import { RecentCalls } from "@/components/analytics/recent-calls";
import { Metrics } from "@/components/analytics/metrics";
import { apiClient } from "@/lib/api-client";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WS_NAMESPACES } from "@/constants/websocket.constants";
import { ActiveCalls } from "@/components/admin/active-calls";

interface SystemMetrics {
  totalCalls: number;
  missedCalls: number;
  averageRating: number;
  averageWaitTime: number;
  activeQueueLength: number;
  availableRepresentatives: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const { socket } = useWebSocket(WS_NAMESPACES.ANALYTICS);

  useEffect(() => {
    loadMetrics();

    if (socket) {
      socket.on("metrics_update", (data) => {
        setMetrics(data);
      });
    }

    return () => {
      socket?.off("metrics_update");
    };
  }, [socket]);

  const loadMetrics = async () => {
    const today = new Date();
    const startDate = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endDate = new Date().toISOString();

    try {
      const response = await apiClient.get(
        `/admin/metrics?startDate=${startDate}&endDate=${endDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Failed to load metrics:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.activeQueueLength ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Representatives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.availableRepresentatives ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Wait Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.averageWaitTime ?? 0} min
            </div>
          </CardContent>
        </Card>
      </div>

      <ActiveCalls />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentCalls />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Metrics />
        </CardContent>
      </Card>
    </div>
  );
}
