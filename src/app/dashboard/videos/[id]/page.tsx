'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ThumbsUp, Calendar, Clock, Tag, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getVideoList, Video } from '@/data/videos'
import { toast } from 'sonner'
import { OSSClient, OSSVideo } from '@/lib/oss'

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
  const videoId = decodeURIComponent(params.id as string)
  const [video, setVideo] = useState<Video | undefined>()
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [publishedItems, setPublishedItems] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  // 加载视频数据
  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true);
        const videoList = await OSSClient.listVideos()
        const foundVideo = videoList.find(v => v.id === videoId)
        if (foundVideo) {
          setVideo(foundVideo)
        } else {
          toast.error('视频不存在');
          router.push('/dashboard/videos');
        }
      } catch (error) {
        console.error('加载视频失败:', error);
        toast.error('加载视频失败');
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoId, router]);

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

  if (!video && !loading) {
    return <div className="p-4">视频不存在</div>
  }

  const toggleSelection = (id: number) => {
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
    if (selectedItems.length === 0) {
      toast.error('请选择至少一个内容')
      return
    }

    // 获取选中的项目详情
    const selectedItemDetails = selectedItems.map(id => 
      mockData.find(item => item.id === id)
    ).filter(Boolean)

    // 创建新任务
    const newTask = {
      id: Date.now(),
      sourceVideoId: videoId,
      selectedItems: selectedItemDetails,
      status: 'pending'
    }

    // 保存到localStorage
    const existingTasks = JSON.parse(localStorage.getItem('videoTasks') || '[]')
    localStorage.setItem('videoTasks', JSON.stringify([...existingTasks, newTask]))

    // 更新状态
    setSelectedItems([])
    toast.success('任务创建成功')
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">视频详情</h2>
      </div>
      <Separator />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              {loading ? (
                <div className="w-[300px] h-[200px] flex items-center justify-center bg-gray-100 rounded-lg">
                  加载中...
                </div>
              ) : video?.url ? (
                <video 
                  className="w-[300px] rounded-lg max-h-[500px] object-contain"
                  controls
                  autoPlay
                  playsInline
                  src={video.url}
                  key={video.url}
                />
              ) : (
                <div className="w-[300px] h-[200px] flex items-center justify-center bg-gray-100 rounded-lg">
                  视频加载失败
                </div>
              )}
              {video && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{video.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {video.likes}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {video.lastModified.toLocaleString()}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {(video.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-100 rounded-full text-sm">
                      {video.platformCategory}
                    </span>
                    <span className="px-2 py-1 bg-green-100 rounded-full text-sm">
                      {video.productCategory}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 视频信息区域 */}
        <div className="col-span-1">
          <Card className="p-4 space-y-4">
            {video && (
              <div>
                <h1 className="text-2xl font-bold">{video.title}</h1>
                
                <div className="flex items-center gap-2 text-blue-500">
                  <ThumbsUp className="h-5 w-5" />
                  <span className="text-lg">{video.likes.toLocaleString()} 赞</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>上传时间：{video.lastModified.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>文件大小：{(video.size / 1024 / 1024).toFixed(2)} MB</span>
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
                    {/* video.tags.map(tag => (
                      <span 
                        key={tag}
                        className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    )) */}
                  </div>
                </div>
              </div>
            )}
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
