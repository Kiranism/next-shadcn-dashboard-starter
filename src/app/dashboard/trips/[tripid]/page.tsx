"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import BotIcon from "./components/bot-icon";
import ChatAside from "./components/chat-aside";
import Overlay from "./components/overlay";
import Map, { Place } from "./components/map";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTripById } from "@/features/trips/data";
import { DEFAULT_TRIP_PLACES } from "@/features/trips/constants/default-places";
import {
  readStoredTrips,
  updateStoredTripPlaces,
} from "@/features/trips/lib/custom-trips-storage";
import { sortPlacesByTimeline } from "@/features/trips/lib/place-timeline";

function normalizePlaceForEdit(place: Place): Place {
  return {
    ...place,
    day: place.day ?? "Mon",
    date: place.date ?? new Date().toISOString().slice(0, 10),
    startTime: place.startTime ?? "09:00",
    endTime: place.endTime ?? "10:30",
  };
}

export default function Home() {
  const params = useParams<{ tripid: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = params?.tripid ?? "";
  const isCustomTrip = tripId.startsWith("custom-");
  const autoExportTriggeredRef = useRef(false);

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [preferRoadRoute, setPreferRoadRoute] = useState(true);
  const [isTripListMinimized, setIsTripListMinimized] = useState(false);
  const [isMobileTripListFullscreen, setIsMobileTripListFullscreen] =
    useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [editingPlaceSourceName, setEditingPlaceSourceName] = useState<
    string | null
  >(null);
  const [chatTaggedPlace, setChatTaggedPlace] = useState<Place | null>(null);
  const [editingQuery, setEditingQuery] = useState("");
  const [tripName, setTripName] = useState("Trip itinerary");
  const [isExportingCalendar, setIsExportingCalendar] = useState(false);
  const [isCalendarPermissionOpen, setIsCalendarPermissionOpen] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isCalendarStatusLoading, setIsCalendarStatusLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>(DEFAULT_TRIP_PLACES);

  useEffect(() => {
    if (!tripId) return;

    const storedTrip = readStoredTrips().find((item) => item.trip.id === tripId)?.trip;
    const staticTrip = getTripById(tripId);
    const resolvedPlaces = sortPlacesByTimeline(
      storedTrip?.places ?? staticTrip?.places ?? DEFAULT_TRIP_PLACES,
    );

    setTripName(storedTrip?.name ?? staticTrip?.name ?? "Trip itinerary");
    setPlaces(resolvedPlaces);
    setSelectedPlace(null);
    setChatTaggedPlace(null);
    setEditingPlace(null);
    setEditingPlaceSourceName(null);
  }, [tripId]);

  useEffect(() => {
    let isActive = true;

    const loadCalendarStatus = async () => {
      try {
        const response = await fetch('/api/google-calendar/status');
        if (!response.ok) {
          throw new Error('Unable to read Google Calendar connection status.');
        }

        const payload = (await response.json()) as { connected?: boolean };

        if (isActive) {
          setIsCalendarConnected(Boolean(payload.connected));
        }
      } catch {
        if (isActive) {
          setIsCalendarConnected(false);
        }
      } finally {
        if (isActive) {
          setIsCalendarStatusLoading(false);
        }
      }
    };

    void loadCalendarStatus();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const connected = searchParams.get('calendar_connected');
    const error = searchParams.get('calendar_error');
    const shouldAutoExport = searchParams.get('calendar_export') === '1';

    if (error) {
      toast.error(`Google Calendar connection failed: ${error}`);
      router.replace(`/dashboard/trips/${tripId}`);
      return;
    }

    if (shouldAutoExport && isCalendarConnected && !autoExportTriggeredRef.current) {
      autoExportTriggeredRef.current = true;
      setIsCalendarPermissionOpen(false);
      void handleExportCalendar().finally(() => {
        router.replace(`/dashboard/trips/${tripId}`);
      });
      return;
    }

    if (connected) {
      toast.success('Google Calendar connected successfully.');
      router.replace(`/dashboard/trips/${tripId}`);
    }
  }, [isCalendarConnected, router, searchParams, tripId]);

  const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleEditPlace = (place: Place) => {
    setEditingPlace(normalizePlaceForEdit(place));
    setEditingPlaceSourceName(place.name);
    setEditingQuery("");
  };

  const handleSavePlace = (updatedPlace: Place) => {
    setPlaces((currentPlaces) => {
      const nextPlaces = currentPlaces.map((place) =>
        place.name === editingPlaceSourceName ? updatedPlace : place,
      );
      const sortedPlaces = sortPlacesByTimeline(nextPlaces);

      if (isCustomTrip) {
        updateStoredTripPlaces(tripId, sortedPlaces);
      }

      return sortedPlaces;
    });

    setSelectedPlace(updatedPlace);
    setEditingPlaceSourceName(null);
    setEditingPlace(null);
  };

  const handleDeletePlace = (placeName: string) => {
    setPlaces((currentPlaces) => {
      const nextPlaces = currentPlaces.filter((place) => place.name !== placeName);
      const sortedPlaces = sortPlacesByTimeline(nextPlaces);

      if (isCustomTrip) {
        updateStoredTripPlaces(tripId, sortedPlaces);
      }

      return sortedPlaces;
    });

    setSelectedPlace((currentPlace) =>
      currentPlace?.name === placeName ? null : currentPlace,
    );
    setEditingPlaceSourceName(null);
    setEditingPlace(null);
  };

  const handleChatPlacesUpdate = (nextPlaces: Place[]) => {
    const sortedPlaces = sortPlacesByTimeline(nextPlaces);
    setPlaces(sortedPlaces);

    if (isCustomTrip) {
      updateStoredTripPlaces(tripId, sortedPlaces);
    }
  };

  const handleOpenChatForPlace = (place: Place) => {
    setSelectedPlace(place);
    setChatTaggedPlace(place);
    setIsChatOpen(true);
  };

  const handleExportCalendar = async () => {
    if (places.length === 0) {
      toast.error("There are no events to export.");
      return;
    }

    setIsExportingCalendar(true);

    try {
      const response = await fetch("/api/trips/calendar/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripName,
          places,
        }),
      });

      const payload = (await response.json()) as {
        createdCount?: number;
        failedCount?: number;
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ?? payload.message ?? "Failed to export events to Google Calendar.",
        );
      }

      const createdCount = payload.createdCount ?? places.length;
      const failedCount = payload.failedCount ?? 0;

      if (failedCount > 0) {
        toast.warning(
          `Exported ${createdCount} event${createdCount === 1 ? "" : "s"} with ${failedCount} skipped.`,
        );
        return;
      }

      toast.success(
        `Exported ${createdCount} event${createdCount === 1 ? "" : "s"} to Google Calendar.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to export events to Google Calendar.";
      toast.error(message);
    } finally {
      setIsExportingCalendar(false);
    }
  };

  const requestCalendarExport = () => {
    if (places.length === 0) {
      toast.error("There are no events to export.");
      return;
    }

    setIsCalendarPermissionOpen(true);
  };

  const confirmCalendarExport = async () => {
    if (!isCalendarConnected) {
      const returnTo = `/dashboard/trips/${tripId}?calendar_export=1`;
      window.location.assign(
        `/api/google-calendar/oauth/start?returnTo=${encodeURIComponent(returnTo)}`,
      );
      return;
    }

    setIsCalendarPermissionOpen(false);
    await handleExportCalendar();
  };

  const filteredEditPlaces = useMemo(() => {
    const search = editingQuery.trim().toLowerCase();
    if (!search) return places;

    return places.filter((place) => {
      const haystack = [place.name, place.city, place.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [editingQuery, places]);

  return (
    <div className="relative isolate h-[calc(100dvh-4rem)] w-full overflow-hidden [transform:translateZ(0)]">
      <div className="relative min-h-full w-full overflow-hidden bg-slate-950">
        <aside
          className={`fixed inset-x-3 bottom-3 z-10 overflow-hidden rounded-[28px] border border-white/12 bg-slate-950/78 shadow-[0_28px_80px_rgba(15,23,42,0.34)] backdrop-blur-xl transition-all duration-300 md:left-5 md:right-auto md:w-[min(420px,calc(100vw-2.5rem))] ${
            isMobileTripListFullscreen
              ? "top-3"
              : isTripListMinimized
                ? "top-[calc(100dvh-9rem)]"
                : "top-[56dvh]"
          } ${
            isTripListMinimized
              ? "md:top-5 md:bottom-auto md:h-[176px]"
              : "md:top-5 md:bottom-5"
          }`}
        >
          <div className="absolute right-2 top-2 z-20 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsTripListMinimized((prev) => {
                  const next = !prev;
                  if (next) {
                    setIsMobileTripListFullscreen(false);
                  }
                  return next;
                });
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300/80 bg-white/90 text-slate-700 shadow-sm transition hover:bg-white"
              aria-label={
                isTripListMinimized
                  ? "Maximize trip plan list"
                  : "Minimize trip plan list"
              }
              title={isTripListMinimized ? "Maximize list" : "Minimize list"}
            >
              {isTripListMinimized ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m6 14 6-6 6 6"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m6 10 6 6 6-6"
                  />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMobileTripListFullscreen((prev) => !prev);
                setIsTripListMinimized(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300/80 bg-white/90 text-slate-700 shadow-sm transition hover:bg-white md:hidden"
              aria-label={
                isMobileTripListFullscreen
                  ? "Shrink trip plan list"
                  : "Expand trip plan list"
              }
              title={isMobileTripListFullscreen ? "Shrink list" : "Expand list"}
            >
              {isMobileTripListFullscreen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9H4v5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4 14 6-6"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 15h5v-5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m20 10-6 6"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 4H4v5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 4h5v5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 15v5h5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 15v5h-5"
                  />
                </svg>
              )}
            </button>
          </div>

          <Overlay
            places={places}
            selectedPlace={selectedPlace}
            showRoute={showRoute}
            preferRoadRoute={preferRoadRoute}
            isListMinimized={isTripListMinimized}
            onToggleRoute={() => setShowRoute((prev) => !prev)}
            onToggleRouteMode={() => setPreferRoadRoute((prev) => !prev)}
            onSelectPlace={setSelectedPlace}
            onEditPlace={handleEditPlace}
            onOpenChatForPlace={handleOpenChatForPlace}
            onExportCalendar={requestCalendarExport}
            isExportingCalendar={isExportingCalendar}
          />
        </aside>

        <Dialog open={isCalendarPermissionOpen} onOpenChange={setIsCalendarPermissionOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Grant Google Calendar access?</DialogTitle>
              <DialogDescription>
                Connect Google Calendar first, then export this trip after you approve the access.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {isCalendarStatusLoading ? (
                <span>Checking Google Calendar connection...</span>
              ) : isCalendarConnected ? (
                <span>
                  {places.length} event{places.length === 1 ? "" : "s"} will be created from this trip.
                </span>
              ) : (
                <span>You need to connect Google Calendar before exporting these events.</span>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCalendarPermissionOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmCalendarExport}
                disabled={isExportingCalendar || isCalendarStatusLoading}
              >
                {isCalendarConnected
                  ? isExportingCalendar
                    ? "Exporting..."
                    : "Export events"
                  : "Connect Google Calendar"}
              </Button>
            </DialogFooter>

            <p className="text-muted-foreground text-xs">
              {isCalendarConnected
                ? 'Google access is already connected. Export will use the granted calendar session.'
                : 'You will be redirected to Google to approve calendar access, then returned here.'}
            </p>
          </DialogContent>
        </Dialog>

        <ChatAside
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          places={places}
          taggedPlace={chatTaggedPlace}
          onClearTaggedPlace={() => setChatTaggedPlace(null)}
          onApplyPlaces={handleChatPlacesUpdate}
          onSelectPlace={setSelectedPlace}
        />

        <BotIcon
          isChatOpen={isChatOpen}
          onToggle={() => setIsChatOpen((prev) => !prev)}
        />

        <div className="absolute inset-0 z-0">
          <Map
            places={places}
            selectedPlace={selectedPlace}
            showRoute={showRoute}
            preferRoadRoute={preferRoadRoute}
          />
        </div>

        {editingPlace ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/20 px-4 py-6 backdrop-blur-[2px]">
            <div className="w-full max-w-3xl overflow-hidden rounded-[18px] border border-slate-200 bg-white text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                    Edit Trip Node
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                    {editingPlace.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Search from the place list, then adjust day, date, and time
                    range.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPlace(null)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.05fr)]">
                <section className="space-y-4 rounded-[16px] border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Search place
                    </label>
                    <input
                      type="text"
                      value={editingQuery}
                      onChange={(event) => setEditingQuery(event.target.value)}
                      placeholder="Search by place, city, or category"
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                    />
                  </div>

                  <div className="max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-white p-2">
                    {filteredEditPlaces.map((place) => {
                      const isActive = place.name === editingPlace.name;

                      return (
                        <button
                          key={place.name}
                          type="button"
                          onClick={() => {
                            setEditingPlace(normalizePlaceForEdit(place));
                            setEditingPlaceSourceName(place.name);
                            setSelectedPlace(place);
                          }}
                          className={`mb-2 flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition last:mb-0 ${
                            isActive
                              ? "border-sky-500 bg-sky-50"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <img
                            src={place.image}
                            alt={place.name}
                            className="h-12 w-12 shrink-0 rounded-md object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-950">
                              {place.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {place.city} · {place.category}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-4 rounded-[16px] border border-slate-200 bg-white p-4">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Current selection
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      {editingPlace.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {editingPlace.city} · {editingPlace.category}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Date
                        </span>
                        <span className="mt-1 block font-medium text-slate-900">
                          {editingPlace.date || "Not set"}
                        </span>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Time
                        </span>
                        <span className="mt-1 block font-medium text-slate-900">
                          {editingPlace.startTime || "--:--"} - {editingPlace.endTime || "--:--"}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      Use the schedule controls below. The place itself comes
                      from the search list.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Day selector
                      </label>
                      <select
                        value={editingPlace.day ?? "Mon"}
                        onChange={(event) =>
                          setEditingPlace((current) =>
                            current
                              ? { ...current, day: event.target.value }
                              : current,
                          )
                        }
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                      >
                        {dayOptions.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Calendar adjuster
                      </label>
                      <input
                        type="date"
                        value={editingPlace.date ?? ""}
                        onChange={(event) =>
                          setEditingPlace((current) =>
                            current
                              ? { ...current, date: event.target.value }
                              : current,
                          )
                        }
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Time range selector
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="time"
                        value={editingPlace.startTime ?? ""}
                        onChange={(event) =>
                          setEditingPlace((current) =>
                            current
                              ? { ...current, startTime: event.target.value }
                              : current,
                          )
                        }
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                      />
                      <input
                        type="time"
                        value={editingPlace.endTime ?? ""}
                        onChange={(event) =>
                          setEditingPlace((current) =>
                            current
                              ? { ...current, endTime: event.target.value }
                              : current,
                          )
                        }
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSavePlace(editingPlace)}
                      className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeletePlace(
                          editingPlaceSourceName ?? editingPlace.name,
                        )
                      }
                      className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Delete Place
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
