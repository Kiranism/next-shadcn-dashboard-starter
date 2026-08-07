'use client';

import { useChat } from '@ai-sdk/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport
} from '@/components/ui/message-scroller';
import { Message, MessageAvatar, MessageContent } from '@/components/ui/message';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker';
import { chatTransport, demoChat, initialMessages, type DemoUIMessage } from '../chat';

type ToolPart = {
  type: string;
  toolName?: string;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function ToolMarker({ part }: { part: ToolPart }) {
  const name = part.toolName ?? part.type.replace(/^tool-/, '');
  const running = part.state === 'input-streaming' || part.state === 'input-available';
  const done = part.state === 'output-available';
  const errored = part.state === 'output-error';

  return (
    <div className='flex flex-col gap-1.5'>
      <Marker>
        <MarkerIcon>
          <Icons.code />
        </MarkerIcon>
        {running ? (
          <MarkerContent className='shimmer'>Running {name}…</MarkerContent>
        ) : (
          <MarkerContent>
            {errored ? 'Failed' : 'Called'}{' '}
            <span className='text-foreground font-medium'>{name}</span>
          </MarkerContent>
        )}
      </Marker>
      {done && part.output != null && (
        <Bubble variant='outline'>
          <BubbleContent>
            <pre className='overflow-x-auto font-mono text-xs'>
              {JSON.stringify(part.output, null, 2)}
            </pre>
          </BubbleContent>
        </Bubble>
      )}
      {errored && part.errorText && <p className='text-destructive text-sm'>{part.errorText}</p>}
    </div>
  );
}

export function AiChatDemo() {
  const { messages, sendMessage, status, setMessages } = useChat<DemoUIMessage>({
    messages: initialMessages,
    transport: chatTransport
  });

  const nextMessage = demoChat.next(messages);
  const isBusy = status === 'submitted' || status === 'streaming';

  return (
    <div className='relative flex flex-1'>
      <div className='bg-card absolute inset-0 mx-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border'>
        <div className='flex shrink-0 items-center gap-2 border-b px-4 py-3'>
          <div className='bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg'>
            <Icons.sparkles className='size-4' />
          </div>
          <div className='min-w-0'>
            <p className='text-sm font-medium'>Release Assistant</p>
            <p className='text-muted-foreground text-xs'>Scripted demo · streamed via useChat</p>
          </div>
          <Badge variant='outline' className='ml-auto capitalize'>
            {status}
          </Badge>
        </div>

        <MessageScrollerProvider defaultScrollPosition='end' scrollPreviousItemPeek={64}>
          <MessageScroller className='min-h-0 flex-1'>
            <MessageScrollerViewport>
              <MessageScrollerContent className='px-4 py-4'>
                {messages.length === 0 ? (
                  <div className='text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm'>
                    <Icons.sparkles className='size-8' />
                    <p>
                      Press <span className='text-foreground font-medium'>Send</span> to stream the
                      conversation.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isUser = message.role === 'user';
                    return (
                      <MessageScrollerItem
                        key={message.id}
                        messageId={message.id}
                        scrollAnchor={isUser}
                      >
                        <Message align={isUser ? 'end' : 'start'}>
                          <MessageAvatar
                            className={cn(
                              'size-8 self-start',
                              isUser
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-primary/10 text-primary'
                            )}
                          >
                            {isUser ? (
                              <Icons.user className='size-4' />
                            ) : (
                              <Icons.sparkles className='size-4' />
                            )}
                          </MessageAvatar>
                          <MessageContent>
                            {message.parts.map((part, i) => {
                              const key = `${message.id}-${i}`;
                              if (part.type === 'text') {
                                return (
                                  <Bubble
                                    key={key}
                                    variant={isUser ? 'default' : 'muted'}
                                    align={isUser ? 'end' : 'start'}
                                  >
                                    <BubbleContent className='whitespace-pre-wrap'>
                                      {part.text}
                                    </BubbleContent>
                                  </Bubble>
                                );
                              }
                              if (part.type === 'reasoning') {
                                return (
                                  <Marker key={key}>
                                    <MarkerIcon>
                                      <Icons.sparkles />
                                    </MarkerIcon>
                                    <MarkerContent className='italic'>{part.text}</MarkerContent>
                                  </Marker>
                                );
                              }
                              if (part.type === 'dynamic-tool' || part.type.startsWith('tool-')) {
                                return <ToolMarker key={key} part={part as unknown as ToolPart} />;
                              }
                              return null;
                            })}
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    );
                  })
                )}

                {status === 'submitted' && (
                  <MessageScrollerItem messageId='pending'>
                    <Message align='start'>
                      <MessageAvatar className='bg-primary/10 text-primary size-8 self-start'>
                        <Icons.sparkles className='size-4' />
                      </MessageAvatar>
                      <MessageContent>
                        <Marker>
                          <MarkerContent className='shimmer'>Thinking…</MarkerContent>
                        </Marker>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>

        <div className='flex shrink-0 items-center gap-2 border-t px-4 py-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setMessages(demoChat.get(0))}
            disabled={isBusy || messages.length === 0}
          >
            Restart
          </Button>
          <LoadingButton
            className='ml-auto'
            loading={isBusy}
            loadingLabel='Streaming response'
            disabled={!nextMessage}
            onClick={() => {
              if (nextMessage) void sendMessage(nextMessage);
            }}
          >
            {nextMessage ? (
              <>
                <Icons.send className='size-4' /> Send next message
              </>
            ) : (
              'End of demo'
            )}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
