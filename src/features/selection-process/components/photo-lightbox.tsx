'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Icons } from '@/components/icons';

interface PhotoLightboxProps {
  src: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhotoLightbox({ src, alt, open, onOpenChange }: PhotoLightboxProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-[60] bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
        <DialogPrimitive.Content
          className='fixed inset-0 z-[60] flex items-center justify-center p-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          onClick={() => onOpenChange(false)}
        >
          <DialogPrimitive.Title className='sr-only'>{alt}</DialogPrimitive.Title>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className='max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          />
          <DialogPrimitive.Close className='absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors'>
            <Icons.close className='size-5' />
            <span className='sr-only'>Fechar</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
