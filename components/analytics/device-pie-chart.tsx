"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell, Label } from "recharts";

interface DevicePieChartProps {
  data: Array<{
    device: string;
    count: number;
  }>;
  title: string;
  description: string;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function DevicePieChart({ data, title, description }: DevicePieChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const chartConfig = data.reduce((acc, item, index) => {
    acc[item.device.toLowerCase().replace(/\s+/g, "")] = {
      label: item.device,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="device"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ device, count, percent }) =>
                `${device}: ${((percent * 100).toFixed(1))}%`
              }
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
              <Label
                value={`Total: ${total}`}
                position="center"
                className="text-sm font-medium"
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

