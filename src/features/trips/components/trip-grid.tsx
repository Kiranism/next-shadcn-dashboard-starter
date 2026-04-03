"use client";

import type { ComponentType } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { tripsQueryOptions } from "../api/queries";

function statusClasses(status: string) {
  switch (status) {
    case "Booked":
      return "border-blue-500/20 bg-blue-500/10 text-blue-200";
    case "Active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "Completed":
      return "border-zinc-500/20 bg-zinc-500/10 text-zinc-200";
    default:
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
        </div>
        <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-2xl">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TripsGrid() {
  const { data } = useSuspenseQuery(tripsQueryOptions());
  const trips = data.trips;

  const stats = {
    total: trips.length,
    planning: trips.filter((trip) => trip.status === "Planning").length,
    booked: trips.filter((trip) => trip.status === "Booked").length,
    active: trips.filter((trip) => trip.status === "Active").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Icons.calendar}
          label="Total Trips"
          value={String(stats.total)}
          hint="Saved trip lists"
        />
        <StatCard
          icon={Icons.clock}
          label="Planning"
          value={String(stats.planning)}
          hint="Still shaping the details"
        />
        <StatCard
          icon={Icons.check}
          label="Booked"
          value={String(stats.booked)}
          hint="Ready to go"
        />
        <StatCard
          icon={Icons.sparkles}
          label="Active"
          value={String(stats.active)}
          hint="Already underway"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {trips.map((trip) => (
          <Card
            key={trip.id}
            className="overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-muted/40 shadow-sm"
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-xl">{trip.title}</CardTitle>
                <CardDescription className="mt-2 text-sm">
                  {trip.summary}
                </CardDescription>
              </div>
              <Badge
                className={cn(
                  "shrink-0 border px-2.5 py-1 font-medium",
                  statusClasses(trip.status),
                )}
              >
                {trip.status}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{trip.destination}</Badge>
                <Badge variant="outline">{trip.travel_window}</Badge>
                <Badge variant="outline">{trip.travelers}</Badge>
                <Badge variant="outline">{trip.budget}</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
                    Style
                  </p>
                  <p className="mt-2 font-medium">{trip.style}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
                    Focus
                  </p>
                  <p className="mt-2 font-medium">{trip.focus}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {trip.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="bg-primary/5 text-primary rounded-full border border-primary/10 px-3 py-1 text-xs"
                  >
                    {highlight}
                  </span>
                ))}
              </div>

              <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
                <span>
                  Created{" "}
                  {formatDate(trip.created_at, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>
                  Updated{" "}
                  {formatDate(trip.updated_at, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function TripsGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-72 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
