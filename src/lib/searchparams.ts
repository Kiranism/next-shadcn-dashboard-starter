import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString
} from 'nuqs/server';

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  name: parseAsString,
  gender: parseAsString,
  category: parseAsString,
  search: parseAsString, // 添加通用搜索参数
  // Task search params
  title: parseAsString,
  status: parseAsString,
  priority: parseAsString,
  projectName: parseAsString,
  // Ticket search params
  submitter: parseAsString,
  assignedTo: parseAsString,
  tags: parseAsString,
  email: parseAsString,
  nickname: parseAsString,
  walletAddress: parseAsString,
  subject: parseAsString,
  // Submission search params
  submissionContent: parseAsString,
  taskTitle: parseAsString,
  reviewStatus: parseAsString,
  taskId: parseAsString,
  userId: parseAsString,
  reviewedBy: parseAsString
  // advanced filter
  // filters: getFiltersStateParser().withDefault([]),
  // joinOperator: parseAsStringEnum(['and', 'or']).withDefault('and')
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
