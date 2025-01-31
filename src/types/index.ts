export interface NavItem {
  title: string;
  url: string;
  icon: string;
  shortcut: string[];
  isActive: boolean;
  items: NavItem[];
  adminOnly: boolean;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      image: string | null;
      isAdmin: boolean;
    };
  }
}
