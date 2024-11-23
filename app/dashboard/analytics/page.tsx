"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "@/components/analytics/overview";
import { RecentCalls } from "@/components/analytics/recent-calls";
import { Metrics } from "@/components/analytics/metrics";
import { apiClient } from "@/lib/api-client";
import { AnalyticsData } from "@/types/analytics";

type TimeframeType = "day" | "week" | "month";

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeframe, setTimeframe] = useState<TimeframeType>("week");

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      const response = await apiClient.get(
        `/analytics/metrics?timeframe=${timeframe}`
      );
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as TimeframeType)}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Calls"
          value={analyticsData?.totalCalls ?? 0}
        />
        <MetricCard
          title="Average Rating"
          value={(analyticsData?.averageRating ?? 0).toFixed(1)}
        />
        <MetricCard
          title="Avg. Call Duration"
          value={`${analyticsData?.averageCallDuration ?? 0} min`}
        />
        <MetricCard
          title="Missed Calls"
          value={analyticsData?.missedCalls ?? 0}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>

        <div className="col-span-3">
          <RecentCalls />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Metrics />
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
