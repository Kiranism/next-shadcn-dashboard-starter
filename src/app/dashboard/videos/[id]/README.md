# 视频详情页面开发文档

## 第一部分：现有代码详解

### 1. 文件概述
- **路径**: `src/app/dashboard/videos/[id]/page.tsx`
- **功能**: 视频详情展示、视频播放、内容选择、任务创建
- **类型**: Next.js 客户端组件

### 2. 代码结构分析

#### 2.1 导入声明
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ThumbsUp, Calendar, Clock, Tag, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { videoData } from '@/data/videos'
import { toast } from 'sonner'
```

这些导入说明了组件的主要依赖：
- React Hooks: 状态和副作用管理
- Next.js 导航: 路由参数和页面跳转
- UI 组件: Card, Button, Separator
- 图标: Lucide 图标库
- 数据源: 视频数据
- 通知: Toast 提示

#### 2.2 模拟数据结构
```typescript
const mockData = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `示例内容 ${i + 1}`,
  description: `这是第 ${i + 1} 条示例内容的详细描述...`,
  date: `2024-01-${String(i + 1).padStart(2, '0')}`
}))
```

这个模拟数据用于展示相关内容列表，包含：
- id: 内容唯一标识
- title: 内容标题
- description: 内容描述
- date: 发布日期

#### 2.3 组件状态定义
```typescript
export default function VideoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const videoId = Number(params.id)
  const video = videoData.find(v => v.id === videoId)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [publishedItems, setPublishedItems] = useState<number[]>([])
```

状态说明：
- router: 页面导航控制
- params: URL 参数获取
- videoId: 当前视频 ID
- video: 当前视频数据
- selectedItems: 选中的内容项 ID 列表
- publishedItems: 已发布的内容项 ID 列表

#### 2.4 数据加载逻辑
```typescript
useEffect(() => {
  if (typeof window !== 'undefined') {
    const tasks = JSON.parse(localStorage.getItem('videoTasks') || '[]')
    const publishedIds = tasks
      .filter((task: any) => task.sourceVideoId === videoId)
      .flatMap((task: any) => task.selectedItems.map((item: any) => item.id))
    setPublishedItems(publishedIds)
  }
}, [videoId])
```

这段代码：
1. 检查是否在浏览器环境
2. 从 localStorage 读取任务数据
3. 过滤当前视频相关的任务
4. 提取已发布的内容 ID
5. 更新 publishedItems 状态

#### 2.5 内容选择逻辑
```typescript
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
```

选择功能说明：
1. 检查内容是否已发布
2. 如果已发布，不允许选择
3. 如果已选中，则取消选择
4. 如果未选中，则添加到选中列表

#### 2.6 任务创建逻辑
```typescript
const handleCreateTask = () => {
  // 获取选中项详情
  const selectedItemDetails = selectedItems.map(id => 
    mockData.find(item => item.id === id)
  ).filter(Boolean)

  // 创建新任务
  const newTask = {
    id: crypto.randomUUID(),
    sourceVideoId: videoId,
    selectedItems: selectedItemDetails,
    status: 'pending' as const,
    createdAt: new Date().toLocaleString()
  }

  // 保存任务
  const existingTasks = JSON.parse(localStorage.getItem('videoTasks') || '[]')
  const updatedTasks = [newTask, ...existingTasks]
  localStorage.setItem('videoTasks', JSON.stringify(updatedTasks))

  // 更新状态和提示
  setPublishedItems(prev => [...prev, ...selectedItems])
  toast.success('已创建新任务')
  setSelectedItems([])
  router.push('/dashboard/tasks')
}
```

任务创建流程：
1. 获取选中内容的完整信息
2. 生成唯一任务 ID
3. 创建任务对象
4. 保存到 localStorage
5. 更新已发布状态
6. 显示成功提示
7. 清空选择状态
8. 跳转到任务列表

#### 2.7 页面布局结构

##### 2.7.1 视频播放区域
```typescript
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
```

视频播放器特点：
- 响应式宽度
- 最大高度限制
- 内容适应容器
- 原生播放控件

##### 2.7.2 视频信息区域
```typescript
<div className="col-span-1">
  <Card className="p-4 space-y-4">
    <h1 className="text-2xl font-bold">{video.title}</h1>
    
    {/* 点赞信息 */}
    <div className="flex items-center gap-2 text-blue-500">
      <ThumbsUp className="h-5 w-5" />
      <span className="text-lg">{video.likes.toLocaleString()} 赞</span>
    </div>

    {/* 元数据信息 */}
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-gray-600">
        <Calendar className="h-4 w-4" />
        <span>上传日期：{video.uploadDate}</span>
      </div>
      
      <div className="flex items-center gap-2 text-gray-600">
        <Clock className="h-4 w-4" />
        <span>时长：{video.duration}</span>
      </div>

      {/* 分类标签 */}
      <div className="flex gap-2">
        <span className="px-2 py-1 bg-blue-100 rounded-full">
          {video.platformCategory}
        </span>
        <span className="px-2 py-1 bg-green-100 rounded-full">
          {video.productCategory}
        </span>
      </div>

      {/* 标签列表 */}
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
```

信息展示包括：
- 视频标题
- 点赞数
- 上传日期
- 视频时长
- 平台分类
- 产品分类
- 标签列表

##### 2.7.3 相关内容区域
```typescript
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
```

内容项特点：
- 可点击选择
- 状态样式区分
- 标题和描述展示
- 日期显示
- 交互反馈

### 3. 现有代码的局限性

#### 3.1 数据管理
- 使用本地存储，不适合生产环境
- 缺乏数据持久化方案
- 没有数据同步机制

#### 3.2 视频处理
- 直接使用本地视频文件
- 缺乏视频处理能力
- 没有清晰度切换
- 缺乏播放统计

#### 3.3 错误处理
- 错误处理不完整
- 缺乏加载状态
- 网络错误未处理

#### 3.4 性能问题
- 没有视频预加载
- 没有内容懒加载
- 缺乏缓存机制

#### 3.5 类型定义
- 部分使用 any 类型
- 接口定义不完整

## 第二部分：阿里云视频集成方案

### 1. 环境准备

#### 1.1 安装依赖
```bash
npm install ali-oss @alicloud/pop-core @alicloud/vod-sdk
```

#### 1.2 配置环境变量
```env
# .env.local
NEXT_PUBLIC_OSS_REGION=oss-cn-shanghai
NEXT_PUBLIC_OSS_ACCESS_KEY_ID=your-access-key-id
NEXT_PUBLIC_OSS_ACCESS_KEY_SECRET=your-access-key-secret
NEXT_PUBLIC_OSS_BUCKET=your-bucket-name
NEXT_PUBLIC_VOD_ACCESS_KEY_ID=your-vod-key-id
NEXT_PUBLIC_VOD_ACCESS_KEY_SECRET=your-vod-key-secret
```

### 2. 基础配置实现

#### 2.1 阿里云客户端配置
```typescript
// src/lib/alicloud.ts
import OSS from 'ali-oss'
import { vodClient } from '@alicloud/vod-sdk'

