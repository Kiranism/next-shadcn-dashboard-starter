import type { CollectionConfig } from 'payload';
import type { VectorField } from '@/types/payload-vector';

const KnowledgeBase: CollectionConfig = {
  slug: 'knowledge-base',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt']
  },
  access: {
    read: () => true
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true
    },
    {
      name: 'content',
      type: 'richText',
      required: true
    },
    // Vector field for RAG
    {
      name: 'embedding',
      type: 'vector',
      dimension: 1536,
      index: true,
      adapter: 'openai'
    } as VectorField
  ]
};

export default KnowledgeBase;
