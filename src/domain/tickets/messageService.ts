import { requireSupabase } from '../../lib/supabase';

export type SupportMessage = {
  id: string;
  ticket_id: string;
  sender_user_id: string;
  message: string;
  visibility: 'public' | 'internal';
  created_at: string;
};

export async function listTicketMessages(ticketId: string): Promise<SupportMessage[]> {
  const { data, error } = await requireSupabase()
    .from('support_ticket_messages')
    .select('id,ticket_id,sender_user_id,message,visibility,created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SupportMessage[];
}

export async function sendTicketMessage(ticketId: string, message: string, visibility: SupportMessage['visibility']): Promise<void> {
  const client = requireSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Your session has expired. Please sign in again.');
  const { error } = await client.from('support_ticket_messages').insert({
    ticket_id: ticketId,
    sender_user_id: user.id,
    message: message.trim(),
    visibility,
  });
  if (error) throw error;
}

export function subscribeToTicketMessages(ticketId: string, onChange: () => void) {
  return requireSupabase().channel('support-ticket-messages-' + ticketId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'support_ticket_messages', filter: 'ticket_id=eq.' + ticketId }, onChange)
    .subscribe();
}
