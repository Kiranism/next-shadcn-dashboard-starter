'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Mail, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Bot {
  id: string
  email: string
  nickname: string
  status: 'online' | 'offline' | 'busy' | 'error' | 'maintenance'
  mode: 'shadow' | 'delegate' | 'autonomous'
  last_active: string
  total_conversations: number
  active_conversations: number
  total_messages: number
  last_message_at: string | null
}

export default function BotConsolePage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadBots()

    const channel = supabase
      .channel('bot-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bots'
        },
        () => {
          loadBots()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadBots() {
    try {
      const { data, error } = await supabase
        .from('bot_status_summary')
        .select('*')
        .order('email')

      if (error) throw error
      setBots(data || [])
    } catch (error) {
      console.error('Error loading bots:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateBotMode(botId: string, newMode: string) {
    try {
      const { error } = await supabase
        .from('bots')
        .update({ mode: newMode })
        .eq('id', botId)

      if (error) throw error
      loadBots()
    } catch (error) {
      console.error('Error updating bot mode:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bot status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bot Command Center</h1>
        <p className="text-gray-600">
          Monitor and manage your 8 AI bot agents across the AMT ecosystem
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {bots.map((bot) => (
          <Card
            key={bot.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedBot(bot)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{bot.nickname}</CardTitle>
                <StatusBadge status={bot.status} />
              </div>
              <CardDescription className="text-xs">{bot.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Mode:</span>
                  <ModeBadge mode={bot.mode} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Conversations:</span>
                  <span className="font-semibold">{bot.total_conversations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active:</span>
                  <span className="font-semibold text-green-600">
                    {bot.active_conversations}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Messages:</span>
                  <span className="font-semibold">{bot.total_messages}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedBot && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedBot.nickname} - {selectedBot.email}
            </CardTitle>
            <CardDescription>Detailed bot information and controls</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="conversations">Conversations</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">Status:</span>
                      <StatusBadge status={selectedBot.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">Mode:</span>
                      <ModeBadge mode={selectedBot.mode} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">Last Active:</span>
                      <span className="text-sm text-gray-600">
                        {new Date(selectedBot.last_active).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="conversations">
                <p className="text-gray-600">
                  Conversation history will be displayed here
                </p>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Delegation Mode</h3>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedBot.mode === 'shadow' ? 'default' : 'outline'}
                      onClick={() => updateBotMode(selectedBot.id, 'shadow')}
                    >
                      Shadow
                    </Button>
                    <Button
                      variant={selectedBot.mode === 'delegate' ? 'default' : 'outline'}
                      onClick={() => updateBotMode(selectedBot.id, 'delegate')}
                    >
                      Delegate
                    </Button>
                    <Button
                      variant={
                        selectedBot.mode === 'autonomous' ? 'default' : 'outline'
                      }
                      onClick={() => updateBotMode(selectedBot.id, 'autonomous')}
                    >
                      Autonomous
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants = {
    online: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    offline: { color: 'bg-gray-100 text-gray-800', icon: Activity },
    busy: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    error: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    maintenance: { color: 'bg-blue-100 text-blue-800', icon: Activity }
  }

  const variant = variants[status as keyof typeof variants] || variants.offline
  const Icon = variant.icon

  return (
    <Badge className={variant.color}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </Badge>
  )
}

function ModeBadge({ mode }: { mode: string }) {
  const variants = {
    shadow: 'bg-purple-100 text-purple-800',
    delegate: 'bg-blue-100 text-blue-800',
    autonomous: 'bg-green-100 text-green-800'
  }

  return (
    <Badge className={variants[mode as keyof typeof variants]}>
      {mode}
    </Badge>
  )
}
