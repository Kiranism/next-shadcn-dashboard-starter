import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
import type { Attachment, Conversation, Message } from './types';
import { initialConversations } from './data';

type ReplyCursorState = Record<string, number>;

type ChatState = {
  conversations: Conversation[];
  selectedConversationId: string;
  draft: string;
  replyCursor: ReplyCursorState;

  selectConversation: (id: string) => void;
  setDraft: (text: string) => void;
  sendMessage: (text: string, attachments?: Attachment[]) => void;
  addIncomingMessage: (conversationId: string, message: Message) => void;
  advanceReplyCursor: (conversationId: string) => void;
  getActiveConversation: () => Conversation | undefined;
};

export const useChatStore = create<ChatState>()(
  // To enable persistence across refreshes, uncomment the persist wrapper below:
  // persist(
  (set, get) => ({
    conversations: initialConversations,
    selectedConversationId: initialConversations[0]?.id ?? '',
    draft: '',
    replyCursor: Object.fromEntries(initialConversations.map((c) => [c.id, 0])),

    selectConversation: (id) =>
      set((state) => ({
        selectedConversationId: id,
        conversations: state.conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
      })),

    setDraft: (text) => set({ draft: text }),

    sendMessage: (text, attachments) => {
      const state = get();
      const timestamp = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const outgoing: Message = {
        id: 'outgoing-' + Date.now().toString(),
        sender: 'user',
        author: 'You',
        text: text.trim(),
        timestamp,
        attachments: attachments?.length ? attachments : undefined
      };

      set({
        draft: '',
        conversations: state.conversations.map((c) =>
          c.id === state.selectedConversationId
            ? { ...c, messages: [...c.messages, outgoing], unread: 0 }
            : c
        )
      });
    },

    addIncomingMessage: (conversationId, message) =>
      set((state) => ({
        conversations: state.conversations.map((c) => {
          if (c.id !== conversationId) return c;
          const isActive = state.selectedConversationId === conversationId;
          return {
            ...c,
            messages: [...c.messages, message],
            unread: isActive ? 0 : c.unread + 1
          };
        })
      })),

    advanceReplyCursor: (conversationId) =>
      set((state) => ({
        replyCursor: {
          ...state.replyCursor,
          [conversationId]: (state.replyCursor[conversationId] ?? 0) + 1
        }
      })),

    getActiveConversation: () => {
      const state = get();
      return state.conversations.find((c) => c.id === state.selectedConversationId);
    }
  })
  //   ,
  //   { name: 'chat' }
  // )
);
