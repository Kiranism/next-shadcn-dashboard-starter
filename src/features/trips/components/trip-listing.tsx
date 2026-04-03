import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import { getQueryClient } from "@/lib/query-client";
import { tripsQueryOptions } from "../api/queries";
import { TripsGrid, TripsGridSkeleton } from "./trip-grid";

export default function TripListingPage() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(tripsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<TripsGridSkeleton />}>
        <TripsGrid />
      </Suspense>
    </HydrationBoundary>
  );
}
