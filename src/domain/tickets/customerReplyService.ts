import type { SupportTicket } from './types';
import { supportRequest, pollSupportChanges } from './adminApi';

/** Returns tickets whose latest public conversation message came from the requester. */
export async function listCustomerRepliedTicketIds(tickets: SupportTicket[]): Promise<Set<string>> {
  if (tickets.length === 0) return new Set();
  const result = await supportRequest<{ ids: string[] }>('customer_replies', { ticketIds: tickets.map(ticket => ticket.id) });
  return new Set(result.ids);
}

export function subscribeToCustomerReplies(onChange: () => void) {
  return pollSupportChanges(onChange);
}
