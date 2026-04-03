"use client";

import { useState } from "react";
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
import TripMap from "./trip-map";
import type { TripListItem } from "../data";

type TripDetailViewProps = {
  trip: TripListItem;
};

export default function TripDetailView({ trip }: TripDetailViewProps) {
  const [selectedPlace, setSelectedPlace] = useState(trip.places[0] ?? null);

  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:p-6">
      <Card className="border-border/60 bg-card/80 overflow-hidden">
        <CardHeader>
          <div className="pt-1">
            <CardTitle className="text-2xl">{trip.name}</CardTitle>
            <CardDescription className="mt-2">{trip.summary}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge>{trip.city}</Badge>
            <Badge variant="secondary">{trip.theme}</Badge>
            <Badge variant="outline">{trip.period}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {trip.places.map((place) => {
            const isActive = selectedPlace?.name === place.name;

            return (
              <button
                key={place.name}
                type="button"
                onClick={() => setSelectedPlace(place)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  isActive
                    ? "border-primary/50 bg-primary/5"
                    : "bg-background hover:bg-accent"
                }`}
              >
                <img
                  src={place.image}
                  alt={place.name}
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{place.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {place.city} · {place.category}
                  </p>
                </div>
                <Icons.arrowRight className="text-muted-foreground h-4 w-4" />
              </button>
            );
          })}

          <div className="pt-2">
            <Button variant="secondary" className="w-full" asChild>
              <a href="/dashboard/trips">Back to trip list</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 overflow-hidden p-0">
        <TripMap
          places={trip.places}
          selectedPlace={selectedPlace}
          showRoute
          preferRoadRoute
        />
      </Card>
    </div>
  );
}
