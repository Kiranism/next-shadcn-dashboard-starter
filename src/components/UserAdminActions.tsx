'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useUpdateUserAdmin } from '@/hooks/useMutation';
import {
  IconUserCheck,
  IconUserX,
  IconLock,
  IconLockOpen
} from '@tabler/icons-react';

interface UserAdminActionsProps {
  userId: string;
  userEmail: string;
  isActive: boolean;
  isRestricted?: boolean;
  onUpdate?: () => void;
  compact?: boolean; // New prop for compact display
}

export function UserAdminActions({
  userId,
  userEmail,
  isActive,
  isRestricted = false,
  onUpdate,
  compact = false
}: UserAdminActionsProps) {
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
    confirmText: string;
    confirmVariant:
      | 'default'
      | 'destructive'
      | 'outline'
      | 'secondary'
      | 'ghost'
      | 'link';
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {},
    confirmText: 'Confirm',
    confirmVariant: 'default'
  });

  const updateUserMutation = useUpdateUserAdmin({
    onSuccess: () => {
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      onUpdate?.();
    }
  });

  const handleToggleActive = () => {
    setConfirmModal({
      isOpen: true,
      title: `${isActive ? 'Deactivate' : 'Activate'} User`,
      description: `Are you sure you want to ${
        isActive ? 'deactivate' : 'activate'
      } ${userEmail}? This will ${
        isActive ? 'prevent' : 'allow'
      } them from accessing the platform.`,
      action: () => {
        updateUserMutation.mutate({
          userId,
          data: { isActive: !isActive }
        });
      },
      confirmText: isActive ? 'Deactivate' : 'Activate',
      confirmVariant: isActive ? 'destructive' : 'default'
    });
  };

  const handleToggleRestricted = () => {
    setConfirmModal({
      isOpen: true,
      title: `${isRestricted ? 'Unrestrict' : 'Restrict'} User`,
      description: `Are you sure you want to ${
        isRestricted ? 'unrestrict' : 'restrict'
      } ${userEmail}? This will ${
        isRestricted ? 'remove restrictions from' : 'add restrictions to'
      } their account.`,
      action: () => {
        updateUserMutation.mutate({
          userId,
          data: { isRestricted: !isRestricted }
        });
      },
      confirmText: isRestricted ? 'Unrestrict' : 'Restrict',
      confirmVariant: isRestricted ? 'default' : 'destructive'
    });
  };

  if (compact) {
    return (
      <>
        <div className='flex items-center gap-1'>
          {/* Status Badges */}
          <Badge
            variant={isActive ? 'default' : 'destructive'}
            className='text-xs'
          >
            {isActive ? 'Active' : 'Inactive'}
          </Badge>

          {isRestricted && (
            <Badge variant='destructive' className='text-xs'>
              Restricted
            </Badge>
          )}

          {/* Action Buttons */}
          <Button
            variant={isActive ? 'destructive' : 'default'}
            size='sm'
            onClick={handleToggleActive}
            disabled={updateUserMutation.isPending}
            className='h-6 px-2 text-xs'
          >
            {isActive ? (
              <>
                <IconUserX className='mr-1 h-3 w-3' />
                Deactivate
              </>
            ) : (
              <>
                <IconUserCheck className='mr-1 h-3 w-3' />
                Activate
              </>
            )}
          </Button>

          <Button
            variant={isRestricted ? 'default' : 'destructive'}
            size='sm'
            onClick={handleToggleRestricted}
            disabled={updateUserMutation.isPending}
            className='h-6 px-2 text-xs'
          >
            {isRestricted ? (
              <>
                <IconLockOpen className='mr-1 h-3 w-3' />
                Unrestrict
              </>
            ) : (
              <>
                <IconLock className='mr-1 h-3 w-3' />
                Restrict
              </>
            )}
          </Button>
        </div>

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() =>
            setConfirmModal((prev) => ({ ...prev, isOpen: false }))
          }
          onConfirm={confirmModal.action}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmText={confirmModal.confirmText}
          confirmVariant={confirmModal.confirmVariant}
        />
      </>
    );
  }

  return (
    <>
      <div className='flex flex-wrap gap-2'>
        {/* Status Badges */}
        <Badge variant={isActive ? 'default' : 'destructive'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>

        {isRestricted && <Badge variant='destructive'>Restricted</Badge>}

        {/* Action Buttons */}
        <div className='flex gap-1'>
          <Button
            variant={isActive ? 'destructive' : 'default'}
            size='sm'
            onClick={handleToggleActive}
            disabled={updateUserMutation.isPending}
          >
            {isActive ? (
              <>
                <IconUserX className='mr-1 h-3 w-3' />
                Deactivate
              </>
            ) : (
              <>
                <IconUserCheck className='mr-1 h-3 w-3' />
                Activate
              </>
            )}
          </Button>

          <Button
            variant={isRestricted ? 'default' : 'destructive'}
            size='sm'
            onClick={handleToggleRestricted}
            disabled={updateUserMutation.isPending}
          >
            {isRestricted ? (
              <>
                <IconLockOpen className='mr-1 h-3 w-3' />
                Unrestrict
              </>
            ) : (
              <>
                <IconLock className='mr-1 h-3 w-3' />
                Restrict
              </>
            )}
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.action}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
      />
    </>
  );
}
