'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { navItems } from '@/constants/data';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  IconBell,
  IconChevronRight,
  IconChevronsDown,
  IconCreditCard,
  IconLogout,
  IconPhotoUp,
  IconUserCircle
} from '@tabler/icons-react';
// Modo sem autenticação: removemos Clerk
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { OrgSwitcher } from '../org-switcher';
export const company = {
  name: 'Sistema Médico',
  logo: IconPhotoUp,
  plan: 'Professional',
  description: 'Plataforma de Gestão Médica'
};

const tenants = [
  { id: '1', name: 'Clínica Central' },
  { id: '2', name: 'Hospital São José' },
  { id: '3', name: 'Clínica Especializada' }
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const user = {
    fullName: 'Dr. João Silva',
    emailAddresses: [{ emailAddress: 'joao.silva@clinica.med.br' }],
    imageUrl: undefined
  } as any;
  const router = useRouter();
  const handleSwitchTenant = (_tenantId: string) => {
    void _tenantId;
    // Tenant switching functionality would be implemented here
  };

  const activeTenant = tenants[0];

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar
      collapsible='icon'
      className='glass-medical border-border/50 border-r'
    >
      <SidebarHeader className='border-border/50 border-b pb-3'>
        <div className='px-3 py-2'>
          <div className='mb-2 flex items-center gap-2'>
            <div className='rounded-medical-md bg-medical-primary flex h-8 w-8 items-center justify-center text-white'>
              <company.logo className='h-5 w-5' />
            </div>
            <div className='min-w-0 flex-1'>
              <h1 className='text-foreground truncate text-sm font-semibold'>
                {company.name}
              </h1>
              <p className='text-muted-foreground truncate text-xs'>
                {company.description}
              </p>
            </div>
          </div>
          <OrgSwitcher
            tenants={tenants}
            defaultTenant={activeTenant}
            onTenantSwitch={handleSwitchTenant}
          />
        </div>
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden px-2'>
        <SidebarGroup>
          <SidebarGroupLabel className='text-muted-foreground mb-2 px-2 text-xs font-semibold tracking-wider uppercase'>
            Navegação Principal
          </SidebarGroupLabel>
          <SidebarMenu className='space-y-1'>
            {navItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className='group/collapsible'
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={pathname === item.url}
                        className='data-[active=true]:bg-medical-primary/10 data-[active=true]:text-medical-primary data-[active=true]:border-medical-primary/20 hover:bg-accent/50 duration-medical rounded-medical-md transition-all'
                      >
                        {item.icon && <Icon className='h-4 w-4' />}
                        <span className='font-medium'>{item.title}</span>
                        <IconChevronRight className='duration-medical ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                    className='data-[active=true]:bg-medical-primary/10 data-[active=true]:text-medical-primary data-[active=true]:border-medical-primary/20 hover:bg-accent/50 duration-medical rounded-medical-md transition-all'
                  >
                    <Link href={item.url} className='flex items-center gap-3'>
                      <Icon className='h-4 w-4' />
                      <span className='font-medium'>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className='border-border/50 border-t px-2 pt-3'>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  {user && (
                    <UserAvatarProfile
                      className='h-8 w-8 rounded-lg'
                      showInfo
                      user={user}
                    />
                  )}
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='px-1 py-1.5'>
                    {user && (
                      <UserAvatarProfile
                        className='h-8 w-8 rounded-lg'
                        showInfo
                        user={user}
                      />
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/profile')}
                  >
                    <IconUserCircle className='mr-2 h-4 w-4' />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconCreditCard className='mr-2 h-4 w-4' />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconBell className='mr-2 h-4 w-4' />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <IconLogout className='mr-2 h-4 w-4' />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
