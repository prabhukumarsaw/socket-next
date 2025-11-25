'use client';

import { IconTrendingUp } from '@tabler/icons-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import * as React from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

interface AreaGraphProps {
  data?: Array<{
    date: string;
    month?: string;
    desktop: number;
    mobile: number;
    tablet?: number;
  }>;
  total?: number;
}

const chartConfig = {
  views: {
    label: 'News Views'
  },
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--primary))'
  },
  mobile: {
    label: 'Mobile',
    color: 'hsl(var(--primary) / 0.7)'
  },
  tablet: {
    label: 'Tablet',
    color: 'hsl(var(--primary) / 0.5)'
  }
} satisfies ChartConfig;

export function AreaGraph({ data = [], total = 0 }: AreaGraphProps) {
  const chartData = React.useMemo(() => {
    // Group by month if we have daily data
    if (data.length > 30) {
      const monthlyData: Record<string, { month: string; desktop: number; mobile: number; tablet: number }> = {};
      
      data.forEach((item) => {
        const month = item.month || new Date(item.date).toLocaleDateString('en-US', { month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { month, desktop: 0, mobile: 0, tablet: 0 };
        }
        monthlyData[month].desktop += item.desktop || 0;
        monthlyData[month].mobile += item.mobile || 0;
        monthlyData[month].tablet += (item.tablet || 0);
      });
      
      return Object.values(monthlyData);
    }
    
    // For 30 days or less, show daily data but use month labels
    return data.map((item) => ({
      ...item,
      month: item.month || new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle>Area Chart - Stacked</CardTitle>
          <CardDescription>News views by device type</CardDescription>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='flex h-[250px] items-center justify-center text-muted-foreground'>
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }
  const totalDesktop = chartData.reduce((sum, item) => sum + (item.desktop || 0), 0);
  const totalMobile = chartData.reduce((sum, item) => sum + (item.mobile || 0), 0);
  const totalTablet = chartData.reduce((sum, item) => sum + (item.tablet || 0), 0);
  const totalViews = totalDesktop + totalMobile + totalTablet;

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Area Chart - Stacked</CardTitle>
        <CardDescription>
          News views by device type (last 30 days)
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillDesktop' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-desktop)'
                  stopOpacity={1.0}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-desktop)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillMobile' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-mobile)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-mobile)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillTablet' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-tablet)'
                  stopOpacity={0.6}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-tablet)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                if (value.includes(' ')) {
                  return value.split(' ')[1] || value.slice(0, 3);
                }
                return value.slice(0, 3);
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dot' />}
            />
            <Area
              dataKey='tablet'
              type='natural'
              fill='url(#fillTablet)'
              stroke='var(--color-tablet)'
              stackId='a'
            />
            <Area
              dataKey='mobile'
              type='natural'
              fill='url(#fillMobile)'
              stroke='var(--color-mobile)'
              stackId='a'
            />
            <Area
              dataKey='desktop'
              type='natural'
              fill='url(#fillDesktop)'
              stroke='var(--color-desktop)'
              stackId='a'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='flex items-center gap-2 leading-none font-medium'>
              {totalViews.toLocaleString()} total views{' '}
              <IconTrendingUp className='h-4 w-4' />
            </div>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              Desktop: {totalDesktop.toLocaleString()} | Mobile: {totalMobile.toLocaleString()} | Tablet: {totalTablet.toLocaleString()}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
