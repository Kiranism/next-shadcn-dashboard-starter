import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, TrendingUp, Users, DollarSign, Calendar, 
  Activity, AlertTriangle, Target, Award, ChevronRight 
} from 'lucide-react';

export const metadata = {
  title: 'Executive Dashboard',
  description: 'Strategic command center for executive decision-making',
};

export default function ExecutiveDashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6 bg-amt-very-dark min-h-screen">
      {/* Executive Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
            Executive Command Center
          </h1>
          <p className="text-amt-light-gray mt-2">
            Strategic intelligence and decision-making dashboard
          </p>
        </div>
        <div className="flex gap-3">
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            All Systems Operational
          </Badge>
          <Button className="bg-amt-red hover:bg-amt-red/90">
            Generate Executive Report
          </Button>
        </div>
      </div>

      {/* Priority Alerts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-amt-accent/20 bg-amt-accent/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priority Actions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amt-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amt-accent">3</div>
            <p className="text-xs text-muted-foreground">Requiring immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 of 12</div>
            <p className="text-xs text-muted-foreground">Power Playbooks, M.E.L. AI</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">↗ +2% vs last quarter</p>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Financial Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amt-accent" />
              Financial Performance
            </CardTitle>
            <CardDescription>Revenue and growth metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
              <div>
                <p className="text-sm font-medium">Q4 Revenue</p>
                <p className="text-2xl font-bold">$2.4M</p>
              </div>
              <Badge className="bg-green-500/10 text-green-500">+20.1%</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Clients</span>
                <span className="font-medium">573</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Growth Rate</span>
                <span className="font-medium">+12.5%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Market Share</span>
                <span className="font-medium">8.3%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-amt-accent" />
              Team Metrics
            </CardTitle>
            <CardDescription>Staff performance and productivity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
              <div>
                <p className="text-sm font-medium">Team Efficiency</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
              <Badge className="bg-green-500/10 text-green-500">Excellent</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Staff</span>
                <span className="font-medium">25 members</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Projects Completed</span>
                <span className="font-medium">47 this quarter</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Satisfaction Score</span>
                <span className="font-medium">92%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Performance Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amt-accent" />
            Module Performance Overview
          </CardTitle>
          <CardDescription>Status and metrics across all 12 AMT modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {/* Power Playbooks */}
            <div className="p-3 rounded-lg border border-amt-red/20 bg-amt-red/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Power Playbooks</span>
                <Badge className="bg-green-500/10 text-green-500">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground">847 plays created</p>
            </div>

            {/* M.E.L. AI */}
            <div className="p-3 rounded-lg border border-amt-accent/20 bg-amt-accent/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">M.E.L. AI</span>
                <Badge className="bg-green-500/10 text-green-500">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground">2.3K insights generated</p>
            </div>

            {/* Executive Suite */}
            <div className="p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Executive Suite</span>
                <Badge className="bg-yellow-500/10 text-yellow-500">Beta</Badge>
              </div>
              <p className="text-xs text-muted-foreground">47 reports available</p>
            </div>

            {/* Dynamic Fabricator */}
            <div className="p-3 rounded-lg border opacity-60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Dynamic Fabricator</span>
                <Badge variant="outline">Q2 2025</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Video processing AI</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Initiatives */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Triangle Defense Adoption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold">67%</span>
              <Target className="h-8 w-8 text-amt-accent" />
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Increased from 45% last quarter
            </p>
            <Button variant="outline" className="w-full" size="sm">
              View Details
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Platform Expansion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold">8</span>
              <Award className="h-8 w-8 text-amt-accent" />
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              New markets entered in 2025
            </p>
            <Button variant="outline" className="w-full" size="sm">
              View Markets
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Client Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold">9.2/10</span>
              <Users className="h-8 w-8 text-amt-accent" />
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Average client rating
            </p>
            <Button variant="outline" className="w-full" size="sm">
              View Feedback
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amt-accent" />
            Recent Executive Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Q4 Strategic Review</p>
                <p className="text-xs text-muted-foreground">Denauld Brown • 2 hours ago</p>
              </div>
              <Badge variant="outline">Completed</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Module 7 Launch Approval</p>
                <p className="text-xs text-muted-foreground">Alexandra Martinez • 5 hours ago</p>
              </div>
              <Badge className="bg-green-500/10 text-green-500">Approved</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium text-sm">Budget Allocation Review</p>
                <p className="text-xs text-muted-foreground">Courtney Sellars • 1 day ago</p>
              </div>
              <Badge variant="outline">In Progress</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
