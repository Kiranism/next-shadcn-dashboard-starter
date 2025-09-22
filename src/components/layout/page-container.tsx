import React from 'react';

export default function PageContainer({
  children,
  scrollable = true
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  // scrollable parameter is currently not used but kept for future compatibility
  return (
    <div className='flex flex-1 justify-start p-4 md:px-6'>
      <div className='w-full max-w-[1200px]'>{children}</div>
    </div>
  );
}
