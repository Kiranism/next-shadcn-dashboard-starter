'use client';

import { FormEvent, useRef } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FilePreview } from '@/components/ui/file-preview';
import type { Attachment } from '../utils/types';

interface MessageComposerProps {
  draft: string;
  onDraftChange: (text: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  contactName: string;
  quickReplies: string[];
  attachments: Attachment[];
  onAddAttachments: (files: FileList) => void;
  onRemoveAttachment: (id: string) => void;
}

export function MessageComposer({
  draft,
  onDraftChange,
  onSubmit,
  contactName,
  quickReplies,
  attachments,
  onAddAttachments,
  onRemoveAttachment
}: MessageComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <form onSubmit={onSubmit} className='space-y-2 sm:space-y-3' aria-label='Reply composer'>
      <label htmlFor='messenger-editor' className='sr-only'>
        Write a message
      </label>
      <div className='border-border/40 bg-background/80 flex items-end gap-2 rounded-2xl border p-3 backdrop-blur sm:gap-3 sm:rounded-3xl sm:p-4'>
        <div className='min-w-0 flex-1'>
          {attachments.length > 0 && (
            <FilePreview
              files={attachments.map((a) => ({
                id: a.id,
                name: a.name,
                type: a.type
              }))}
              onRemove={onRemoveAttachment}
              className='mb-1 p-0'
            />
          )}
          <Textarea
            id='messenger-editor'
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (draft.trim() || attachments.length > 0) {
                  const form = e.currentTarget.closest('form');
                  form?.requestSubmit();
                }
              }
            }}
            placeholder={'Message ' + contactName + ' (Enter to send, Shift+Enter for newline)'}
            rows={2}
            className='text-foreground placeholder:text-muted-foreground/70 min-h-[3rem] w-full resize-none border-none bg-transparent text-xs focus-visible:ring-0 focus-visible:outline-none sm:min-h-[4rem] sm:text-sm'
            aria-label={'Message ' + contactName}
          />
          <div className='mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2'>
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type='button'
                onClick={() => onDraftChange(reply)}
                className='border-border/50 bg-background/70 text-muted-foreground hover:border-primary/40 hover:text-foreground focus-visible:ring-primary/40 focus-visible:ring-offset-background rounded-full border px-2.5 py-0.5 text-[0.65rem] transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:px-3 sm:py-1 sm:text-xs'
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
        <div className='flex shrink-0 flex-col items-end gap-1.5 sm:w-24 sm:gap-2'>
          <input
            ref={fileInputRef}
            type='file'
            multiple
            className='hidden'
            onChange={(e) => {
              if (e.target.files?.length) {
                onAddAttachments(e.target.files);
              }
              // Reset so same file can be re-selected
              e.target.value = '';
            }}
          />
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='border-border/40 bg-background/70 text-muted-foreground hover:bg-muted/50 focus-visible:ring-primary/40 focus-visible:ring-offset-background size-8 rounded-full border transition focus-visible:ring-2 focus-visible:ring-offset-2 sm:size-10'
            aria-label='Attach a file'
            onClick={() => fileInputRef.current?.click()}
          >
            <Icons.paperclip className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
          </Button>
          <Button
            type='submit'
            size='icon'
            className='bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/40 focus-visible:ring-offset-background size-8 rounded-full shadow-lg transition focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:size-10'
            disabled={!draft.trim() && attachments.length === 0}
            aria-label='Send message'
          >
            <Icons.send className='h-3.5 w-3.5 sm:h-4 sm:w-4' aria-hidden='true' />
          </Button>
        </div>
      </div>
    </form>
  );
}
