'use client';

import { useAuth, useOrganizationList } from '@clerk/nextjs';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { useEffect } from 'react';

export function OrgSwitcher() {
  const { isMobile, state } = useSidebar();
  // Side menus open to the right: 8px from the expanded sidebar, 16px off the icon rail
  const railMenu = state === 'collapsed' && !isMobile;
  const router = useRouter();
  const { isLoaded, setActive, userMemberships } = useOrganizationList({
    userMemberships: {
      infinite: true,
      keepPreviousData: false
    }
  });

  const { orgId } = useAuth();

  useEffect(() => {
    if (userMemberships?.revalidate) {
      void userMemberships.revalidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only revalidate when org changes, not on every userMemberships ref change
  }, [orgId]);

  // Get the currently active organization
  const activeOrganization = userMemberships?.data?.find(
    (membership) => membership.organization.id === orgId
  )?.organization;

  // Handle organization switch
  const handleOrganizationSwitch = async (organizationId: string) => {
    if (orgId === organizationId || !setActive) {
      return; // Already active or setActive not available
    }
    try {
      await setActive({ organization: organizationId });
    } catch (error) {
      console.error('Failed to switch organization:', error);
    }
  };

  // Show loading state
  if (!isLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' disabled>
            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg'>
              <Icons.galleryVerticalEnd className='size-4' />
            </div>
            <div
              className={`grid flex-1 text-left text-sm leading-tight transition-all duration-200 ease-in-out ${
                state === 'collapsed'
                  ? 'invisible max-w-0 overflow-hidden opacity-0'
                  : 'visible max-w-full opacity-100'
              }`}
            >
              <span className='truncate font-medium'>Loading...</span>
              <span className='text-muted-foreground truncate text-xs'>Organizations</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Show create organization option if no organizations
  if (!userMemberships?.data || userMemberships.data.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size='lg'
            onClick={() => router.push('/dashboard/workspaces')}
            className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground'
          >
            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg'>
              <Icons.add className='size-4' />
            </div>
            <div
              className={`grid flex-1 text-left text-sm leading-tight transition-all duration-200 ease-in-out ${
                state === 'collapsed'
                  ? 'invisible max-w-0 overflow-hidden opacity-0'
                  : 'visible max-w-full opacity-100'
              }`}
            >
              <span className='truncate font-medium'>Create organization</span>
              <span className='text-muted-foreground truncate text-xs'>Get started</span>
            </div>
            <Icons.chevronsUpDown
              className={`text-muted-foreground ml-auto transition-all duration-200 ease-in-out ${
                state === 'collapsed'
                  ? 'invisible max-w-0 opacity-0'
                  : 'visible max-w-full opacity-100'
              }`}
            />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Use active organization or first organization as fallback
  const displayOrganization = activeOrganization || userMemberships.data[0]?.organization;

  if (!displayOrganization) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size='lg'
                className='data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground'
              />
            }
          >
            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg'>
              {displayOrganization.hasImage && displayOrganization.imageUrl ? (
                <Image
                  src={displayOrganization.imageUrl}
                  alt={displayOrganization.name}
                  width={32}
                  height={32}
                  className='size-full object-cover'
                />
              ) : (
                <Icons.galleryVerticalEnd className='size-4' />
              )}
            </div>
            <div
              className={`grid flex-1 text-left text-sm leading-tight transition-all duration-200 ease-in-out ${
                state === 'collapsed'
                  ? 'invisible max-w-0 overflow-hidden opacity-0'
                  : 'visible max-w-full opacity-100'
              }`}
            >
              <span className='truncate font-medium' title={displayOrganization.name}>
                {displayOrganization.name}
              </span>
              <span className='text-muted-foreground truncate text-xs'>
                {userMemberships.data.find((m) => m.organization.id === displayOrganization.id)
                  ?.role || 'Organization'}
              </span>
            </div>
            <Icons.chevronsUpDown
              className={`text-muted-foreground ml-auto transition-all duration-200 ease-in-out ${
                state === 'collapsed'
                  ? 'invisible max-w-0 opacity-0'
                  : 'visible max-w-full opacity-100'
              }`}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-72 max-w-[calc(100vw-2rem)]'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={isMobile ? 4 : railMenu ? 16 : 8}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Organizations</DropdownMenuLabel>
              {userMemberships.data.map((membership) => {
                const isActive = membership.organization.id === orgId;
                return (
                  <DropdownMenuItem
                    key={membership.id}
                    onClick={() => handleOrganizationSwitch(membership.organization.id)}
                    className='items-start gap-2 p-1.5'
                  >
                    <div className='flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md border'>
                      {membership.organization.hasImage && membership.organization.imageUrl ? (
                        <Image
                          src={membership.organization.imageUrl}
                          alt={membership.organization.name}
                          width={28}
                          height={28}
                          className='size-full object-cover'
                        />
                      ) : (
                        <Icons.galleryVerticalEnd className='size-3.5 shrink-0' />
                      )}
                    </div>
                    {/* Names wrap instead of truncating so similar org names stay distinguishable */}
                    <div className='grid min-w-0 flex-1 leading-tight'>
                      <span className='text-pretty wrap-break-word'>
                        {membership.organization.name}
                      </span>
                      <span className='text-muted-foreground text-xs'>{membership.role}</span>
                    </div>
                    {isActive && <Icons.check className='mt-1.5 ml-auto size-4' />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className='gap-2 p-1.5'
                onClick={() => {
                  router.push('/dashboard/workspaces');
                }}
              >
                <div className='flex size-7 items-center justify-center rounded-md border bg-transparent'>
                  <Icons.add className='size-4' />
                </div>
                <div className='text-muted-foreground font-medium'>Add organization</div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
