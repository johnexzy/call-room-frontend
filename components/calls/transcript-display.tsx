import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { forwardRef, useImperativeHandle, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

interface TranscriptEntry {
  userId: string;
  text: string;
  timestamp: Date;
}

interface TranscriptDisplayProps {
  customerId: string;
  customerName?: string;
  repName?: string;
}

export interface TranscriptDisplayRef {
  addTranscript: (userId: string, text: string) => void;
}

export const TranscriptDisplay = forwardRef<
  TranscriptDisplayRef,
  TranscriptDisplayProps
>(({ customerId, customerName = "Customer", repName = "Representative" }, ref) => {
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
    <Card className="border-none shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <CardTitle>Live Transcript</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {transcripts.map((entry, index) => {
              const isCustomer = entry.userId === customerId;
              const speakerName = isCustomer ? customerName : repName;
              const badgeVariant = isCustomer ? "default" : "secondary";

              return (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col gap-1",
                    isCustomer ? "items-end" : "items-start"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={badgeVariant}>{speakerName}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      isCustomer
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted rounded-tl-none"
                    )}
                  >
                    <p className="text-sm leading-relaxed">{entry.text}</p>
                  </div>
                </div>
              );
            })}
            {transcripts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No transcripts yet</p>
                <p className="text-xs">Start speaking to see the conversation</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

TranscriptDisplay.displayName = "TranscriptDisplay";
