import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Users, Video, Target, TrendingUp, FileText } from 'lucide-react';

export const metadata = {
  title: 'Power Playbooks',
  description: 'Interactive digital playbooks with Triangle Defense and yard-based animation',
};

export default function PowerPlaybooksPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
            Power Playbooks
          </h1>
          <p className="text-muted-foreground mt-2">
            Interactive digital playbooks with Triangle Defense integration
          </p>
        </div>
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          Active
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">847</div>
            <p className="text-xs text-muted-foreground">+127 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaborators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Active coaching staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Animations</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">423</div>
            <p className="text-xs text-muted-foreground">Yard-based routes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Execution accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Playbook Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Digital Playbook Canvas</CardTitle>
          <CardDescription>
            120×53.33 yard football field with Konva.js animation and Triangle Defense overlays
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[500px] bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <div className="text-center space-y-4 p-8">
              <Target className="h-16 w-16 mx-auto text-amt-red" />
              <div>
                <h3 className="text-lg font-semibold">Power Playbooks Canvas</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                  Interactive yard-based animation system with real-time collaboration, Triangle Defense formation classification, and M.E.L. AI analysis integration.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Features:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline">Konva.js Canvas</Badge>
                  <Badge variant="outline">Anime.js Routes</Badge>
                  <Badge variant="outline">WebSocket Sync</Badge>
                  <Badge variant="outline">Triangle Defense</Badge>
                  <Badge variant="outline">GraphQL Integration</Badge>
                </div>
              </div>
              <Button className="bg-amt-red hover:bg-amt-red/90">
                Open Playbook Editor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Triangle Defense Formations */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Triangle Defense Integration</CardTitle>
            <CardDescription>Formation classification by type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg border" style={{ borderColor: '#4ECDC4' }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4ECDC4' }}></div>
                  <span className="font-semibold">LARRY</span>
                </div>
                <p className="text-xs text-muted-foreground">MO Left + Male</p>
                <p className="text-sm font-medium mt-1">342 plays</p>
              </div>
              <div className="p-3 rounded-lg border" style={{ borderColor: '#FF6B6B' }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF6B6B' }}></div>
                  <span className="font-semibold">LINDA</span>
                </div>
                <p className="text-xs text-muted-foreground">MO Left + Female</p>
                <p className="text-sm font-medium mt-1">187 plays</p>
              </div>
              <div className="p-3 rounded-lg border" style={{ borderColor: '#FFD93D' }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFD93D' }}></div>
                  <span className="font-semibold">RICKY</span>
                </div>
                <p className="text-xs text-muted-foreground">MO Right + Male</p>
                <p className="text-sm font-medium mt-1">289 plays</p>
              </div>
              <div className="p-3 rounded-lg border" style={{ borderColor: '#9B59B6' }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#9B59B6' }}></div>
                  <span className="font-semibold">RITA</span>
                </div>
                <p className="text-xs text-muted-foreground">MO Right + Female</p>
                <p className="text-sm font-medium mt-1">156 plays</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Playbooks</CardTitle>
            <CardDescription>Latest play creations and edits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <div className="flex-1">
                <p className="text-sm font-medium">3rd Down Package - Rita Formation</p>
                <p className="text-xs text-muted-foreground">Created by Courtney Sellars • 2 hours ago</p>
              </div>
              <Badge variant="outline">12 plays</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <div className="flex-1">
                <p className="text-sm font-medium">Goal Line - Larry Strong</p>
                <p className="text-xs text-muted-foreground">Created by Denauld Brown • 1 day ago</p>
              </div>
              <Badge variant="outline">8 plays</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <div className="flex-1">
                <p className="text-sm font-medium">Two-Minute Drill - Multiple Formations</p>
                <p className="text-xs text-muted-foreground">Created by M.E.L. AI • 2 days ago</p>
              </div>
              <Badge variant="outline">15 plays</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common playbook tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Button variant="outline" className="justify-start">
              <Play className="mr-2 h-4 w-4" />
              New Play
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Import Playbook
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="mr-2 h-4 w-4" />
              Collaborate
            </Button>
            <Button variant="outline" className="justify-start">
              <Video className="mr-2 h-4 w-4" />
              Animate Routes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
