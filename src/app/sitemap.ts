import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://shadcn-dashboard.kiranism.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/about', '/privacy-policy', '/terms-of-service'].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date()
  }));
}
