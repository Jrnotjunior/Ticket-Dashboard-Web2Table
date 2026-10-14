import { requireSupabase } from '../../lib/supabase';
import type { SupportTicket } from './types';

type PublicMessage = {
  ticket_id: string;
  sender_user_id: string;
  created_at: string;
};

/** Returns tickets whose latest public conversation message came from the requester. */
export async function listCustomerRepliedTicketIds(tickets: SupportTicket[]): Promise<Set<string>> {
  if (tickets.length === 0) return new Set();

  const { data, error } = await requireSupabase()
    .from('support_ticket_messages')
    .select('ticket_id,sender_user_id,created_at')
    .in('ticket_id', tickets.map(ticket => ticket.id))
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const ticketById = new Map(tickets.map(ticket => [ticket.id, ticket]));
  const latestPublicMessageByTicket = new Map<string, PublicMessage>();

  for (const row of (data ?? []) as PublicMessage[]) {
    if (!latestPublicMessageByTicket.has(row.ticket_id)) {
      latestPublicMessageByTicket.set(row.ticket_id, row);
    }
  }

  const repliedIds = new Set<string>();
  for (const [ticketId, message] of latestPublicMessageByTicket) {
    if (ticketById.get(ticketId)?.requester_user_id === message.sender_user_id) {
      repliedIds.add(ticketId);
    }
  }

  return repliedIds;
}

export function subscribeToCustomerReplies(onChange: () => void) {
  return requireSupabase()
    .channel('support-ticket-customer-replies')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'support_ticket_messages' }, onChange)
    .subscribe();
}
