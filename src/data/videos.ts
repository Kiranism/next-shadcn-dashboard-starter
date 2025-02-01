import { OSSClient, OSSVideo } from '@/lib/oss'

export interface Video {
  [x: string]: any
  id: string
  title: string
  filename: string
  ossKey: string
  ossUrl: string
  likes: number
  favorites: number
  shares: number
  comments: number
  views: number
  sales: number
  revenue: number
  conversionRate: number
  platformCategory: '抖音' | '蝉妈妈'
  productCategory: '洗面奶' | '护肤品' | '牙具'
  uploadDate: string
  duration: string
  tags: string[]
}

// 从OSS获取视频列表
export async function getVideoList(): Promise<Video[]> {
  try {
    const ossVideos = await OSSClient.listVideos();
    
    // 将OSS视频转换为应用所需的格式
    return ossVideos.map((ossVideo) => {
      const filename = ossVideo.name.split('/').pop() || '';
      const title = filename.split('.')[0] || '未命名视频';
      
      return {
        id: ossVideo.name,
        title,
        filename,
        ossKey: ossVideo.name,
        ossUrl: ossVideo.url,
        // Mock其他数据
        likes: Math.floor(Math.random() * 50000),
        favorites: Math.floor(Math.random() * 10000),
        shares: Math.floor(Math.random() * 5000),
        comments: Math.floor(Math.random() * 2000),
        views: Math.floor(Math.random() * 300000),
        sales: Math.floor(Math.random() * 5000),
        revenue: Math.floor(Math.random() * 400000),
        conversionRate: Number((Math.random() * 5).toFixed(1)),
        platformCategory: Math.random() > 0.5 ? '抖音' : '蝉妈妈',
        productCategory: Math.random() > 0.66 ? '洗面奶' : Math.random() > 0.5 ? '护肤品' : '牙具',
        uploadDate: ossVideo.lastModified.toISOString().split('T')[0],
        duration: ossVideo.duration || '00:00', // 使用OSS视频的时长
        tags: ['产品展示', '使用教程'].sort(() => Math.random() - 0.5).slice(0, Math.random() > 0.5 ? 2 : 1)
      };
    });
  } catch (error) {
    console.error('获取视频列表失败:', error);
    return []; 
  }
}

// 平台分类选项
export const platformCategories = ['全部', '抖音', '蝉妈妈']
  
// 产品分类选项
export const productCategories = ['全部', '洗面奶', '护肤品', '牙具']