// OSS 客户端配置
export const ossClient = new OSS({
  region: process.env.NEXT_PUBLIC_OSS_REGION,
  accessKeyId: process.env.NEXT_PUBLIC_OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.NEXT_PUBLIC_OSS_ACCESS_KEY_SECRET,
  bucket: process.env.NEXT_PUBLIC_OSS_BUCKET,
  secure: true
})

// VOD 客户端配置
export const vodClient = new vodClient({
  accessKeyId: process.env.NEXT_PUBLIC_VOD_ACCESS_KEY_ID,
  accessKeySecret: process.env.NEXT_PUBLIC_VOD_ACCESS_KEY_SECRET,
  endpoint: 'vod.cn-shanghai.aliyuncs.com'
})
```

#### 2.2 类型定义更新
```typescript
// src/types/video.ts
interface Video {
  id: number
  title: string
  ossKey: string        // 阿里云 OSS 存储路径
  vodId: string         // 阿里云视频点播 ID
  thumbnailUrl: string  // 视频封面 URL
  likes: number
  platformCategory: '抖音' | '蝉妈妈'
  productCategory: '洗面奶' | '护肤品' | '牙具'
  tags: string[]
  uploadDate: string
  duration: string
  status: 'processing' | 'normal' | 'error'
}
```

### 3. 核心功能实现

#### 3.1 视频播放器组件
```typescript
// src/components/VideoPlayer.tsx
import { useEffect, useState } from 'react'
import { vodClient } from '@/lib/alicloud'

interface VideoPlayerProps {
  vodId: string
  title: string
}

