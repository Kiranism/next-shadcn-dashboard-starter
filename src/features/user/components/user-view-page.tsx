import { notFound } from 'next/navigation';
import {
  IBrandListResponse,
  ICategoryListResponse
} from 'types/schema/product.shema';
import { IUserResponse } from 'types/schema/user.schema';
import getUser from '@/app/(server)/actions/getUser';

interface IUserViewPageProps {
  userId: string;
  brands?: IBrandListResponse;
  categories?: ICategoryListResponse;
}

export default async function UserViewPage({
  userId,
  brands,
  categories
}: IUserViewPageProps) {
  let user: IUserResponse | undefined;
  let pageTitle = 'Create New User';

  if (userId !== 'new') {
    const data = await getUser(userId);
    // product = data.product as Product;
    if (!data.ok) {
      console.error('[UserViewPage] Failed to get user >', data.error);
      notFound();
    }

    pageTitle = `Edit User`;
    user = data.data;
  }

  return (
    // <UserForm
    //   initialData={user?.payload}
    //   pageTitle={pageTitle}
    //   categories={categories?.payload ?? []}
    //   brands={brands?.payload ?? []}
    // />
    <>WIP</>
  );
}
