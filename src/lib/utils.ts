import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: 'accurate' | 'normal';
  } = {}
) {
  const { decimals = 0, sizeType = 'normal' } = opts;

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const accurateSizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === 'accurate'
      ? (accurateSizes[i] ?? 'Bytest')
      : (sizes[i] ?? 'Bytes')
  }`;
}

export function withPrecision({
  num,
  precision = 2
}: {
  num: number;
  precision?: number;
}) {
  if (precision < 1) precision = 1;
  const shift = Math.pow(10, precision);

  return (Math.round(num * shift) / shift).toFixed(precision);
}

export function toCapCase(str: string) {
  const words = str.trim().split(' ');
  const capitalizedWords = words.map((item) => {
    if (item.length < 1) return item;
    return item.charAt(0).toUpperCase().concat(item.substring(1));
  });

  return capitalizedWords.join(' ');
}

export function toHTTPSString(link?: string) {
  if (!link) return '#';

  if (!link.startsWith('http')) return `https://${link}`;
  return link.replace('http:', 'https:');
}
