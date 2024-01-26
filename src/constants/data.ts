import { NavItem, SidebarNavItem } from "@/types";

export type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string; // Consider using a proper date type if possible
  street: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  longitude?: number; // Optional field
  latitude?: number; // Optional field
  job: string;
  profile_picture?: string | null; // Profile picture can be a string (URL) or null (if no picture)
};

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    label: "Dashboard",
  },
  {
    title: "Send Message",
    href: "/dashboard/send-message",
    icon: "send",
    label: "send",
  },
  {
    title: "Gallery",
    href: "/dashboard/gallery",
    icon: "gallery",
    label: "gallery",
  },
 
  {
    title: "Log",
    href: "/dashboard/log",
    icon: "log",
    label: "log",
  },
  {
    title: "Kanban",
    href: "/dashboard/kanban",
    icon: "kanban",
    label: "kanban",
  },
  {
    title: "Login",
    href: "/",
    icon: "login",
    label: "login",
  },
];


export const MAX_IMAGE_LIMIT = 3