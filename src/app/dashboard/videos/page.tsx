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
import { getVideoList, Video, platformCategories, productCategories } from '@/data/videos'
import { toast } from 'sonner'

export default function VideosPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('全部')
  const [selectedProduct, setSelectedProduct] = useState<string>('全部')
  const [sortByLikes, setSortByLikes] = useState(false)
  const [isGridView, setIsGridView] = useState(true)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [thumbnails, setThumbnails] = useState<{[key: string]: string}>({})

  // 从OSS加载视频列表
  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true)
        const videoList = await getVideoList()
        setVideos(videoList)
      } catch (error) {
        console.error('加载视频列表失败:', error)
        toast.error('加载视频列表失败')
      } finally {
        setLoading(false)
      }
    }

    loadVideos()
  }, [])

  // 过滤和排序视频
  const filteredAndSortedVideos = videos
    .filter(video => 
      (selectedPlatform === '全部' || video.platformCategory === selectedPlatform) &&
      (selectedProduct === '全部' || video.productCategory === selectedProduct)
    )
    .sort((a, b) => sortByLikes ? b.likes - a.likes : 0)

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

      {loading ? (
        // 加载状态
        <div className={isGridView ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-2"}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Card key={n} className={isGridView ? "overflow-hidden" : "p-4"}>
              <div className={isGridView ? "aspect-[9/16] bg-gray-100 animate-pulse" : "h-16 bg-gray-100 animate-pulse"} />
            </Card>
          ))}
        </div>
      ) : isGridView ? (
        // 网格视图
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSortedVideos.map(video => (
            <Card key={video.id} className="overflow-hidden">
              <div className="aspect-[9/16] relative">
                {video.thumbnailUrl ? (
                  <img 
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={video.ossUrl}
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <Link 
                    href={`/dashboard/videos/${encodeURIComponent(video.id)}`}
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
                    href={`/dashboard/videos/${encodeURIComponent(video.id)}`}
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

      {!loading && filteredAndSortedVideos.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          没有找到符合条件的视频
        </div>
      )}
    </div>
  )
}
