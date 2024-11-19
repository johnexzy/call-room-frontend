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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { apiClient } from "@/lib/api-client";

interface CallRecord {
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
  status: "active" | "completed" | "missed";
  notes?: string;
}

const statusColors = {
  active: "bg-green-500",
  completed: "bg-blue-500",
  missed: "bg-red-500",
};

export function CallHistory() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    try {
      const response = await apiClient.get("/calls/history");
      if (response.ok) {
        const data = await response.json();
        setCalls(data);
      }
    } catch (error) {
      console.error("Failed to load call history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call History</CardTitle>
        <CardDescription>View your recent calls and their status</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Representative</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((call) => {
              const duration = call.endTime
                ? Math.round(
                    (new Date(call.endTime).getTime() -
                      new Date(call.startTime).getTime()) /
                      1000 /
                      60
                  )
                : 0;

              return (
                <TableRow key={call.id}>
                  <TableCell>
                    {format(new Date(call.startTime), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    {call.customer.firstName} {call.customer.lastName}
                  </TableCell>
                  <TableCell>
                    {call.representative.firstName} {call.representative.lastName}
                  </TableCell>
                  <TableCell>{duration} minutes</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusColors[call.status]}
                    >
                      {call.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )}
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 