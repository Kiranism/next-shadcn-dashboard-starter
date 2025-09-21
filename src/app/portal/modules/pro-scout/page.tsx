import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, FileText, Target, TrendingUp, Eye, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Pro Scout',
  description: 'Professional scouting platform for opponent analysis and strategic intelligence',
};

export default function ProScoutPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
            Pro Scout
          </h1>
          <p className="text-muted-foreground mt-2">
            Professional scouting and opponent analysis intelligence platform
          </p>
        </div>
        <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
          Coming Soon
        </Badge>
      </div>

      {/* Module Overview */}
      <Card className="border-indigo-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-indigo-500" />
            Advanced Scouting Intelligence
          </CardTitle>
          <CardDescription>
            Comprehensive opponent analysis and strategic scouting reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pro Scout provides professional-grade opponent analysis, tendency tracking, and strategic 
            intelligence reports. Automatically generates scouting reports with Triangle Defense integration, 
            formation tendencies, and M.E.L. AI strategic recommendations.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium">Opponent Analysis</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Comprehensive tendency and pattern identification
              </p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium">Auto Reports</span>
              </div>
              <p className="text-xs text-muted-foreground">
                AI-generated scouting reports with key insights
              </p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium">Game Planning</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Strategic recommendations and exploit identification
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scouting Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Analysis Categories</CardTitle>
            <CardDescription>Comprehensive opponent breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Formation Tendencies</span>
              <Badge variant="outline">By Down & Distance</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Personnel Groupings</span>
              <Badge variant="outline">11, 12, 21, 22</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Play Action Usage</span>
              <Badge variant="outline">Situational</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Red Zone Patterns</span>
              <Badge variant="outline">Inside 20</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Third Down Analysis</span>
              <Badge variant="outline">Critical Situations</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Generation</CardTitle>
            <CardDescription>Automated scouting intelligence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-accent/50">
              <p className="text-sm font-medium mb-2">Weekly Opponent Report</p>
              <p className="text-xs text-muted-foreground">
                Complete tendency breakdown with Triangle Defense counters and strategic exploits
              </p>
            </div>
            <div className="p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Self-Scout Analysis</p>
              <p className="text-xs text-muted-foreground">
                Internal tendency audit to identify predictable patterns
              </p>
            </div>
            <div className="p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Individual Player Reports</p>
              <p className="text-xs text-muted-foreground">
                Key player analysis with strengths, weaknesses, tendencies
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Triangle Defense Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Triangle Defense Scouting Integration</CardTitle>
          <CardDescription>Formation-based opponent analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pro Scout automatically categorizes opponent formations using Triangle Defense methodology, 
              identifying LARRY, LINDA, RICKY, RITA patterns and their success rates.
            </p>
            <div className="grid gap-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                <div>
                  <p className="text-sm font-medium">Opponent Formation Usage</p>
                  <p className="text-xs text-muted-foreground">LARRY: 42% | LINDA: 23% | RICKY: 28% | RITA: 7%</p>
                </div>
                <Badge variant="outline">156 plays analyzed</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <Card>
        <CardHeader>
          <CardTitle>Planned Features</CardTitle>
          <CardDescription>Advanced scouting capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-sm font-medium">Video Integration</p>
              <p className="text-xs text-muted-foreground">Link clips to tendency reports with automatic tagging</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-sm font-medium">Competitive Intelligence</p>
              <p className="text-xs text-muted-foreground">Track multiple opponents across season with trend analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-sm font-medium">M.E.L. AI Insights</p>
              <p className="text-xs text-muted-foreground">AI-generated game planning recommendations</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-sm font-medium">Report Sharing</p>
              <p className="text-xs text-muted-foreground">Collaborative scouting with coaching staff annotations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon CTA */}
      <Card className="border-indigo-500/20 bg-indigo-500/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Search className="h-12 w-12 mx-auto text-indigo-500" />
            <div>
              <h3 className="text-lg font-semibold">Professional Scouting Platform Coming Soon</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Pro Scout brings advanced opponent analysis with Triangle Defense integration, 
                automated report generation, and M.E.L. AI strategic insights. Expected launch Q2 2025.
              </p>
            </div>
            <Button variant="outline" className="border-indigo-500/20">
              Request Demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
