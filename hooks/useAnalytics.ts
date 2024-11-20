import { useEffect, useState } from 'react';
import { useWebSocket } from '../app/hooks/useWebSocket';
import { apiClient } from '@/app/lib/api-client';

interface AnalyticsMetrics {
  totalCalls: number;
  missedCalls: number;
  averageRating: number;
  averageCallDuration: number;
}

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

export function useAnalytics(timeframe: 'day' | 'week' | 'month') {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [quality, setQuality] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const socket = useWebSocket('analytics');

  useEffect(() => {
    if (socket) {
      socket.on('metrics_update', (data: AnalyticsMetrics) => {
        setMetrics(data);
      });

      socket.on('quality_update', (data: QualityMetrics) => {
        setQuality(data);
      });
    }

    return () => {
      if (socket) {
        socket.off('metrics_update');
        socket.off('quality_update');
      }
    };
  }, [socket]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [metricsResponse, qualityResponse] = await Promise.all([
          apiClient.get(`/analytics/metrics?timeframe=${timeframe}`),
          apiClient.get(`/analytics/call-quality?timeframe=${timeframe}`),
        ]);

        if (metricsResponse.ok && qualityResponse.ok) {
          const [metricsData, qualityData] = await Promise.all([
            metricsResponse.json(),
            qualityResponse.json(),
          ]);

          setMetrics(metricsData);
          setQuality(qualityData);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeframe]);

  return { metrics, quality, loading };
} 