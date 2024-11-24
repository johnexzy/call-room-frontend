import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";

interface QualityMetrics {
  audioQuality: {
    packetLoss: number;
    jitter: number;
    latency: number;
  };
  networkMetrics: {
    bandwidth: number;
    roundTripTime: number;
  };
}

export function QualityMonitor({ callId }: { callId: string }) {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await apiClient.get(`/calls/${callId}/quality`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [callId]);

  if (!metrics) return null;

  const getQualityStatus = (metric: number, threshold: number) => {
    return metric <= threshold ? "success" : "destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Quality Metrics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Audio Quality</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Packet Loss</span>
                <Badge variant={getQualityStatus(metrics.audioQuality.packetLoss, 1)}>
                  {metrics.audioQuality.packetLoss}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Jitter</span>
                <Badge variant={getQualityStatus(metrics.audioQuality.jitter, 30)}>
                  {metrics.audioQuality.jitter}ms
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Latency</span>
                <Badge variant={getQualityStatus(metrics.audioQuality.latency, 100)}>
                  {metrics.audioQuality.latency}ms
                </Badge>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Network Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Bandwidth</span>
                <Badge variant={getQualityStatus(metrics.networkMetrics.bandwidth, 500)}>
                  {metrics.networkMetrics.bandwidth}kbps
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Round Trip Time</span>
                <Badge variant={getQualityStatus(metrics.networkMetrics.roundTripTime, 200)}>
                  {metrics.networkMetrics.roundTripTime}ms
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 