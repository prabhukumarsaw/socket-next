import { RecentSales } from '@/features/overview/components/recent-sales';
import { getTopRecentNews } from '@/lib/actions/chart-data';

export default async function Sales() {
  const result = await getTopRecentNews(5);
  
  return <RecentSales news={result.data || []} />;
}
