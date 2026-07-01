import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'selection-process-files';

export interface ApplicationFiles {
  resumePath: string;
  transcriptPath: string;
  photoPath: string;
}

function getExtension(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? 'bin';
}

export async function uploadApplicationFiles(
  resumeFile: File,
  transcriptFile: File,
  photoFile: File,
  supabase: SupabaseClient
): Promise<ApplicationFiles> {
  const folder = crypto.randomUUID();

  const uploads = [
    { file: resumeFile, key: 'resume' as const },
    { file: transcriptFile, key: 'transcript' as const },
    { file: photoFile, key: 'photo' as const }
  ];

  const paths: Record<string, string> = {};

  await Promise.all(
    uploads.map(async ({ file, key }) => {
      const ext = getExtension(file);
      const path = `${folder}/${key}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) throw new Error(`Falha ao enviar "${file.name}": ${error.message}`);
      paths[key] = path;
    })
  );

  return {
    resumePath: paths.resume,
    transcriptPath: paths.transcript,
    photoPath: paths.photo
  };
}
