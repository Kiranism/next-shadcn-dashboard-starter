import { Product } from "../../models/product";
import { mongooseConnect } from "../../lib/mongoose";

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
    const { title, desc, price, images, selectCategory, properties } = req.body;
    const productDoc = await Product.create({
      title,
      desc,
      price,
      images,
      selectCategory,
      properties,
    });
    res.json(productDoc);
  }
  if (method === "PUT") {
    const { title, desc, price, images, selectCategory, properties, _id } =
      req.body;
    await Product.updateOne(
      { _id },
      { title, desc, price, images, selectCategory, properties },
    );
    res.json(true);
  }
  if (method === "DELETE") {
    if (req.query?.id) {
      await Product.deleteOne({ _id: req.query?.id });
      res.json(true);
    }
  }
}
