import { MockProduct, MockData } from './types';

export const mockProducts: MockProduct[] = [
  { id: 1, name: '智能手表', category: '智能穿戴' },
  { id: 2, name: '无线耳机', category: '音频设备' },
  { id: 3, name: '智能音箱', category: '智能家居' },
  { id: 4, name: '平板电脑', category: '移动设备' },
  { id: 5, name: '智能手环', category: '智能穿戴' },
];

export const mockData: MockData[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `示例内容 ${i + 1}`,
  description: `这是第 ${i + 1} 条示例内容的详细描述，可以包含一些具体的信息。`,
  date: `2024-01-${String(i + 1).padStart(2, '0')}`
}));
