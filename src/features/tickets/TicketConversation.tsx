import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { requireSupabase } from '../../lib/supabase';
import { listTicketMessages, TICKET_MESSAGE_PAGE_SIZE, sendTicketMessage, subscribeToTicketMessages, type SupportMessage } from '../../domain/tickets/messageService';
import { createSupportAttachmentUrl, listSupportAttachments, uploadSupportAttachments, type SupportAttachment } from '../../domain/tickets/attachmentService';
import type { SupportTicket } from '../../domain/tickets/types';

type Props = { ticket: SupportTicket; accessLevel: 'owner' | 'administrator' | 'view_only' | null };

export function TicketConversation({ ticket, accessLevel }: Props) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [attachments, setAttachments] = useState<SupportAttachment[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const conversationListRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [visibility, setVisibility] = useState<SupportMessage['visibility']>('public');
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const canReply = accessLevel === 'owner' || accessLevel === 'administrator';
  const canWriteInternal = accessLevel === 'owner' || accessLevel === 'administrator';

  const load = useCallback(async () => {
    try {
      const [rows, attachmentRows] = await Promise.all([
        listTicketMessages(ticket.id),
        listSupportAttachments(ticket.id),
      ]);
      setMessages(rows);
      setHasOlderMessages(rows.length === TICKET_MESSAGE_PAGE_SIZE);
      setAttachments(attachmentRows);
      const urls = await Promise.all(attachmentRows.map(async (attachment) => {
        try { return [attachment.id, await createSupportAttachmentUrl(attachment.storage_path)] as const; }
        catch { return [attachment.id, ''] as const; }
      }));
      setAttachmentUrls(Object.fromEntries(urls));
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

  async function loadOlderMessages() {
    if (loadingOlder || !hasOlderMessages) return;
    setLoadingOlder(true);
    try {
      const olderRows = await listTicketMessages(ticket.id, messages.length);
      setMessages(current => [...current, ...olderRows]);
      setHasOlderMessages(olderRows.length === TICKET_MESSAGE_PAGE_SIZE);
    } catch (e) {
      setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Could not load older messages.');
    } finally {
      setLoadingOlder(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) { setError('Add a message before sending attachments.'); return; }
    setSending(true); setError('');
    try {
      const messageId = await sendTicketMessage(ticket.id, draft, visibility);
      if (files.length) await uploadSupportAttachments(ticket.id, files, messageId, visibility);
      setDraft('');
      setFiles([]);
      await load();
    } catch (e) {
      setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Message could not be sent.');
    } finally { setSending(false); }
  }

  const visibleAttachments = (messageId: string) => attachments.filter(item => item.message_id === messageId);

  return <section className="ticket-conversation">
    <div className="conversation-heading"><div><h4>Conversation</h4><p>Replies are shared with the restaurant. Internal notes are only visible to support administrators.</p></div></div>
    {canReply && <form className="conversation-composer" onSubmit={(e) => void submit(e)}>
      {canWriteInternal && <label>Message visibility<select value={visibility} onChange={(e) => setVisibility(e.target.value as SupportMessage['visibility'])}><option value="public">Public reply — visible to restaurant</option><option value="internal">Internal note — support only</option></select></label>}
      <label htmlFor="ticket-reply">Write a {visibility === 'internal' ? 'private note' : 'reply'}</label>
      <textarea id="ticket-reply" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={10000} rows={4} placeholder={visibility === 'internal' ? 'Add an internal note…' : 'Write a response to the restaurant…'} required />
      <label className="conversation-attachment-field">Attach files (optional)
        <input className="conversation-file-input" aria-label="Attach files to reply or internal note" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain" onChange={e => setFiles(Array.from(e.target.files ?? []))} disabled={sending} />
        <small className="conversation-file-help">Images, PDF, or text files. Maximum 10 MB per file.</small>
      </label>
      {files.length > 0 && <p className="conversation-attachment-selection">{files.map(file => file.name).join(', ')}</p>}
      {error && <div className="alert alert-error">{error}</div>}
      <button className="button button-primary button-compact" type="submit" disabled={sending || !draft.trim()}>{sending ? 'Sending…' : visibility === 'internal' ? 'Add internal note' : 'Send reply'}</button>
    </form>}
    <div ref={conversationListRef} className="conversation-list" aria-live="polite">
      {!loading && hasOlderMessages && <button className="button button-secondary button-compact" type="button" onClick={() => void loadOlderMessages()} disabled={loadingOlder}>{loadingOlder ? 'Loading older messages…' : 'Load older messages'}</button>}
      {attachments.some(item => !item.message_id) && <article className="conversation-message from-requester">
        <div className="conversation-message-meta"><strong>Ticket attachments</strong></div>
        <ul className="conversation-attachments">{attachments.filter(item => !item.message_id).map(attachment => <li key={attachment.id}>
          {attachmentUrls[attachment.id] ? <a href={attachmentUrls[attachment.id]} target="_blank" rel="noreferrer">{attachment.file_name}</a> : <span>{attachment.file_name} (unavailable)</span>}
          <small>{(attachment.file_size / 1024 / 1024).toFixed(2)} MB</small>
        </li>)}</ul>
      </article>}
      {loading ? <p className="conversation-empty">Loading messages…</p> : messages.length === 0 ? <p className="conversation-empty">No messages yet. Send the first reply to start the conversation.</p> : messages.map((item) => {
        const fromRequester = item.sender_user_id === ticket.requester_user_id;
        const messageAttachments = visibleAttachments(item.id);
        return <article key={item.id} className={'conversation-message ' + (item.visibility === 'internal' ? 'is-internal' : fromRequester ? 'from-requester' : 'from-support')}>
          <div className="conversation-message-meta"><strong>{item.visibility === 'internal' ? 'Internal note' : fromRequester ? 'Restaurant owner' : 'Support team'}</strong><time>{new Date(item.created_at).toLocaleString()}</time></div>
          <p>{item.message}</p>
          {messageAttachments.length > 0 && <ul className="conversation-attachments">{messageAttachments.map(attachment => <li key={attachment.id}>
            {attachmentUrls[attachment.id] ? <a href={attachmentUrls[attachment.id]} target="_blank" rel="noreferrer">{attachment.file_name}</a> : <span>{attachment.file_name} (unavailable)</span>}
            <small>{(attachment.file_size / 1024 / 1024).toFixed(2)} MB</small>
          </li>)}</ul>}
        </article>;
      })}
    </div>
    {!canReply && <p className="view-only-note">This account has read-only access.</p>}
  </section>;
}
