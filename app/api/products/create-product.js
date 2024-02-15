// pages/api/products/create-product.js

import { mongooseConnect } from "../../../lib/mongoose";
import { Product } from "../../../models/product";

export default async function handler(req, res) {
  const { method } = req;

  await mongooseConnect();

  switch (method) {
    case "POST":
      try {
        const product = await Product.create(req.body);
        return res.status(201).json({ success: true, data: product });
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
      }
    case "PUT":
      try {
        const { id } = req.query;
        const product = await Product.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        });
        if (!product) {
          return res
            .status(404)
            .json({ success: false, error: "Product not found" });
        }
        return res.status(200).json({ success: true, data: product });
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
      }
    default:
      return res
        .status(405)
        .json({ success: false, error: "Method Not Allowed" });
  }
}
