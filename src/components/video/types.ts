export interface Video {
  id: number
  url: string
  duration: number
  startTime: number
  script: string
  title: string
  lastModified: Date
  size: number
  likes: number
  platformCategory: string
  productCategory: string
}

export interface VideoCardProps {
  videoUrl: string
  duration: number
  startTime: number
  script: string
  similarVideos: string[]
  onDistribute: () => void
  videoId: string | number
}

export interface MockProduct {
  id: number
  name: string
  category: string
}

export interface MockData {
  id: number
  title: string
  description: string
  date: string
}

export interface MockUser {
  id: string
  name: string
  avatar: string
}

export interface VideoTask {
  id: string
  sourceVideoId: string | number
  videoUrl: string
  duration: number
  startTime: number
  script: string
  status: string
  createdAt: string
}
