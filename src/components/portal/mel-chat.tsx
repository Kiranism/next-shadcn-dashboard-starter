'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MELChatProps {
  context?: {
    formationId?: string;
    classification?: string;
    situation?: any;
  };
  placeholder?: string;
  className?: string;
}

export function MELChat({ context, placeholder, className }: MELChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello, I'm M.E.L., your AI coaching assistant powered by Claude Sonnet 4. I can help you analyze Triangle Defense formations, develop game strategies, and provide coaching insights. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if M.E.L. AI is configured
  useEffect(() => {
    checkMELStatus();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const checkMELStatus = async () => {
    try {
      const response = await fetch('/api/mel');
      const data = await response.json();
      setIsConfigured(data.status === 'active');
    } catch (error) {
      console.error('Error checking M.E.L. status:', error);
      setIsConfigured(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/mel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          conversationHistory,
          context,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get response from M.E.L.');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('M.E.L. Chat Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          "I apologize, but I'm having trouble processing your request. Please ensure the ANTHROPIC_API_KEY is configured and try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amt-accent/10">
              <Brain className="h-5 w-5 text-amt-accent" />
            </div>
            <div>
              <CardTitle>M.E.L. AI Coaching Assistant</CardTitle>
              <CardDescription>Powered by Claude Sonnet 4</CardDescription>
            </div>
          </div>
          {isConfigured !== null && (
            <Badge
              variant={isConfigured ? 'default' : 'destructive'}
              className={
                isConfigured
                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                  : 'bg-red-500/10 text-red-500 border-red-500/20'
              }
            >
              {isConfigured ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages Area */}
        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-amt-red text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <Brain className="h-4 w-4 mt-0.5 flex-shrink-0 text-amt-accent" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-amt-accent" />
                    <p className="text-sm text-muted-foreground">M.E.L. is thinking...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex gap-2">
          <Textarea
            placeholder={
              placeholder ||
              'Ask about Triangle Defense formations, game strategies, or coaching insights...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || !isConfigured}
            className="min-h-[60px] resize-none"
            rows={2}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !isConfigured}
            className="bg-amt-red hover:bg-amt-red/90 h-auto"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        {!isLoading && messages.length <= 1 && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput('Analyze a LARRY formation against Cover 3 defense')}
              disabled={!isConfigured}
            >
              Analyze Formation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput('What Triangle Defense should I use vs spread offense?')}
              disabled={!isConfigured}
            >
              Triangle Strategy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput('Generate a game plan for this week')}
              disabled={!isConfigured}
            >
              Game Planning
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput('What are the key coaching points for EDGE triangle?')}
              disabled={!isConfigured}
            >
              Coaching Tips
            </Button>
          </div>
        )}

        {/* Not Configured Warning */}
        {isConfigured === false && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-500">M.E.L. AI Not Configured</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please set the ANTHROPIC_API_KEY environment variable to enable M.E.L. AI
                  coaching features.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
