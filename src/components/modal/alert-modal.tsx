'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { LoadingButton } from '@/components/ui/loading-button';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
}

export function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Continue'
}: AlertModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Modal title={title} description={description} isOpen={isOpen} onClose={onClose}>
      <div className='flex w-full items-center justify-end space-x-2 pt-6'>
        <Button variant='outline' onClick={onClose}>
          Cancel
        </Button>
        <LoadingButton loading={loading} type='button' variant='destructive' onClick={onConfirm}>
          {confirmLabel}
        </LoadingButton>
      </div>
    </Modal>
  );
}
