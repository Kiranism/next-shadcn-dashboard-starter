import { Metadata } from 'next';
import TodoList from './TodoList';
import TodoForm from './TodoForm';

export const metadata: Metadata = {
  title: 'Todos | JSON Placeholder',
  description: 'Example todos page using React Query and JSON Placeholder API'
};

export default function TodosPage() {
  return (
    <div className='container mx-auto py-8'>
      <h1 className='mb-6 text-3xl font-bold'>Todos</h1>
      <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <TodoList />
        </div>
        <div>
          <TodoForm />
        </div>
      </div>
    </div>
  );
}
