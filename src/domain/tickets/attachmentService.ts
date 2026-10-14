import { requireSupabase } from '../../lib/supabase';

export type SupportAttachment = {
  id: string;
  ticket_id: string;
  message_id: string | null;
  uploaded_by: string;
  storage_path: string;
  file_name: string;
  content_type: string;
  file_size: number;
  visibility: 'public' | 'internal';
  created_at: string;
};

export const SUPPORT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const SUPPORT_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain'];

export async function uploadSupportAttachments(
  ticketId: string,
  files: File[],
  messageId: string | null,
  visibility: 'public' | 'internal',
): Promise<void> {
  if (!files.length) return;
  const client = requireSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error('Your session has expired. Please sign in again.');

  const uploadedPaths: string[] = [];
  try {
    for (const file of files) {
      if (!SUPPORT_ATTACHMENT_TYPES.includes(file.type)) {
        throw new Error(`File type not allowed: ${file.name}`);
      }
      if (file.size <= 0 || file.size > SUPPORT_ATTACHMENT_MAX_BYTES) {
        throw new Error(`${file.name} must be 10 MB or smaller.`);
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-180) || 'attachment';
      const path = `${ticketId}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await client.storage.from('support-attachments').upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;
      uploadedPaths.push(path);
      const { error: metadataError } = await client.from('support_ticket_attachments').insert({
        ticket_id: ticketId,
        message_id: messageId,
        uploaded_by: user.id,
        storage_path: path,
        file_name: file.name.slice(0, 255),
        content_type: file.type,
        file_size: file.size,
        visibility,
      });
      if (metadataError) throw metadataError;
    }
  } catch (error) {
    // Best-effort rollback for files that were uploaded but could not be registered.
    if (uploadedPaths.length) await client.storage.from('support-attachments').remove(uploadedPaths);
    throw error;
  }
}

export async function listSupportAttachments(ticketId: string): Promise<SupportAttachment[]> {
  const { data, error } = await requireSupabase()
    .from('support_ticket_attachments')
    .select('id,ticket_id,message_id,uploaded_by,storage_path,file_name,content_type,file_size,visibility,created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SupportAttachment[];
}

export async function createSupportAttachmentUrl(path: string): Promise<string> {
  const { data, error } = await requireSupabase()
    .storage.from('support-attachments').createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}
