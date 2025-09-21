import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Upload, Eye, Cpu, TrendingUp, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Dynamic Fabricator',
  description: 'Video-to-data conversion with advanced computer vision processing',
};

export default function DynamicFabricatorPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
            Dynamic Fabricator
          </h1>
          <p className="text-muted-foreground mt-2">
            Advanced video-to-data conversion with computer vision and AI processing
          </p>
        </div>
        <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
          Coming Soon
        </Badge>
      </div>

      {/* Module Overview */}
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-purple-500" />
            Module Overview
          </CardTitle>
          <CardDescription>
            Transform game film into actionable data with computer vision and AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The Dynamic Fabricator uses advanced computer vision algorithms (OpenCV, YOLO, InsightFace) 
            to automatically convert football game film into structured data. Extract player positions, 
            formation classifications, and play outcomes directly from video.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Computer Vision</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatic player tracking and field recognition
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">AI Processing</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Formation classification and play identification
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Data Export</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Structured output for analytics and playbooks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expected Features */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Planned Features</CardTitle>
            <CardDescription>What to expect when module launches</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-3 p-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Automatic Formation Detection</p>
                <p className="text-xs text-muted-foreground">Triangle Defense classification from video</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Player Tracking</p>
                <p className="text-xs text-muted-foreground">22 player position extraction per frame</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Play Outcome Analysis</p>
                <p className="text-xs text-muted-foreground">Automatic success/failure classification</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Real-time Processing</p>
                <p className="text-xs text-muted-foreground">Sub-second video analysis with GPU acceleration</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical Stack</CardTitle>
            <CardDescription>Computer vision and AI technologies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">OpenCV</span>
                <Badge variant="outline">Video Processing</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">YOLO (Ultralytics)</span>
                <Badge variant="outline">Object Detection</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">InsightFace</span>
                <Badge variant="outline">Player Recognition</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Python/FastAPI</span>
                <Badge variant="outline">Backend Processing</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AWS S3 + Lambda</span>
                <Badge variant="outline">Cloud Processing</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Integration with AMT Platform</CardTitle>
          <CardDescription>How Dynamic Fabricator connects with other modules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amt-red/10 flex items-center justify-center">
                <Video className="h-5 w-5 text-amt-red" />
              </div>
              <div>
                <p className="font-medium">Power Playbooks</p>
                <p className="text-xs text-muted-foreground">Auto-generate playbooks from video analysis</p>
              </div>
            </div>
            <Badge variant="outline">Connected</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amt-accent/10 flex items-center justify-center">
                <Cpu className="h-5 w-5 text-amt-accent" />
              </div>
              <div>
                <p className="font-medium">M.E.L. AI</p>
                <p className="text-xs text-muted-foreground">AI analysis of extracted formations</p>
              </div>
            </div>
            <Badge variant="outline">Connected</Badge>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Upload className="h-12 w-12 mx-auto text-purple-500" />
            <div>
              <h3 className="text-lg font-semibold">Module In Development</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                The Dynamic Fabricator is currently under development. Expected launch in Q2 2025. 
                Contact the development team for early access or feature requests.
              </p>
            </div>
            <Button variant="outline" className="border-purple-500/20">
              Request Early Access
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
