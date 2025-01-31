import OSS from 'ali-oss';
import { ossConfig } from './oss.config';

export interface OSSVideo {
  id: string;
  name: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  lastModified: Date;
  size: number;
  platformCategory: string;
  productCategory: string;
  likes: number;
}

export class OSSClient {
  private static instance: OSS | null = null;

  public static getInstance(): OSS {
    if (!this.instance) {
      if (!ossConfig.accessKeyId || !ossConfig.accessKeySecret || !ossConfig.bucket || !ossConfig.region) {
        throw new Error('OSS配置不完整，请检查环境变量');
      }

      this.instance = new OSS({
        region: ossConfig.region,
        accessKeyId: ossConfig.accessKeyId,
        accessKeySecret: ossConfig.accessKeySecret,
        bucket: ossConfig.bucket,
        secure: true,
        timeout: 60000,
        internal: false,
        cname: false,
        
      });
    }
    return this.instance;
  }

  private static parseVideoInfo(filename: string): { title: string; platformCategory: string; productCategory: string } {
    // 从文件名解析视频信息
    const parts = filename.split('_');
    if (parts.length >= 3) {
      return {
        title: parts[0],
        platformCategory: parts[1] || '抖音',
        productCategory: parts[2].replace('.mp4', '') || '护肤品'
      };
    }
    return {
      title: filename.replace('.mp4', ''),
      platformCategory: '抖音',
      productCategory: '护肤品'
    };
  }

  static async listVideos(prefix: string = 'test/'): Promise<OSSVideo[]> {
    try {
      const client = this.getInstance();
      const result = await client.list(
        {
          prefix,
          'max-keys': 100,
          delimiter: '/'
        },
        {} // 空对象
      );
      console.log(result); // 处理结果

      // 过滤掉非视频文件和空文件
      const videoObjects = result.objects?.filter(obj => 
        obj.name.toLowerCase().endsWith('.mp4') && 
        obj.size > 0 &&
        !obj.name.startsWith('.')  // 排除隐藏文件
      ) || [];

      return await Promise.all(
        videoObjects.map(async (obj) => {
          const url = await this.getSignedUrl(obj.name);
          const thumbnailUrl = await this.getSignedUrl(obj.name.replace('.mp4', '.jpg'));
          const { title, platformCategory, productCategory } = this.parseVideoInfo(obj.name);
          
          return {
            id: obj.name,  // 使用文件名作为唯一标识符
            name: obj.name,
            title: title,
            url: url,
            thumbnailUrl: thumbnailUrl,
            lastModified: new Date(obj.lastModified),
            size: obj.size,
            platformCategory: platformCategory,
            productCategory: productCategory,
            likes: Math.floor(Math.random() * 1000) + 100  // 示例数据
          };
        })
      );
    } catch (error) {
      console.error('获取视频列表失败:', error);
      throw error;
    }
  }

  static async getSignedUrl(objectName: string): Promise<string> {
    try {
      const client = this.getInstance();
      return client.signatureUrl(objectName, { 
        expires: 3600,
        process: objectName.endsWith('.jpg') ? 'style/thumbnail' : undefined 
      });
    } catch (error) {
      console.error('获取签名URL失败:', error);
      throw error;
    }
  }
}
