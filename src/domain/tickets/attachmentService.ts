import { supportRequest, uploadSupportFile } from './adminApi';

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

export async function uploadSupportAttachments(ticketId: string, files: File[], messageId: string | null, visibility: 'public' | 'internal'): Promise<void> {
  for (const file of files) {
    if (!SUPPORT_ATTACHMENT_TYPES.includes(file.type)) throw new Error(`File type not allowed: ${file.name}`);
    if (file.size <= 0 || file.size > SUPPORT_ATTACHMENT_MAX_BYTES) throw new Error(`${file.name} must be 10 MB or smaller.`);
    await uploadSupportFile(ticketId, file, messageId, visibility);
  }
}

export async function listSupportAttachments(ticketId: string): Promise<SupportAttachment[]> {
  const result = await supportRequest<{ attachments: SupportAttachment[] }>('list_attachments', { ticketId });
  return result.attachments;
}

export async function createSupportAttachmentUrl(path: string): Promise<string> {
  const result = await supportRequest<{ url: string }>('create_attachment_url', { path });
  return result.url;
}
