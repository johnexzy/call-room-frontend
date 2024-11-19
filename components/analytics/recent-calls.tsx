"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
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

interface RecentCall {
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
  endTime: string;
  status: string;
  rating?: number;
}

export function RecentCalls() {
  const [calls, setCalls] = useState<RecentCall[]>([]);

  useEffect(() => {
    loadRecentCalls();
  }, []);

  const loadRecentCalls = async () => {
    try {
      const response = await apiClient.get("/calls/history?limit=5");
      if (response.ok) {
        const data = await response.json();
        setCalls(data);
      }
    } catch (error) {
      console.error("Failed to load recent calls:", error);
    }
  };

  const getStatusVariant = (status: string) => {
    if (status === "completed") return "success";
    if (status === "missed") return "destructive";
    return "secondary";
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Rating</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {calls.map((call) => (
          <TableRow key={call.id}>
            <TableCell>{format(new Date(call.startTime), "HH:mm")}</TableCell>
            <TableCell>
              {call.customer.firstName} {call.customer.lastName}
            </TableCell>
            <TableCell>
              <Badge
                variant={getStatusVariant(call.status)}
              >
                {call.status}
              </Badge>
            </TableCell>
            <TableCell>{call.rating ? `${call.rating}/5` : "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
