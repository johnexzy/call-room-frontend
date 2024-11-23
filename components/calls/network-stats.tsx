"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WS_NAMESPACES } from "@/constants/websocket.constants";

interface NetworkStats {
  bitrate: number;
  packetsLost: number;
  roundTripTime: number;
  jitter: number;
  audioLevel: number;
}

interface NetworkStatsProps {
  callId: string;
}

export function NetworkStats({ callId }: NetworkStatsProps) {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const { socket } = useWebSocket(WS_NAMESPACES.CALLS);

  useEffect(() => {
    if (!socket) return;

    socket.on(`network_stats:${callId}`, (data: NetworkStats) => {
      setStats(data);
    });

    return () => {
      socket.off(`network_stats:${callId}`);
    };
  }, [socket, callId]);

  const getQualityColor = (value: number, threshold: number) => {
    const percentage = (value / threshold) * 100;
    if (percentage <= 50) return 'bg-green-500';
    if (percentage <= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Network Quality</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Packet Loss</span>
            <span>{stats.packetsLost}%</span>
          </div>
          <Progress 
            value={100 - stats.packetsLost} 
            className={getQualityColor(stats.packetsLost, 5)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Round Trip Time</span>
            <span>{stats.roundTripTime}ms</span>
          </div>
          <Progress 
            value={100 - (stats.roundTripTime / 3)} 
            className={getQualityColor(stats.roundTripTime, 300)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Jitter</span>
            <span>{stats.jitter}ms</span>
          </div>
          <Progress 
            value={100 - (stats.jitter * 2)} 
            className={getQualityColor(stats.jitter, 50)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Audio Level</span>
            <span>{stats.audioLevel}dB</span>
          </div>
          <Progress 
            value={stats.audioLevel + 100} 
            className={getQualityColor(-stats.audioLevel, 50)}
          />
        </div>

        <div className="text-sm text-muted-foreground text-center">
          Bitrate: {(stats.bitrate / 1000).toFixed(1)} kbps
        </div>
      </CardContent>
    </Card>
  );
} 