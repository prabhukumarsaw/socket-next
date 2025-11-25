import { BarGraph } from '@/features/overview/components/bar-graph';
import { getDailyNewsPostCounts } from '@/lib/actions/chart-data';

export default async function BarStats() {
  const result = await getDailyNewsPostCounts(30);
  
  return <BarGraph data={result.data || []} total={result.total || 0} />;
}
