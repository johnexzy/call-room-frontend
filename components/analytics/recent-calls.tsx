"use client";

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';

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
  status: string;
  feedback?: Array<{
    rating: number;
  }>;
}

interface CallsResponse {
  data: Call[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function RecentCalls() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecentCalls = async () => {
      try {
        const response = await apiClient.get('/calls/history?page=1&limit=5');
        if (response.ok) {
          const data: CallsResponse = await response.json();
          setCalls(data.data);
        }
      } catch (error) {
        console.error('Failed to load recent calls:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentCalls();
  }, []);

  const getAverageRating = (feedback?: Array<{ rating: number }>) => {
    if (!feedback?.length) return null;
    const sum = feedback.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / feedback.length).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <Skeleton className="h-4 w-[100px]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {calls.map((call) => (
        <div key={call.id} className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {call.customer.firstName} {call.customer.lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              with {call.representative.firstName} {call.representative.lastName}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {getAverageRating(call.feedback) && (
              <span className="text-sm text-muted-foreground">
                ★ {getAverageRating(call.feedback)}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(call.startTime), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}

      {calls.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          No recent calls
        </p>
      )}
    </div>
  );
}
