import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;

export type Row<T extends TableName> = Tables[T]['Row'];
export type Insert<T extends TableName> = Tables[T]['Insert'];
export type Update<T extends TableName> = Tables[T]['Update'];

/**
 * A generic factory to create Supabase services for any table.
 * This ensures consistency across all feature api layers.
 */
export const createService = <T extends TableName>(tableName: T) => {
  return {
    async getAll() {
      const supabase = createClient();
      const { data, error } = await supabase.from(tableName).select('*');

      if (error) throw error;
      return data as Row<T>[];
    },

    async getById(id: string) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Row<T>;
    },

    async create(item: Insert<T>) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(tableName as any)
        .insert(item as any)
        .select()
        .single();

      if (error) throw error;
      return data as Row<T>;
    },

    async update(id: string, item: Update<T>) {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(tableName as any)
        .update(item as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Row<T>;
    },

    async delete(id: string) {
      const supabase = createClient();
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  };
};
