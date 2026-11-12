
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

// Convert world land boundaries into geographic polygons
const landData = feature(
  landTopology,
  landTopology.objects.land
);

const landFeatures =
  landData.type === "FeatureCollection"
    ? landData.features
    : [landData];

function MapClickHandler({ onOceanSelect, onLandSelect }) {
  const [selectedPosition, setSelectedPosition] = useState(null);

  useMapEvents({
    click(event) {
        console.error("MAP CLICK DETECTED!");
        console.error(event.latlng);
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

      const isLand = landFeatures.some((landPolygon) =>
  booleanPointInPolygon(point, landPolygon)
);

      if (isLand) {
        setSelectedPosition(null);

        onLandSelect?.({
          latitude,
          longitude,
        });
      } else {
        setSelectedPosition([latitude, longitude]);

        onOceanSelect?.({
          latitude,
          longitude,
        });
      }
    },
  });

  return selectedPosition ? (
    <CircleMarker
      center={selectedPosition}
      radius={9}
      pathOptions={{
        color: "#ffffff",
        fillColor: "#38b9b0",
        fillOpacity: 1,
        weight: 3,
      }}
    >
      <Popup>Selected ocean location 🌊</Popup>
    </CircleMarker>
  ) : null;
}

export default function OceanMap({
  onOceanSelect,
  onLandSelect,
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "520px",
        borderRadius: "18px",
        overflow: "hidden",
        border: "1px solid #8bcac255",
      }}
    >
      <MapContainer
        center={[15, 20]}
        zoom={2}
        minZoom={2}
        maxZoom={8}
        scrollWheelZoom={true}
        style={{
          width: "100%",
          height: "100%",
          background: "#063b46",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          onOceanSelect={onOceanSelect}
          onLandSelect={onLandSelect}
        />
      </MapContainer>
    </div>
  );
}
