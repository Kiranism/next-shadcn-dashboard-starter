// data/products.ts
import { supabase } from '../lib/supabaseClient';
import { Product } from '../types/product';

export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    throw new Error(error.message);
  }
  return data as Product[];
};

export const getProduct = async (id: number): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data as Product;
};

export const createProduct = async (product: Product): Promise<void> => {
  const { error } = await supabase.from('products').insert([
    {
      name: product.name,
      cogs: product.cogs,
      selling_price: product.selling_price,
      stock_qty: product.stock_qty,
      vendor: product.vendor
    }
  ]);
  if (error) {
    throw new Error(error.message);
  }
};

export const updateProduct = async (
  id: number,
  updatedProduct: Product
): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .update({
      name: updatedProduct.name,
      cogs: updatedProduct.cogs,
      selling_price: updatedProduct.selling_price,
      stock_qty: updatedProduct.stock_qty,
      vendor: updatedProduct.vendor
    })
    .eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
};

export const deleteProduct = async (id: number): Promise<void> => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
};
