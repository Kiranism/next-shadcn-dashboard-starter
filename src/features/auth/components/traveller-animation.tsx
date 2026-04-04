'use client';

import { cn } from '@/lib/utils';
import Lottie from 'lottie-react';

import travellerAnimation from '../../../../public/traveller.json';

interface TravellerAnimationProps {
  className?: string;
}

export function TravellerAnimation({ className }: TravellerAnimationProps) {
  return (
    <div className={cn('relative w-full max-w-[28rem]', className)}>
      <div className='absolute inset-0 rounded-[2rem] bg-primary/10 blur-3xl' />
      {/* <div className='relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 p-4 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-card/70'> */}
        <Lottie
          animationData={travellerAnimation}
          loop
          autoplay
          className='h-full w-full'
          aria-label='Traveller animation'
        />
      {/* </div> */}
    </div>
  );
}