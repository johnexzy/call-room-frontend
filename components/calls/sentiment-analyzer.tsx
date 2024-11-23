"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WS_NAMESPACES } from "@/constants/websocket.constants";

interface SentimentData {
  score: number;
  sentiment: "positive" | "neutral" | "negative";
  keywords: string[];
  confidence: number;
}

interface SentimentAnalyzerProps {
  callId: string;
}

export function SentimentAnalyzer({
  callId,
}: Readonly<SentimentAnalyzerProps>) {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const { socket } = useWebSocket(WS_NAMESPACES.CALLS);

  useEffect(() => {
    if (!socket) return;

    socket.emit("join_sentiment_room", { callId });
    socket.on(`sentiment_update:${callId}`, (data: SentimentData) => {
      setSentiment(data);
    });

    return () => {
      socket.emit("leave_sentiment_room", { callId });
      socket.off(`sentiment_update:${callId}`);
    };
  }, [socket, callId]);

  if (!sentiment) return null;

  const getSentimentColor = (score: number) => {
    if (score >= 0.6) return "bg-green-500";
    if (score >= 0.4) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getSentimentStyle = (sentiment: string | undefined) => {
    if (sentiment === "positive") return "bg-green-100 text-green-800";
    if (sentiment === "neutral") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Sentiment Score</span>
            <span>{(sentiment?.score ?? 0 * 100).toFixed(1)}%</span>
          </div>
          <Progress
            value={sentiment?.score ? sentiment.score * 100 : 0}
            className={getSentimentColor(sentiment?.score ?? 0)}
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Overall Mood</span>
          <div className="flex items-center space-x-2">
            <div
              className={`px-3 py-1 rounded-full text-sm ${getSentimentStyle(sentiment?.sentiment)}`}
            >
              {(sentiment?.sentiment ?? "N/A").charAt(0).toUpperCase() +
                (sentiment?.sentiment ?? "N/A").slice(1)}
            </div>
            <span className="text-sm text-muted-foreground">
              {sentiment?.confidence.toFixed(1)}% confidence
            </span>
          </div>
        </div>

        {sentiment?.keywords?.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Key Phrases</span>
            <div className="flex flex-wrap gap-2">
              {sentiment.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="px-2 py-1 bg-muted rounded-md text-xs"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
