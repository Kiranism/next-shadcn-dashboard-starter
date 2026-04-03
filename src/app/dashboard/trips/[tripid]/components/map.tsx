"use client";

import { useEffect, useRef, useState } from "react";
import type { FeatureCollection, LineString } from "geojson";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export type Place = {
  name: string;
  lng: number;
  lat: number;
  image: string;
  city?: string;
  category?: string;
  day?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
};

type MapProps = {
  places: Place[];
  selectedPlace: Place | null;
  showRoute: boolean;
  preferRoadRoute: boolean;
};

const ROUTE_SOURCE_ID = "user-to-destination-route-source";
const ROUTE_LAYER_ID = "user-to-destination-route-layer";

type RouteInfo = {
  distanceKm: number;
  durationMinutes: number;
  mode: "road" | "direct";
};

function haversineKm(from: [number, number], to: [number, number]): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const [lon1, lat1] = from;
  const [lon2, lat2] = to;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function Map({ places, selectedPlace, showRoute, preferRoadRoute }: MapProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const popupsRef = useRef<mapboxgl.Popup[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  const mapboxToken =
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const flyToPlace = (lng: number, lat: number) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: 17,
      pitch: 60,
      bearing: 45,
      duration: 4200,
      curve: 1.2,
      speed: 0.45,
      easing: (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
      essential: true,
    });
  };

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.longitude, position.coords.latitude]);
      },
      () => {
        setUserLocation(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  }, []);

  useEffect(() => {
    mapboxgl.accessToken = mapboxToken;

    if (!mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [38.7578, 9.032],
      zoom: 17,
      pitch: 60,
      bearing: 45,
      antialias: true,
    });

    mapRef.current.on("style.load", () => {
      const map = mapRef.current;
      if (!map) return;

      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
      }

      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

      if (!map.getLayer("buildings-3d-colored") && map.getSource("composite")) {
        const firstLabelLayerId = map
          .getStyle()
          .layers?.find(
            (layer) =>
              layer.type === "symbol" &&
              typeof layer.layout !== "undefined" &&
              "text-field" in layer.layout,
          )?.id;

        map.addLayer(
          {
            id: "buildings-3d-colored",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 14,
            paint: {
              "fill-extrusion-color": [
                "interpolate",
                ["linear"],
                ["coalesce", ["get", "height"], 0],
                0,
                "#7dd3fc",
                40,
                "#22d3ee",
                100,
                "#f59e0b",
                220,
                "#ef4444",
              ],
              "fill-extrusion-height": ["coalesce", ["get", "height"], 0],
              "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
              "fill-extrusion-opacity": 0.95,
            },
          },
          firstLabelLayerId,
        );
      }
    });

    return () => {
      popupsRef.current.forEach((popup) => popup.remove());
      popupsRef.current = [];

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!selectedPlace) return;
    flyToPlace(selectedPlace.lng, selectedPlace.lat);
  }, [selectedPlace]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    popupsRef.current.forEach((popup) => popup.remove());

    popupsRef.current = places.map((place) => {
      const popupHtml = `
        <div style="width: min(72vw, 250px); max-width: 250px; border-radius: 20px; overflow: hidden; font-family: var(--font-geist-sans, Arial, sans-serif); color: #0f172a; background: rgba(255, 255, 255, 0.98); box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18); border: 1px solid rgba(255, 255, 255, 0.75);">
          <div style="position: relative;">
            <img src="${place.image}" alt="${place.name}" style="width: 100%; height: 128px; object-fit: cover; display: block;" />
            <div style="position: absolute; left: 10px; top: 10px; border-radius: 999px; background: rgba(15, 23, 42, 0.78); color: #fff; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 9px;">${place.category ?? "Stay"}</div>
          </div>
          <div style="padding: 12px 13px 13px 13px;">
            <div style="font-weight: 700; font-size: 14px; line-height: 1.3; margin-bottom: 4px;">${place.name}</div>
            <div style="font-size: 12px; color: #475569;">${place.city ?? "Ethiopia"}</div>
          </div>
        </div>
      `;

      return new mapboxgl.Popup({
        offset: 18,
        closeButton: false,
        closeOnClick: false,
        maxWidth: "300px",
        className: "place-popup",
      })
        .setLngLat([place.lng, place.lat])
        .setHTML(popupHtml)
        .addTo(map);
    });

    return () => {
      popupsRef.current.forEach((popup) => popup.remove());
      popupsRef.current = [];
    };
  }, [places]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const removeRoute = () => {
      if (map.getLayer(ROUTE_LAYER_ID)) {
        map.removeLayer(ROUTE_LAYER_ID);
      }
      if (map.getSource(ROUTE_SOURCE_ID)) {
        map.removeSource(ROUTE_SOURCE_ID);
      }
      setRouteInfo(null);
    };

    if (!showRoute || !selectedPlace || !userLocation) {
      removeRoute();
      return;
    }

    const setRouteData = (
      coordinates: [number, number][],
      mode: "road" | "direct",
      distanceKm: number,
      durationMinutes: number,
    ) => {
      const routeGeoJson: FeatureCollection<LineString> = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates,
            },
          },
        ],
      };

      if (map.getSource(ROUTE_SOURCE_ID)) {
        const source = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource;
        source.setData(routeGeoJson);
      } else {
        map.addSource(ROUTE_SOURCE_ID, {
          type: "geojson",
          data: routeGeoJson,
        });
      }

      if (!map.getLayer(ROUTE_LAYER_ID)) {
        map.addLayer({
          id: ROUTE_LAYER_ID,
          type: "line",
          source: ROUTE_SOURCE_ID,
          paint: {
            "line-color": mode === "road" ? "#2563eb" : "#7c3aed",
            "line-width": 4,
            "line-opacity": 0.9,
            "line-dasharray": mode === "road" ? [1, 0] : [2, 1],
          },
        });
      } else {
        map.setPaintProperty(
          ROUTE_LAYER_ID,
          "line-color",
          mode === "road" ? "#2563eb" : "#7c3aed",
        );
        map.setPaintProperty(
          ROUTE_LAYER_ID,
          "line-dasharray",
          mode === "road" ? [1, 0] : [2, 1],
        );
      }

      setRouteInfo({ distanceKm, durationMinutes, mode });
    };

    const directDistanceKm = haversineKm(userLocation, [
      selectedPlace.lng,
      selectedPlace.lat,
    ]);

    let cancelled = false;

    const buildRoute = async () => {
      if (!preferRoadRoute) {
        setRouteData(
          [
            [userLocation[0], userLocation[1]],
            [selectedPlace.lng, selectedPlace.lat],
          ],
          "direct",
          directDistanceKm,
          (directDistanceKm / 55) * 60,
        );
        return;
      }

      try {
        const directionsUrl =
          `https://api.mapbox.com/directions/v5/mapbox/driving/` +
          `${userLocation[0]},${userLocation[1]};${selectedPlace.lng},${selectedPlace.lat}` +
          `?alternatives=false&geometries=geojson&overview=full&steps=false&access_token=${mapboxToken}`;

        const response = await fetch(directionsUrl);
        if (!response.ok) {
          throw new Error("Directions API request failed");
        }

        const data = (await response.json()) as {
          routes?: Array<{
            distance: number;
            duration: number;
            geometry: { coordinates: [number, number][] };
          }>;
        };

        const bestRoute = data.routes?.[0];
        if (!bestRoute || cancelled) {
          return;
        }

        setRouteData(
          bestRoute.geometry.coordinates,
          "road",
          bestRoute.distance / 1000,
          bestRoute.duration / 60,
        );
      } catch {
        if (cancelled) return;

        // Fallback when road-routing is unavailable.
        setRouteData(
          [
            [userLocation[0], userLocation[1]],
            [selectedPlace.lng, selectedPlace.lat],
          ],
          "direct",
          directDistanceKm,
          (directDistanceKm / 55) * 60,
        );
      }
    };

    void buildRoute();

    return () => {
      cancelled = true;
    };
  }, [selectedPlace, showRoute, userLocation, preferRoadRoute, mapboxToken]);

  return (
    <div className="relative w-full h-full">
      <div
        id="map-container"
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%" }}
      />

      {showRoute && selectedPlace && routeInfo ? (
        <div className="absolute left-4 top-4 z-10 max-w-[220px] rounded-[18px] border border-white/70 bg-white/90 px-3 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-md md:left-auto md:right-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Route Summary
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Mode: {routeInfo.mode === "road" ? "Road" : "Direct"}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {routeInfo.distanceKm.toFixed(1)} km
          </p>
          <p className="text-xs text-slate-600">
            ETA: {Math.round(routeInfo.durationMinutes)} min
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default Map;
