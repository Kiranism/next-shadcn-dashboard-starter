import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Film, Scissors, Play, Target, Layers } from 'lucide-react';

export const metadata = {
  title: 'Game Changer',
  description: 'Professional video editing with Triangle Defense overlays and analytics timeline',
};

export default function GameChangerPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
            Game Changer
          </h1>
          <p className="text-muted-foreground mt-2">
            Professional video editing with Triangle Defense overlays and coaching annotations
          </p>
        </div>
        <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
          Coming Soon
        </Badge>
      </div>

      {/* Module Overview */}
      <Card className="border-pink-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5 text-pink-500" />
            Professional Video Editing Suite
          </CardTitle>
          <CardDescription>
            Advanced video editing platform designed specifically for football coaching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Game Changer provides professional-grade video editing tools integrated with Triangle Defense 
            analytics. Create highlight reels, coaching breakdowns, and presentation videos with automatic 
            formation overlays and M.E.L. AI insights embedded directly in the timeline.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Scissors className="h-4 w-4 text-pink-500" />
                <span className="text-sm font-medium">Smart Editing</span>
              </div>
              <p className="text-xs text-muted-foreground">
                AI-powered clip selection and trimming
              </p>
            </div>
            <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-4 w-4 text-pink-500" />
                <span className="text-sm font-medium">Overlay System</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Triangle Defense formations and annotations
              </p>
            </div>
            <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Play className="h-4 w-4 text-pink-500" />
                <span className="text-sm font-medium">Export & Share</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Multi-format export and team sharing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Features */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Editing Features</CardTitle>
            <CardDescription>Professional tools for coaching videos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2">
              <span className="text-sm">Multi-track timeline editing</span>
              <Badge variant="outline">Pro</Badge>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-sm">Formation overlay library</span>
              <Badge variant="outline">Triangle Defense</Badge>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-sm">Slow-motion analysis tools</span>
              <Badge variant="outline">Frame-by-frame</Badge>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-sm">Voice annotation recording</span>
              <Badge variant="outline">Audio</Badge>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-sm">M.E.L. AI auto-suggestions</span>
              <Badge variant="outline">AI-Powered</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Triangle Defense Integration</CardTitle>
            <CardDescription>Automatic formation overlays</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="p-3 rounded-lg bg-accent/50">
              <p className="text-sm font-medium mb-2">Formation Recognition</p>
              <p className="text-xs text-muted-foreground">
                Automatically detect and overlay LARRY, LINDA, RICKY, RITA formations with color-coded indicators
              </p>
            </div>
            <div className="p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Triangle Overlays</p>
              <p className="text-xs text-muted-foreground">
                Visual triangle relationship markers (EDGE, BRACKET, SEAL, FUNNEL, WALL, SWARM, TRAP)
              </p>
            </div>
            <div className="p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Route Animation</p>
              <p className="text-xs text-muted-foreground">
                Import yard-based animations from Power Playbooks directly into video timeline
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Points */}
      <Card>
        <CardHeader>
          <CardTitle>Module Integrations</CardTitle>
          <CardDescription>Seamless workflow with other AMT modules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Video className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium">Dynamic Fabricator</p>
                <p className="text-xs text-muted-foreground">Import processed game film with data overlays</p>
              </div>
            </div>
            <Badge variant="outline">Import</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amt-accent/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-amt-accent" />
              </div>
              <div>
                <p className="font-medium">M.E.L. AI</p>
                <p className="text-xs text-muted-foreground">AI-generated coaching insights on timeline</p>
              </div>
            </div>
            <Badge variant="outline">AI Assist</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amt-red/10 flex items-center justify-center">
                <Play className="h-5 w-5 text-amt-red" />
              </div>
              <div>
                <p className="font-medium">Power Playbooks</p>
                <p className="text-xs text-muted-foreground">Sync playbook animations with video</p>
              </div>
            </div>
            <Badge variant="outline">Sync</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon CTA */}
      <Card className="border-pink-500/20 bg-pink-500/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Film className="h-12 w-12 mx-auto text-pink-500" />
            <div>
              <h3 className="text-lg font-semibold">Professional Editing Suite Coming Soon</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Game Changer is in active development with Triangle Defense integration, advanced editing tools, 
                and AI-powered features. Expected launch Q3 2025.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="border-pink-500/20">
                Join Waitlist
              </Button>
              <Button variant="outline" className="border-pink-500/20">
                View Roadmap
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
