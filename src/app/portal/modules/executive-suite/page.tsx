import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

export const metadata = {
  title: 'Executive Suite',
  description: 'Power BI dashboards and strategic analytics for leadership',
};

export default function ExecutiveSuitePage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
            Executive Suite
          </h1>
          <p className="text-muted-foreground mt-2">
            Strategic analytics and business intelligence dashboards
          </p>
        </div>
        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          Beta
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.4M</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">+201 since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-muted-foreground">+4.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Quarter</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Q1 2025</div>
            <p className="text-xs text-muted-foreground">Outstanding performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Area */}
      <Card>
        <CardHeader>
          <CardTitle>Power BI Dashboard</CardTitle>
          <CardDescription>
            Interactive business intelligence and strategic analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[600px] bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <div className="text-center space-y-4">
              <BarChart className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">Power BI Integration</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                  Connect your Power BI workspace to embed executive dashboards and reports.
                  Configure in Admin Panel → Module Settings.
                </p>
              </div>
              <div className="pt-4">
                <code className="text-xs bg-muted px-3 py-1 rounded">
                  POWERBI_WORKSPACE_ID required
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
            <CardDescription>Pre-configured executive reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Financial Performance Q1</span>
              <Badge variant="outline">Ready</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Team Productivity Metrics</span>
              <Badge variant="outline">Ready</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Client Engagement Analysis</span>
              <Badge variant="outline">Pending</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Strategic Growth Forecast</span>
              <Badge variant="outline">Pending</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Insights</CardTitle>
            <CardDescription>AI-generated executive insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-1">
              <p className="font-medium">Revenue Trend Analysis</p>
              <p className="text-muted-foreground">
                Q1 revenue exceeded projections by 15%, driven primarily by Triangle Defense platform adoption.
              </p>
            </div>
            <div className="text-sm space-y-1">
              <p className="font-medium">Market Opportunity</p>
              <p className="text-muted-foreground">
                Expansion into collegiate market shows 340% growth potential based on current trajectory.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
