import type { Conversation } from './types';

export const initialConversations: Conversation[] = [
  {
    id: 'billing-issue',
    name: 'Alex from Support',
    title: 'Billing Issue #4821',
    status: 'online',
    unread: 2,
    initials: 'AS',
    messages: [
      {
        id: 'billing-1',
        sender: 'contact',
        author: 'Alex',
        text: "Hi there! I can see you were charged twice for the Pro plan this month. I've already initiated a refund for the duplicate charge.",
        timestamp: '10:02'
      },
      {
        id: 'billing-2',
        sender: 'user',
        author: 'You',
        text: 'Thanks for catching that. How long will the refund take to process?',
        timestamp: '10:05'
      },
      {
        id: 'billing-3',
        sender: 'contact',
        author: 'Alex',
        text: 'Typically 3-5 business days depending on your bank. You should see a pending credit within 24 hours though. Is there anything else I can help with?',
        timestamp: '10:08'
      }
    ],
    quickReplies: [
      "That's perfect, thank you!",
      'Can I get a receipt for the refund?',
      'I also have a question about upgrading.'
    ],
    autoReplies: [
      "You're welcome! I've also applied a 10% discount on your next billing cycle as an apology for the inconvenience.",
      'Absolutely — I just emailed the refund confirmation to your registered address.',
      "Of course! I'd be happy to walk you through the available plans."
    ]
  },
  {
    id: 'api-integration',
    name: 'Priya from Engineering',
    title: 'API Integration Help',
    status: 'online',
    unread: 0,
    initials: 'PE',
    messages: [
      {
        id: 'api-1',
        sender: 'user',
        author: 'You',
        text: "I'm getting a 429 rate limit error when calling the /api/products endpoint. We're only making about 50 requests per minute.",
        timestamp: '09:15'
      },
      {
        id: 'api-2',
        sender: 'contact',
        author: 'Priya',
        text: "I checked your API key — it's on the Starter tier which has a 30 req/min limit. You'll need the Growth plan for 200 req/min. Would you like me to upgrade it?",
        timestamp: '09:18'
      },
      {
        id: 'api-3',
        sender: 'user',
        author: 'You',
        text: 'Yes please. Also, is there a way to implement retry logic that respects the Retry-After header?',
        timestamp: '09:22'
      },
      {
        id: 'api-4',
        sender: 'contact',
        author: 'Priya',
        text: "Great question — our SDK handles this automatically if you enable `autoRetry: true` in the config. I'll send you a code snippet.",
        timestamp: '09:25'
      }
    ],
    quickReplies: [
      'That would be very helpful.',
      'Can you also share the rate limit docs?',
      "We're also seeing timeouts on the webhook endpoint."
    ],
    autoReplies: [
      "Here's the code snippet — just add `autoRetry: true` and `maxRetries: 3` to your client config.",
      "Sure! I've shared the rate limiting guide in your inbox. It covers burst limits too.",
      "Let me check the webhook logs for your account. Can you share the endpoint URL you're using?"
    ]
  },
  {
    id: 'account-access',
    name: 'Jordan from Security',
    title: 'Account Access Request',
    status: 'offline',
    unread: 1,
    initials: 'JS',
    messages: [
      {
        id: 'access-1',
        sender: 'contact',
        author: 'Jordan',
        text: "We noticed a login attempt from an unrecognized device in São Paulo. Was this you? We've temporarily locked the session as a precaution.",
        timestamp: 'Yesterday'
      },
      {
        id: 'access-2',
        sender: 'user',
        author: 'You',
        text: "No, that wasn't me. I'm based in New York. Can you revoke that session and enable 2FA on my account?",
        timestamp: 'Yesterday'
      }
    ],
    quickReplies: [
      'Can I also see a list of all active sessions?',
      'Please reset my password as well.',
      'Has any data been accessed from that session?'
    ],
    autoReplies: [
      "I've revoked all sessions except your current one and enabled 2FA. You'll get an email with the setup QR code.",
      "Done — you'll receive a password reset link shortly. Make sure to use a unique password.",
      'No data was accessed — the session was blocked before any API calls were made. Your account is secure.'
    ]
  }
];
