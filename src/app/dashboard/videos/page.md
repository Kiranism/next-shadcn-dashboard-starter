# 视频列表页面开发文档

## 第一部分：现有代码详解

### 1. 文件概述
- **路径**: `src/app/dashboard/videos/page.tsx`
- **功能**: 视频列表展示、筛选、排序、缩略图生成
- **类型**: Next.js 客户端组件

### 2. 代码结构分析

#### 2.1 导入声明
```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ThumbsUp, ChevronDown, LayoutGrid, LayoutList } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { videoData, platformCategories, productCategories } from '@/data/videos'
```

导入说明：
- React Hooks: 状态和副作用管理
- Next.js 组件: 页面导航
- UI 组件: 按钮、卡片、下拉菜单
- 图标: Lucide 图标库
- 数据源: 视频数据和分类数据

#### 2.2 类型定义
```typescript
interface Video {
  id: number
  title: string
  filename: string
  likes: number
  platformCategory: '抖音' | '蝉妈妈'
  productCategory: '洗面奶' | '护肤品' | '牙具'
}
```

视频数据结构：
- id: 唯一标识符
- title: 视频标题
- filename: 文件名
- likes: 点赞数
- platformCategory: 平台分类
- productCategory: 产品分类

#### 2.3 组件状态
```typescript
export default function VideosPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('全部')
  const [selectedProduct, setSelectedProduct] = useState<string>('全部')
  const [sortByLikes, setSortByLikes] = useState(false)
  const [isGridView, setIsGridView] = useState(true)
  const [thumbnails, setThumbnails] = useState<{[key: string]: string}>({})
  const [debug, setDebug] = useState<string[]>([])
  const [loadingThumbnails, setLoadingThumbnails] = useState<{[key: string]: boolean}>({})
```

状态说明：
- selectedPlatform: 当前选中的平台分类
- selectedProduct: 当前选中的产品分类
- sortByLikes: 是否按点赞数排序
- isGridView: 是否使用网格视图
- thumbnails: 视频缩略图缓存
- loadingThumbnails: 缩略图加载状态

#### 2.4 缓存管理
```typescript
useEffect(() => {
  const savedThumbnails = localStorage.getItem('videoThumbnails')
  if (savedThumbnails) {
    setThumbnails(JSON.parse(savedThumbnails))
  }
}, [])

useEffect(() => {
  if (Object.keys(thumbnails).length > 0) {
    localStorage.setItem('videoThumbnails', JSON.stringify(thumbnails))
  }
}, [thumbnails])
```

缓存功能：
1. 组件加载时从 localStorage 读取缩略图
2. 缩略图更新时保存到 localStorage

#### 2.5 缩略图生成
```typescript
useEffect(() => {
  const generateAllThumbnails = async () => {
    for (const video of videoData) {
      const key = video.filename.replace('.mp4', '')
      if (thumbnails[key] || loadingThumbnails[key]) continue

      try {
        setLoadingThumbnails(prev => ({ ...prev, [key]: true }))
        
        const videoElement = document.createElement('video')
        videoElement.src = `/video/${video.filename}`
        videoElement.preload = 'metadata'
        videoElement.muted = true
        videoElement.playsInline = true

        await new Promise((resolve) => {
          videoElement.onloadeddata = resolve
          videoElement.onerror = resolve
        })

        videoElement.currentTime = 0
        
        await new Promise((resolve) => {
          videoElement.onseeked = resolve
        })

        const canvas = document.createElement('canvas')
        canvas.width = 320
        canvas.height = 568
        
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
          setThumbnails(prev => ({ ...prev, [key]: dataUrl }))
        }
      } catch (error) {
        console.error('生成缩略图失败:', video.filename, error)
      } finally {
        setLoadingThumbnails(prev => ({ ...prev, [key]: false }))
      }
    }
  }

  generateAllThumbnails()
}, [])
```

缩略图生成流程：
1. 创建视频元素
2. 加载视频元数据
3. 设置视频时间为开始
4. 创建 canvas 并设置尺寸
5. 将视频帧绘制到 canvas
6. 生成缩略图 URL
7. 更新缩略图状态

