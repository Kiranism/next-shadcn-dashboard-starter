import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Award, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Academics',
  description: 'Student-athlete academic tracking and NCAA eligibility management',
};

export default function AcademicsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
            Academics
          </h1>
          <p className="text-muted-foreground mt-2">
            Student-athlete academic performance and NCAA eligibility monitoring
          </p>
        </div>
        <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
          Coming Soon
        </Badge>
      </div>

      {/* Module Overview */}
      <Card className="border-violet-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-violet-500" />
            Academic Performance Management
          </CardTitle>
          <CardDescription>
            Complete academic tracking, tutoring coordination, and eligibility monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Academics module provides comprehensive student-athlete academic support from GPA tracking to 
            NCAA eligibility compliance. Monitor grades, coordinate tutoring, track progress toward degree, 
            and ensure all student-athletes maintain athletic eligibility through academic success.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-medium">Grade Tracking</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Real-time GPA and course performance monitoring
              </p>
            </div>
            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-medium">Eligibility Tracking</span>
              </div>
              <p className="text-xs text-muted-foreground">
                NCAA compliance and progress monitoring
              </p>
            </div>
            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-medium">Academic Support</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tutoring and study hall coordination
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Academic Performance</CardTitle>
            <CardDescription>Current semester overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-lg border bg-accent/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Team GPA</span>
                <span className="text-2xl font-bold text-green-500">3.24</span>
              </div>
              <p className="text-xs text-muted-foreground">Above program minimum (2.5)</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2">
                <span className="text-sm">4.0 GPA Athletes</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-500">12</Badge>
              </div>
              <div className="flex items-center justify-between p-2">
                <span className="text-sm">3.0+ GPA Athletes</span>
                <Badge variant="outline">87</Badge>
              </div>
              <div className="flex items-center justify-between p-2">
                <span className="text-sm">Academic Warning</span>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">8</Badge>
              </div>
              <div className="flex items-center justify-between p-2">
                <span className="text-sm">Academic Probation</span>
                <Badge variant="outline" className="bg-red-500/10 text-red-500">3</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NCAA Eligibility Status</CardTitle>
            <CardDescription>Compliance monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
              <div>
                <p className="font-medium text-green-500">Eligible to Compete</p>
                <p className="text-xs text-muted-foreground">Meeting all requirements</p>
              </div>
              <span className="text-2xl font-bold text-green-500">112</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
              <div>
                <p className="font-medium text-yellow-500">Progress Warning</p>
                <p className="text-xs text-muted-foreground">Needs improvement</p>
              </div>
              <span className="text-2xl font-bold text-yellow-500">8</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
              <div>
                <p className="font-medium text-red-500">Ineligible</p>
                <p className="text-xs text-muted-foreground">Academic intervention required</p>
              </div>
              <span className="text-2xl font-bold text-red-500">4</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Support Programs */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Support Services</CardTitle>
          <CardDescription>Available resources and interventions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 rounded-lg border bg-accent/30">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Active Tutoring Sessions</p>
                <Badge variant="outline">47 weekly</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Individual and group tutoring across all subjects</p>
            </div>
            <div className="p-3 rounded-lg border bg-accent/30">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Study Hall Participation</p>
                <Badge variant="outline">234 hours/week</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Mandatory for students below 3.0 GPA</p>
            </div>
            <div className="p-3 rounded-lg border bg-accent/30">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Academic Mentoring</p>
                <Badge variant="outline">32 pairs</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Upperclassmen mentoring freshmen</p>
            </div>
            <div className="p-3 rounded-lg border bg-accent/30">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Time Management Workshops</p>
                <Badge variant="outline">Monthly</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Skills training for student-athletes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Degree Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Degree Progress Tracking</CardTitle>
          <CardDescription>Academic milestone monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
              <div className="flex-1">
                <p className="text-sm font-medium">On Track for Graduation</p>
                <p className="text-xs text-muted-foreground">Meeting degree requirements and timeline</p>
              </div>
              <Badge variant="outline">98 athletes</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium">Delayed Progress</p>
                <p className="text-xs text-muted-foreground">May need extra semester or summer courses</p>
              </div>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">18 athletes</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium">Degree Completion</p>
                <p className="text-xs text-muted-foreground">Graduated while maintaining eligibility</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-500">8 this year</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <Card>
        <CardHeader>
          <CardTitle>Planned Features</CardTitle>
          <CardDescription>Advanced academic management capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-violet-500" />
            <div>
              <p className="text-sm font-medium">SIS Integration</p>
              <p className="text-xs text-muted-foreground">Direct connection to Student Information Systems for real-time grades</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-violet-500" />
            <div>
              <p className="text-sm font-medium">Early Alert System</p>
              <p className="text-xs text-muted-foreground">Automated notifications for academic struggles and intervention triggers</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-violet-500" />
            <div>
              <p className="text-sm font-medium">Career Planning</p>
              <p className="text-xs text-muted-foreground">Post-graduation career preparation and internship coordination</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2">
            <CheckCircle className="h-5 w-5 text-violet-500" />
            <div>
              <p className="text-sm font-medium">M.E.L. AI Study Recommendations</p>
              <p className="text-xs text-muted-foreground">Personalized academic support suggestions based on performance patterns</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon CTA */}
      <Card className="border-violet-500/20 bg-violet-500/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <GraduationCap className="h-12 w-12 mx-auto text-violet-500" />
            <div>
              <h3 className="text-lg font-semibold">Academic Management Platform Coming Soon</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Academics module brings comprehensive student-athlete academic tracking with NCAA eligibility 
                monitoring, tutoring coordination, and degree progress management. Expected launch Q3 2025.
              </p>
            </div>
            <Button variant="outline" className="border-violet-500/20">
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
