'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SignUpPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amt-very-dark via-amt-dark to-amt-blue-gray p-4">
      <Card className="w-full max-w-md border-amt-blue-gray/20">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amt-red text-amt-white font-bold text-xl">
              AMT
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
            AMT Portal Access
          </CardTitle>
          <CardDescription className="text-center">
            Restricted access - Authorization required
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="default" className="border-amt-accent/20 bg-amt-accent/5">
            <AlertCircle className="h-4 w-4 text-amt-accent" />
            <AlertTitle className="text-amt-accent">Access Restricted</AlertTitle>
            <AlertDescription className="text-sm">
              The AMT Portal is a private platform restricted to authorized AnalyzeMyTeam staff only.
              Self-registration is not available.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="p-4 bg-card border border-border rounded-lg">
              <h3 className="font-semibold mb-2">Current Authorized Users:</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Denauld Brown (Founder)</li>
                <li>• Courtney Sellars (CEO/Chief Legal Officer)</li>
                <li>• M.E.L. (AI Core)</li>
                <li>• Alexandra Martinez (Chief Administrative Officer)</li>
              </ul>
            </div>

            <div className="p-4 bg-card border border-border rounded-lg">
              <h3 className="font-semibold mb-2">To Request Access:</h3>
              <p className="text-sm text-muted-foreground">
                Please contact the AnalyzeMyTeam administration team at{' '}
                <a href="mailto:admin@analyzemyteam.com" className="text-amt-accent hover:underline">
                  admin@analyzemyteam.com
                </a>
              </p>
            </div>
          </div>

          <Button
            onClick={() => router.push('/auth/sign-in')}
            className="w-full bg-amt-red hover:bg-amt-red/90"
          >
            Return to Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