#### 2.6 数据过滤和排序
```typescript
const filteredAndSortedVideos = videoData
  .filter(video => 
    (selectedPlatform === '全部' || video.platformCategory === selectedPlatform) &&
    (selectedProduct === '全部' || video.productCategory === selectedProduct)
  )
  .sort((a, b) => sortByLikes ? b.likes - a.likes : a.id - b.id)
```

数据处理：
1. 根据选中的平台和产品分类过滤视频
2. 根据排序选项进行排序（点赞数或 ID）

#### 2.7 UI 结构

##### 2.7.1 筛选和控制栏
```typescript
<div className="flex justify-between items-center sticky top-0 bg-background z-10 pt-4 pb-4">
  <div className="grid grid-cols-12 gap-4 w-full">
    {/* 左侧分类筛选 */}
    <div className="col-span-8 flex gap-4">
      {/* 平台分类下拉菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-between">
            {selectedPlatform === '全部' ? '平台分类' : selectedPlatform}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {platformCategories.map((category) => (
            <DropdownMenuItem 
              key={category}
              onClick={() => setSelectedPlatform(category)}
            >
              {category}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 产品分类下拉菜单 */}
      <DropdownMenu>
        {/* 类似的产品分类下拉菜单结构 */}
      </DropdownMenu>
    </div>

    {/* 右侧功能按钮 */}
    <div className="col-span-4 flex justify-end gap-4">
      {/* 布局切换按钮 */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsGridView(!isGridView)}
      >
        {isGridView ? <LayoutGrid /> : <LayoutList />}
      </Button>

      {/* 排序按钮 */}
      <Button
        variant="outline"
        onClick={() => setSortByLikes(!sortByLikes)}
      >
        {sortByLikes ? '默认排序' : '按点赞排序'} 
      </Button>
    </div>
  </div>
</div>
```

控制栏功能：
- 平台分类筛选
- 产品分类筛选
- 视图布局切换
- 排序方式切换

##### 2.7.2 视频列表
```typescript
{isGridView ? (
  // 网格视图
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {filteredAndSortedVideos.map(video => (
      <Card key={video.id} className="overflow-hidden">
        <div className="aspect-[9/16] relative">
          {/* 缩略图或加载状态 */}
          {thumbnails[video.filename.replace('.mp4', '')] ? (
            <img 
              src={thumbnails[video.filename.replace('.mp4', '')]} 
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 animate-pulse">
              <span>
                {loadingThumbnails[video.filename.replace('.mp4', '')] 
                  ? '生成缩略图...' 
                  : '加载中...'}
              </span>
            </div>
          )}
        </div>
        {/* 视频信息 */}
        <div className="p-4">
          <h3 className="font-medium">{video.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ThumbsUp className="h-4 w-4" />
            <span>{video.likes}</span>
          </div>
        </div>
      </Card>
    ))}
  </div>
) : (
  // 列表视图
  <div className="space-y-4">
    {/* 类似的列表项结构 */}
  </div>
)}
```

列表功能：
- 响应式网格布局
- 缩略图显示
- 加载状态提示
- 视频基本信息展示

### 3. 现有代码的局限性

#### 3.1 数据管理
- 使用静态数据源
- 缺乏分页加载
- 没有实时更新机制

#### 3.2 缩略图处理
- 客户端生成缩略图性能差
- 缓存管理不完善
- 缺乏错误重试机制

#### 3.3 性能问题
- 一次性加载所有视频
- 没有虚拟滚动
- 缺乏性能监控

#### 3.4 用户体验
- 缺乏搜索功能
- 筛选条件不支持多选
- 缺乏高级筛选

## 第二部分：阿里云视频集成方案

### 1. 基础配置

#### 1.1 环境配置
```bash
# 安装依赖
npm install ali-oss @alicloud/pop-core @alicloud/vod-sdk
```

```env
# .env.local
NEXT_PUBLIC_OSS_REGION=oss-cn-shanghai
NEXT_PUBLIC_OSS_ACCESS_KEY_ID=your-access-key-id
NEXT_PUBLIC_OSS_ACCESS_KEY_SECRET=your-access-key-secret
NEXT_PUBLIC_OSS_BUCKET=your-bucket-name
NEXT_PUBLIC_VOD_ACCESS_KEY_ID=your-vod-key-id
NEXT_PUBLIC_VOD_ACCESS_KEY_SECRET=your-vod-key-secret
```

#### 1.2 类型定义更新
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

### 2. 核心功能实现

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

