'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ThumbsUp, Calendar, Clock, Tag, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { videoData } from '@/data/videos'
import { toast } from 'sonner'

// 虚拟内容数据
const mockData = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `示例内容 ${i + 1}`,
  description: `这是第 ${i + 1} 条示例内容的详细描述，可以包含一些具体的信息。`,
  date: `2024-01-${String(i + 1).padStart(2, '0')}`
}))

export default function VideoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const videoId = Number(params.id)
  const video = videoData.find(v => v.id === videoId)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [publishedItems, setPublishedItems] = useState<number[]>([])

  // 从 localStorage 加载已发布的项目
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tasks = JSON.parse(localStorage.getItem('videoTasks') || '[]')
      const publishedIds = tasks
        .filter((task: any) => task.sourceVideoId === videoId)
        .flatMap((task: any) => task.selectedItems.map((item: any) => item.id))
      setPublishedItems(publishedIds)
    }
  }, [videoId])

  if (!video) {
    return <div>视频不存在</div>
  }

  const toggleSelection = (id: number) => {
    // 如果项目已发布，不允许选择
    if (publishedItems.includes(id)) {
      return
    }
    
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const handleCreateTask = () => {
    // 获取选中的项目详情
    const selectedItemDetails = selectedItems.map(id => 
      mockData.find(item => item.id === id)
    ).filter(Boolean)

    // 创建新任务
    const newTask: Task = {
      id: crypto.randomUUID(),
      sourceVideoId: videoId,
      selectedItems: selectedItemDetails,
      status: 'pending' as const,
      createdAt: new Date().toLocaleString()
    }

    // 从 localStorage 获取现有任务
    const existingTasks = JSON.parse(localStorage.getItem('videoTasks') || '[]')
    
    // 添加新任务
    const updatedTasks = [newTask, ...existingTasks]
    
    // 保存回 localStorage
    localStorage.setItem('videoTasks', JSON.stringify(updatedTasks))

    // 更新已发布项目列表
    setPublishedItems(prev => [...prev, ...selectedItems])

    // 提示用户
    toast.success('已创建新任务')
    
    // 清空选择
    setSelectedItems([])
    
    // 导航到任务页面
    router.push('/dashboard/tasks')
  }

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100">
      <div className="grid grid-cols-3 gap-6">
        {/* 视频播放区域 */}
        <div className="col-span-2">
          <Card className="p-4 w-full">
            <div className="flex justify-center">
              <video 
                className="w-[300px] rounded-lg max-h-[500px] object-contain"
                controls
                src={`/video/${video.filename}`}
              />
            </div>
          </Card>
        </div>

        {/* 视频信息区域 */}
        <div className="col-span-1">
          <Card className="p-4 space-y-4">
            <h1 className="text-2xl font-bold">{video.title}</h1>
            
            <div className="flex items-center gap-2 text-blue-500">
              <ThumbsUp className="h-5 w-5" />
              <span className="text-lg">{video.likes.toLocaleString()} 赞</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>上传日期：{video.uploadDate}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>时长：{video.duration}</span>
              </div>

              <div className="flex gap-2">
                <span className="px-2 py-1 bg-blue-100 rounded-full">
                  {video.platformCategory}
                </span>
                <span className="px-2 py-1 bg-green-100 rounded-full">
                  {video.productCategory}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Tag className="h-4 w-4 text-gray-600" />
                {video.tags.map(tag => (
                  <span 
                    key={tag}
                    className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">相关内容</h2>
        <Button 
          variant="default"
          disabled={selectedItems.length === 0}
          className="flex items-center gap-2"
          onClick={handleCreateTask}
        >
          <Camera className="h-4 w-4" />
          拍摄 {selectedItems.length > 0 && `(${selectedItems.length})`}
        </Button>
      </div>

      <Separator className="my-4" />

      {/* 可选取的虚拟内容 */}
      <div className="space-y-2">
        {mockData.map(item => (
          <Card 
            key={item.id} 
            className={`p-4 cursor-pointer transition-colors ${
              publishedItems.includes(item.id)
                ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                : selectedItems.includes(item.id)
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50'
            }`}
            onClick={() => toggleSelection(item.id)}
          >
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {item.date}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
