'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Task {
  id: string
  sourceVideoId: number
  selectedItems: {
    id: number
    title: string
    description: string
    date: string
  }[]
  status: 'pending' | 'assigned' | 'completed' | 'failed'
  assignedTo?: string
  createdAt: string
}

export default function TasksPage() {
  const { data: session } = useSession()
  const username = session?.user?.name || '未知用户'
  
  // 从 localStorage 获取任务列表
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem('videoTasks')
      return savedTasks ? JSON.parse(savedTasks) : []
    }
    return []
  })

  const handleAssignTask = (taskId: string) => {
    const updatedTasks: Task[] = tasks.map(task => 
      task.id === taskId
        ? {
            ...task,
            status: 'assigned' as const,
            assignedTo: username
          }
        : task
    )
    
    localStorage.setItem('videoTasks', JSON.stringify(updatedTasks))
    setTasks(updatedTasks)
    toast.success('已成功领取任务')
  }

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId)
    localStorage.setItem('videoTasks', JSON.stringify(updatedTasks))
    setTasks(updatedTasks)
    toast.success('已删除任务')
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const assignedTasks = tasks.filter(t => t.status === 'assigned')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">任务队列</h1>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            待领取: {pendingTasks.length}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            已领取: {assignedTasks.length}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <Card key={task.id} className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/tasks/${task.id}`} className="hover:underline">
                    <span className="font-medium">任务 ID: {task.id.slice(0, 8)}</span>
                  </Link>
                  <Badge 
                    variant={
                      task.status === 'completed' ? 'secondary' :
                      task.status === 'failed' ? 'destructive' : 'default'
                    }
                  >
                    {task.status === 'pending' && '待领取'}
                    {task.status === 'assigned' && `已领取: ${task.assignedTo}`}
                    {task.status === 'completed' && '已完成'}
                    {task.status === 'failed' && '失败'}
                  </Badge>
                </div>
                {task.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAssignTask(task.id)}
                  >
                    领取任务
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  来自视频 ID: {task.sourceVideoId}
                </div>
                <div className="text-sm">
                  选中项目: {task.selectedItems.length}
                </div>
                <div className="bg-gray-50 rounded-lg p-2 space-y-2">
                  {task.selectedItems.map(item => (
                    <div key={item.id} className="text-sm">
                      • {item.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {tasks.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            暂无任务
          </div>
        )}
      </div>
    </div>
  )
}
