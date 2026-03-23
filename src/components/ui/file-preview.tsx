'use client';

import Image from 'next/image';
import type { FC } from 'react';
import {
  IconFile,
  IconFileTypeDoc,
  IconFileTypeXls,
  IconFileTypePdf,
  IconPhoto,
  IconVideo,
  IconMusic,
  IconFileZip,
  IconCode,
  IconFileText,
  IconLoader2,
  IconX
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export interface UploadedFile {
  id: string;
  url?: string;
  name: string;
  type: string;
  description?: string;
  isUploading?: boolean;
}

export interface FilePreviewProps {
  files: UploadedFile[];
  onRemove?: (id: string) => void;
  className?: string;
  variant?: 'default' | 'inverted';
}

const getFileExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
};

const getFileIcon = (fileType: string, fileName: string) => {
  const extension = getFileExtension(fileName).toLowerCase();
  const iconProps = { size: 24 };

  if (fileType.startsWith('image/'))
    return (
      <IconPhoto
        {...iconProps}
        className='text-emerald-500 dark:text-emerald-400'
      />
    );

  if (fileType === 'application/pdf' || extension === 'pdf')
    return (
      <IconFileTypePdf
        {...iconProps}
        className='text-red-500 dark:text-red-400'
      />
    );

  if (
    ['doc', 'docx', 'odt', 'rtf'].includes(extension) ||
    fileType.includes('wordprocessing') ||
    fileType.includes('msword')
  )
    return (
      <IconFileTypeDoc
        {...iconProps}
        className='text-blue-500 dark:text-blue-400'
      />
    );

  if (
    ['xls', 'xlsx', 'csv', 'ods'].includes(extension) ||
    fileType.includes('spreadsheet') ||
    fileType.includes('excel')
  )
    return (
      <IconFileTypeXls
        {...iconProps}
        className='text-green-500 dark:text-green-400'
      />
    );

  if (['txt', 'md'].includes(extension) || fileType === 'text/plain')
    return (
      <IconFileText
        {...iconProps}
        className='text-zinc-500 dark:text-zinc-400'
      />
    );

  if (
    [
      'js',
      'ts',
      'jsx',
      'tsx',
      'py',
      'java',
      'c',
      'cpp',
      'html',
      'css'
    ].includes(extension) ||
    fileType.includes('javascript') ||
    fileType.includes('typescript')
  )
    return (
      <IconCode
        {...iconProps}
        className='text-yellow-500 dark:text-yellow-400'
      />
    );

  if (['json', 'xml', 'yaml', 'yml'].includes(extension))
    return (
      <IconCode {...iconProps} className='text-zinc-500 dark:text-zinc-400' />
    );

  if (
    fileType.startsWith('video/') ||
    ['mp4', 'avi', 'mov', 'mkv'].includes(extension)
  )
    return (
      <IconVideo
        {...iconProps}
        className='text-purple-500 dark:text-purple-400'
      />
    );

  if (
    fileType.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg'].includes(extension)
  )
    return (
      <IconMusic {...iconProps} className='text-pink-500 dark:text-pink-400' />
    );

  if (
    ['zip', 'rar', 'tar', 'gz', '7z'].includes(extension) ||
    fileType.includes('archive') ||
    fileType.includes('compressed')
  )
    return (
      <IconFileZip
        {...iconProps}
        className='text-amber-500 dark:text-amber-400'
      />
    );

  return (
    <IconFile {...iconProps} className='text-zinc-500 dark:text-zinc-400' />
  );
};

const getFormattedFileType = (fileType: string, fileName: string): string => {
  const ext = getFileExtension(fileName).toUpperCase();

  if (fileType.includes('msword') || fileType.includes('wordprocessing'))
    return 'DOC';

  if (fileType.includes('spreadsheet') || fileType.includes('excel'))
    return 'SPREADSHEET';

  const typePart = fileType.split('/')[1];

  if (!typePart || typePart === 'octet-stream') {
    return ext || 'FILE';
  }

  const cleanType = typePart
    .replace('vnd.openxmlformats-officedocument.', '')
    .replace('vnd.ms-', '')
    .replace('x-', '')
    .replace('document.', '')
    .replace('presentation.', '')
    .replace('application.', '')
    .split('.')[0];

  return cleanType.toUpperCase().substring(0, 8);
};

export const FilePreview: FC<FilePreviewProps> = ({
  files,
  onRemove,
  className,
  variant = 'default'
}) => {
  const isInverted = variant === 'inverted';
  if (files.length === 0) return null;

  return (
    <div className={cn('flex w-full flex-col gap-2 rounded-xl p-2', className)}>
      <div className='flex w-full flex-wrap gap-2'>
        {files.map((file) => (
          <div
            key={file.id}
            className={cn(
              'group/file relative flex items-center rounded-xl transition-all',
              isInverted
                ? 'bg-primary-foreground/15 hover:bg-primary-foreground/20'
                : 'bg-muted hover:bg-muted/80',
              file.type.startsWith('image/') && file.url
                ? 'h-14 w-14 justify-center'
                : 'max-w-[220px] min-w-[180px] p-2 pr-8'
            )}
          >
            {file.isUploading && (
              <div className='absolute inset-0 flex items-center justify-center rounded-xl bg-black/30'>
                <IconLoader2 size={20} className='animate-spin text-white' />
              </div>
            )}

            {onRemove && (
              <button
                type='button'
                onClick={() => onRemove(file.id)}
                className={cn(
                  'absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full',
                  'scale-75 opacity-0 transition-all duration-150 group-hover/file:scale-100 group-hover/file:opacity-100',
                  'bg-muted-foreground/60 hover:bg-muted-foreground/80 cursor-pointer'
                )}
                aria-label={`Remove ${file.name}`}
              >
                <IconX size={10} className='text-white' />
              </button>
            )}

            {file.type.startsWith('image/') && file.url ? (
              <div className='h-12 w-12 overflow-hidden rounded-md'>
                <Image
                  width={48}
                  height={48}
                  src={file.url}
                  alt={file.name}
                  className='h-full w-full object-cover'
                />
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    'mr-3 flex h-10 w-10 items-center justify-center rounded-lg',
                    isInverted
                      ? 'bg-primary-foreground/10'
                      : 'bg-muted-foreground/10'
                  )}
                >
                  {getFileIcon(file.type, file.name)}
                </div>
                <div className='flex min-w-0 flex-1 flex-col'>
                  <p
                    className={cn(
                      'truncate text-sm font-medium',
                      isInverted ? 'text-primary-foreground' : 'text-foreground'
                    )}
                  >
                    {file.name.length > 18
                      ? `${file.name.substring(0, 15)}...`
                      : file.name}
                  </p>
                  <span
                    className={cn(
                      'text-xs',
                      isInverted
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    )}
                  >
                    {getFormattedFileType(file.type, file.name)}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
