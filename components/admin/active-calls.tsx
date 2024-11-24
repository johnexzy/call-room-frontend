"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiClient } from "@/lib/api-client";
import { WS_NAMESPACES } from "@/constants/websocket.constants";
import { formatDistanceToNow } from "date-fns";
import { PhoneOff } from "lucide-react";

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
  duration: number;
}

export function ActiveCalls() {
  const [calls, setCalls] = useState<ActiveCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useWebSocket(WS_NAMESPACES.CALLS);
  const { toast } = useToast();

  useEffect(() => {
    loadActiveCalls();

    if (socket) {
      socket.on("call_started", () => {
        loadActiveCalls();
      });

      socket.on("call_ended", () => {
        loadActiveCalls();
      });
    }

    return () => {
      if (socket) {
        socket.off("call_started");
        socket.off("call_ended");
      }
    };
  }, [socket]);

  const loadActiveCalls = async () => {
    try {
      const response = await apiClient.get("/admin/calls/active");
      if (response.ok) {
        const data = await response.json();
        setCalls(data);
      }
    } catch (error) {
      console.error("Failed to load active calls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = async (callId: string) => {
    try {
      const response = await apiClient.post(`/calls/${callId}/admin-end`);
      if (response.ok) {
        toast({
          title: "Call Ended",
          description: "The call has been ended successfully.",
        });
        loadActiveCalls();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end the call",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Active Calls</CardTitle>
        <Badge variant="secondary">{calls.length} Active</Badge>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Representative</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Started</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((call) => (
              <TableRow key={call.id}>
                <TableCell>
                  {call.customer.firstName} {call.customer.lastName}
                </TableCell>
                <TableCell>
                  {call.representative.firstName} {call.representative.lastName}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(call.startTime), {
                    addSuffix: false,
                  })}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(call.startTime), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleEndCall(call.id)}
                  >
                    <PhoneOff className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {calls.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-6 text-muted-foreground"
                >
                  No active calls
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
