import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, Brain, Zap, LineChart, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Dynamic Predictor',
  description: 'A* algorithm game outcome modeling and strategic prediction engine',
};

export default function DynamicPredictorPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
            Dynamic Predictor
          </h1>
          <p className="text-muted-foreground mt-2">
            A* algorithm-powered prediction engine for game outcome modeling
          </p>
        </div>
        <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
          Coming Soon
        </Badge>
      </div>

      {/* Module Overview */}
      <Card className="border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Predictive Analytics Engine
          </CardTitle>
          <CardDescription>
            Advanced algorithms for game outcome prediction and strategic decision optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Dynamic Predictor uses the A* pathfinding algorithm combined with machine learning to predict 
            game outcomes, play success probabilities, and optimal strategic decisions. Integrates with 
            Triangle Defense data and M.E.L. AI for comprehensive predictive modeling.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Real-time Predictions</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Live game outcome probabilities during play
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">A* Algorithm</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Optimal path finding for strategic decisions
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <LineChart className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Trend Analysis</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Historical pattern recognition and forecasting
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prediction Types</CardTitle>
            <CardDescription>What the engine can forecast</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Game Outcome Probability</span>
              <Badge variant="outline">Win %</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Play Success Rate</span>
              <Badge variant="outline">Formation-based</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Optimal 4th Down Decisions</span>
              <Badge variant="outline">Go/Punt/FG</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">2-Point Conversion Success</span>
              <Badge variant="outline">Situational</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Time Management Strategy</span>
              <Badge variant="outline">Clock Optimization</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Algorithm Features</CardTitle>
            <CardDescription>A* pathfinding implementation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-accent/50">
              <p className="text-sm font-medium mb-2">Heuristic Evaluation</p>
              <p className="text-xs text-muted-foreground">
                Evaluates all possible strategic paths to find optimal decision tree
              </p>
            </div>
            <div className="p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Cost Function</p>
              <p className="text-xs text-muted-foreground">
                Weights risks vs rewards based on game situation and Triangle Defense data
              </p>
            </div>
            <div className="p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Path Optimization</p>
              <p className="text-xs text-muted-foreground">
                Finds shortest path to victory through strategic decision nodes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration with Triangle Defense */}
      <Card>
        <CardHeader>
          <CardTitle>Triangle Defense Data Integration</CardTitle>
          <CardDescription>Formation-specific success predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 rounded-lg border bg-accent/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Formation Success Modeling</h4>
                <Badge>94% Accuracy</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Predicts play success based on offensive formation vs Triangle Defense classification
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between p-2 bg-background rounded">
                  <span>LARRY vs Cover 3</span>
                  <span className="text-green-500">67% success</span>
                </div>
                <div className="flex justify-between p-2 bg-background rounded">
                  <span>LINDA vs Cover 4</span>
                  <span className="text-yellow-500">52% success</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <Card>
        <CardHeader>
          <CardTitle>Planned Capabilities</CardTitle>
          <CardDescription>Advanced features in development</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Live Win Probability Charts</p>
              <p className="text-xs text-muted-foreground">Real-time probability graphs throughout game</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Decision Recommendation Engine</p>
              <p className="text-xs text-muted-foreground">AI-suggested optimal play calls by situation</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Monte Carlo Simulations</p>
              <p className="text-xs text-muted-foreground">10,000+ game simulations for probability modeling</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">M.E.L. AI Integration</p>
              <p className="text-xs text-muted-foreground">Coaching insights combined with predictive analytics</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon CTA */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <TrendingUp className="h-12 w-12 mx-auto text-green-500" />
            <div>
              <h3 className="text-lg font-semibold">Predictive Engine In Development</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Dynamic Predictor brings advanced A* algorithm pathfinding to football strategy. 
                Make optimal decisions with real-time probability modeling. Expected launch Q3 2025.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="border-green-500/20">
                Learn More
              </Button>
              <Button variant="outline" className="border-green-500/20">
                Join Beta Program
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
