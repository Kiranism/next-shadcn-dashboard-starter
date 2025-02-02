'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ThumbsUp, ChevronDown, LayoutGrid, LayoutList, Search, Heart, Share2, MessageCircle, Play, ShoppingCart, DollarSign, BarChart, Clock, Calendar } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getVideoList, Video, platformCategories, productCategories } from '@/data/videos'
import { toast } from 'sonner'

export default function VideosPage() {
  const router = useRouter()
  const [selectedPlatform, setSelectedPlatform] = useState<string>('全部')
  const [selectedProduct, setSelectedProduct] = useState<string>('全部')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortType, setSortType] = useState<'default' | 'sales' | 'revenue' | 'conversion' | 'likes' | 'date'>('default')
  const [isGridView, setIsGridView] = useState(true)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

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
      (selectedProduct === '全部' || video.productCategory === selectedProduct) &&
      (searchQuery === '' || video.title.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortType) {
        case 'sales':
          return b.sales - a.sales
        case 'revenue':
          return b.revenue - a.revenue
        case 'conversion':
          return b.conversionRate - a.conversionRate
        case 'likes':
          return b.likes - a.likes
        case 'date':
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        default:
          return 0
      }
    })

  return (
    <div className="p-0 space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100">
      <div className="flex justify-between items-center sticky top-0 bg-background z-10 p-6 border-b">
        <div className="grid grid-cols-12 gap-6 w-full">
          {/* 左侧分类筛选和搜索 */}
          <div className="col-span-8 flex gap-6">
            {/* 平台分类下拉菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[160px] justify-between">
                  {selectedPlatform ===  '全部' ? '数据来源' : selectedPlatform}
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
                <Button variant="outline" className="w-[160px] justify-between">
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

            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索视频标题..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* 右侧功能按钮 */}
          <div className="col-span-4 flex justify-end gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsGridView(!isGridView)}
              className="w-10 h-10 shrink-0"
            >
              {isGridView ? (
                <LayoutGrid className="h-4 w-4" />
              ) : (
                <LayoutList className="h-4 w-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[150px] justify-between shrink-0"
                >
                  {sortType === 'default' && '默认排序'}
                  {sortType === 'sales' && '按销量排序'}
                  {sortType === 'revenue' && '按销售额排序'}
                  {sortType === 'conversion' && '按转化率排序'}
                  {sortType === 'likes' && '按点赞数排序'}
                  {sortType === 'date' && '按发布时间排序'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortType('default')}>
                  默认排序
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortType('sales')}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  按销量排序
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortType('revenue')}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  按销售额排序
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortType('conversion')}>
                  <BarChart className="mr-2 h-4 w-4" />
                  按转化率排序
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortType('likes')}>
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  按点赞数排序
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortType('date')}>
                  <Clock className="mr-2 h-4 w-4" />
                  按发布时间排序
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {loading ? (
        // 加载状态
        <div className="px-6">
          <div className={isGridView ? "grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6" : "space-y-4"}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Card key={n} className={isGridView ? "overflow-hidden" : "p-4"}>
                <div className={isGridView ? "aspect-square bg-gray-100 animate-pulse" : "h-16 bg-gray-100 animate-pulse"} />
              </Card>
            ))}
          </div>
        </div>
      ) : isGridView ? (
        // 网格视图
        <div className="px-6">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredAndSortedVideos.map(video => (
              <Card 
                key={video.id} 
                className="overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="aspect-square relative">
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
                      onLoadedMetadata={(e) => {
                        const videoEl = e.target as HTMLVideoElement;
                        const minutes = Math.floor(videoEl.duration / 60);
                        const seconds = Math.floor(videoEl.duration % 60);
                        const duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        setVideos(prev => prev.map(v => 
                          v.id === video.id 
                            ? { ...v, duration } 
                            : v
                        ));
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 p-3">
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="text-white font-medium text-sm line-clamp-2 mb-2">
                        {video.title}
                      </div>
                      <div className="flex items-center gap-3 text-white/90 text-xs">
                        <div className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          <span>{video.views.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          <span>{video.likes.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-blue-100 rounded-full text-xs">
                        {video.platformCategory}
                      </span>
                      <span className="px-1.5 py-0.5 bg-green-100 rounded-full text-xs">
                        {video.productCategory}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{video.uploadDate}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>时长：{video.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      <span>销量：{video.sales.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span>销售额：{video.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart className="h-3 w-3" />
                      <span>转化率：{video.conversionRate}%</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        // 列表视图
        <div className="px-6">
          <div className="space-y-4">
            {filteredAndSortedVideos.map(video => (
              <Card 
                key={video.id} 
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="flex gap-4">
                  <div className="aspect-square w-40 relative flex-shrink-0">
                    {video.thumbnailUrl ? (
                      <img 
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={video.ossUrl}
                        className="w-full h-full object-cover rounded-lg"
                        preload="metadata"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium mb-2">{video.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                      <span className="px-2 py-1 bg-blue-100 rounded-full">{video.platformCategory}</span>
                      <span className="px-2 py-1 bg-green-100 rounded-full">{video.productCategory}</span>
                      <span>{video.duration}</span>
                      <span>{video.uploadDate}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Play className="h-4 w-4" />
                        <span>{video.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{video.likes.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Heart className="h-4 w-4" />
                        <span>{video.favorites.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <ShoppingCart className="h-4 w-4" />
                        <span>{video.sales.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!loading && filteredAndSortedVideos.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          没有找到符合条件的视频
        </div>
      )}

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="aspect-[9/16] relative">
                <video
                  src={selectedVideo?.ossUrl}
                  className="w-full h-full object-contain rounded-lg bg-black"
                  controls
                  onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement;
                    const minutes = Math.floor(video.duration / 60);
                    const seconds = Math.floor(video.duration % 60);
                    const duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    if (selectedVideo) {
                      setVideos(prev => prev.map(v => 
                        v.id === selectedVideo.id 
                          ? { ...v, duration } 
                          : v
                      ));
                    }
                  }}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {selectedVideo?.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-accent rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">视频数据</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Play className="h-4 w-4 text-blue-500" />
                      <div className="space-y-0.5">
                        <div className="text-muted-foreground">播放量</div>
                        <div className="font-medium">{selectedVideo?.views.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <ThumbsUp className="h-4 w-4 text-blue-500" />
                      <div className="space-y-0.5">
                        <div className="text-muted-foreground">点赞数</div>
                        <div className="font-medium">{selectedVideo?.likes.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Heart className="h-4 w-4 text-red-500" />
                      <div className="space-y-0.5">
                        <div className="text-muted-foreground">收藏数</div>
                        <div className="font-medium">{selectedVideo?.favorites.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Share2 className="h-4 w-4 text-green-500" />
                      <div className="space-y-0.5">
                        <div className="text-muted-foreground">转发数</div>
                        <div className="font-medium">{selectedVideo?.shares.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="h-4 w-4 text-orange-500" />
                      <div className="space-y-0.5">
                        <div className="text-muted-foreground">评论数</div>
                        <div className="font-medium">{selectedVideo?.comments.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <ShoppingCart className="h-4 w-4 text-purple-500" />
                      <div className="space-y-0.5">
                        <div className="text-muted-foreground">销量</div>
                        <div className="font-medium">{selectedVideo?.sales.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-yellow-500" />
                      <div className="space-y-0.5">
                        <div className="text-muted-foreground">销售额</div>
                        <div className="font-medium">¥{selectedVideo?.revenue.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BarChart className="h-4 w-4 text-indigo-500" />
                      <div className="space-y-0.5">
                        <div className="text-muted-foreground">转化率</div>
                        <div className="font-medium">{selectedVideo?.conversionRate}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">发布时间：</span>
                  <span>{selectedVideo?.uploadDate}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">时长：</span>
                  <span>{selectedVideo?.duration}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">平台：</span>
                  <span>{selectedVideo?.platformCategory}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">产品：</span>
                  <span>{selectedVideo?.productCategory}</span>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => {
                  if (selectedVideo) {
                    router.push(`/dashboard/videos/${encodeURIComponent(selectedVideo.id)}`)
                  }
                }}
              >
                开始创作
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