export function VideoPlayer({ vodId, title }: VideoPlayerProps) {
  const [playUrl, setPlayUrl] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const getPlayUrl = async () => {
      try {
        const response = await vodClient.getPlayInfo({
          VideoId: vodId,
          Formats: 'mp4',
          Definition: 'HD'
        })
        
        const playInfo = response.PlayInfoList.PlayInfo[0]
        setPlayUrl(playInfo.PlayURL)
      } catch (err) {
        console.error('获取播放地址失败:', err)
        setError('视频加载失败，请稍后重试')
      }
    }

    if (vodId) {
      getPlayUrl()
    }
  }, [vodId])

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="relative aspect-video">
      <video
        className="w-full h-full rounded-lg"
        controls
        src={playUrl}
        title={title}
        poster={`https://vod.${process.env.NEXT_PUBLIC_OSS_REGION}.aliyuncs.com/${vodId}/snapshot/00001.jpg`}
      >
        <track kind="captions" />
      </video>
    </div>
  )
}
```

#### 3.2 视频上传功能
```typescript
// src/lib/upload.ts
import { ossClient, vodClient } from '@/lib/alicloud'

export async function uploadVideo(file: File) {
  try {
    // 1. 创建视频点播上传凭证
    const createResponse = await vodClient.createUploadVideo({
      Title: file.name,
      FileName: file.name,
      FileSize: file.size,
      Description: '通过网页端上传',
      CoverURL: '', // 可选的封面 URL
      Tags: 'web-upload', // 可选的标签
      TemplateGroupId: 'your-template-group-id' // 转码模板组 ID
    })

    const { VideoId, UploadAddress, UploadAuth } = createResponse

    // 2. 解码上传凭证
    const uploadAddress = JSON.parse(Buffer.from(UploadAddress, 'base64').toString())
    const uploadAuth = JSON.parse(Buffer.from(UploadAuth, 'base64').toString())

    // 3. 执行上传
    await ossClient.put(
      uploadAddress.ObjectKey,
      file,
      {
        headers: {
          'x-oss-security-token': uploadAuth.SecurityToken,
          ...uploadAddress.Headers
        }
      }
    )

    // 4. 等待视频处理完成
    await waitForVideoProcessing(VideoId)

    return {
      vodId: VideoId,
      ossKey: uploadAddress.ObjectKey
    }
  } catch (error) {
    console.error('视频上传失败:', error)
    throw new Error('视频上传失败，请重试')
  }
}

async function waitForVideoProcessing(videoId: string) {
  let retries = 0
  const maxRetries = 30
  const interval = 2000 // 2秒检查一次

  while (retries < maxRetries) {
    try {
      const response = await vodClient.getVideoInfo({
        VideoId: videoId
      })

      if (response.Video.Status === 'Normal') {
        return true
      }

      await new Promise(resolve => setTimeout(resolve, interval))
      retries++
    } catch (error) {
      console.error('检查视频状态失败:', error)
      throw error
    }
  }

  throw new Error('视频处理超时')
}
```

#### 3.3 视频详情页面改造
```typescript
// src/app/dashboard/videos/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { VideoPlayer } from '@/components/VideoPlayer'
import { getVideoDetails } from '@/lib/videos'
import type { Video } from '@/types/video'

