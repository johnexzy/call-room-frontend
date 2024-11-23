"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { Wand2 } from 'lucide-react';

interface NextStepsProps {
  context: string;
}

interface Suggestion {
  action: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface SuggestionsResponse {
  suggestions: Suggestion[];
}

export function NextSteps({ context }: NextStepsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/ai/suggest-next-steps', { context });
      if (response.ok) {
        const data: SuggestionsResponse = await response.json();
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <Button
            variant="outline"
            size="sm"
            onClick={generateSuggestions}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Generate
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.length > 0 ? (
          suggestions.map((suggestion, index) => (
            <div key={index} className="space-y-2">
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
            Click generate to get AI suggestions
          </p>
        )}
      </CardContent>
    </Card>
  );
} 