import { supportRequest, pollSupportChanges } from './adminApi';

export type SupportMessage = {
  id: string;
  ticket_id: string;
  sender_user_id: string;
  message: string;
  visibility: 'public' | 'internal';
  created_at: string;
};

export const TICKET_MESSAGE_PAGE_SIZE = 50;

export async function listTicketMessages(ticketId: string, offset = 0): Promise<SupportMessage[]> {
  const result = await supportRequest<{ messages: SupportMessage[] }>('list_messages', { ticketId, offset });
  return result.messages;
}

export async function sendTicketMessage(ticketId: string, message: string, visibility: SupportMessage['visibility']): Promise<string> {
  const result = await supportRequest<{ id: string }>('send_message', { ticketId, message, visibility });
  return result.id;
}

export function subscribeToTicketMessages(_ticketId: string, onChange: () => void) {
  return pollSupportChanges(onChange);
}
