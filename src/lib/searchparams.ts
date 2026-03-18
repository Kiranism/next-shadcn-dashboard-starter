import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString
} from 'nuqs/server';

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  search: parseAsString,
  name: parseAsString,
  gender: parseAsString,
  category: parseAsString,
  // trip filters
  status: parseAsString,
  driver_id: parseAsString,
  payer_id: parseAsString,
  billing_type_id: parseAsString,
  scheduled_at: parseAsString, // for date filtering
  sort: parseAsString,
  view: parseAsString.withDefault('list')
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