#### 2.2 视频列表页面改造

##### 2.2.1 数据获取
```typescript
// src/app/dashboard/videos/page.tsx
const [videos, setVideos] = useState<Video[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await vodClient.getVideoList({
        PageSize: 20,
        PageNo: 1,
        SortBy: 'CreationTime:Desc'
      })
      
      const videoList = response.VideoList.Video.map(video => ({
        id: video.VideoId,
        title: video.Title,
        ossKey: video.FileUrl,
        vodId: video.VideoId,
        thumbnailUrl: video.CoverURL,
        likes: 0, // 需要从自己的数据库获取
        platformCategory: '抖音', // 需要从自己的数据库获取
        productCategory: '护肤品', // 需要从自己的数据库获取
        tags: video.Tags?.split(',') || [],
        uploadDate: video.CreationTime,
        duration: video.Duration,
        status: video.Status.toLowerCase()
      }))
      
      setVideos(videoList)
    } catch (error) {
      console.error('获取视频列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  fetchVideos()
}, [])
```

##### 2.2.2 缩略图处理优化
```typescript
// 移除本地缩略图生成逻辑，直接使用阿里云视频点播的封面图
const VideoCard = ({ video }: { video: Video }) => {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[9/16] relative">
        <img 
          src={video.thumbnailUrl} 
          alt={video.title}
          className="w-full h-full object-cover"
        />
        {video.status === 'processing' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white">处理中...</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium">{video.title}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ThumbsUp className="h-4 w-4" />
          <span>{video.likes}</span>
        </div>
      </div>
    </Card>
  )
}
```

### 3. 数据库集成

#### 3.1 Schema 定义
```typescript
// src/lib/db/schema.ts
import { sql } from 'drizzle-orm'
import { 
  sqliteTable, 
  text, 
  integer 
} from 'drizzle-orm/sqlite-core'

export const videos = sqliteTable('videos', {
  id: integer('id').primaryKey(),
  vodId: text('vod_id').notNull(),
  ossKey: text('oss_key').notNull(),
  title: text('title').notNull(),
  likes: integer('likes').default(0),
  platformCategory: text('platform_category').notNull(),
  productCategory: text('product_category').notNull(),
  tags: text('tags'),
  uploadDate: text('upload_date').notNull(),
  duration: text('duration'),
  status: text('status').default('processing'),
  createdAt: integer('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at').default(sql`CURRENT_TIMESTAMP`)
})
```

#### 3.2 数据操作函数
```typescript
// src/lib/db/videos.ts
import { db } from '@/lib/db'
import { videos } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getVideos() {
  return await db.select().from(videos).orderBy(videos.createdAt)
}

export async function updateVideoStatus(vodId: string, status: string) {
  return await db
    .update(videos)
    .set({ status, updatedAt: Date.now() })
    .where(eq(videos.vodId, vodId))
}

export async function incrementLikes(vodId: string) {
  return await db
    .update(videos)
    .set(videos => ({ likes: videos.likes + 1 }))
    .where(eq(videos.vodId, vodId))
}

```

### 4. 视频上传功能

#### 4.1 上传组件
```typescript
// src/components/VideoUploader.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { uploadVideo } from '@/lib/upload'
import { Progress } from '@/components/ui/progress'

export function VideoUploader() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string>('')

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setError('')
      
      const result = await uploadVideo(file, (percent) => {
        setProgress(percent)
      })

      // 上传成功后刷新列表
      window.location.reload()
    } catch (err) {
      console.error('上传失败:', err)
      setError('视频上传失败，请重试')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="video/*"
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
        id="video-upload"
      />
      <label htmlFor="video-upload">
        <Button 
          variant="outline" 
          disabled={uploading}
          className="w-full"
        >
          {uploading ? '上传中...' : '上传视频'}
        </Button>
      </label>
      
      {uploading && (
        <Progress value={progress} className="w-full" />
      )}
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  )
}
```

