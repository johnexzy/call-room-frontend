"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { useWebSocket } from "@/hooks/useWebSocket";
import { formatDistanceToNow } from "date-fns";
import { WS_NAMESPACES } from "@/constants/websocket.constants";

interface ActiveCall {
  id: string;
  customer: {
    firstName: string;
    lastName: string;
  };
  representative: {
    firstName: string;
    lastName: string;
  };
  startTime: string;
  qualityMetrics?: {
    audioQuality: {
      packetLoss: number;
      latency: number;
    };
  };
}

export default function ActiveCallsPage() {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const { socket } = useWebSocket(WS_NAMESPACES.CALLS);

  useEffect(() => {
    loadActiveCalls();

    if (socket) {
      socket.on("call_update", () => {
        loadActiveCalls();
      });
    }

    const interval = setInterval(loadActiveCalls, 10000);

    return () => {
      socket?.off("call_update");
      clearInterval(interval);
    };
  }, [socket]);

  const loadActiveCalls = async () => {
    try {
      const response = await apiClient.get("/admin/calls/active");
      if (response.ok) {
        const data = await response.json();
        setActiveCalls(data);
      }
    } catch (error) {
      console.error("Failed to load active calls:", error);
    }
  };

  const getQualityStatus = (metrics?: ActiveCall["qualityMetrics"]) => {
    if (!metrics) return "unknown";

    const { packetLoss, latency } = metrics.audioQuality;
    if (packetLoss < 1 && latency < 100) return "good";
    if (packetLoss < 2 && latency < 200) return "fair";
    return "poor";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Active Calls</h1>
        <Badge variant="secondary" className="text-lg">
          Total Active: {activeCalls.length}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Representative</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Quality</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeCalls.map((call) => (
            <TableRow key={call.id}>
              <TableCell>
                {call.customer.firstName} {call.customer.lastName}
              </TableCell>
              <TableCell>
                {call.representative.firstName} {call.representative.lastName}
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(call.startTime))}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    getQualityStatus(call.qualityMetrics) === "good"
                      ? "success"
                      : getQualityStatus(call.qualityMetrics) === "fair"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {getQualityStatus(call.qualityMetrics)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {activeCalls.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-8 text-muted-foreground"
              >
                No active calls
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
