import Link from "next/link";
import PageContainer from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { trips } from "@/features/trips/data";

export const metadata = {
  title: "Dashboard: Trips",
};

export default function TripsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle="Trips"
      pageDescription="Pick a trip to open its map."
    >
      <div className="flex min-h-[calc(100dvh-220px)] items-center justify-center px-4">
        <div className="w-full max-w-5xl space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.35em]">
              Trip Lists
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Choose a trip
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Two simple mock lists. Clicking one opens the map view.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {trips.map((trip) => (
              <Link key={trip.id} href={`/dashboard/trips/${trip.id}`}>
                <Card className="hover:border-primary/40 hover:bg-accent/30 h-full transition">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl">{trip.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {trip.summary}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {trip.places.length} stops
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge>{trip.city}</Badge>
                      <Badge variant="secondary">{trip.theme}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{trip.period}</span>
                      <span className="inline-flex items-center gap-1">
                        Open map <Icons.arrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="flex justify-center">
            <Button variant="secondary" asChild>
              <Link href={`/dashboard/trips/${trips[0].id}`}>
                Open first trip
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
