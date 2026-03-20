import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const docsDirectory = path.join(process.cwd(), 'docs');

export interface DocMetadata {
  title: string;
  description?: string;
  icon?: string;
  category?: string;
  order?: number;
}

export interface DocContent extends DocMetadata {
  slug: string;
  content: string;
}

export interface DocToc {
  level: number;
  text: string;
  id: string;
}

export function getDocSlugs() {
  return fs.readdirSync(docsDirectory).filter((file) => file.endsWith('.md'));
}

export function getDocBySlug(slug: string): DocContent {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = path.join(docsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug: realSlug,
    content,
    title:
      data.title ||
      realSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    ...data
  } as DocContent;
}

export function getAllDocs(): DocContent[] {
  const slugs = getDocSlugs();
  const docs = slugs
    .map((slug) => getDocBySlug(slug))
    .sort((doc1, doc2) => (doc1.order || 99) - (doc2.order || 99));
  return docs;
}

export function getDocsByCategory() {
  const docs = getAllDocs();
  const categories: Record<string, DocContent[]> = {};

  docs.forEach((doc) => {
    const category = doc.category || 'Allgemein';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(doc);
  });

  return categories;
}
export function getDocSearchData() {
  const docs = getAllDocs();
  return docs.map((doc) => ({
    id: `${doc.slug}DocAction`,
    name: doc.title,
    section: 'Dokumentation',
    keywords: `${doc.title.toLowerCase()} ${doc.category?.toLowerCase() || ''} help doku`,
    subtitle: doc.description || `Dokumentation: ${doc.title}`,
    url: `/dashboard/documentation/${doc.slug}`
  }));
}
export function getDocToc(content: string): DocToc[] {
  const headings: DocToc[] = [];
  const lines = content.split('\n');

  lines.forEach((line) => {
    const match = line.match(/^(#{1,2})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
      headings.push({ level, text, id });
    }
  });

  return headings;
}
