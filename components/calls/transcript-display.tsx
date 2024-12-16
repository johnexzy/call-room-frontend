import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { forwardRef, useImperativeHandle, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";

interface TranscriptEntry {
  userId: string;
  text: string;
  timestamp: Date;
}

interface TranscriptDisplayProps {
  customerId: string;
}

export interface TranscriptDisplayRef {
  addTranscript: (userId: string, text: string) => void;
}

export const TranscriptDisplay = forwardRef<
  TranscriptDisplayRef,
  TranscriptDisplayProps
>(({ customerId }, ref) => {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);

  const addTranscript = (userId: string, text: string) => {
    setTranscripts((prev) => [
      ...prev,
      { userId, text, timestamp: new Date() },
    ]);
  };

  useImperativeHandle(ref, () => ({
    addTranscript,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Transcript</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {transcripts.map((entry, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  entry.userId === customerId ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    entry.userId === customerId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{entry.text}</p>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {entry.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

TranscriptDisplay.displayName = "TranscriptDisplay";
