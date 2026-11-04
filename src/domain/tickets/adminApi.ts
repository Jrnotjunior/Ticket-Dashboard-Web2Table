import { requireSupabase } from '../../lib/supabase';

const SUPPORT_URL = 'https://cishhexduxgrwdvptuhj.supabase.co/functions/v1/support-admin-portal';
const SUPPORT_KEY = 'sb_publishable_tr8QdcIBOu2FfjMx_7YyjA_sP4ZM782';

export async function supportRequest<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data: { session }, error } = await requireSupabase().auth.getSession();
  if (error) throw error;
  if (!session?.access_token) throw new Error('Your Web2Table session has expired. Please sign in again.');
  const response = await fetch(SUPPORT_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + session.access_token, apikey: SUPPORT_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Support service request failed.');
  return result as T;
}

export async function uploadSupportFile(ticketId: string, file: File, messageId: string | null, visibility: 'public' | 'internal') {
  const { data: { session }, error } = await requireSupabase().auth.getSession();
  if (error) throw error;
  if (!session?.access_token) throw new Error('Your Web2Table session has expired. Please sign in again.');
  const response = await fetch(SUPPORT_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + session.access_token,
      apikey: SUPPORT_KEY,
      'Content-Type': file.type,
      'x-action': 'upload_attachment',
      'x-ticket-id': ticketId,
      'x-file-name': encodeURIComponent(file.name),
      'x-message-id': messageId ?? '',
      'x-visibility': visibility,
    },
    body: file,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Attachment upload failed.');
  return result.attachment;
}

export function pollSupportChanges(onChange: () => void, intervalMs = 5000) {
  return globalThis.setInterval(onChange, intervalMs);
}
