import { AreaGraph } from '@/features/overview/components/area-graph';
import { getNewsViewsByDeviceType } from '@/lib/actions/chart-data';

export default async function AreaStats() {
  const result = await getNewsViewsByDeviceType(30);
  
  return <AreaGraph data={result.data || []} total={result.total || 0} />;
}
