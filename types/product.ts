// types/Product.ts
export interface Product {
  id: number;
  name: string;
  cogs: number;
  selling_price: number;
  stock_qty: number; // New field
  vendor: string; // New field
}
