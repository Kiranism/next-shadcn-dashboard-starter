'use client';

import { Messenger } from './messenger';

export default function ChatViewPage() {
  return (
    <div className='flex min-h-0 flex-1 p-4 md:p-6'>
      <Messenger />
    </div>
  );
}
