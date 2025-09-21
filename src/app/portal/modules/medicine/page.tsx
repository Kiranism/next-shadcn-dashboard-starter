import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Activity, AlertTriangle, FileText, TrendingUp, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Medicine',
  description: 'Sports medicine and player health monitoring management system',
};

export default function MedicinePage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
            Medicine
          </h1>
          <p className="text-muted-foreground mt-2">
            Sports medicine and comprehensive player health monitoring platform
          </p>
        </div>
        <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
          Coming Soon
        </Badge>
      </div>

      {/* Module Overview */}
      <Card className="border-rose-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            Athletic Health Management
          </CardTitle>
          <CardDescription>
            Complete medical records, injury tracking, and return-to-play protocols
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Medicine module provides comprehensive sports medicine management from injury documentation to 
            rehabilitation tracking. Monitor player health, manage medical records, coordinate with athletic 
            training staff, and integrate with Strength module for complete athlete wellness oversight.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-medium">Medical Records</span>
              </div>
              <p className="text-xs text-muted-foreground">
                HIPAA-compliant health documentation
              </p>
            </div>
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-medium">Injury Management</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Complete injury tracking and rehabilitation
              </p>
            </div>
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-medium">Return-to-Play</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Progressive protocols and clearance tracking
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Monitoring */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Injury Categories</CardTitle>
            <CardDescription>Comprehensive health tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Acute Injuries</span>
              <Badge variant="outline">23 active cases</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Chronic Conditions</span>
              <Badge variant="outline">12 managed</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Concussion Protocol</span>
              <Badge variant="outline">3 in progress</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Preventive Care</span>
              <Badge variant="outline">89 checkups</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
              <span className="text-sm">Cleared to Play</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-500">112 athletes</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Return-to-Play Protocols</CardTitle>
            <CardDescription>Progressive recovery phases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-accent/50">
              <p className="text-sm font-medium mb-2">Phase 1: Rest & Recovery</p>
              <p className="text-xs text-muted-foreground">
                Initial healing with daily medical monitoring and symptom tracking
              </p>
            </div>
            <div className="p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Phase 2: Limited Activity</p>
              <p className="text-xs text-muted-foreground">
                Gradual introduction of light exercise with therapist supervision
              </p>
            </div>
            <div className="p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Phase 3: Full Clearance</p>
              <p className="text-xs text-muted-foreground">
                Medical approval for complete return to contact activities
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Points */}
      <Card>
        <CardHeader>
          <CardTitle>Module Integrations</CardTitle>
          <CardDescription>Coordinated athlete wellness management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium">Strength Module</p>
                <p className="text-xs text-muted-foreground">Share injury data for modified training programs</p>
              </div>
            </div>
            <Badge variant="outline">Connected</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amt-accent/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-amt-accent" />
              </div>
              <div>
                <p className="font-medium">M.E.L. AI</p>
                <p className="text-xs text-muted-foreground">AI-powered injury risk prediction and prevention</p>
              </div>
            </div>
            <Badge variant="outline">Connected</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Medical Staff Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Staff Dashboard</CardTitle>
          <CardDescription>Team health overview and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border bg-accent/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Daily Check-ins</span>
              </div>
              <p className="text-2xl font-bold">124/124</p>
              <p className="text-xs text-muted-foreground mt-1">All athletes reported</p>
            </div>
            <div className="p-4 rounded-lg border bg-accent/30">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="font-medium">Recovery Progress</span>
              </div>
              <p className="text-2xl font-bold">89%</p>
              <p className="text-xs text-muted-foreground mt-1">On track or ahead</p>
            </div>
            <div className="p-4 rounded-lg border bg-accent/30">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Active Treatments</span>
              </div>
              <p className="text-2xl font-bold">47</p>
              <p className="text-xs text-muted-foreground mt-1">Rehabilitation plans</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <Card>
        <CardHeader>
          <CardTitle>Planned Features</CardTitle>
          <CardDescription>Advanced medical management capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-rose-500" />
            <div>
              <p className="text-sm font-medium">Electronic Medical Records (EMR)</p>
              <p className="text-xs text-muted-foreground">HIPAA-compliant digital health documentation system</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-rose-500" />
            <div>
              <p className="text-sm font-medium">Telemedicine Integration</p>
              <p className="text-xs text-muted-foreground">Virtual consultations with team physicians and specialists</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-rose-500" />
            <div>
              <p className="text-sm font-medium">Medication Tracking</p>
              <p className="text-xs text-muted-foreground">Prescription management with NCAA compliance monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-rose-500" />
            <div>
              <p className="text-sm font-medium">Injury Analytics</p>
              <p className="text-xs text-muted-foreground">Pattern recognition for injury prevention strategies</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon CTA */}
      <Card className="border-rose-500/20 bg-rose-500/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Heart className="h-12 w-12 mx-auto text-rose-500" />
            <div>
              <h3 className="text-lg font-semibold">Medical Management Platform Coming Soon</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Medicine module brings comprehensive sports medicine management with HIPAA-compliant records, 
                injury tracking, return-to-play protocols, and Strength module integration. Expected launch Q3 2025.
              </p>
            </div>
            <Button variant="outline" className="border-rose-500/20">
              Request Information
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
