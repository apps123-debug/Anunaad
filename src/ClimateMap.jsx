
import { useState } from "react";

import {
  MapContainer,
  TileLayer,
  useMapEvents,
  CircleMarker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import landTopology from "world-atlas/land-110m.json";
import { feature } from "topojson-client";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

// Load world land boundaries
const landData = feature(
  landTopology,
  landTopology.objects.land
);

const landFeatures =
  landData.type === "FeatureCollection"
    ? landData.features
    : [landData];

function ClimateMapClickHandler({
  onLocationSelect,
  onWaterSelect,
}) {
  const [selectedPosition, setSelectedPosition] =
    useState(null);

  useMapEvents({
    click(event) {
      const latitude = event.latlng.lat;
      const longitude = event.latlng.lng;

      const point = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        properties: {},
      };

      const isLand = landFeatures.some((polygon) =>
        booleanPointInPolygon(point, polygon)
      );

      if (isLand) {
        setSelectedPosition([latitude, longitude]);

        onLocationSelect?.({
          latitude,
          longitude,
        });
      } else {
        setSelectedPosition(null);

        onWaterSelect?.();
      }
    },
  });

  return selectedPosition ? (
    <CircleMarker
      center={selectedPosition}
      radius={9}
      pathOptions={{
        color: "#ffffff",
        fillColor: "#d98f72",
        fillOpacity: 1,
        weight: 3,
      }}
    >
      <Popup>Selected climate location 🌍</Popup>
    </CircleMarker>
  ) : null;
}

export default function ClimateMap({
  onLocationSelect,
  onWaterSelect,
}) {
  return (
    <div
  className="climate-map-container"
  style={{
    width: "100%",
    height: "520px",
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid #8bcac255",
  }}
>
    
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={8}
        scrollWheelZoom={true}
        style={{
          width: "100%",
          height: "100%",
          background: "#e9eee3",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClimateMapClickHandler
          onLocationSelect={onLocationSelect}
          onWaterSelect={onWaterSelect}
        />
      </MapContainer>
    </div>
  );
}
