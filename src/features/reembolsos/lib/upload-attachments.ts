import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'reimbursement-receipts';

export interface UploadedAttachment {
  path: string;
  name: string;
}

function sanitizeFilename(name: string): string {
  return name.replace(/\s+/g, '_').replace(/[^\w.\-]/g, '_');
}

export async function uploadAttachments(
  files: File[],
  userId: string,
  supabase: SupabaseClient
): Promise<UploadedAttachment[]> {
  const results = await Promise.all(
    files.map(async (file) => {
      const folder = crypto.randomUUID();
      const safeName = sanitizeFilename(file.name);
      const path = `receipts/${userId}/${folder}/${safeName}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) throw new Error(`Falha ao enviar "${file.name}": ${error.message}`);
      return { path, name: file.name };
    })
  );
  return results;
}
