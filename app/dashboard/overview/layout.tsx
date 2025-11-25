import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import React from 'react';
import { getDashboardOverviewStats } from '@/lib/actions/dashboard-overview';

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export default async function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  // Fetch dashboard overview statistics
  const result = await getDashboardOverviewStats();
  const stats = result.stats;

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Hi, Welcome back 👋
          </h2>
        </div>

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          {/* Card 1: Today's Unique Visits */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Today's Unique Visits</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {formatNumber(stats.todayUniqueVisits)}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  {stats.visitChange >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                  {stats.visitChange >= 0 ? '+' : ''}{stats.visitChange.toFixed(1)}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {stats.visitChange >= 0 ? 'Trending up today' : 'Down today'} 
                {stats.visitChange >= 0 ? <IconTrendingUp className='size-4' /> : <IconTrendingDown className='size-4' />}
              </div>
              <div className='text-muted-foreground'>
                {stats.todayNewsViews} news views today
              </div>
            </CardFooter>
          </Card>

          {/* Card 2: Total News Posts */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Total News Posts</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {formatNumber(stats.totalNews)}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  {stats.publishedChange >= 50 ? <IconTrendingUp /> : <IconTrendingDown />}
                  {stats.publishedChange.toFixed(1)}% published
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {stats.publishedNews} published posts
                {stats.publishedChange >= 50 ? <IconTrendingUp className='size-4' /> : <IconTrendingDown className='size-4' />}
              </div>
              <div className='text-muted-foreground'>
                {stats.totalNews - stats.publishedNews} drafts
              </div>
            </CardFooter>
          </Card>

          {/* Card 3: Total Users & Roles */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Users & Roles</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {formatNumber(stats.totalUsers)}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconTrendingUp />
                  {stats.totalRoles} roles
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Active user accounts <IconTrendingUp className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                {stats.totalRoles} role{stats.totalRoles !== 1 ? 's' : ''} configured
              </div>
            </CardFooter>
          </Card>

          {/* Card 4: Active Advertisements */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Active Advertisements</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {formatNumber(stats.activeAds)}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  {stats.activeAds > 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                  Active now
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {stats.activeAds > 0 ? 'Ads running' : 'No active ads'} 
                {stats.activeAds > 0 ? <IconTrendingUp className='size-4' /> : <IconTrendingDown className='size-4' />}
              </div>
              <div className='text-muted-foreground'>
                Currently displayed on site
              </div>
            </CardFooter>
          </Card>
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>
            {/* sales arallel routes */}
            {sales}
          </div>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 md:col-span-3'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
