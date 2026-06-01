'use client';

import { useCallback, useRef } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_FILES = 5;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export type FileStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface ManagedFile {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
}

interface AttachmentUploadProps {
  files: ManagedFile[];
  onChange: (files: ManagedFile[]) => void;
}

export function AttachmentUpload({ files, onChange }: AttachmentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming);
      const remaining = MAX_FILES - files.length;
      if (remaining <= 0) return;

      const toAdd: ManagedFile[] = arr.slice(0, remaining).map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: file.size > MAX_SIZE_BYTES ? 'error' : 'pending',
        error: file.size > MAX_SIZE_BYTES ? `Arquivo muito grande (máx 10MB)` : undefined
      }));

      onChange([...files, ...toAdd]);
    },
    [files, onChange]
  );

  const removeFile = useCallback(
    (id: string) => {
      onChange(files.filter((f) => f.id !== id));
    },
    [files, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
      e.target.value = '';
    },
    [addFiles]
  );

  const statusIcon = (status: FileStatus) => {
    if (status === 'uploading')
      return <Icons.spinner className='size-3.5 animate-spin text-blue-500' />;
    if (status === 'done') return <Icons.circleCheck className='size-3.5 text-green-500' />;
    if (status === 'error') return <Icons.alertCircle className='size-3.5 text-destructive' />;
    return <Icons.paperclip className='size-3.5 text-muted-foreground' />;
  };

  return (
    <div className='space-y-2'>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-colors',
          'hover:border-primary/50 hover:bg-muted/30',
          files.length >= MAX_FILES && 'pointer-events-none opacity-50'
        )}
      >
        <Icons.upload className='text-muted-foreground mb-2 size-6' />
        <p className='text-sm font-medium'>
          {files.length >= MAX_FILES
            ? 'Limite de arquivos atingido'
            : 'Arraste arquivos ou clique para selecionar'}
        </p>
        <p className='text-muted-foreground mt-0.5 text-xs'>
          Até {MAX_FILES} arquivos · máx 10MB cada
        </p>
        <input
          ref={inputRef}
          type='file'
          multiple
          className='hidden'
          onChange={handleInputChange}
          accept='image/*,.pdf,.doc,.docx,.xls,.xlsx'
        />
      </div>

      {files.length > 0 && (
        <ul className='space-y-1.5'>
          {files.map((f) => (
            <li
              key={f.id}
              className='flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2'
            >
              {statusIcon(f.status)}
              <span className='min-w-0 flex-1 truncate text-sm'>{f.file.name}</span>
              {f.error && <span className='text-destructive shrink-0 text-xs'>{f.error}</span>}
              {f.status !== 'uploading' && (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='size-6 shrink-0'
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(f.id);
                  }}
                >
                  <Icons.close className='size-3' />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
