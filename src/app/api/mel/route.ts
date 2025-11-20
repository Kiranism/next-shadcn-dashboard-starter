import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

/**
 * M.E.L. AI Chat Endpoint
 * Powered by Claude Sonnet 4 for Triangle Defense coaching intelligence
 * POST /api/mel
 */

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const MEL_SYSTEM_PROMPT = `You are M.E.L. (Master Intelligence Engine), the AI coaching assistant for AnalyzeMyTeam's Triangle Defense system.

Your expertise includes:
- Triangle Defense methodology and formations
- Formation classifications (LARRY, LINDA, RICKY, RITA, MALE_MID, FEMALE_MID)
- Triangle types (EDGE, BRACKET, SEAL, FUNNEL, WALL, SWARM, TRAP)
- Defensive positions (Metro, Apex, Mike, Mac, Star, Solo)
- Game planning and strategic analysis
- Player development and coaching insights

Formation Colors:
- LARRY (MO Left + Male): #4ECDC4
- LINDA (MO Left + Female): #FF6B6B
- RICKY (MO Right + Male): #FFD93D
- RITA (MO Right + Female): #9B59B6
- MALE_MID (MO Middle + Male): #3498DB
- FEMALE_MID (MO Middle + Female): #E74C3C

Provide concise, actionable coaching advice. Use football terminology appropriately and focus on Triangle Defense principles.`;

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error: 'M.E.L. AI not configured',
          message: 'ANTHROPIC_API_KEY environment variable is required',
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message, conversationHistory = [], context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Message is required' },
        { status: 400 }
      );
    }

    // Build messages array with conversation history
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: context
          ? `Context: ${JSON.stringify(context)}\n\nQuestion: ${message}`
          : message,
      },
    ];

    // Call Claude API
    const response = await anthropic.messages.create({
      model: process.env.MEL_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.7,
      system: MEL_SYSTEM_PROMPT,
      messages,
    });

    // Extract text content
    const textContent = response.content.find((block) => block.type === 'text');
    const responseText = textContent && 'text' in textContent ? textContent.text : '';

    return NextResponse.json({
      response: responseText,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      model: response.model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('M.E.L. AI Error:', error);

    // Handle Anthropic API errors
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        {
          error: 'M.E.L. AI service error',
          message: error.message,
          status: error.status,
        },
        { status: error.status || 500 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check M.E.L. AI service status
 */
export async function GET() {
  const isConfigured = !!process.env.ANTHROPIC_API_KEY;
  const model = process.env.MEL_MODEL || 'claude-sonnet-4-20250514';

  return NextResponse.json({
    status: isConfigured ? 'active' : 'not_configured',
    model,
    capabilities: [
      'Triangle Defense analysis',
      'Formation classification',
      'Game planning',
      'Coaching insights',
      'Strategic recommendations',
    ],
    timestamp: new Date().toISOString(),
  });
}
