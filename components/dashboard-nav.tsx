'use client';

import { Icons } from '@/components/icons';
import { useBreakpoint } from '@/hooks/useBreakPoints';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/lib/utils';
import { NavItem } from '@/types';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useCallback, useMemo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './ui/tooltip';

interface DashboardNavProps {
  items: NavItem[];
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileNav?: boolean;
}

const NavItemContent = React.memo(
  ({
    item,
    isMinimized,
    isExpanded,
    path
  }: {
    item: NavItem;
    isMinimized: boolean;
    isExpanded: boolean;
    path: string;
  }) => {
    const Icon = item.icon ? Icons[item.icon] : Icons.logo;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
          path === item.href ? 'bg-accent' : 'transparent',
          item.disabled && 'cursor-not-allowed opacity-80'
        )}
      >
        <Icon className="size-5 flex-none" />
        {!isMinimized && <span className="mr-2 truncate">{item.title}</span>}
        {hasChildren && !isMinimized && (
          <ChevronRight
            className={cn('ml-auto h-4 w-4', isExpanded && 'rotate-90')}
          />
        )}
      </div>
    );
  }
);

NavItemContent.displayName = 'NavItemContent';

const NavItemLink = React.memo(
  ({
    item,
    onClick,
    children
  }: {
    item: NavItem;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <Link
      href={item.disabled ? '/' : item.href || '#'}
      className={cn('block', item.disabled && 'cursor-not-allowed opacity-80')}
      onClick={onClick}
    >
      {children}
    </Link>
  )
);

NavItemLink.displayName = 'NavItemLink';

const NavItemButton = React.memo(
  ({
    onClick,
    children
  }: {
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button className="w-full text-left" onClick={onClick}>
      {children}
    </button>
  )
);

NavItemButton.displayName = 'NavItemButton';

export function DashboardNav({
  items,
  setOpen,
  isMobileNav = false
}: DashboardNavProps) {
  const path = usePathname();
  const { isMinimized } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { isAboveLg } = useBreakpoint('lg');

  const toggleExpand = useCallback((title: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  }, []);

  const handleSetOpen = useCallback(() => {
    if (setOpen) setOpen(false);
  }, [setOpen]);

  const renderNavItem = useCallback(
    (item: NavItem, depth = 0) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedItems.has(item.title);

      const content = (
        <NavItemContent
          item={item}
          isMinimized={isMinimized}
          isExpanded={isExpanded}
          path={path}
        />
      );

      if (hasChildren && isAboveLg && isMinimized) {
        return (
          <DropdownMenu key={item.title}>
            <DropdownMenuTrigger>{content}</DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-48 space-y-1"
              align="start"
              side="right"
              sideOffset={20}
            >
              <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
              {item.children &&
                item.children.map((child) => (
                  <DropdownMenuItem key={child.title} asChild>
                    {child.href && (
                      <Link
                        href={child.href}
                        onClick={handleSetOpen}
                        className="cursor-pointer"
                      >
                        {child.title}
                      </Link>
                    )}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }

      return (
        <div key={item.title}>
          {item.href ? (
            <NavItemLink item={item} onClick={handleSetOpen}>
              {content}
            </NavItemLink>
          ) : (
            <NavItemButton onClick={() => toggleExpand(item.title)}>
              {content}
            </NavItemButton>
          )}
          {hasChildren && !isMinimized && isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children &&
                item.children.map((child) => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    },
    [expandedItems, isMinimized, isAboveLg, path, handleSetOpen, toggleExpand]
  );

  const memoizedItems = useMemo(() => items, [items]);

  if (!memoizedItems?.length) {
    return null;
  }

  return (
    <nav className={cn('grid items-start gap-2')}>
      <TooltipProvider>
        {memoizedItems.map((item) => (
          <Tooltip key={item.title}>
            <TooltipTrigger asChild>{renderNavItem(item)}</TooltipTrigger>
            <TooltipContent
              align="center"
              side="right"
              sideOffset={8}
              className={!isMinimized ? 'hidden' : 'inline-block'}
            >
              {item.title}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </nav>
  );
}
