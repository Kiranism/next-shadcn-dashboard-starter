'use server';

import { IUserResponse } from 'types/schema/user.schema';
import requestAPI from './request-api.action';

export default async function getUser(id: string) {
  const user = await requestAPI<IUserResponse>({
    endpoint: ['user', id].join('/'),
    method: 'GET',
    authenticate: true
  });

  return user;
}
