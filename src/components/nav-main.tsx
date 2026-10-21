'use client';

import { Icons, Icon } from '@/components/icons';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from '@/components/ui/sidebar';
import Link from 'next/link';

export function NavMain({
  items
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const { state, isMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarGroupContent className='flex flex-col gap-2'>
        <SidebarMenu>
          {items.map((item) => {
            const hasSubItems = Boolean(item?.items && item.items.length > 0);

            if (hasSubItems) {
              if (state === 'collapsed' && !isMobile) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={item.isActive}
                            className='group/collapsible bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear'
                          />
                        }
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side='right'
                        align='start'
                        sideOffset={4}
                        className='min-w-48 rounded-lg'
                      >
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          {item.items?.map((subItem) => (
                            <DropdownMenuItem
                              key={subItem.title}
                              render={<Link href={subItem.url} aria-label={subItem.title} />}
                              className='flex items-center gap-2 cursor-pointer'
                            >
                              <span>{subItem.title}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                );
              }

              return (
                <Collapsible
                  key={item.title}
                  defaultOpen={item.isActive}
                  render={<SidebarMenuItem />}
                >
                  <CollapsibleTrigger
                    render={
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={item.isActive}
                        className='group/collapsible bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear'
                      />
                    }
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <Icons.chevronRight className='ml-auto transition-transform duration-200 group-data-panel-open/collapsible:rotate-90' />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            render={<Link href={subItem.url} aria-label={subItem.title} />}
                          >
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link href={item.url} aria-label={item.title} />}
                  tooltip={item.title}
                  isActive={item.isActive}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
