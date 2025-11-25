import { PieGraph } from '@/features/overview/components/pie-graph';
import { getNewsByAuthorDistribution } from '@/lib/actions/chart-data';

export default async function Stats() {
  const result = await getNewsByAuthorDistribution();
  
  return <PieGraph data={result.data || []} total={result.total || 0} />;
}
