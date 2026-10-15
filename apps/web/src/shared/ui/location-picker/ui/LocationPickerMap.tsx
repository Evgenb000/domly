"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMemo, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_ZOOM,
  SELECTED_ZOOM,
} from "../model/constants";
import { roundCoordinate } from "../model/roundCoordinate";
import type { Coordinates } from "../model/types";

const LOCATION_PICKER_MARKER_ICON = L.divIcon({
  className: "domly-map-marker",
  html: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface LocationPickerMapProps {
  value: Coordinates | null;
  onChange: (value: Coordinates) => void;
}

function ClickHandler({
  onChange,
}: {
  onChange: (value: Coordinates) => void;
}) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: roundCoordinate(event.latlng.lat),
        longitude: roundCoordinate(event.latlng.lng),
      });
    },
  });
  return null;
}

export function LocationPickerMap({ value, onChange }: LocationPickerMapProps) {
  const markerRef = useRef<L.Marker | null>(null);

  const center = value ?? DEFAULT_MAP_CENTER;

  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker === null) {
          return;
        }
        const latlng = marker.getLatLng();
        onChange({
          latitude: roundCoordinate(latlng.lat),
          longitude: roundCoordinate(latlng.lng),
        });
      },
    }),
    [onChange],
  );

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={value === null ? DEFAULT_ZOOM : SELECTED_ZOOM}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
        className="domly-map-tiles"
      />
      <ClickHandler onChange={onChange} />
      {value === null ? null : (
        <Marker
          ref={markerRef}
          position={[value.latitude, value.longitude]}
          draggable
          icon={LOCATION_PICKER_MARKER_ICON}
          eventHandlers={markerEventHandlers}
        />
      )}
    </MapContainer>
  );
}