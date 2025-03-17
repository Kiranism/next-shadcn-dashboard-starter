import { notFound } from 'next/navigation';
import { ICategoryResponse } from 'types/schema/product.shema';
import getCategory from '@/app/(server)/actions/getCategory';
import CategoryForm from './category-form';

interface IProductViewPageProps {
  categoryId: string;
}

export default async function CategoryViewPage({
  categoryId
}: IProductViewPageProps) {
  let category: ICategoryResponse | undefined;
  let pageTitle = 'Create New Category';

  if (categoryId !== 'new') {
    const data = await getCategory(categoryId);
    // product = data.product as Product;
    if (!data.ok) {
      console.error('[CategoryViewPage] Failed to get category >', data.error);
      notFound();
    }

    pageTitle = `Edit Category`;
    category = data.data;
  }

  return <CategoryForm initialData={category?.payload} pageTitle={pageTitle} />;
}
