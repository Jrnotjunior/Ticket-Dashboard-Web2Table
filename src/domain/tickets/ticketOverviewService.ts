import { requireSupabase } from '../../lib/supabase';
import type { TicketOverviewCounts } from '../../features/tickets/overview/TicketOverview';

export async function getTicketOverviewCounts(): Promise<TicketOverviewCounts> {
  const { data, error } = await requireSupabase().from('support_ticket_dashboard_counts').select('*').single();
  if (error) throw error;
  return data as TicketOverviewCounts;
}

export function subscribeToTicketOverviewCounts(onChange: () => void) {
  return requireSupabase().channel('support-ticket-overview-counts')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_support_requests' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'support_ticket_messages' }, onChange)
    .subscribe();
}
