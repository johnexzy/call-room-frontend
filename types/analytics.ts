export interface AnalyticsData {
  totalCalls: number;
  averageRating: number;
  averageCallDuration: number;
  missedCalls: number;
}

export interface QualityMetrics {
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

export interface ChartData {
  time: string;
  calls: number;
  rating: number;
}

export interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: ChartData;
  }>;
} 