'use client'

import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function TaskDetailPage() {
  const params = useParams()
  const taskId = params.id as string

  // 从 localStorage 获取任务详情
  const task = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('videoTasks') || '[]').find((t: any) => t.id === taskId)
    : null

  if (!task) {
    return <div className="p-6">任务不存在</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">任务详情</h1>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">任务 ID</div>
            <div className="font-medium">{task.id}</div>
          </div>
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

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">创建时间</div>
          <div>{task.createdAt}</div>
        </div>

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">来源视频</div>
          <div>ID: {task.sourceVideoId}</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">选中项目</div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {task.selectedItems.map((item: any) => (
              <div key={item.id} className="space-y-2">
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-muted-foreground">{item.description}</div>
                <div className="text-sm text-muted-foreground">{item.date}</div>
              </div>
            ))}
          </div>
        </div>

        {task.assignedTo && (
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">领取人</div>
            <div>{task.assignedTo}</div>
          </div>
        )}
      </Card>
    </div>
  )
}