export default function VideoDetailPage() {
  const params = useParams()
  const videoId = Number(params.id)
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true)
        const videoData = await getVideoDetails(videoId)
        setVideo(videoData)
      } catch (err) {
        console.error('加载视频失败:', err)
        setError('视频加载失败，请刷新页面重试')
      } finally {
        setLoading(false)
      }
    }

    loadVideo()
  }, [videoId])

  if (loading) {
    return <div>加载中...</div>
  }

  if (error || !video) {
    return <div className="text-red-500">{error || '视频不存在'}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {/* 视频播放区域 */}
        <div className="col-span-2">
          <VideoPlayer
            vodId={video.vodId}
            title={video.title}
          />
        </div>

        {/* 视频信息区域保持不变 */}
        <div className="col-span-1">
          {/* ... */}
        </div>
      </div>

      {/* 相关内容区域保持不变 */}
      <div className="space-y-2">
        {/* ... */}
      </div>
    </div>
  )
}
```

### 4. 高级功能实现

#### 4.1 视频转码配置
```typescript
// 在上传时指定转码模板
const createResponse = await vodClient.createUploadVideo({
  // ... 基本参数
  TemplateGroupId: 'your-template-group-id', // 转码模板组 ID
  WorkflowId: 'your-workflow-id',           // 工作流 ID
})
```

#### 4.2 视频加密播放
```typescript
const getEncryptedPlayUrl = async (vodId: string) => {
  const response = await vodClient.getPlayInfo({
    VideoId: vodId,
    ResultType: 'Multiple',
    PlayConfig: JSON.stringify({
      EncryptType: 'AliyunVoDEncryption'
    })
  })
  return response.PlayInfoList.PlayInfo[0].PlayURL
}
```

#### 4.3 播放统计实现
```typescript
const reportPlayProgress = async (vodId: string, position: number) => {
  await vodClient.reportPlayProgress({
    VideoId: vodId,
    PlayPosition: position,
    Source: 'web'
  })
}
```

### 5. 性能优化

#### 5.1 视频预加载
```typescript
const preloadVideo = (vodId: string) => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'video'
  link.href = playUrl
  document.head.appendChild(link)
}
```

#### 5.2 清晰度自适应
```typescript
const getAdaptivePlayUrl = async (vodId: string) => {
  const response = await vodClient.getPlayInfo({
    VideoId: vodId,
    Formats: 'mp4,m3u8',
    Definition: 'AUTO',
    ResultType: 'Multiple'
  })
  return response.PlayInfoList.PlayInfo
}
```

### 6. 安全措施

#### 6.1 播放鉴权
```typescript
const getAuthorizedPlayUrl = async (vodId: string) => {
  const response = await vodClient.getVideoPlayAuth({
    VideoId: vodId,
    AuthInfoTimeout: 3600
  })
  return response.PlayAuth
}
```

#### 6.2 上传安全
```typescript
// 使用 STS 临时凭证
const getStsToken = async () => {
  const response = await vodClient.createUploadVideo({
    // ... 其他参数
    SecurityToken: 'your-sts-token'
  })
  return response
}
```

### 7. 错误处理

#### 7.1 上传错误处理
```typescript
const handleUploadError = async (error: any) => {
  if (error.code === 'ConnectionTimeout') {
    // 重试上传
    return await uploadWithRetry(file)
  }
  
  if (error.code === 'InvalidParameter') {
    // 参数错误处理
    toast.error('上传参数无效，请检查文件格式')
    return
  }
  
  // 其他错误处理
  console.error('上传失败:', error)
  toast.error('上传失败，请重试')
}
```

#### 7.2 播放错误处理
```typescript
const handlePlayError = async (error: any) => {
  if (error.name === 'NotAllowedError') {
    toast.error('没有播放权限')
    return
  }
  
  if (error.name === 'NetworkError') {
    // 尝试切换清晰度
    const lowQualityUrl = await getLowQualityPlayUrl(vodId)
    videoRef.current.src = lowQualityUrl
    return
  }
  
  console.error('播放错误:', error)
  toast.error('视频播放失败，请刷新重试')
}
```

### 8. 测试建议

#### 8.1 上传测试
```typescript
describe('Video Upload', () => {
  it('should upload video successfully', async () => {
    const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    const result = await uploadVideo(file)
    expect(result.vodId).toBeDefined()
    expect(result.ossKey).toBeDefined()
  })

  it('should handle large file upload', async () => {
    // 测试大文件上传
  })

  it('should handle upload errors', async () => {
    // 测试错误处理
  })
})
```

#### 8.2 播放测试
```typescript
describe('Video Playback', () => {
  it('should load video url successfully', async () => {
    const player = new VideoPlayer({ vodId: 'test-id' })
    await player.load()
    expect(player.playUrl).toBeDefined()
  })

  it('should handle playback errors', async () => {
    // 测试播放错误
  })

  it('should report play progress', async () => {
    // 测试播放统计
  })
})
```

### 9. 部署注意事项

1. **域名配置**
   - 配置 CNAME 解析
   - 设置防盗链
   - 配置 HTTPS 证书

2. **跨域设置**
   - 配置 OSS CORS 规则
   - 设置允许的域名和方法

3. **缓存策略**
   - 配置 CDN 缓存规则
   - 设置播放地址有效期

4. **监控告警**
   - 配置上传失败告警
   - 设置播放异常监控
   - 配置流量监控

### 10. 开发建议

1. **代码组织**
   - 抽象通用的视频处理逻辑
   - 使用统一的错误处理
   - 实现完整的类型定义

2. **性能优化**
   - 实现视频预加载
   - 使用自适应码率
   - 优化首屏加载

3. **用户体验**
   - 添加上传进度提示
   - 实现断点续传
   - 优化播放控制

4. **安全措施**
   - 使用 STS 临时凭证
   - 实现播放鉴权
   - 配置访问控制
