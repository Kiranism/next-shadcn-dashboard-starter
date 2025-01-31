export interface Video {
  id: number;
  title: string;
  description: string;
  filename: string;
  ossKey: string;  // OSS中的对象键名
  uploadDate: string;
  duration: string;
  tags: string[];
}
