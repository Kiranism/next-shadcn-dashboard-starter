// // pages/api/products/create-product.js

// import { mongooseConnect } from "../../../lib/mongoose";
// import { Product } from "../../../models/product";

// export default async function handler(req, res) {
//   const { method } = req;

//   await mongooseConnect();

//   switch (method) {
//     case "POST":
//       try {
//         const product = await Product.create(req.body);
//         return res.status(201).json({ success: true, data: product });
//       } catch (error) {
//         return res.status(400).json({ success: false, error: error.message });
//       }
//     case "PUT":
//       try {
//         const { id } = req.query;
//         const product = await Product.findByIdAndUpdate(id, req.body, {
//           new: true,
//           runValidators: true,
//         });
//         if (!product) {
//           return res
//             .status(404)
//             .json({ success: false, error: "Product not found" });
//         }
//         return res.status(200).json({ success: true, data: product });
//       } catch (error) {
//         return res.status(400).json({ success: false, error: error.message });
//       }
//     default:
//       return res
//         .status(405)
//         .json({ success: false, error: "Method Not Allowed" });
//   }
// }

// import { Product } from "../../../models/product";
// import { mongooseConnect } from "../../../lib/mongoose";

// export default async function handle(req, res) {
//   const { method } = req;
//   await mongooseConnect();

//   if (method === "GET") {
//     if (req.query?.id) {
//       res.json(await Product.findOne({ _id: req.query.id }));
//     } else {
//       res.json(await Product.find());
//     }
//   }

//   if (method === "POST") {
//     console.log("before post method");
//     const { name, description, price } = req.body;
//     const productDoc = await Product.create({
//       name,
//       description,
//       price,
//       // imgUrl,
//       // category,
//     });
//     console.log("productDoc", res.json(productDoc));
//     res.json(productDoc);
//   }
//   if (method === "PUT") {
//     const { name, description, price, _id } = req.body;
//     await Product.updateOne({ _id }, { name, description, price });
//     res.json(true);
//   }
//   if (method === "DELETE") {
//     if (req.query?.id) {
//       await Product.deleteOne({ _id: req.query?.id });
//       res.json(true);
//     }
//   }
// }

// import { Product } from "../../../models/product";
// import { mongooseConnect } from "../../../lib/mongoose";

// export default async function handler(req, res) {
//   const { method } = req;

//   await mongooseConnect();

//   switch (method) {
//     case "POST":
//       try {
//         const product = await Product.create(req?.body);
//         console.log(product, "productproductproductproductproduct");
//         return res.status(201).json({ success: true, data: product });
//       } catch (error) {
//         console.log("errorerrorerrorerrorerrorerrorerror");
//         return res.status(400).json({ success: false, error: error.message });
//       }
//     case "PUT":
//       try {
//         const { id } = req.query;
//         const product = await Product.findByIdAndUpdate(id, req.body, {
//           new: true,
//           runValidators: true,
//         });
//         if (!product) {
//           return res
//             .status(404)
//             .json({ success: false, error: "Product not found" });
//         }
//         return res.status(200).json({ success: true, data: product });
//       } catch (error) {
//         return res.status(400).json({ success: false, error: error.message });
//       }
//     default:
//       return res
//         .status(405)
//         .json({ success: false, error: "Method Not Allowed" });
//   }
// }

// pages/api/products/create-product.js

// pages/api/products/create-product.js

import dbConnect from "../../../utils/dbConnect";
import Product from "../../../models/Product";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      // Connect to MongoDB
      await dbConnect();

      // Extract product data from the request body
      const { name, description, price, category } = req.body;

      // Create a new product instance
      const newProduct = new Product({
        name,
        description,
        price,
        category,
      });

      // Save the product to the database
      const savedProduct = await newProduct.save();

      res.status(201).json({ success: true, data: savedProduct });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: "Method Not Allowed" });
  }
}
