import { Product } from "../../../models/product";
import { mongooseConnect } from "../../../lib/mongoose";

export default async function handle(req, res) {
  const { method } = req;
  await mongooseConnect();

  if (method === "GET") {
    if (req.query?.id) {
      res.json(await Product.findOne({ _id: req.query.id }));
    } else {
      res.json(await Product.find());
    }
  }

  if (method === "POST") {
    console.log("before post method");
    const { name, description, price } = req.body;
    const productDoc = await Product.create({
      name,
      description,
      price,
      // imgUrl,
      // category,
    });
    console.log("productDoc", res.json(productDoc));
    res.json(productDoc);
  }
  if (method === "PUT") {
    const { name, description, price, _id } = req.body;
    await Product.updateOne({ _id }, { name, description, price });
    res.json(true);
  }
  if (method === "DELETE") {
    if (req.query?.id) {
      await Product.deleteOne({ _id: req.query?.id });
      res.json(true);
    }
  }
}
