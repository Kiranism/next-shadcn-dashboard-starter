'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import { isAdmin } from '@/lib/auth/jwt-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Users, Settings, Activity, Lock } from 'lucide-react';

const ADMIN_USERS = [
  {
    id: 'denauld-brown',
    name: 'Denauld Brown',
    email: 'denauld@analyzemyteam.com',
    role: 'FOUNDER',
    tier: 'Tier 1: Founder Authority',
    avatar: 'DB',
    permissions: ['all'],
    status: 'active',
  },
  {
    id: 'courtney-sellars',
    name: 'Courtney Sellars',
    email: 'courtney@analyzemyteam.com',
    role: 'EXECUTIVE',
    tier: 'Tier 3: Executive Command',
    avatar: 'CS',
    permissions: ['legal', 'operations', 'admin'],
    status: 'active',
  },
  {
    id: 'mel-ai',
    name: 'M.E.L.',
    email: 'mel@analyzemyteam.com',
    role: 'AI_CORE',
    tier: 'Tier 2: AI Core',
    avatar: 'AI',
    permissions: ['intelligence', 'analysis', 'coordination'],
    status: 'active',
  },
  {
    id: 'alexandra-martinez',
    name: 'Alexandra Martinez',
    email: 'alexandra@analyzemyteam.com',
    role: 'EXECUTIVE',
    tier: 'Tier 3: Executive Command',
    avatar: 'AM',
    permissions: ['operations', 'admin', 'coordination'],
    status: 'active',
  },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  if (!user || !isAdmin(user.email)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
        <Lock className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Access Restricted</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Admin panel access is limited to authorized personnel only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
          Admin Control Panel
        </h1>
        <p className="text-muted-foreground mt-2">
          Restricted access for Denauld Brown, Courtney Sellars, M.E.L., and Alexandra Martinez
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-2">
            <Settings className="h-4 w-4" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authorized Admin Users</CardTitle>
              <CardDescription>
                Only these 4 users have admin panel access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ADMIN_USERS.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amt-accent text-amt-black font-bold">
                            {admin.avatar}
                          </div>
                          <div>
                            <p className="font-medium">{admin.name}</p>
                            <p className="text-xs text-muted-foreground">{admin.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {admin.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{admin.tier}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {admin.permissions.slice(0, 2).map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {admin.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {['Executive Suite', 'Power Playbooks', 'M.E.L. AI', 'Dynamic Fabricator', 'Game Changer', 'Q3', 'Dynamic Predictor', 'Pro Scout', 'Recruit', 'Strength', 'Medicine', 'Academics'].map((module, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{module}</CardTitle>
                    <Badge>{i < 2 ? 'Active' : 'Coming Soon'}</Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Configuration</CardTitle>
              <CardDescription>Role-based access control settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                AMT Portal uses a 7-tier permission system from Founder to Football operations.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>System-wide activity log</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>Activity logs will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Authorized admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Out of 12 total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