#### 4.2 上传工具函数
```typescript
// src/lib/upload.ts
import { ossClient, vodClient } from '@/lib/alicloud'
import { db } from '@/lib/db'
import { videos } from '@/lib/db/schema'

export async function uploadVideo(
  file: File, 
  onProgress?: (percent: number) => void
) {
  try {
    // 1. 创建视频点播上传凭证
    const createResponse = await vodClient.createUploadVideo({
      Title: file.name,
      FileName: file.name,
      FileSize: file.size,
      Description: '通过网页端上传',
      Tags: 'web-upload'
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
        },
        progress: (p) => {
          onProgress?.(Math.floor(p * 100))
        }
      }
    )

    // 4. 保存到数据库
    await db.insert(videos).values({
      vodId: VideoId,
      ossKey: uploadAddress.ObjectKey,
      title: file.name,
      platformCategory: '抖音',
      productCategory: '护肤品',
      uploadDate: new Date().toISOString(),
      status: 'processing'
    })

    return {
      vodId: VideoId,
      ossKey: uploadAddress.ObjectKey
    }
  } catch (error) {
    console.error('视频上传失败:', error)
    throw new Error('视频上传失败，请重试')
  }
}
```

### 5. 性能优化

#### 5.1 分页加载
```typescript
// src/app/dashboard/videos/page.tsx
const PAGE_SIZE = 20

const [page, setPage] = useState(1)
const [hasMore, setHasMore] = useState(true)

const loadMore = async () => {
  if (!hasMore || loading) return
  
  try {
    setLoading(true)
    const response = await vodClient.getVideoList({
      PageSize: PAGE_SIZE,
      PageNo: page + 1,
      SortBy: 'CreationTime:Desc'
    })
    
    const newVideos = response.VideoList.Video.map(/* ... */)
    
    setVideos(prev => [...prev, ...newVideos])
    setPage(prev => prev + 1)
    setHasMore(newVideos.length === PAGE_SIZE)
  } catch (error) {
    console.error('加载更多视频失败:', error)
  } finally {
    setLoading(false)
  }
}
```

#### 5.2 虚拟滚动
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const parentRef = useRef<HTMLDivElement>(null)

const rowVirtualizer = useVirtualizer({
  count: videos.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 300,
  overscan: 5
})

return (
  <div ref={parentRef} className="h-screen overflow-auto">
    <div
      className="relative w-full"
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => (
        <div
          key={virtualRow.index}
          className="absolute top-0 left-0 w-full"
          style={{
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          <VideoCard video={videos[virtualRow.index]} />
        </div>
      ))}
    </div>
  </div>
)
```

### 6. 开发建议

#### 6.1 代码组织
1. 将阿里云相关的配置和工具函数放在 `src/lib/alicloud` 目录下
2. 使用环境变量管理敏感信息
3. 实现完整的错误处理和日志记录

#### 6.2 性能优化
1. 使用 CDN 加速视频和封面图访问
2. 实现视频预加载
3. 优化首屏加载时间

#### 6.3 用户体验
1. 添加上传进度提示
2. 实现断点续传
3. 支持批量上传

#### 6.4 安全措施
1. 使用 STS 临时凭证
2. 实现上传文件大小和格式验证
3. 配置跨域和防盗链设置

### 7. 测试计划

#### 7.1 单元测试
```typescript
// __tests__/upload.test.ts
describe('Video Upload', () => {
  it('should upload video successfully', async () => {
    const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' })
    const result = await uploadVideo(file)
    expect(result.vodId).toBeDefined()
    expect(result.ossKey).toBeDefined()
  })

  it('should handle upload errors', async () => {
    // 测试错误情况
  })
})
```

#### 7.2 集成测试
```typescript
// __tests__/integration/videos.test.ts
describe('Videos Page', () => {
  it('should load videos from VOD', async () => {
    render(<VideosPage />)
    await waitFor(() => {
      expect(screen.getAllByTestId('video-card')).toHaveLength(20)
    })
  })

  it('should handle video upload', async () => {
    // 测试上传流程
  })
})
```

### 8. 部署检查清单

1. 环境配置
   - [ ] 配置阿里云 AccessKey
   - [ ] 设置 OSS Bucket 权限
   - [ ] 配置 VOD 转码模板

2. 安全设置
   - [ ] 开启 HTTPS
   - [ ] 配置跨域规则
   - [ ] 设置防盗链

3. 性能优化
   - [ ] 配置 CDN
   - [ ] 开启 Gzip 压缩
   - [ ] 设置缓存策略

4. 监控告警
   - [ ] 配置错误日志
   - [ ] 设置流量监控
   - [ ] 配置告警规则
