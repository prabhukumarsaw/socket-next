"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

interface VisitsChartProps {
  data: Array<{
    date: string;
    uniqueVisits: number;
    totalVisits: number;
  }>;
}

const chartConfig = {
  uniqueVisits: {
    label: "Unique Visits",
    color: "hsl(var(--chart-1))",
  },
  totalVisits: {
    label: "Total Visits",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function VisitsChart({ data }: VisitsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Visits</CardTitle>
        <CardDescription>Unique and total visits by day</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillUniqueVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-uniqueVisits)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-uniqueVisits)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillTotalVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-totalVisits)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-totalVisits)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="uniqueVisits"
              stroke="var(--color-uniqueVisits)"
              fill="url(#fillUniqueVisits)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="totalVisits"
              stroke="var(--color-totalVisits)"
              fill="url(#fillTotalVisits)"
              stackId="2"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

