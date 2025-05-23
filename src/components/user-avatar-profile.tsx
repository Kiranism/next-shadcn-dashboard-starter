import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGetCurrentUser } from '@/hooks/useQuery';
import { useUserStore } from '@/stores/useUserStore';
// import { IUser } from '@/types/common.types';

interface UserAvatarProfileProps {
  className?: string;
  showInfo?: boolean;
}

export function UserAvatarProfile({
  className,
  showInfo = false
}: UserAvatarProfileProps) {
  const { currentUser } = useUserStore();
  const { data: userData } = useGetCurrentUser({
    enabled: !!currentUser
  });
  const user = userData?.data;
  return (
    <div className='flex items-center gap-2'>
      <Avatar className={className}>
        <AvatarImage src={user?.profilePicture || ''} alt={''} />
        <AvatarFallback className='rounded-lg'>
          {/* {user?.fullName?.slice(0, 2)?.toUpperCase() || 'CN'} */}
          CN
          {/* {currentUser?.userProfile.firstName.slice(0, 2)?.toUpperCase() ||
            'CN'} */}
        </AvatarFallback>
      </Avatar>

      {showInfo && (
        <div className='grid flex-1 text-left text-sm leading-tight'>
          <span className='truncate font-semibold'>
            {/* {currentUser?.userProfile.firstName || ''} */}
            Admin
          </span>
          <span className='truncate text-xs'>Admin@admin.com</span>
          {/* <span className='truncate text-xs'>{user?.email || ''}</span> */}
        </div>
      )}
    </div>
  );
}
