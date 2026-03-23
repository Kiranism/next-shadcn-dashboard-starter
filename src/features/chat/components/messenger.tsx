'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useChatStore } from '../utils/store';
import type { Attachment, Message } from '../utils/types';
import { ConversationList } from './conversation-list';
import { ConversationSelect } from './conversation-select';
import { ChatArea } from './chat-area';

export function Messenger() {
  const {
    conversations,
    selectedConversationId,
    draft,
    replyCursor,
    selectConversation,
    setDraft,
    sendMessage,
    addIncomingMessage,
    advanceReplyCursor,
    getActiveConversation
  } = useChatStore();

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const shouldReduceMotion = useReducedMotion();
  const replyTimeoutRef = useRef<number | null>(null);
  const selectedRef = useRef(selectedConversationId);

  useEffect(() => {
    selectedRef.current = selectedConversationId;
    setAttachments([]);
  }, [selectedConversationId]);

  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current) {
        window.clearTimeout(replyTimeoutRef.current);
      }
    };
  }, []);

  const handleAddAttachments = useCallback((files: FileList) => {
    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      id: 'file-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const active = getActiveConversation();
      if ((!draft.trim() && attachments.length === 0) || !active) return;

      const conversationId = active.id;
      sendMessage(draft, attachments.length > 0 ? attachments : undefined);
      setAttachments([]);

      const autoReplies = active.autoReplies;
      if (!autoReplies.length) return;

      const cursor = replyCursor[conversationId] ?? 0;
      const nextReply = autoReplies[cursor % autoReplies.length];
      const delay = shouldReduceMotion ? 0 : 900;

      replyTimeoutRef.current = window.setTimeout(() => {
        const timestamp = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        const incoming: Message = {
          id: 'incoming-' + Date.now().toString(),
          sender: 'contact',
          author: active.name,
          text: nextReply,
          timestamp
        };

        addIncomingMessage(conversationId, incoming);
        advanceReplyCursor(conversationId);
      }, delay);
    },
    [
      draft,
      attachments,
      replyCursor,
      shouldReduceMotion,
      getActiveConversation,
      sendMessage,
      addIncomingMessage,
      advanceReplyCursor
    ]
  );

  const activeConversation = getActiveConversation();
  if (!activeConversation) return null;

  return (
    <div className='border-border/50 bg-background/70 relative grid h-[calc(100dvh-5.5rem)] w-full grid-rows-[auto,1fr] gap-3 overflow-hidden rounded-2xl border p-3 backdrop-blur-xl sm:gap-4 sm:p-4 lg:[grid-template-columns:30%_1fr] lg:grid-rows-[1fr] lg:gap-4 lg:rounded-3xl lg:p-5'>
      <ConversationSelect
        conversations={conversations}
        selectedId={selectedConversationId}
        onSelect={selectConversation}
      />
      <ConversationList
        conversations={conversations}
        selectedId={selectedConversationId}
        onSelect={selectConversation}
      />
      <ChatArea
        conversation={activeConversation}
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={handleSubmit}
        attachments={attachments}
        onAddAttachments={handleAddAttachments}
        onRemoveAttachment={handleRemoveAttachment}
      />
    </div>
  );
}
