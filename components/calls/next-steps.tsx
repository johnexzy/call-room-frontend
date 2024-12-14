"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { Wand2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NextStepsProps {
  callId: string;
}

interface Suggestion {
  action: string;
  priority: "high" | "medium" | "low";
  reasoning: string;
}

interface NextStepsData {
  suggestions: Suggestion[];
  generatedAt: Date;
}

export function NextSteps({ callId }: NextStepsProps) {
  const [nextSteps, setNextSteps] = useState<NextStepsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateNextSteps = async (refresh = false) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post(
        `/ai/calls/${callId}/next-steps${refresh ? "?refresh=true" : ""}`
      );
      if (response.ok) {
        const data = await response.json();
        setNextSteps({
          suggestions: data.suggestions,
          generatedAt: data.generatedAt || new Date(),
        });
      }
    } catch (error) {
      console.error("Failed to generate next steps:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateNextSteps();
  }, [callId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          AI Suggestions
          <div className="flex items-center gap-2">
            {nextSteps?.generatedAt && (
              <span className="text-xs text-muted-foreground">
                Generated{" "}
                {formatDistanceToNow(new Date(nextSteps.generatedAt), {
                  addSuffix: true,
                })}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateNextSteps(true)}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Regenerate
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {nextSteps && nextSteps.suggestions?.length > 0 ? (
          nextSteps.suggestions.map((suggestion, index) => (
            <div key={index} className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">{suggestion.action}</h4>
                <Badge className={getPriorityColor(suggestion.priority)}>
                  {suggestion.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {suggestion.reasoning}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No suggestions available. Click regenerate to get AI suggestions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
