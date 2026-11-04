import type { TicketOverviewCounts } from '../../features/tickets/overview/TicketOverview';
import { supportRequest, pollSupportChanges } from './adminApi';

export async function getTicketOverviewCounts(): Promise<TicketOverviewCounts> {
  const result = await supportRequest<{ counts: TicketOverviewCounts }>('overview_counts');
  return result.counts;
}

export function subscribeToTicketOverviewCounts(onChange: () => void) {
  return pollSupportChanges(onChange);
}
