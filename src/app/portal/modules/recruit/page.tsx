import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Star, TrendingUp, MapPin, Phone, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Recruit',
  description: 'College recruiting CRM and talent evaluation management system',
};

export default function RecruitPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
            Recruit
          </h1>
          <p className="text-muted-foreground mt-2">
            College recruiting CRM and talent evaluation management platform
          </p>
        </div>
        <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
          Coming Soon
        </Badge>
      </div>

      {/* Module Overview */}
      <Card className="border-cyan-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-500" />
            Recruiting Management Platform
          </CardTitle>
          <CardDescription>
            Complete talent evaluation and recruiting workflow automation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Recruit streamlines the entire recruiting process from prospect identification to commitment. 
            Track evaluations, manage communications, coordinate visits, and analyze talent with 
            integrated M.E.L. AI insights and Triangle Defense position fitting.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-cyan-500" />
                <span className="text-sm font-medium">Talent Evaluation</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Comprehensive player assessment and ranking
              </p>
            </div>
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-cyan-500" />
                <span className="text-sm font-medium">Communication Hub</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Automated outreach and relationship tracking
              </p>
            </div>
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-cyan-500" />
                <span className="text-sm font-medium">Visit Coordination</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Schedule and track campus/home visits
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recruiting Pipeline */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recruiting Pipeline Stages</CardTitle>
            <CardDescription>Track prospects through evaluation process</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-accent/50">
              <span className="text-sm font-medium">Identified</span>
              <Badge variant="outline">432 prospects</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Evaluated</span>
              <Badge variant="outline">187</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Offered</span>
              <Badge variant="outline">43</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Visited</span>
              <Badge variant="outline">28</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Committed</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-500">12</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Position Needs Analysis</CardTitle>
            <CardDescription>Current recruiting class breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Defensive Backs</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-accent rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: '75%' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground">3 of 4</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Linebackers</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-accent rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: '50%' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground">2 of 4</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Defensive Line</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-accent rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500" style={{ width: '100%' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground">3 of 3</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Triangle Defense Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Triangle Defense Position Fitting</CardTitle>
          <CardDescription>Evaluate prospects for defensive scheme compatibility</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Recruit integrates with Triangle Defense methodology to evaluate how prospects fit specific 
            positions (Metro, Apex, Mike, Mac, Star, Solo) based on their athletic profile and skills.
          </p>
          <div className="grid gap-2">
            <div className="p-3 rounded-lg border bg-accent/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Hybrid LB Prospects</p>
                  <p className="text-xs text-muted-foreground">Ideal for Mac/Apex edge positions in Triangle Defense</p>
                </div>
                <Badge variant="outline">23 identified</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <Card>
        <CardHeader>
          <CardTitle>Planned Features</CardTitle>
          <CardDescription>Advanced recruiting capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-cyan-500" />
            <div>
              <p className="text-sm font-medium">Automated Communication Sequences</p>
              <p className="text-xs text-muted-foreground">Personalized email/text campaigns with compliance tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-cyan-500" />
            <div>
              <p className="text-sm font-medium">M.E.L. AI Talent Scoring</p>
              <p className="text-xs text-muted-foreground">AI-powered prospect evaluation and ranking system</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-cyan-500" />
            <div>
              <p className="text-sm font-medium">Video Integration</p>
              <p className="text-xs text-muted-foreground">Link game film with evaluations and sharing tools</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-cyan-500" />
            <div>
              <p className="text-sm font-medium">Compliance Management</p>
              <p className="text-xs text-muted-foreground">NCAA rule tracking and violation prevention</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon CTA */}
      <Card className="border-cyan-500/20 bg-cyan-500/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Users className="h-12 w-12 mx-auto text-cyan-500" />
            <div>
              <h3 className="text-lg font-semibold">Recruiting Platform Coming Soon</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Recruit brings comprehensive talent management with Triangle Defense integration, 
                M.E.L. AI evaluation insights, and complete recruiting workflow automation. Expected launch Q3 2025.
              </p>
            </div>
            <Button variant="outline" className="border-cyan-500/20">
              Request Demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
