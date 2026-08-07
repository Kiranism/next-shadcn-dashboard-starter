import { createChat } from '@shadcn/helpers/ai-sdk';
import type { UIMessage } from 'ai';

type Tools = {
  getRevenue: {
    input: { period: string };
    output: {
      period: string;
      revenue: number;
      changePct: number;
      topDriver: string;
    };
  };
};

/** The message shape for this demo (typed tools, no data parts). */
export type DemoUIMessage = UIMessage<unknown, Record<string, never>, Tools>;

/**
 * A scripted AI conversation. It streams through the real `useChat` lifecycle
 * via `transport()` — no model, API route, network request, or API key. The
 * script shows off reasoning, a tool call, and streamed text across two turns.
 */
export const demoChat = createChat<unknown, Record<string, never>, Tools>()
  .user('How did revenue do last month, and what should I focus on next?')
  .sleep(500)
  .assistant(({ writer }) => {
    writer.reasoning(
      "The user is asking two things — last month's revenue trend and a recommendation. I'll pull the numbers from the metrics tool first, then base the suggestion on what the data shows."
    );
    writer
      .tool('getRevenue', {
        title: 'Fetching revenue metrics',
        input: { period: 'last-month' }
      })
      .sleep(900)
      .output({
        period: 'last-month',
        revenue: 1250,
        changePct: 12.5,
        topDriver: 'returning customers'
      });
    writer.text(
      'Last month you brought in $1,250 — up 12.5% from the month before, so revenue is clearly trending up. '
    );
    writer.text('Most of that growth came from returning customers.');
  })
  .user('Great. Where should I put my energy next?')
  .sleep(500)
  .assistant(({ writer }) => {
    writer.reasoning(
      "Revenue is healthy and driven by retention, so the weak spot is acquisition. I'll point them there with a concrete, low-lift action."
    );
    writer.text(
      "Since returning customers are carrying growth, I'd shift focus to new-customer acquisition — it slipped about 20% this period. A referral incentive or a small targeted campaign would rebalance the funnel without much lift."
    );
  });

/** Empty initial transcript — the demo streams as the user presses Send. */
export const initialMessages = demoChat.get(0);

/** Local transport that streams the scripted responses through `useChat`. */
export const chatTransport = demoChat.transport({ delayMs: 30 });
