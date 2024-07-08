// types/Order.ts
export interface Order {
  id: number;
  customer_name: string;
  phone_number: string;
  address: string;
  city: string;
  status: string;
  handling_cost: number;
  shipping_cost: number;
  total: number;
  cogs: number;
  gross_profit: number;
  shipping_company: string;
  agent: string;
  product_link: string;
  product_name: string;
  quantity: number;
}
