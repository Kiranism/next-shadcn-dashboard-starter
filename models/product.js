import mongoose, { model, Schema, models } from "mongoose";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    desc: { type: String },
    price: { type: Number, required: true },
    images: [{ type: String }],
    // selectCategory: { type: mongoose.Types.ObjectId, ref: "Category" },
    // properties: { type: Object },
  },
  {
    timestamps: true,
  },
);

export const Product = models.Product || model("Product", ProductSchema);
