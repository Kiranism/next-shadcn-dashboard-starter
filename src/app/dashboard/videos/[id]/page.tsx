'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ThumbsUp, Calendar, Clock, Tag, Camera, Wand2, FileText, VideoIcon, Play, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { OSSClient, OSSVideo } from '@/lib/oss'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog"
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface VideoCardProps {
  id: string;
  videoUrl?: string;
  duration?: number;
  startTime?: number;
  script?: string;
  similarVideos?: any[];
  onDistribute?: () => void;
  initialState?: {
    status: '未分发' | '待领取' | '拍摄中' | '已上传' | '录用' | '拒绝';
    inputText: string;
    selectedUser: string;
    isInQueue?: boolean;
  };
  onStateChange?: (state: {
    status: '未分发' | '待领取' | '拍摄中' | '已上传' | '录用' | '拒绝';
    inputText: string;
    selectedUser: string;
    isInQueue?: boolean;
  }) => void;
  isInTaskQueue?: boolean;
}

const VideoCard = ({
  id,
  videoUrl,
  duration,
  startTime,
  script,
  similarVideos = [],
  onDistribute,
  initialState,
  onStateChange,
  isInTaskQueue = false,
}: VideoCardProps) => {
  const [inputText, setInputText] = useState(initialState?.inputText || "");
  const [showDistributeDialog, setShowDistributeDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(initialState?.selectedUser || "");
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [status, setStatus] = useState(initialState?.status || '未分发');
  const [isInQueue, setIsInQueue] = useState(initialState?.isInQueue || false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if this card is in task queue
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const taskQueueItems = JSON.parse(localStorage.getItem('taskQueueItems') || '[]');
      const isInQueue = taskQueueItems.some((item: any) => item.videoUrl === videoUrl);
      setIsInQueue(isInQueue);
    }
  }, [videoUrl]);

  const persistentValues = useRef({
    similarity: (Math.random() * 0.5 + 0.5).toFixed(2),
    selectedSimilarVideos: similarVideos.slice(0, Math.floor(Math.random() * 3) + 1)
  });

  const mockUsers = [
    { id: '1', name: '用户A' },
    { id: '2', name: '用户B' },
    { id: '3', name: '用户C' },
  ];

  const showUploadSection = status === '待领取' || status === '拍摄中' || status === '已上传' || status === '录用' || status === '拒绝';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setInputText(newText);
    onStateChange?.({
      status,
      inputText: newText,
      selectedUser,
      isInQueue
    });
  };

  const handleStatusChange = (newStatus: typeof status, newIsInQueue = isInQueue) => {
    setStatus(newStatus);
    setIsInQueue(newIsInQueue);
    onStateChange?.({
      status: newStatus,
      inputText,
      selectedUser,
      isInQueue: newIsInQueue
    });
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    onStateChange?.({
      status,
      inputText,
      selectedUser: userId,
      isInQueue
    });
  };

  const handleAddToTaskQueue = () => {
    const taskData = {
      id: Date.now().toString(),
      videoUrl,
      inputText,
      status: '待领取',
      duration,
      startTime,
      script
    };

    if (typeof window !== 'undefined') {
      const taskQueueItems = JSON.parse(localStorage.getItem('taskQueueItems') || '[]');
      taskQueueItems.push(taskData);
      localStorage.setItem('taskQueueItems', JSON.stringify(taskQueueItems));
      handleStatusChange('待领取');
      setShowDistributeDialog(false);
      toast.success('已添加到任务队列');
    }
  };

  const handleRemoveFromQueue = () => {
    if (typeof window !== 'undefined') {
      const taskQueueItems = JSON.parse(localStorage.getItem('taskQueueItems') || '[]');
      const updatedItems = taskQueueItems.filter((item: any) => item.videoUrl !== videoUrl);
      localStorage.setItem('taskQueueItems', JSON.stringify(updatedItems));
      setIsInQueue(false);
      handleStatusChange('未分发', false);
      toast.success('已从任务队列移除');
    }
  };

  return (
    <Card className="p-4">
      <div className="flex gap-8">
        {/* Section 1: Video Player */}
        <div className="space-y-2">
          <Dialog>
            <DialogTrigger>
              <div className="relative w-32 h-32 bg-gray-100 rounded cursor-pointer">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-cover rounded"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <video src={videoUrl} controls className="w-full max-h-[70vh] object-contain rounded-lg"
                autoPlay
                playsInline
              />

            </DialogContent>
          </Dialog>
          <div className="text-sm">
            <div>时长：{duration?.toFixed(2)}秒</div>
            <div>总时长：{startTime?.toFixed(2)}秒 ~ {(startTime + duration)?.toFixed(2)}秒</div>
          </div>
        </div>

        {/* Section 2: Script Input */}
        <div className="flex-1">
          <Input
            value={inputText}
            onChange={handleInputChange}
            placeholder="请输入台词"
          />
          <div className="mt-2 p-2 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">{script}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => {
                setInputText(script);
                onStateChange?.({
                  status,
                  inputText: script,
                  selectedUser,
                  isInQueue
                });
              }}
            >
              使用此台词
            </Button>
          </div>
        </div>

        {/* Section 3: Distribution */}
        <div className="space-y-2 min-w-[200px]">
          <Dialog open={showDistributeDialog} onOpenChange={setShowDistributeDialog}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="w-full" disabled={status !== '未分发'}>
                分发拍摄 {isInQueue && '(已在任务队列中)'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogTitle>分发拍摄任务</DialogTitle>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <video src={videoUrl} controls className="w-full max-h-[70vh] object-contain rounded-lg"
                    autoPlay
                    playsInline
                  />
                  <div className="text-sm">
                    <div>时长：{duration?.toFixed(2)}秒</div>
                    <div>总时长：{startTime?.toFixed(2)}秒 ~ {(startTime + duration)?.toFixed(2)}秒</div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleAddToTaskQueue();
                    }}
                  >
                    添加到任务队列
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {mockUsers.map(user => (
                      <Button
                        key={user.id}
                        variant={selectedUser === user.id ? "default" : "outline"}
                        onClick={() => handleUserSelect(user.id)}
                      >
                        {user.name}
                      </Button>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    disabled={!selectedUser}
                    onClick={() => {
                      handleStatusChange('拍摄中');
                      setShowDistributeDialog(false);
                      onDistribute?.();
                      toast.success('已分发给用户');
                    }}
                  >
                    确定分发
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-3 gap-2">
            {persistentValues.current.selectedSimilarVideos.map((video, index) => (
              <Dialog key={index}>
                <DialogTrigger>
                  <div className="relative w-16 h-16 bg-gray-100 rounded cursor-pointer">
                    <video
                      src={video}
                      className="w-full h-full object-cover rounded"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                <video src={video} controls className="w-full max-h-[70vh] object-contain rounded-lg"
                    autoPlay
                    playsInline
                  />                
                  </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>

        {/* Section 4: Upload (Only shown after distribution) */}
        {showUploadSection && (
          <div className="space-y-2 min-w-[200px]">
            <div className="space-y-2">
              <div className="relative w-32 h-32 border-2 border-dashed rounded flex items-center justify-center">
                {uploadedVideo ? (
                  <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                    <DialogTrigger asChild>
                      <div className="relative w-full h-full cursor-pointer">
                        <video
                          src={uploadedVideo}
                          className="w-full h-full object-cover rounded"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                        <button
                          className="absolute top-1 right-1 p-1 bg-white rounded-full shadow"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedVideo(null);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <video src={uploadedVideo} controls className="w-full" />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <input
                      type="file"
                      accept="video/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedVideo(URL.createObjectURL(file));
                          handleStatusChange('已上传');
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {uploadedVideo && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>分镜头来源：</div>
                    <div>原有素材</div>
                    <div>相似度：</div>
                    <div>{persistentValues.current.similarity}</div>
                    <div>状态：</div>
                    <div>{status}</div>
                  </div>
                  <Select
                    value={status}
                    onValueChange={(value: any) => handleStatusChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="更改状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="已上传">已上传</SelectItem>
                      <SelectItem value="录用">录用</SelectItem>
                      <SelectItem value="拒绝">拒绝</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {!isInQueue && status === '待领取' && (
              <Button
                variant="default"
                className="w-full"
                onClick={() => handleStatusChange('拍摄中')}
              >
                领取任务
              </Button>
            )}
            {isInQueue && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center">
                  <div>状态: {status}</div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveFromQueue}
                  >
                    删除任务
                  </Button>
                </div>
                {status === '待领取' && (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => handleStatusChange('拍摄中')}
                  >
                    领取任务
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

// 虚拟内容数据
const mockData = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `示例内容 ${i + 1}`,
  description: `这是第 ${i + 1} 条示例内容的详细描述，可以包含一些具体的信息。`,
  date: `2024-01-${String(i + 1).padStart(2, '0')}`
}))

// 虚拟产品数据
const mockProducts = [
  { id: 1, name: '智能手表', category: '智能穿戴' },
  { id: 2, name: '无线耳机', category: '音频设备' },
  { id: 3, name: '智能音箱', category: '智能家居' },
  { id: 4, name: '平板电脑', category: '移动设备' },
  { id: 5, name: '智能手环', category: '智能穿戴' },
];

// 本地存储键
const STORAGE_KEYS = {
  VIDEO_STATES: 'video_states',
  VIDEO_UPLOADS: 'video_uploads'
}

// 获取视频状态
const getVideoState = (videoId: string, startTime: number) => {
  try {
    const states = JSON.parse(localStorage.getItem(STORAGE_KEYS.VIDEO_STATES) || '{}')
    const key = `${videoId}_${startTime}`
    return states[key] || { status: '未分发', inputText: '', selectedUser: '', isInQueue: false }
  } catch (error) {
    console.error('Error getting video state:', error)
    return { status: '未分发', inputText: '', selectedUser: '', isInQueue: false }
  }
}

// 保存视频状态
const saveVideoState = (videoId: string, startTime: number, state: any) => {
  try {
    const states = JSON.parse(localStorage.getItem(STORAGE_KEYS.VIDEO_STATES) || '{}')
    const key = `${videoId}_${startTime}`
    states[key] = { ...state, lastModified: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEYS.VIDEO_STATES, JSON.stringify(states))
    return true
  } catch (error) {
    console.error('Error saving video state:', error)
    return false
  }
}

export default function VideoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const videoId = decodeURIComponent(params.id as string)
  const [video, setVideo] = useState<Video | undefined>()
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [publishedItems, setPublishedItems] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [videos, setVideos] = useState<{ url: string; duration: number; status: '未分发' | '待领取' | '拍摄中' | '已上传' | '录用' | '拒绝'; inputText: string; selectedUser: string; isInQueue: boolean }[]>([])
  const [cumulativeDurations, setCumulativeDurations] = useState<number[]>([])

  // 加载视频数据
  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true)
        const videoList = await OSSClient.listVideos()
        const foundVideo = videoList.find(v => v.id === videoId)
        if (foundVideo) {
          setVideo(foundVideo)
        } else {
          toast.error('视频不存在')
          router.push('/dashboard/videos')
        }
      } catch (error) {
        console.error('加载视频失败:', error)
        toast.error('加载视频失败')
      } finally {
        setLoading(false)
      }
    }
    loadVideo()
  }, [videoId, router])

  // 加载test_result目录下的视频
  useEffect(() => {
    const loadTestVideos = async () => {
      try {
        const client = OSSClient.getInstance()
        const result = await client.list({
          prefix: 'test_result/',
          'max-keys': 1000
        })

        // Filter for MP4 files and sort by scene number
        const mp4Files = result.objects
          ?.filter(obj => obj.name.toLowerCase().endsWith('.mp4'))
          .sort((a, b) => {
            const getSceneNumber = (name: string) => {
              const match = name.match(/scene_(\d+)\.mp4$/i)
              return match ? parseInt(match[1]) : 0
            }
            return getSceneNumber(a.name) - getSceneNumber(b.name)
          }) || []

        const videosWithDuration = await Promise.all(
          mp4Files.map(async (file) => {
            const url = client.signatureUrl(file.name)
            // Get video duration
            const video = document.createElement('video')
            video.src = url
            await new Promise((resolve) => {
              video.addEventListener('loadedmetadata', resolve)
            })
            const duration = video.duration

            // 加载持久化状态
            const state = getVideoState(videoId, duration)
            return {
              url,
              duration,
              status: state.status,
              inputText: state.inputText,
              selectedUser: state.selectedUser,
              isInQueue: state.isInQueue
            }
          })
        )

        setVideos(videosWithDuration)

        // Calculate cumulative durations
        let cumulative = 0
        const cumulatives = videosWithDuration.map(v => {
          const start = cumulative
          cumulative += v.duration
          return start
        })
        setCumulativeDurations(cumulatives)
      } catch (error) {
        console.error('加载视频失败:', error)
        toast.error('加载视频失败')
      }
    }

    loadTestVideos()
  }, [videoId])

  // 处理视频状态更新
  const handleVideoStateChange = (index: number, state: any) => {
    const video = videos[index]
    if (video) {
      const startTime = cumulativeDurations[index]
      saveVideoState(videoId, startTime, state)

      // 更新本地状态
      const updatedVideos = [...videos]
      updatedVideos[index] = { ...video, ...state }
      setVideos(updatedVideos)
    }
  }

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
    <div className="p-0 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="p-4">
        <div className="grid gap-4">
          <Card className="p-4 max-w-[1418px]">
            <div className="flex items-start justify-center">
              {/* 左侧视频播放器和属性 */}
              <div className="w-[500px]">
                <div className="flex gap-3">
                  <Dialog>
                    <DialogTrigger>
                      <div className="relative w-32 aspect-square cursor-pointer group">
                        {loading ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                            <div className="text-sm">加载中...</div>
                          </div>
                        ) : video?.url ? (
                          <>
                            <video
                              className="w-full h-full object-cover rounded-lg"
                              src={video.url}
                              key={video.url}
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                              <Play className="w-6 h-6 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                            <div className="text-sm">视频加载失败</div>
                          </div>
                        )}
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl sm:max-w-2xl">
                      <DialogTitle>
                        {video?.title || "视频播放"}
                      </DialogTitle>
                      {video?.url && (
                        <video
                          className="w-full max-h-[70vh] object-contain rounded-lg"
                          controls
                          autoPlay
                          playsInline
                          src={video.url}
                        />
                      )}
                    </DialogContent>
                  </Dialog>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    {video && (
                      <>
                        <h3 className="text-xs font-medium truncate">{video.title}</h3>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {video.lastModified.toLocaleString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {(video.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <span className="flex items-center text-blue-500">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {video.likes.toLocaleString()} 赞
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.5 bg-blue-100 rounded-full text-xs">
                            {video.platformCategory}
                          </span>
                          <span className="px-1.5 py-0.5 bg-green-100 rounded-full text-xs">
                            {video.productCategory}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 分割线 */}
              <div className="mx-6 self-stretch w-px bg-border opacity-70" />

              {/* 右侧 AI 生成部分 */}
              <div className="w-[400px]">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-medium mb-2">请选择产品</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {mockProducts.map(product => (
                        <Button
                          key={product.id}
                          variant={selectedProduct === product.id ? "default" : "outline"}
                          className="justify-start h-7 text-xs"
                          onClick={() => setSelectedProduct(product.id)}
                        >
                          <span className="truncate">{product.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => toast.success("开始生成文案")}>
                        <FileText className="w-3 h-3 mr-1" />
                        生成文案
                      </Button>
                      <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => toast.success("开始挑选素材")}>
                        <Wand2 className="w-3 h-3 mr-1" />
                        自动挑选素材
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      className="px-4 h-7 text-xs"
                      onClick={() => toast.success("开始生成视频")}
                      disabled={!selectedProduct}
                    >
                      <VideoIcon className="w-3 h-3 mr-1" />
                      生成视频
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 新的视频卡片列表 */}
          <div className="mt-4 space-y-4 max-w-[1418px]">
            {videos.map((video, index) => (
              <VideoCard
                key={index}
                id={index.toString()}
                videoUrl={video.url}
                duration={video.duration}
                startTime={cumulativeDurations[index]}
                script="这是示例台词文本，您可以根据实际情况修改。"
                similarVideos={videos.map(v => v.url)}
                onDistribute={() => {
                  handleVideoStateChange(index, {
                    status: '待领取',
                    inputText: video.inputText,
                    selectedUser: video.selectedUser,
                    isInQueue: video.isInQueue
                  })
                }}
                initialState={{
                  status: video.status,
                  inputText: video.inputText,
                  selectedUser: video.selectedUser,
                  isInQueue: video.isInQueue
                }}
                onStateChange={(state) => handleVideoStateChange(index, state)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
