import { TaskSubmission } from '@/types/submission';
import { submissionAdapter } from '@/lib/adapters/database-adapter';
import { searchParamsCache } from '@/lib/searchparams';
import { SubmissionTable } from './submission-tables';
import { columns } from './submission-tables/columns';

type SubmissionListingPageProps = {};

export default async function SubmissionListingPage({}: SubmissionListingPageProps) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search =
    searchParamsCache.get('submissionContent') ||
    searchParamsCache.get('taskTitle') ||
    searchParamsCache.get('search');
  const pageLimit = searchParamsCache.get('perPage');
  const reviewStatus = searchParamsCache.get('reviewStatus');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search: search.toString() }), // 确保 search 是 string 类型
    ...(reviewStatus && { reviewStatus })
  };

  const data = await submissionAdapter.getSubmissions(filters);
  const totalSubmissions = data.total_submissions;
  const submissions: TaskSubmission[] = data.submissions;

  return (
    <SubmissionTable
      data={submissions}
      totalItems={totalSubmissions}
      columns={columns}
    />
  );
}
