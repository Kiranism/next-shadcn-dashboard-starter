'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { Product } from '@/constants/data';
import { columns } from './columns';

export default function ProductTable({
  data,
  totalData
}: {
  data: Product[];
  totalData: number;
}) {
  return <DataTable columns={columns} data={data} totalItems={totalData} />;
}
