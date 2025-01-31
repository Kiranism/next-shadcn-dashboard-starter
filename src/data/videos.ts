import { OSSClient, OSSVideo } from '@/lib/oss'

export interface Video {
  [x: string]: string | undefined
  id: string
  title: string
  filename: string
  ossKey: string
  ossUrl: string
  likes: number
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
        likes: 0,
        platformCategory: '抖音',
        productCategory: '护肤品',
        uploadDate: ossVideo.lastModified.toISOString().split('T')[0],
        duration: '未知',
        tags: []
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
