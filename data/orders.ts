import { supabase } from '../lib/supabaseClient';
import { Order } from '../types/order';

export const getOrders = async (
  offset: number,
  pageLimit: number,
  searchTerm: string
): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .range(offset, offset + pageLimit);
  if (error) {
    throw new Error(error.message);
  }
  return data as Order[];
};

export const getOrder = async (id: number): Promise<Order | null> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  console.log('order ==>', data);
  return data as Order;
};

export const createOrder = async (order: Omit<Order, 'id'>): Promise<void> => {
  const { error } = await supabase.from('orders').insert([order]);
  if (error) {
    throw new Error(error.message);
  }
};

export const updateOrder = async (
  id: number,
  updatedOrder: Omit<Order, 'id'>
): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update(updatedOrder)
    .eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
};

export const deleteOrder = async (id: number): Promise<void> => {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
};
