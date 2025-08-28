import { Task } from '@/types/task';
import { fakeTasks } from '@/lib/adapters/database-adapter';
import { searchParamsCache } from '@/lib/searchparams';
import { TaskTable } from './task-tables';
import { columns } from './task-tables/columns';

type TaskListingPageProps = {};

export default async function TaskListingPage({}: TaskListingPageProps) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('title');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(status && { status })
  };

  const data = await fakeTasks.getTasks(filters);
  const totalTasks = data.total_tasks;
  const tasks: Task[] = data.tasks;

  return <TaskTable data={tasks} totalItems={totalTasks} columns={columns} />;
}
