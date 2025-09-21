import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dumbbell, Activity, TrendingUp, Heart, AlertCircle, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Strength',
  description: 'Performance tracking and injury prevention analytics platform',
};

export default function StrengthPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
            Strength
          </h1>
          <p className="text-muted-foreground mt-2">
            Performance tracking, injury prevention, and athletic development analytics
          </p>
        </div>
        <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
          Coming Soon
        </Badge>
      </div>

      {/* Module Overview */}
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-red-500" />
            Athletic Performance Platform
          </CardTitle>
          <CardDescription>
            Comprehensive strength and conditioning management with injury prevention
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Strength module provides complete athletic performance tracking from weight room to field. 
            Monitor workouts, track progress, identify injury risks, and optimize training programs with 
            M.E.L. AI insights and integration with Medicine module for comprehensive athlete wellness.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Workout Tracking</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Complete exercise logging and progress monitoring
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Injury Prevention</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Workload monitoring and risk assessment
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Performance Analytics</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Strength gains and athletic development tracking
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Training Categories</CardTitle>
            <CardDescription>Comprehensive program management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Strength Training</span>
              <Badge variant="outline">2.1K workouts</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Speed & Agility</span>
              <Badge variant="outline">847 sessions</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Conditioning</span>
              <Badge variant="outline">1.5K sessions</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Mobility Work</span>
              <Badge variant="outline">923 sessions</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Recovery Protocols</span>
              <Badge variant="outline">1.2K sessions</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Athlete Monitoring</CardTitle>
            <CardDescription>Performance and wellness tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-accent/50">
              <p className="text-sm font-medium mb-2">Load Management</p>
              <p className="text-xs text-muted-foreground">
                Track acute vs chronic workload ratios to prevent overtraining and injury
              </p>
            </div>
            <div className="p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Readiness Assessment</p>
              <p className="text-xs text-muted-foreground">
                Daily wellness surveys and fatigue monitoring for training optimization
              </p>
            </div>
            <div className="p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">1RM Tracking</p>
              <p className="text-xs text-muted-foreground">
                Monitor one-rep max progress across all major lifts
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Position-Specific Training */}
      <Card>
        <CardHeader>
          <CardTitle>Triangle Defense Position Training</CardTitle>
          <CardDescription>Specialized programs for defensive positions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Strength programs tailored to Triangle Defense positions - Metro, Apex, Mike, Mac, Star, Solo - 
            with position-specific exercises and performance benchmarks.
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="p-3 rounded-lg border bg-accent/30">
              <p className="text-sm font-medium mb-1">Edge Position Development</p>
              <p className="text-xs text-muted-foreground">Mac/Apex athletes: Explosive power, speed, agility focus</p>
            </div>
            <div className="p-3 rounded-lg border bg-accent/30">
              <p className="text-sm font-medium mb-1">Inside Linebacker Program</p>
              <p className="text-xs text-muted-foreground">Mike/Metro athletes: Strength, tackling power, lateral quickness</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <Card>
        <CardHeader>
          <CardTitle>Planned Features</CardTitle>
          <CardDescription>Advanced performance capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium">Video Form Analysis</p>
              <p className="text-xs text-muted-foreground">AI-powered exercise technique evaluation and correction</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium">Wearable Integration</p>
              <p className="text-xs text-muted-foreground">GPS, heart rate, and force plate data synchronization</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium">Injury Risk Prediction</p>
              <p className="text-xs text-muted-foreground">ML-based injury likelihood modeling with preventive recommendations</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium">Medicine Module Integration</p>
              <p className="text-xs text-muted-foreground">Seamless coordination with medical staff for injury management</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon CTA */}
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Dumbbell className="h-12 w-12 mx-auto text-red-500" />
            <div>
              <h3 className="text-lg font-semibold">Performance Platform Coming Soon</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Strength module brings comprehensive athletic development with Triangle Defense position-specific 
                training, injury prevention analytics, and M.E.L. AI performance optimization. Expected launch Q3 2025.
              </p>
            </div>
            <Button variant="outline" className="border-red-500/20">
              Join Waitlist
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
