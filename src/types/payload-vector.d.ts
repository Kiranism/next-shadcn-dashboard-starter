import type { Field } from 'payload';

declare module 'payload' {
  interface VectorField extends Omit<Field, 'type'> {
    type: 'vector';
    dimension: number;
    index?: boolean;
    adapter?: string;
  }
}

export type VectorField = {
  name: string;
  type: 'vector';
  dimension: number;
  index?: boolean;
  adapter?: string;
};
