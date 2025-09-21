import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, Brain, BarChart3, Activity, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Q3 Quarterback',
  description: 'Advanced QB analytics and decision modeling with performance metrics',
};

export default function Q3QuarterbackPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
            Q3 Quarterback
          </h1>
          <p className="text-muted-foreground mt-2">
            Advanced quarterback analytics and decision modeling system
          </p>
        </div>
        <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
          Coming Soon
        </Badge>
      </div>

      {/* Module Overview */}
      <Card className="border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            QB Performance Analytics
          </CardTitle>
          <CardDescription>
            Comprehensive quarterback evaluation and decision-making analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Q3 Quarterback provides deep analytics on quarterback performance, decision-making patterns, 
            and development tracking. Integrates with Triangle Defense to analyze QB reads against specific 
            defensive formations and provides M.E.L. AI coaching recommendations.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Decision Analysis</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Pre-snap reads and post-snap decision tracking
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Pattern Recognition</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Formation reads and defensive tendency analysis
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Performance Metrics</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Completion rate, accuracy, and efficiency tracking
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
            <CardDescription>Quarterback performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2">
              <span className="text-sm">Completion Percentage</span>
              <Badge variant="outline">vs Coverage Type</Badge>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-sm">Pre-snap Recognition Rate</span>
              <Badge variant="outline">Formation Analysis</Badge>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-sm">Time to Throw (TTT)</span>
              <Badge variant="outline">Pressure Scenarios</Badge>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-sm">Expected Points Added (EPA)</span>
              <Badge variant="outline">Situational</Badge>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-sm">Third Down Efficiency</span>
              <Badge variant="outline">Critical Downs</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Development Tracking</CardTitle>
            <CardDescription>QB growth and improvement areas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-accent/50">
              <p className="text-sm font-medium mb-2">Progression Reads</p>
              <p className="text-xs text-muted-foreground">
                Track ability to progress through Triangle Defense progressions systematically
              </p>
            </div>
            <div className="p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Hot Route Recognition</p>
              <p className="text-xs text-muted-foreground">
                Identify defensive looks and adjust protection/routes pre-snap
              </p>
            </div>
            <div className="p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Pocket Awareness</p>
              <p className="text-xs text-muted-foreground">
                Movement within pocket and pressure navigation metrics
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Triangle Defense Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Triangle Defense QB Analysis</CardTitle>
          <CardDescription>Performance against specific defensive formations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-accent/30">
              <p className="text-sm font-medium mb-1">vs LARRY Formation</p>
              <p className="text-xs text-muted-foreground mb-2">MO Left + Male defensive alignment</p>
              <div className="flex items-center justify-between">
                <span className="text-xs">Completion %</span>
                <Badge variant="outline">67.8%</Badge>
              </div>
            </div>
            <div className="p-3 rounded-lg border bg-accent/30">
              <p className="text-sm font-medium mb-1">vs LINDA Formation</p>
              <p className="text-xs text-muted-foreground mb-2">MO Left + Female defensive alignment</p>
              <div className="flex items-center justify-between">
                <span className="text-xs">Completion %</span>
                <Badge variant="outline">72.3%</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <Card>
        <CardHeader>
          <CardTitle>Planned Features</CardTitle>
          <CardDescription>What to expect in Q3 Quarterback module</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium">Real-time Decision Trees</p>
              <p className="text-xs text-muted-foreground">Visualize QB progression reads with outcome probabilities</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium">M.E.L. AI Coaching</p>
              <p className="text-xs text-muted-foreground">Personalized QB development recommendations</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium">Comparative Analysis</p>
              <p className="text-xs text-muted-foreground">Benchmark against league averages and elite performers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon CTA */}
      <Card className="border-orange-500/20 bg-orange-500/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <BarChart3 className="h-12 w-12 mx-auto text-orange-500" />
            <div>
              <h3 className="text-lg font-semibold">QB Analytics Platform Coming Soon</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Q3 Quarterback module is in development with advanced performance tracking, 
                Triangle Defense integration, and AI-powered coaching insights. Expected launch Q2 2025.
              </p>
            </div>
            <Button variant="outline" className="border-orange-500/20">
              Request Early Access
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
