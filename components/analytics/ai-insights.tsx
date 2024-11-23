"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";

interface AIInsights {
  commonIssues: Array<{ issue: string; count: number }>;
  sentimentTrends: Array<{ date: string; sentiment: string; count: number }>;
  resolutionRate: number;
}

export function AIInsights() {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const response = await apiClient.get('/ai/insights');
        if (response.ok) {
          const data = await response.json();
          setInsights(data);
        }
      } catch (error) {
        console.error('Failed to load AI insights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInsights();
  }, []);

  if (isLoading || !insights) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Common Issues</h4>
          <ul className="space-y-1">
            {insights.commonIssues.map((issue, index) => (
              <li key={index} className="text-sm flex justify-between">
                <span>{issue.issue}</span>
                <span className="text-muted-foreground">{issue.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Resolution Rate</h4>
          <div className="text-2xl font-bold">
            {(insights.resolutionRate * 100).toFixed(1)}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 