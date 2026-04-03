"use client";

import Image from "next/image";
import { Place } from "./map";

type OverlayProps = {
  places: Place[];
  selectedPlace: Place | null;
  showRoute: boolean;
  preferRoadRoute: boolean;
  isListMinimized: boolean;
  onToggleRoute: () => void;
  onToggleRouteMode: () => void;
  onSelectPlace: (place: Place) => void;
  onEditPlace: (place: Place) => void;
};

export default function Overlay({
  places,
  selectedPlace,
  showRoute,
  preferRoadRoute,
  isListMinimized,
  onToggleRoute,
  onToggleRouteMode,
  onSelectPlace,
  onEditPlace,
}: OverlayProps) {
  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_48%,#eef2f7_100%)] text-slate-900">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Trip Plans
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
              Pick a place to pin on the map
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Scroll like a ride app and tap a card to focus the map.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onToggleRoute}
            className={`rounded-[14px] border px-3 py-2 text-sm font-medium transition ${
              showRoute
                ? "border-sky-500 bg-sky-50 text-sky-700"
                : "border-slate-200 bg-white text-slate-600"
            }`}
            title="Toggle user-to-destination route"
            aria-label="Toggle route line"
          >
            {showRoute ? "Route On" : "Route Off"}
          </button>

          <button
            type="button"
            onClick={onToggleRouteMode}
            className={`rounded-[14px] border px-3 py-2 text-sm font-medium transition ${
              preferRoadRoute
                ? "border-amber-500 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-white text-slate-600"
            }`}
            title="Switch between road route and direct line"
            aria-label="Toggle route mode"
          >
            {preferRoadRoute ? "Road Mode" : "Direct Mode"}
          </button>
        </div>
      </div>

      {!isListMinimized ? (
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="-mx-3 mb-4 overflow-x-auto px-3 pb-2 md:hidden">
            <div className="flex gap-3 snap-x snap-mandatory">
              {places.map((place) => {
                const isSelected = selectedPlace?.name === place.name;

                return (
                  <div
                    key={place.name}
                    className={`relative w-[190px] shrink-0 snap-start overflow-hidden rounded-[16px] border text-left shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition duration-200 ${
                      isSelected
                        ? "border-sky-500 bg-sky-50 ring-2 ring-sky-200"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectPlace(place)}
                      className="block w-full text-left"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden">
                        <Image
                          src={place.image}
                          alt={place.name}
                          fill
                          sizes="190px"
                          className="object-cover"
                          priority={isSelected}
                        />
                        <div className="absolute left-2 top-2 rounded-full bg-slate-950/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                          {place.category ?? "Stay"}
                        </div>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditPlace(place);
                          }}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white text-slate-700 shadow-md transition hover:bg-slate-50"
                          aria-label={`Edit ${place.name}`}
                          title="Edit place"
                        >
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
                              d="m16.862 4.487 1.65-1.65a1.875 1.875 0 1 1 2.652 2.652L7.5 19.15a4.5 4.5 0 0 1-1.897 1.13l-2.596.7.7-2.596a4.5 4.5 0 0 1 1.13-1.897z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 7.125 16.875 4.5"
                            />
                          </svg>
                        </button>
                      </div>

                      <div className="p-3">
                        <p className="line-clamp-2 text-sm font-semibold leading-tight text-slate-950">
                          {place.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {place.city}
                        </p>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hidden md:block">
            {places.map((place) => {
              const isSelected = selectedPlace?.name === place.name;

              return (
                <div
                  key={place.name}
                  className={`mb-2 flex w-full items-stretch gap-3 rounded-[16px] border p-2 text-left shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.14)] ${
                    isSelected
                      ? "border-sky-500 bg-sky-50 ring-2 ring-sky-200"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectPlace(place)}
                    className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-[14px] sm:w-28"
                  >
                    <Image
                      src={place.image}
                      alt={place.name}
                      fill
                      sizes="120px"
                      className="object-cover"
                      priority={isSelected}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectPlace(place)}
                    className="min-w-0 flex-1 py-1 pr-1 text-left"
                  >
                    <p className="line-clamp-2 text-sm font-semibold leading-tight text-slate-950 sm:text-[15px]">
                      {place.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {place.city}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                        {place.category ?? "Hotel"}
                      </span>
                      {isSelected ? (
                        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                          Active
                        </span>
                      ) : null}
                    </div>
                  </button>

                  <div className="flex items-start pt-1 pr-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditPlace(place);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                      aria-label={`Edit ${place.name}`}
                      title="Edit place"
                    >
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
                          d="m16.862 4.487 1.65-1.65a1.875 1.875 0 1 1 2.652 2.652L7.5 19.15a4.5 4.5 0 0 1-1.897 1.13l-2.596.7.7-2.596a4.5 4.5 0 0 1 1.13-1.897z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 7.125 16.875 4.5"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-4 py-4 text-sm text-slate-600">
          Trip plan list is minimized. Use Maximize List to view destinations.
        </div>
      )}
    </div>
  );
}
