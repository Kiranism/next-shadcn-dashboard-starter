'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Upload, Check, X, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import { VideoIcon } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// 获取任务列表
const getVideoTasks = () => {
  try {
    return JSON.parse(localStorage.getItem('taskQueueItems') || '[]')
  } catch {
    return []
  }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [showVideoDialog, setShowVideoDialog] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const currentUser = { id: 'user1', name: '用户1' } // 模拟当前用户

  // 加载任务
  useEffect(() => {
    const loadTasks = () => {
      const tasks = getVideoTasks()
      setTasks(tasks)
    }
    loadTasks()
    window.addEventListener('storage', loadTasks)
    return () => window.removeEventListener('storage', loadTasks)
  }, [])

  // 领取任务
  const handleClaimTask = (task: any) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === task.id) {
        return { ...t, status: '拍摄中', assignee: currentUser }
      }
      return t
    })
    localStorage.setItem('taskQueueItems', JSON.stringify(updatedTasks))
    setTasks(updatedTasks)
    toast.success('已领取任务')
  }

  // 删除任务
  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId)
    localStorage.setItem('taskQueueItems', JSON.stringify(updatedTasks))
    setTasks(updatedTasks)
    toast.success('已删除任务')
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="pending">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="pending">待领取任务</TabsTrigger>
            <TabsTrigger value="my">我的任务</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="space-y-4">
          {tasks.filter(task => task.status === '待领取').map((task) => (
            <Card key={task.id} className="p-4">
              <div className="flex gap-4">
                <div className="relative w-32 h-32 bg-gray-100 rounded">
                  {task.videoUrl && (
                    <video
                      src={task.videoUrl}
                      className="w-full h-full object-cover rounded"
                      onClick={() => {
                        setSelectedTask(task)
                        setShowVideoDialog(true)
                      }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm mb-4">
                    <div>时长：{task.duration?.toFixed(2)}秒</div>
                    <div>总时长：{task.startTime?.toFixed(2)}秒 ~ {(task.startTime + task.duration)?.toFixed(2)}秒</div>
                    <div className="mt-2">台词：{task.inputText}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge>{task.status}</Badge>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        删除任务
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleClaimTask(task)}
                      >
                        领取任务
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {tasks.filter(task => task.status === '待领取').length === 0 && (
            <div className="text-center text-gray-500 py-8">
              暂无待领取任务
            </div>
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          {tasks.filter(task => task.status === '拍摄中' && task.assignee?.id === currentUser.id).map((task) => (
            <Card key={task.id} className="p-4">
              <div className="flex gap-4">
                <div className="relative w-32 h-32 bg-gray-100 rounded">
                  {task.videoUrl && (
                    <video
                      src={task.videoUrl}
                      className="w-full h-full object-cover rounded"
                      onClick={() => {
                        setSelectedTask(task)
                        setShowVideoDialog(true)
                      }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm mb-4">
                    <div>时长：{task.duration?.toFixed(2)}秒</div>
                    <div>总时长：{task.startTime?.toFixed(2)}秒 ~ {(task.startTime + task.duration)?.toFixed(2)}秒</div>
                    <div className="mt-2">台词：{task.inputText}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge>{task.status}</Badge>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task)
                        setShowUploadDialog(true)
                      }}
                    >
                      上传视频
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {tasks.filter(task => task.status === '拍摄中' && task.assignee?.id === currentUser.id).length === 0 && (
            <div className="text-center text-gray-500 py-8">
              暂无我的任务
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 视频预览弹窗 */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-4xl">
          {selectedTask?.videoUrl && (
            <video src={selectedTask.videoUrl} controls className="w-full max-h-[70vh] object-contain rounded-lg"
                    autoPlay
                    playsInline
                  />
                            )}
        </DialogContent>
      </Dialog>

      {/* 上传视频弹窗 */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <div className="space-y-4">
            <div className="text-lg font-medium">上传视频</div>
            <div className="relative w-full h-32 border-2 border-dashed rounded flex items-center justify-center">
              <input
                type="file"
                accept="video/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file && selectedTask) {
                    const videoUrl = URL.createObjectURL(file);
                    
                    // 更新任务队列中的状态
                    const updatedTasks = tasks.map(t => {
                      if (t.id === selectedTask.id) {
                        return {
                          ...t,
                          status: '已上传',
                          uploadedVideo: videoUrl
                        }
                      }
                      return t
                    })
                    localStorage.setItem('taskQueueItems', JSON.stringify(updatedTasks))
                    setTasks(updatedTasks)

                    // 同步更新视频详情页的状态
                    const videoStates = JSON.parse(localStorage.getItem('videoStates') || '{}')
                    const key = `${selectedTask.videoUrl}`
                    if (videoStates[key]) {
                      videoStates[key] = {
                        ...videoStates[key],
                        status: '已上传',
                        uploadedVideo: videoUrl
                      }
                      localStorage.setItem('videoStates', JSON.stringify(videoStates))
                    }

                    setShowUploadDialog(false)
                    toast.success('上传成功')
                  }
                }}
              />
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <div className="text-sm text-gray-500">点击或拖拽上传视频</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
