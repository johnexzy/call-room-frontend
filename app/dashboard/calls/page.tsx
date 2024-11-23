"use client";

import { CallHistoryTable } from "@/components/calls/call-history-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function CallsPage() {
  const [view, setView] = useState<'all' | 'missed' | 'completed'>('all');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Call History</h1>
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="all">All Calls</TabsTrigger>
            <TabsTrigger value="missed">Missed</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call Records</CardTitle>
        </CardHeader>
        <CardContent>
          <CallHistoryTable initialFilter={view} />
        </CardContent>
      </Card>
    </div>
  );
} 