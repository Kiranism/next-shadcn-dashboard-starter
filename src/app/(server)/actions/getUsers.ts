'use server';

import requestAPI from './request-api.action';
import { IUserListResponse } from 'types/schema/user.schema';

interface FilterProps {
  page?: number;
  limit?: number;
  search?: string;
}

export default async function getUsers({
  page = 1,
  limit = 10,
  search = ''
}: FilterProps) {
  return await requestAPI<IUserListResponse>({
    endpoint: 'user',
    method: 'GET',
    authenticate: true,
    query: [
      ['page', `${page}`],
      ['limit', `${limit}`],
      ['userName', search]
    ]
  });
}
