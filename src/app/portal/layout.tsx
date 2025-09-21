'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Home, BarChart, Video, Play, Brain, Target, Search, 
  Users, Dumbbell, Heart, GraduationCap, Menu, Settings,
  LogOut, User, Shield, Bell, ChevronDown, Briefcase
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  { title: 'Home', href: '/portal', icon: <Home className="h-5 w-5" /> },
  { title: 'Executive Suite', href: '/portal/modules/executive-suite', icon: <BarChart className="h-5 w-5" />, badge: 'Beta' },
  { title: 'Dynamic Fabricator', href: '/portal/modules/dynamic-fabricator', icon: <Video className="h-5 w-5" /> },
  { title: 'Game Changer', href: '/portal/modules/game-changer', icon: <Play className="h-5 w-5" /> },
  { title: 'M.E.L. AI', href: '/portal/modules/mel', icon: <Brain className="h-5 w-5" />, badge: 'Active' },
  { title: 'Q3 Quarterback', href: '/portal/modules/q3', icon: <Briefcase className="h-5 w-5" /> },
  { title: 'Dynamic Predictor', href: '/portal/modules/dynamic-predictor', icon: <Target className="h-5 w-5" /> },
  { title: 'Power Playbooks', href: '/portal/modules/power-playbooks', icon: <Play className="h-5 w-5" />, badge: 'Active' },
  { title: 'Pro Scout', href: '/portal/modules/pro-scout', icon: <Search className="h-5 w-5" /> },
  { title: 'Recruit', href: '/portal/modules/recruit', icon: <Users className="h-5 w-5" /> },
  { title: 'Strength', href: '/portal/modules/strength', icon: <Dumbbell className="h-5 w-5" /> },
  { title: 'Medicine', href: '/portal/modules/medicine', icon: <Heart className="h-5 w-5" /> },
  { title: 'Academics', href: '/portal/modules/academics', icon: <GraduationCap className="h-5 w-5" /> },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/sign-in');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amt-red border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading AMT Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center justify-center border-b border-border px-6">
          <Link href="/portal" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amt-red text-amt-white font-bold">
              AMT
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
              Platform
            </span>
          </Link>
        </div>
        <ScrollArea className="flex-1 py-4">
          <nav className="grid gap-1 px-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                  "hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href
                    ? "bg-amt-red/10 text-amt-red font-medium"
                    : "text-muted-foreground"
                )}
              >
                {item.icon}
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    item.badge === 'Active' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-16 items-center justify-center border-b border-border px-6">
                  <Link href="/portal" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amt-red text-amt-white font-bold">
                      AMT
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
                      Platform
                    </span>
                  </Link>
                </div>
                <ScrollArea className="flex-1 py-4">
                  <nav className="grid gap-1 px-3">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                          "hover:bg-accent hover:text-accent-foreground",
                          pathname === item.href
                            ? "bg-amt-red/10 text-amt-red font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.icon}
                        <span className="flex-1">{item.title}</span>
                      </Link>
                    ))}
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-amt-accent text-amt-black font-bold">
                      {user.avatar || user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">{user.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                {user.permissions.includes('admin') || user.permissions.includes('all') ? (
                  <DropdownMenuItem onClick={() => router.push('/portal/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
