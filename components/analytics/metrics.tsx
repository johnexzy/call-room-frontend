"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export function Metrics() {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await apiClient.get("/analytics/call-quality");
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Failed to load metrics:", error);
    }
  };

  if (!metrics) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Metric</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Packet Loss</TableCell>
          <TableCell>{metrics.audioQuality.packetLoss.toFixed(2)}%</TableCell>
          <TableCell>
            {metrics.audioQuality.packetLoss < 1 ? "Good" : "Poor"}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Jitter</TableCell>
          <TableCell>{metrics.audioQuality.jitter.toFixed(2)} ms</TableCell>
          <TableCell>
            {metrics.audioQuality.jitter < 30 ? "Good" : "Poor"}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Latency</TableCell>
          <TableCell>{metrics.audioQuality.latency.toFixed(0)} ms</TableCell>
          <TableCell>
            {metrics.audioQuality.latency < 150 ? "Good" : "Poor"}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Bandwidth</TableCell>
          <TableCell>{(metrics.networkMetrics.bandwidth / 1000).toFixed(1)} Mbps</TableCell>
          <TableCell>
            {metrics.networkMetrics.bandwidth > 1500 ? "Good" : "Poor"}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
} 