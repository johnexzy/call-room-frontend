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
import { WS_NAMESPACES, WS_EVENTS } from '@/constants/websocket.constants';

interface QueueEntry {
  position: number;
  customerName: string;
  waitingTime: number;
  isCallback: boolean;
}

export default function QueueManagementPage() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const { socket } = useWebSocket(WS_NAMESPACES.QUEUE);

  useEffect(() => {
    loadQueue();

    if (socket) {
      socket.on(WS_EVENTS.QUEUE.QUEUE_UPDATE, () => {
        loadQueue();
      });
    }

    return () => {
      socket?.off(WS_EVENTS.QUEUE.QUEUE_UPDATE);
    };
  }, [socket]);

  const loadQueue = async () => {
    try {
      const response = await apiClient.get("/admin/queue/live");
      if (response.ok) {
        const data = await response.json();
        setQueue(data);
      }
    } catch (error) {
      console.error("Failed to load queue:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Queue Management</h1>
        <Badge variant="secondary" className="text-lg">
          Total in Queue: {queue.length}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Position</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Waiting Time</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {queue.map((entry) => (
            <TableRow key={entry.position}>
              <TableCell>{entry.position}</TableCell>
              <TableCell>{entry.customerName}</TableCell>
              <TableCell>{entry.waitingTime} minutes</TableCell>
              <TableCell>
                <Badge variant={entry.isCallback ? "default" : "secondary"}>
                  {entry.isCallback ? "Callback" : "Direct"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {queue.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-8 text-muted-foreground"
              >
                No customers in queue
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
