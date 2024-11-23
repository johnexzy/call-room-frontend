import { useEffect, useRef } from "react";
import { Chart, ChartConfiguration } from "chart.js/auto";

interface LineChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  category?: string;
}

export function LineChart({ data, xKey, yKey, category }: LineChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart>();

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Destroy previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels: data.map((item) => new Date(item[xKey]).toLocaleTimeString()),
        datasets: [
          {
            label: category || yKey,
            data: data.map((item) => item[yKey]),
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };

    chartInstance.current = new Chart(ctx, config);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, xKey, yKey, category]);

  return <canvas ref={chartRef} />;
}
