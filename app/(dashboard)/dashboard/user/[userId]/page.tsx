import { ProductForm } from "@/components/forms/product-form";
import React from "react";

export default function Page() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <ProductForm categories={[]} initialData={[]} key={null} />
    </div>
  );
}
