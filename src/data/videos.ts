export interface Video {
  id: number
  title: string
  filename: string
  likes: number
  platformCategory: '抖音' | '蝉妈妈'
  productCategory: '洗面奶' | '护肤品' | '牙具'
  uploadDate: string
  duration: string
  tags: string[]
}

// 视频数据
export const videoData: Video[] = [
  {
    id: 1,
    title: '破皮都能用的无酸战痘配方',
    filename: '1.mp4',
    likes: 2345,
    platformCategory: '抖音',
    productCategory: '护肤品',
    uploadDate: '2024-12-28',
    duration: '3:45',
    tags: ['祛痘', '油痘肌', '无酸焕肤', '拯救痘痘肌', '痘印']
  },
  {
    id: 2,
    title: '这个面霜巨好用',
    filename: '2.mp4',
    likes: 1876,
    platformCategory: '蝉妈妈',
    productCategory: '洗面奶',
    uploadDate: '2024-12-28',
    duration: '2:30',
    tags: ['面霜', '护肤']
  },
  {
    id: 3,
    title: '唐三妹云南山歌',
    filename: '3.mp4',
    likes: 3421,
    platformCategory: '抖音',
    productCategory: '牙具',
    uploadDate: '2024-12-28',
    duration: '4:15',
    tags: ['唐三妹', '远嫁姑娘', '云南山歌', '贵妇膏']
  },
  {
    id: 4,
    title: '三妹给婆婆擦贵妇膏',
    filename: '4.mp4',
    likes: 5678,
    platformCategory: '蝉妈妈',
    productCategory: '护肤品',
    uploadDate: '2024-12-28',
    duration: '5:20',
    tags: ['三妹', '贵妇膏', '护肤', '素颜霜']
  },
  {
    id: 5,
    title: '李在明下跪遇难者家属',
    filename: '5.mp4',
    likes: 892,
    platformCategory: '抖音',
    productCategory: '洗面奶',
    uploadDate: '2024-12-30',
    duration: '1:45',
    tags: ['李在明', '韩国', '新闻']
  }
]

// 平台分类选项
export const platformCategories = ['全部', '抖音', '蝉妈妈']
  
// 产品分类选项
export const productCategories = ['全部', '洗面奶', '护肤品', '牙具']
