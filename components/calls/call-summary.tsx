"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { RefreshCw } from 'lucide-react';

interface CallSummaryProps {
  callId: string;
}

interface SummaryData {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  customerSentiment: 'positive' | 'negative' | 'neutral';
}

export function CallSummary({ callId }: CallSummaryProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post(`/ai/calls/${callId}/summary`, {});
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Failed to load call summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [callId]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          AI Summary
          <div className="flex items-center gap-2">
            <Badge className={getSentimentColor(summary.customerSentiment)}>
              {summary.customerSentiment.charAt(0).toUpperCase() + summary.customerSentiment.slice(1)}
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={loadSummary}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Overview</h4>
          <p className="text-sm text-muted-foreground">{summary.summary}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Key Points</h4>
          <ul className="list-disc list-inside space-y-1">
            {summary.keyPoints.map((point, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Action Items</h4>
          <ul className="list-disc list-inside space-y-1">
            {summary.actionItems.map((item, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 