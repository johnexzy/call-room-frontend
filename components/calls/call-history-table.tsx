"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from 'next/navigation';

interface Call {
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
  endTime?: string;
  status: string;
  feedback?: Array<{
    rating: number;
  }>;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface CallHistoryTableProps {
  initialFilter: 'all' | 'missed' | 'completed';
}

export function CallHistoryTable({ initialFilter }: CallHistoryTableProps) {
  const router = useRouter();
  const [calls, setCalls] = useState<Call[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(
    initialFilter === 'all' ? null : initialFilter
  );

  const loadCalls = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (status) {
        params.append("status", status);
      }

      const response = await apiClient.get(
        `/calls/history?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setCalls(data.data);
        setMeta(data.meta);
      }
    } catch (error) {
      console.error("Failed to load calls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, [status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "missed":
        return "bg-red-100 text-red-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAverageRating = (feedback?: Array<{ rating: number }>) => {
    if (!feedback?.length) return null;
    const sum = feedback.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / feedback.length).toFixed(1);
  };

  const handleRowClick = (callId: string) => {
    router.push(`/dashboard/calls/${callId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-5 w-[200px]" />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Representative</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[100px] rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[40px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-5 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select
          value={status || "all"}
          onValueChange={(value) => setStatus(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Calls</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>

        {meta && (
          <div className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} calls
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Representative</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Started</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((call) => (
              <TableRow 
                key={call.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(call.id)}
              >
                <TableCell>
                  {call.customer.firstName} {call.customer.lastName}
                </TableCell>
                <TableCell>
                  {call.representative.firstName} {call.representative.lastName}
                </TableCell>
                <TableCell>
                  {call.endTime
                    ? formatDistanceToNow(new Date(call.startTime), {
                        addSuffix: false,
                      })
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(call.status)}>
                    {call.status}
                  </Badge>
                </TableCell>
                <TableCell>{getAverageRating(call.feedback) ?? "-"}</TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(call.startTime), {
                    addSuffix: true,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            disabled={!meta.hasPreviousPage}
            onClick={() => loadCalls(Number(meta.page) - 1)}
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </div>
          <Button
            variant="outline"
            disabled={!meta.hasNextPage}
            onClick={() => loadCalls(Number(meta.page) + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
