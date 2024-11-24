import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";

interface CallRecordingProps {
  callId: string;
  isActive: boolean;
}

export function CallRecording({ callId, isActive }: CallRecordingProps) {
  const [transcript, setTranscript] = useState<Array<{
    text: string;
    timestamp: Date;
    confidence: number;
  }>>([]);

  useEffect(() => {
    if (isActive) {
      const pollTranscript = setInterval(async () => {
        const response = await apiClient.get(`/calls/${callId}/transcript`);
        if (response.ok) {
          const data = await response.json();
          setTranscript(data);
        }
      }, 5000);

      return () => clearInterval(pollTranscript);
    }
  }, [callId, isActive]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Transcript</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] overflow-y-auto space-y-2">
        {transcript.map((entry, index) => (
          <div key={index} className="text-sm">
            <span className="text-muted-foreground">
              {new Date(entry.timestamp).toLocaleTimeString()}: 
            </span>
            <span className="ml-2">{entry.text}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 