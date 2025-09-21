import { Suspense } from 'react';
import { MELCommandPrompt } from '@/components/portal/mel-prompt';
import { ModuleGrid } from '@/components/portal/module-grid';
import { QuickStats } from '@/components/portal/quick-stats';
import { RecentActivity } from '@/components/portal/recent-activity';

export const metadata = {
  title: 'Home',
  description: 'AMT Portal Home - Your command center for all 12 modules',
};

export default function PortalHomePage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      {/* M.E.L. Command Interface - ONA-style */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amt-red to-amt-accent bg-clip-text text-transparent">
          What do you want to get done today?
        </h1>
        
        <Suspense fallback={<MELCommandPromptSkeleton />}>
          <MELCommandPrompt />
        </Suspense>
      </section>

      {/* Quick Stats Overview */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Today's Overview
        </h2>
        <Suspense fallback={<QuickStatsSkeleton />}>
          <QuickStats />
        </Suspense>
      </section>

      {/* 12 AMT Modules Grid */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          AMT Platform Modules
        </h2>
        <Suspense fallback={<ModuleGridSkeleton />}>
          <ModuleGrid />
        </Suspense>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Recent Activity
        </h2>
        <Suspense fallback={<RecentActivitySkeleton />}>
          <RecentActivity />
        </Suspense>
      </section>
    </div>
  );
}

// Loading Skeletons
function MELCommandPromptSkeleton() {
  return (
    <div className="w-full h-14 bg-muted/50 rounded-lg animate-pulse" />
  );
}

function QuickStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 bg-muted/50 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function ModuleGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-48 bg-muted/50 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
