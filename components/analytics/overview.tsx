"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  TooltipProps as RechartsTooltipProps,
} from "recharts";
import { Card } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { ChartData } from "@/types/analytics";

const data: ChartData[] = [
  {
    time: "00:00",
    calls: 3,
    rating: 4.5,
  },
  {
    time: "03:00",
    calls: 2,
    rating: 4.0,
  },
];

const CustomTooltip = ({
  active,
  payload,
}: RechartsTooltipProps<number, string>) => {
  if (active  && payload?.length) {
    return (
      <Card className="p-2">
        <div className="grid gap-2">
          <div className="flex items-center">
            <div className="w-full">
              <p className="text-sm font-medium">{payload[0].payload.time}</p>
              <p className="text-sm text-muted-foreground">
                Calls: {payload[0].value}
              </p>
              <p className="text-sm text-muted-foreground">
                Avg Rating: {payload[1].value}
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }
  return null;
};

export function Overview() {
  const { theme } = useTheme();

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis
          dataKey="time"
          stroke={theme === "dark" ? "#888888" : "#666666"}
          fontSize={12}
        />
        <YAxis
          stroke={theme === "dark" ? "#888888" : "#666666"}
          fontSize={12}
          yAxisId="left"
        />
        <YAxis
          orientation="right"
          stroke={theme === "dark" ? "#888888" : "#666666"}
          fontSize={12}
          yAxisId="right"
        />
        <Tooltip content={CustomTooltip} />
        <Line
          type="monotone"
          strokeWidth={2}
          dataKey="calls"
          yAxisId="left"
          stroke="#2563eb"
        />
        <Line
          type="monotone"
          strokeWidth={2}
          dataKey="rating"
          yAxisId="right"
          stroke="#16a34a"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
