'use client';

import { Messenger } from './messenger';

export default function ChatViewPage() {
  return (
    <div className='flex min-h-0 flex-1 px-4 py-2 md:px-6'>
      <Messenger />
    </div>
  );
}
