"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CallSummary } from "@/components/calls/call-summary";
import { NextSteps } from "@/components/calls/next-steps";
import { CallNotes } from "@/components/calls/call-notes";
// import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";

interface CallDetails {
  id: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  representative: {
    id: string;
    firstName: string;
    lastName: string;
  };
  startTime: string;
  endTime?: string;
  status: string;
  transcripts: Array<{
    text: string;
    speaker: string;
    timestamp: string;
  }>;
}

// const CallRecorder = dynamic(
//   () => import("@/components/calls/call-recorder").then((mod) => mod.default),
//   { ssr: false }
// );

export default function CallDetailsPage() {
  const { id } = useParams();
  const [call, setCall] = useState<CallDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCallDetails = async () => {
      try {
        const response = await apiClient.get(`/calls/${id}`);
        if (response.ok) {
          const data = await response.json();
          setCall(data);
        }
      } catch (error) {
        console.error("Failed to load call details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCallDetails();
  }, [id]);

  if (isLoading || !call) {
    return <div>Loading...</div>;
  }

  const getCallContext = () => {
    return call.transcripts.map((t) => `${t.speaker}: ${t.text}`).join("\n");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Call Details</h1>
        <Badge variant={call.status === "completed" ? "default" : "secondary"}>
          {call.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="font-medium">Customer: </span>
            {call.customer.firstName} {call.customer.lastName}
          </div>
          <div>
            <span className="font-medium">Representative: </span>
            {call.representative.firstName} {call.representative.lastName}
          </div>
          <div>
            <span className="font-medium">Started: </span>
            {formatDistanceToNow(new Date(call.startTime), { addSuffix: true })}
          </div>
          {call.endTime && (
            <div>
              <span className="font-medium">Duration: </span>
              {formatDistanceToNow(new Date(call.startTime), {
                addSuffix: false,
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">AI Summary</TabsTrigger>
          <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
          <TabsTrigger value="recording">Recording</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <CallSummary callId={call.id} />
        </TabsContent>

        <TabsContent value="suggestions">
          <NextSteps context={getCallContext()} />
        </TabsContent>

        {/* <TabsContent value="recording">
          <CallRecorder callId={call.id} isActive={false} />
        </TabsContent> */}

        <TabsContent value="notes">
          <CallNotes callId={call.id} isActive={false} />
        </TabsContent>

        <TabsContent value="transcript">
          <Card>
            <CardHeader>
              <CardTitle>Call Transcript</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {call.transcripts.map((transcript, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-2 ${
                    transcript.speaker === "customer" ? "justify-end" : ""
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-2 rounded-lg ${
                      transcript.speaker === "customer"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    }`}
                  >
                    <p className="text-sm">{transcript.text}</p>
                    <span className="text-xs opacity-70">
                      {new Date(transcript.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
