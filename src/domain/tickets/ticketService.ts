import { requireSupabase } from '../../lib/supabase';
import type { SupportTicket, TicketStatus } from './types';

const fields = 'id,request_number,restaurant_id,requester_user_id,requester_email,request_type,subject,description,impact,status,created_at,updated_at,restaurant:restaurants(name,slug)';
const PAGE_SIZE = 500;

export async function listTickets(): Promise<SupportTicket[]> {
  const client = requireSupabase();
  const tickets: SupportTicket[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await client
      .from('restaurant_support_requests')
      .select(fields)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const page = (data ?? []) as unknown as SupportTicket[];
    tickets.push(...page);
    if (page.length < PAGE_SIZE) return tickets;
    from += PAGE_SIZE;
  }
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<void> {
  const { error } = await requireSupabase()
    .from('restaurant_support_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export function subscribeToTickets(onChange: () => void) {
  return requireSupabase().channel('support-ticket-dashboard')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_support_requests' }, onChange)
    .subscribe();
}

export function unsubscribeFromTickets(channel: ReturnType<typeof subscribeToTickets>) {
  void requireSupabase().removeChannel(channel);
}
