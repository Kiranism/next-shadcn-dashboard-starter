// models/Product.js

import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  // category: { type: String, required: true },
});

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;

// import mongoose, { model, Schema, models } from "mongoose";

// const ProductSchema = new Schema(
//   {
//     name: { type: String, required: true },
//     description: { type: String },
//     price: { type: Number, required: true },
//     // imgUrl: [{ type: String }],
//     // category: { type: String },
//     // selectCategory: { type: mongoose.Types.ObjectId, ref: "Category" },
//     // properties: { type: Object },
//   },
//   {
//     timestamps: true,
//   },
// );

// export const Product = models.Product || model("Product", ProductSchema);
