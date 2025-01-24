'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function MyTasksPage() {
  const { data: session } = useSession()
  const username = session?.user?.name || '未知用户'

  // 从 localStorage 获取任务列表，只显示已领取的任务
  const [tasks] = useState(() => {
    if (typeof window !== 'undefined') {
      const allTasks = JSON.parse(localStorage.getItem('videoTasks') || '[]')
      return allTasks.filter((task: any) => task.assignedTo === username)
    }
    return []
  })

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100">
      <h1 className="text-2xl font-bold">我的任务</h1>

      <div className="space-y-4">
        {tasks.map((task: any) => (
          <Link key={task.id} href={`/dashboard/tasks/${task.id}`}>
            <Card className="p-4 hover:bg-gray-50 transition-colors">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">任务 ID: {task.id.slice(0, 8)}</span>
                    <Badge 
                      variant={
                        task.status === 'completed' ? 'secondary' :
                        task.status === 'failed' ? 'destructive' : 'default'
                      }
                    >
                      {task.status === 'assigned' && '进行中'}
                      {task.status === 'completed' && '已完成'}
                      {task.status === 'failed' && '失败'}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {task.createdAt}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    来自视频 ID: {task.sourceVideoId}
                  </div>
                  <div className="text-sm">
                    选中项目: {task.selectedItems.length}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
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
