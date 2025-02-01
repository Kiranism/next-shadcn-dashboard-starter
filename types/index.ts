import { Icons } from '@/components/icons';

export interface NavItem {
  [x: string]: any;
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  icon: "list" |"play" | "video" | "close" | "media" | "user" | "check" | "dashboard" | "logo" | "login" | "product" | "spinner" | "kanban" | "chevronLeft" | "chevronRight" | "trash" | "employee" | "post";
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;
