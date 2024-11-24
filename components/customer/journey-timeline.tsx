"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { formatDistanceToNow } from 'date-fns';

interface Interaction {
  id: string;
  type: 'call' | 'feedback' | 'issue' | 'resolution';
  timestamp: string;
  details: string;
  satisfaction?: number;
  status: 'positive' | 'neutral' | 'negative';
  metadata?: Record<string, any>;
}

interface JourneyTimelineProps {
  customerId: string;
}

export function JourneyTimeline({ customerId }: Readonly<JourneyTimelineProps>) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomerJourney();
  }, [customerId]);

  const loadCustomerJourney = async () => {
    try {
      const response = await apiClient.get(`/customers/${customerId}/journey`);
      if (response.ok) {
        const data = await response.json();
        setInteractions(data);
      }
    } catch (error) {
      console.error('Failed to load customer journey:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: Interaction['status']) => {
    switch (status) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTypeIcon = (type: Interaction['type']) => {
    switch (type) {
      case 'call':
        return '📞';
      case 'feedback':
        return '📝';
      case 'issue':
        return '⚠️';
      case 'resolution':
        return '✅';
      default:
        return '•';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Journey</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-muted" />

          {interactions.map((interaction) => (
            <div key={interaction.id} className="relative pl-8">
              {/* Timeline dot */}
              <div className="absolute left-0 w-4 h-4 bg-background border-2 border-primary rounded-full" />
              
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>{getTypeIcon(interaction.type)}</span>
                    <span className="font-medium">
                      {interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)}
                    </span>
                    <Badge className={getStatusColor(interaction.status)}>
                      {interaction.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(interaction.timestamp), { addSuffix: true })}
                  </span>
                </div>

                <p className="text-sm">{interaction.details}</p>

                {interaction.satisfaction && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Satisfaction:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={star <= interaction.satisfaction! ? 'text-yellow-400' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {interaction.metadata && Object.keys(interaction.metadata).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(interaction.metadata).map(([key, value]) => (
                      <Badge key={key} variant="outline">
                        {key}: {value}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 