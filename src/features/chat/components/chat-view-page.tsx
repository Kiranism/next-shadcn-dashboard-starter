'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

const CHATBOT_HISTORY_KEY = 'dashboard.chatbot.history.v1';

const PROMPT_DATA = `
You are the in-app chatbot for this dashboard.
Let users ask anything they want.
Keep replies clear, helpful, and concise.
`;

function nowStamp(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function ChatViewPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const canSubmit = input.trim().length > 0 && !isLoading;
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHATBOT_HISTORY_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as ChatMessage[];
      if (!Array.isArray(parsed)) return;

      const safeMessages = parsed
        .filter((item) => item?.content && (item.role === 'user' || item.role === 'assistant'))
        .slice(-80);

      setMessages(safeMessages);
    } catch {
      // Ignore malformed local history and start fresh.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CHATBOT_HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  const emptyState = useMemo(() => messages.length === 0, [messages.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    const text = input.trim();
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: nowStamp()
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: nextMessages.map((item) => ({ role: item.role, content: item.content })),
          promptData: PROMPT_DATA
        })
      });

      const payload = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || 'Unable to get a response right now.');
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: payload.reply,
        createdAt: nowStamp()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content:
          error instanceof Error ? error.message : 'Something went wrong while contacting Gemini.',
        createdAt: nowStamp()
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClearHistory() {
    setMessages([]);
    localStorage.removeItem(CHATBOT_HISTORY_KEY);
  }

  return (
    <div className='flex min-h-0 flex-1 px-4 py-2 md:px-6'>
      <Card className='flex h-[calc(100dvh-5.5rem)] w-full flex-col overflow-hidden'>
        <CardHeader className='border-b'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <CardTitle className='flex items-center gap-2 text-xl'>
                <Icons.chat className='size-5' />
                Chatbot Assistant
              </CardTitle>
              <p className='text-muted-foreground mt-1 text-sm'>Ask anything. Powered by Gemini.</p>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='secondary'>Gemini</Badge>
              <Button variant='outline' size='sm' onClick={handleClearHistory}>
                Clear history
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className='min-h-0 flex-1 p-0'>
          <ScrollArea className='h-full px-4 py-4 md:px-6'>
            {emptyState ? (
              <div className='text-muted-foreground flex h-full min-h-56 items-center justify-center text-center text-sm'>
                Start the conversation by asking the chatbot anything you want.
              </div>
            ) : (
              <div className='mx-auto flex w-full max-w-3xl flex-col gap-4'>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex w-full',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl border px-4 py-3 text-sm whitespace-pre-wrap',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted border-border text-foreground'
                      )}
                    >
                      <p>{message.content}</p>
                      <p
                        className={cn(
                          'mt-2 text-[11px]',
                          message.role === 'user'
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        )}
                      >
                        {message.createdAt}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className='flex justify-start'>
                    <div className='bg-muted text-muted-foreground border-border rounded-2xl border px-4 py-3 text-sm'>
                      Gemini is thinking...
                    </div>
                  </div>
                )}
                <div ref={scrollAnchorRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>

        <CardFooter className='border-t p-4 md:p-6'>
          <form onSubmit={handleSubmit} className='mx-auto flex w-full max-w-3xl flex-col gap-3'>
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder='Ask anything...'
              className='min-h-24 resize-none'
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmit(event as unknown as FormEvent<HTMLFormElement>);
                }
              }}
            />
            <div className='flex items-center justify-between gap-3'>
              <p className='text-muted-foreground text-xs'>Press Enter to send. Shift + Enter for a new line.</p>
              <Button type='submit' disabled={!canSubmit}>
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
