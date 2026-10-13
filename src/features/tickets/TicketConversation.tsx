import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { requireSupabase } from '../../lib/supabase';
import { listTicketMessages, sendTicketMessage, subscribeToTicketMessages, type SupportMessage } from '../../domain/tickets/messageService';
import type { SupportTicket } from '../../domain/tickets/types';

type Props = { ticket: SupportTicket; accessLevel: 'owner' | 'administrator' | 'view_only' | null };

export function TicketConversation({ ticket, accessLevel }: Props) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [visibility, setVisibility] = useState<SupportMessage['visibility']>('public');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const canReply = accessLevel === 'owner' || accessLevel === 'administrator';
  const canWriteInternal = accessLevel === 'owner' || accessLevel === 'administrator';

  const load = useCallback(async () => {
    try {
      const rows = await listTicketMessages(ticket.id);
      setMessages(rows);
      setError('');
    } catch (e) {
      setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Could not load conversation.');
    } finally { setLoading(false); }
  }, [ticket.id]);

  useEffect(() => {
    setLoading(true);
    void load();
    const channel = subscribeToTicketMessages(ticket.id, () => { void load(); });
    return () => { void requireSupabase().removeChannel(channel); };
  }, [ticket.id, load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    setSending(true); setError('');
    try {
      await sendTicketMessage(ticket.id, draft, visibility);
      setDraft('');
      await load();
    } catch (e) {
      setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Message could not be sent.');
    } finally { setSending(false); }
  }

  return <section className="ticket-conversation">
    <div className="conversation-heading"><div><h4>Conversation</h4><p>Replies are shared with the restaurant. Internal notes are only visible to support administrators.</p></div></div>
    <div className="conversation-list" aria-live="polite">
      {loading ? <p className="conversation-empty">Loading messages…</p> : messages.length === 0 ? <p className="conversation-empty">No messages yet. Send the first reply to start the conversation.</p> : messages.map((item) => {
        const fromRequester = item.sender_user_id === ticket.requester_user_id;
        return <article key={item.id} className={'conversation-message ' + (item.visibility === 'internal' ? 'is-internal' : fromRequester ? 'from-requester' : 'from-support')}>
          <div className="conversation-message-meta"><strong>{item.visibility === 'internal' ? 'Internal note' : fromRequester ? 'Restaurant owner' : 'Support team'}</strong><time>{new Date(item.created_at).toLocaleString()}</time></div>
          <p>{item.message}</p>
        </article>;
      })}
    </div>
    {canReply && <form className="conversation-composer" onSubmit={(e) => void submit(e)}>
      {canWriteInternal && <label>Message visibility<select value={visibility} onChange={(e) => setVisibility(e.target.value as SupportMessage['visibility'])}><option value="public">Public reply — visible to restaurant</option><option value="internal">Internal note — support only</option></select></label>}
      <label htmlFor="ticket-reply">Write a {visibility === 'internal' ? 'private note' : 'reply'}</label>
      <textarea id="ticket-reply" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={10000} rows={4} placeholder={visibility === 'internal' ? 'Add an internal note…' : 'Write a response to the restaurant…'} required />
      {error && <div className="alert alert-error">{error}</div>}
      <button className="button button-primary button-wide" type="submit" disabled={sending || !draft.trim()}>{sending ? 'Sending…' : visibility === 'internal' ? 'Add internal note' : 'Send reply'}</button>
    </form>}
    {!canReply && <p className="view-only-note">This account has read-only access.</p>}
  </section>;
}
