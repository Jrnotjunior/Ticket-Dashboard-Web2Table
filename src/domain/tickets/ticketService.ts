import type { SupportTicket, TicketStatus } from './types';
import { supportRequest, pollSupportChanges } from './adminApi';

export async function listTickets(): Promise<SupportTicket[]> {
  const result = await supportRequest<{ tickets: SupportTicket[] }>('list_tickets');
  return result.tickets;
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<void> {
  await supportRequest('update_ticket_status', { id, status });
}

export function subscribeToTickets(onChange: () => void) {
  return pollSupportChanges(onChange);
}
