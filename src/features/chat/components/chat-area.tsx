'use client';

import { FormEvent, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Attachment, Conversation } from '../utils/types';
import { ChatHeader } from './chat-header';
import { MessageBubble } from './message-bubble';
import { MessageComposer } from './message-composer';

interface ChatAreaProps {
  conversation: Conversation;
  draft: string;
  onDraftChange: (text: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  attachments: Attachment[];
  onAddAttachments: (files: FileList) => void;
  onRemoveAttachment: (id: string) => void;
}

export function ChatArea({
  conversation,
  draft,
  onDraftChange,
  onSubmit,
  attachments,
  onAddAttachments,
  onRemoveAttachment
}: ChatAreaProps) {
  const shouldReduceMotion = useReducedMotion();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;
    const behavior = shouldReduceMotion ? 'auto' : 'smooth';

    const scrollToBottom = () => {
      container.scrollTo({ top: container.scrollHeight, behavior });
    };

    if (behavior === 'smooth') {
      requestAnimationFrame(scrollToBottom);
    } else {
      scrollToBottom();
    }
  }, [conversation.messages, conversation.id, shouldReduceMotion]);

  useEffect(() => {
    if (!liveRegionRef.current) return;
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage) return;
    liveRegionRef.current.textContent =
      lastMessage.author +
      ' at ' +
      lastMessage.timestamp +
      ': ' +
      lastMessage.text;
  }, [conversation.messages]);

  return (
    <>
      <AnimatePresence initial={false} mode='wait'>
        <motion.div
          key={conversation.id}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className='border-border/40 bg-background/80 flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border p-3 backdrop-blur sm:gap-4 sm:p-4 lg:col-start-2 lg:col-end-3 lg:rounded-3xl'
        >
          <ChatHeader conversation={conversation} />

          <div
            ref={messagesContainerRef}
            className='[&::-webkit-scrollbar-thumb]:bg-muted relative min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 sm:space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full'
            aria-live='off'
            aria-label={'Message thread with ' + conversation.name}
          >
            <AnimatePresence initial={false}>
              {conversation.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </AnimatePresence>
          </div>

          <MessageComposer
            draft={draft}
            onDraftChange={onDraftChange}
            onSubmit={onSubmit}
            contactName={conversation.name}
            quickReplies={conversation.quickReplies}
            attachments={attachments}
            onAddAttachments={onAddAttachments}
            onRemoveAttachment={onRemoveAttachment}
          />
        </motion.div>
      </AnimatePresence>
      <div
        ref={liveRegionRef}
        className='sr-only'
        aria-live='polite'
        aria-atomic='true'
      />
    </>
  );
}
