// Supabase client utilities for bot console
// Real-time subscriptions and helper functions

import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

export type Bot = Database['public']['Tables']['bots']['Row']
export type BotConversation = Database['public']['Tables']['bot_conversations']['Row']
export type BotMessage = Database['public']['Tables']['bot_messages']['Row']
export type SuccessionActivation = Database['public']['Tables']['succession_activations']['Row']

export type BotStatusSummary = {
  id: string
  email: string
  nickname: string
  status: string
  mode: string
  last_active: string
  total_conversations: number
  active_conversations: number
  total_messages: number
  last_message_at: string | null
}

// Initialize Supabase client
const supabase = createClient()

/**
 * Subscribe to bot status changes
 */
export function subscribeToBotStatus(callback: (bot: Bot) => void) {
  return supabase
    .channel('bot-status-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'bots'
      },
      (payload) => {
        callback(payload.new as Bot)
      }
    )
    .subscribe()
}

/**
 * Subscribe to new conversations for a specific bot
 */
export function subscribeToBotConversations(
  botId: string,
  callback: (conversation: BotConversation) => void
) {
  return supabase
    .channel(`bot-${botId}-conversations`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bot_conversations',
        filter: `bot_id=eq.${botId}`
      },
      (payload) => {
        callback(payload.new as BotConversation)
      }
    )
    .subscribe()
}

/**
 * Subscribe to new messages in a conversation
 */
export function subscribeToConversationMessages(
  conversationId: string,
  callback: (message: BotMessage) => void
) {
  return supabase
    .channel(`conversation-${conversationId}-messages`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bot_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        callback(payload.new as BotMessage)
      }
    )
    .subscribe()
}

/**
 * Subscribe to succession activations
 */
export function subscribeToSuccessions(callback: (succession: SuccessionActivation) => void) {
  return supabase
    .channel('succession-activations')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'succession_activations'
      },
      (payload) => {
        callback(payload.new as SuccessionActivation)
      }
    )
    .subscribe()
}

/**
 * Get all bots with optional filtering
 */
export async function getBots(filter?: { status?: string; mode?: string }) {
  let query = supabase.from('bots').select('*')

  if (filter?.status) {
    query = query.eq('status', filter.status)
  }
  if (filter?.mode) {
    query = query.eq('mode', filter.mode)
  }

  return query.order('email')
}

/**
 * Get bot status summary (optimized view)
 */
export async function getBotStatusSummary() {
  return supabase
    .from('bot_status_summary')
    .select('*')
    .order('email')
}

/**
 * Get conversations for a bot
 */
export async function getBotConversations(
  botId: string,
  options?: { status?: string; limit?: number }
) {
  let query = supabase
    .from('bot_conversations')
    .select('*')
    .eq('bot_id', botId)

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  return query.order('created_at', { ascending: false })
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(conversationId: string, limit = 100) {
  return supabase
    .from('bot_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: true })
    .limit(limit)
}

/**
 * Update bot mode
 */
export async function updateBotMode(
  botId: string,
  mode: 'shadow' | 'delegate' | 'autonomous',
  reason: string
) {
  const { data: bot, error: updateError } = await supabase
    .from('bots')
    .update({ mode })
    .eq('id', botId)
    .select()
    .single()

  if (updateError) throw updateError

  // Log delegation event
  const { error: logError } = await supabase
    .from('bot_delegation_events')
    .insert({
      bot_id: botId,
      human_email: bot.email,
      action: 'mode_change',
      mode_to: mode,
      reason,
      created_by: 'dashboard'
    })

  if (logError) console.error('Failed to log delegation event:', logError)

  return bot
}

/**
 * Update bot status
 */
export async function updateBotStatus(
  botId: string,
  status: 'online' | 'offline' | 'busy' | 'error' | 'maintenance'
) {
  return supabase
    .from('bots')
    .update({ status, last_active: new Date().toISOString() })
    .eq('id', botId)
    .select()
    .single()
}

/**
 * Mark conversation as resolved
 */
export async function resolveConversation(conversationId: string) {
  return supabase
    .from('bot_conversations')
    .update({ status: 'resolved' })
    .eq('id', conversationId)
    .select()
    .single()
}

/**
 * Get active successions
 */
export async function getActiveSuccessions() {
  return supabase
    .from('succession_activations')
    .select('*')
    .eq('is_active', true)
    .order('tier')
}

/**
 * Get bot metrics for dashboard
 */
export async function getBotMetrics(botId: string, hours = 24) {
  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - hours)

  return supabase
    .from('bot_metrics')
    .select('*')
    .eq('bot_id', botId)
    .gte('hour_window', cutoff.toISOString())
    .order('hour_window', { ascending: false })
}

/**
 * Get response time statistics using database function
 */
export async function getBotResponseTimeStats(botId: string, hours = 24) {
  const { data, error } = await supabase.rpc('get_bot_response_time_stats', {
    p_bot_id: botId,
    p_hours: hours
  })

  if (error) throw error
  return data
}
