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

interface Video {
  id: number
  title: string
  filename: string
  likes: number
  platformCategory: '抖音' | '蝉妈妈'
  productCategory: '洗面奶' | '护肤品' | '牙具'
}

export default function VideosPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('全部')
  const [selectedProduct, setSelectedProduct] = useState<string>('全部')
  const [sortByLikes, setSortByLikes] = useState(false)
  const [isGridView, setIsGridView] = useState(true)
  const [thumbnails, setThumbnails] = useState<{[key: string]: string}>({})
  const [debug, setDebug] = useState<string[]>([])
  const [loadingThumbnails, setLoadingThumbnails] = useState<{[key: string]: boolean}>({})

  // 从 localStorage 加载缩略图
  useEffect(() => {
    const savedThumbnails = localStorage.getItem('videoThumbnails')
    if (savedThumbnails) {
      setThumbnails(JSON.parse(savedThumbnails))
    }
  }, [])

  // 保存缩略图到 localStorage
  useEffect(() => {
    if (Object.keys(thumbnails).length > 0) {
      localStorage.setItem('videoThumbnails', JSON.stringify(thumbnails))
    }
  }, [thumbnails])

  // 批量生成缩略图
  useEffect(() => {
    const generateAllThumbnails = async () => {
      for (const video of videoData) {
        const key = video.filename.replace('.mp4', '')
        // 如果已经有缩略图或正在加载，则跳过
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
            videoElement.onerror = resolve // 如果加载失败也继续处理下一个
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
  }, []) // 只在组件挂载时运行一次

  // 过滤和排序视频
  const filteredAndSortedVideos = videoData
    .filter(video => 
      (selectedPlatform === '全部' || video.platformCategory === selectedPlatform) &&
      (selectedProduct === '全部' || video.productCategory === selectedProduct)
    )
    .sort((a, b) => sortByLikes ? b.likes - a.likes : a.id - b.id)

  return (
    <div className="p-0 space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
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
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-between">
                  {selectedProduct === '全部' ? '产品分类' : selectedProduct}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {productCategories.map((category) => (
                  <DropdownMenuItem 
                    key={category}
                    onClick={() => setSelectedProduct(category)}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 右侧功能按钮 */}
          <div className="col-span-4 flex justify-end gap-4">
            {/* 布局切换按钮 */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsGridView(!isGridView)}
              className="w-10 h-10"
            >
              {isGridView ? (
                <LayoutGrid className="h-4 w-4" />
              ) : (
                <LayoutList className="h-4 w-4" />
              )}
            </Button>

            {/* 排序按钮 */}
            <Button
              variant="outline"
              onClick={() => setSortByLikes(!sortByLikes)}
              className="w-[150px] justify-between"
            >
              {sortByLikes ? '默认排序' : '按点赞排序'} 
              {sortByLikes && <ThumbsUp className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {isGridView ? (
        // 网格视图
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSortedVideos.map(video => (
            <Card key={video.id} className="overflow-hidden">
              <div className="aspect-[9/16] relative">
                {/* 视频缩略图或加载状态 */}
                {thumbnails[video.filename.replace('.mp4', '')] ? (
                  <img 
                    src={thumbnails[video.filename.replace('.mp4', '')]} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                    <span className="text-gray-400">
                      {loadingThumbnails[video.filename.replace('.mp4', '')] 
                        ? '生成缩略图...' 
                        : '加载中...'}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <Link 
                    href={`/dashboard/videos/${video.id}`}
                    className="text-white hover:text-blue-300 transition-colors block font-medium text-sm line-clamp-2"
                  >
                    {video.title}
                  </Link>
                  <div className="flex items-center gap-1 text-white mt-1 text-sm">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{video.likes.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <div className="flex gap-1 flex-wrap">
                  <span className="px-1.5 py-0.5 bg-blue-100 rounded-full text-xs">
                    {video.platformCategory}
                  </span>
                  <span className="px-1.5 py-0.5 bg-green-100 rounded-full text-xs">
                    {video.productCategory}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // 列表视图
        <div className="space-y-2">
          {filteredAndSortedVideos.map(video => (
            <Card key={video.id} className="p-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <Link 
                    href={`/dashboard/videos/${video.id}`}
                    className="text-lg font-medium hover:text-blue-500 transition-colors"
                  >
                    {video.title}
                  </Link>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span className="px-2 py-1 bg-blue-100 rounded-full">{video.platformCategory}</span>
                    <span className="px-2 py-1 bg-green-100 rounded-full">{video.productCategory}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-blue-500" />
                  <span>{video.likes.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* 调试信息 */}
      
    </div>
  )
}
