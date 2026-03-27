'use client';

import { Icons } from '@/components/icons';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { FilePreview } from '@/components/ui/file-preview';
import type { Message } from '../utils/types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const shouldReduceMotion = useReducedMotion();
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className='flex flex-col gap-1'
      role='group'
      aria-label={message.author + ' at ' + message.timestamp}
    >
      <div
        className={cn(
          'relative max-w-[85%] rounded-xl border px-3 py-2 text-xs leading-relaxed sm:max-w-[82%] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm',
          isUser
            ? 'border-primary/40 bg-primary text-primary-foreground ml-auto'
            : 'bg-muted border-transparent'
        )}
      >
        <p
          className={cn(
            'font-medium sm:text-sm',
            isUser ? 'text-primary-foreground/80' : 'text-foreground/80'
          )}
        >
          {message.author}
        </p>
        {message.text && (
          <p
            className={cn(
              'mt-1 text-[0.875rem] sm:text-[0.95rem]',
              isUser ? 'text-primary-foreground/90' : 'text-foreground/90'
            )}
          >
            {message.text}
          </p>
        )}
        {message.attachments && message.attachments.length > 0 && (
          <FilePreview
            files={message.attachments.map((a) => ({
              id: a.id,
              name: a.name,
              type: a.type
            }))}
            variant={isUser ? 'inverted' : 'default'}
            className='mt-1 p-0'
          />
        )}
        <div className='mt-2 flex items-center justify-end gap-1.5 text-[0.65rem] sm:mt-3 sm:gap-2 sm:text-[0.7rem]'>
          <span className={cn('text-muted-foreground', isUser && 'text-primary-foreground/80')}>
            {message.timestamp}
          </span>
          {isUser && (
            <Icons.checks
              className='text-primary-foreground/80 h-3 w-3 sm:h-3.5 sm:w-3.5'
              aria-hidden='true'
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
