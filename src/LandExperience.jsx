
import { useState, useMemo } from "react";
import Papa from "papaparse";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import nasaCSV from "./data/Earth-Jukebox-Vegetation-MOD13Q1-061-results.csv?raw";

import {
  MapContainer,
  TileLayer,
    WMSTileLayer,
  useMapEvents,
  CircleMarker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

const NASA_DATE = "2026-11-01";

function LocationSelector({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

export default function LandExperience({ onBack }) {
  const [activeLayer, setActiveLayer] = useState("vegetation");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [ndviData, setNdviData] = useState([]);
  const [loadingVegetation, setLoadingVegetation] = useState(false);
const [vegetationError, setVegetationError] = useState("");
  


const handleLocationSelect = async (location) => {
  setSelectedLocation(location);
  setLoadingVegetation(true);
  setVegetationError("");
  setNdviData([]);

  try {
    // Submit selected coordinates to NASA through Flask
    const submitResponse = await fetch(
      "http://127.0.0.1:5000/api/vegetation/request",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(location),
      }
    );

    const submitData = await submitResponse.json();

    if (!submitResponse.ok) {
      throw new Error(
        submitData.error || "NASA request could not be submitted."
      );
    }

    const taskId = submitData.task_id;

    // Check NASA task until processing is complete
    for (let attempt = 0; attempt < 60; attempt++) {
      await new Promise((resolve) =>
        setTimeout(resolve, 10000)
      );

      const resultResponse = await fetch(
        `http://127.0.0.1:5000/api/vegetation/results/${taskId}`
      );

      const resultData = await resultResponse.json();

      if (resultResponse.status === 202) {
        continue;
      }

      if (!resultResponse.ok) {
        throw new Error(
          resultData.error || "Could not retrieve NASA results."
        );
      }

      setNdviData(
        (resultData.records || []).map((item) => ({
          ...item,
          reliable: item.quality === "VI produced with good quality",
        }))
      );

      return;
    }

    throw new Error(
      "NASA is taking longer than expected. Please try again later."
    );

  } catch (error) {
    setVegetationError(error.message);
  } finally {
    setLoadingVegetation(false);
  }
};

const reliableNdviData = ndviData.filter(
  (item) =>
    Number.isFinite(item.ndvi) &&
    item.ndvi >= -1 &&
    item.ndvi <= 1 &&
    item.quality !== "Pixel not produced due to other reasons than clouds"
);

const averageNDVI =
  reliableNdviData.length > 0
    ? reliableNdviData.reduce(
        (sum, item) => sum + item.ndvi,
        0
      ) / reliableNdviData.length
    : null;

const layerUrl =
  activeLayer === "vegetation"
    ? `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/${NASA_DATE}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`
    : activeLayer === "landcover"
    ? `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Combined_L3_IGBP_Land_Cover_Type_Annual/default/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`
    : `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${NASA_DATE}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
  return (
    <main className="land-page">
      <style>{`
        .land-page {
          min-height: 100vh;
          background: #f0f0e5;
          color: #263d30;
          font-family: inherit;
          padding-bottom: 70px;
        }

        .land-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px 7%;
        }

        .land-back {
          border: 1px solid #8b9c86;
          background: transparent;
          color: #263d30;
          padding: 11px 20px;
          border-radius: 30px;
          cursor: pointer;
        }

        .land-hero {
          padding: 75px 8% 55px;
        }

        .land-kicker {
          letter-spacing: 4px;
          font-size: 11px;
          color: #648267;
        }

        .land-hero h1 {
          font-size: clamp(48px, 8vw, 100px);
          line-height: 1;
          margin: 22px 0;
          font-weight: 500;
        }

        .land-hero p {
          max-width: 620px;
          font-size: 17px;
          line-height: 1.8;
          color: #647366;
        }

        .land-map-section {
          padding: 25px 7%;
        }

        .land-map-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }

        .land-map-heading h2 {
          font-size: 30px;
          font-weight: 500;
          margin: 0;
        }

        .land-layer-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .land-layer-buttons button {
          padding: 12px 19px;
          border: 1px solid #9aaa91;
          background: transparent;
          color: #263d30;
          border-radius: 30px;
          cursor: pointer;
        }

        .land-layer-buttons button.active {
          background: #355e4b;
          color: white;
          border-color: #355e4b;
        }

        .land-map {
          height: 540px;
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #b4c2ad;
        }

        .land-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 22px;
        }

        .land-info-card {
          padding: 25px;
          background: #e4e9dc;
          border-radius: 16px;
        }

        .land-info-card h3 {
          margin-top: 0;
          font-weight: 500;
        }

        .land-info-card p {
          color: #647366;
          line-height: 1.7;
          font-size: 14px;
        }

        .land-source {
          font-size: 12px;
          color: #647366;
          margin-top: 18px;
        }

        @media(max-width: 650px) {
          .land-hero {
            padding: 55px 7% 35px;
          }

          .land-map-section {
            padding: 20px 5%;
          }

          .land-map {
            height: 65vh;
            min-height: 430px;
          }

          .land-info {
            grid-template-columns: 1fr;
          }

          .land-map-heading h2 {
            font-size: 25px;
          }
        }
      `}</style>

      <header className="land-nav">
        <strong>ANUWAAD / EARTH SYSTEMS</strong>

        <button className="land-back" onClick={onBack}>
          ← Back to Earth
        </button>
      </header>

      <section className="land-hero">
        <span className="land-kicker">
          03 / LIVING LANDSCAPES
        </span>

        <h1>
          The Living
          <br />
          Planet.
        </h1>

        <p>
          Explore Earth's forests, vegetation and changing
          landscapes through real satellite observations
          from NASA.
        </p>
      </section>

      <section className="land-map-section">
        <div className="land-map-heading">
          <h2>Explore Earth's surface</h2>

          <div className="land-layer-buttons">
            <button
              className={activeLayer === "vegetation" ? "active" : ""}
              onClick={() => setActiveLayer("vegetation")}
            >
              Vegetation / NDVI
            </button>

            <button
              className={activeLayer === "truecolor" ? "active" : ""}
              onClick={() => setActiveLayer("truecolor")}
            >
              Satellite imagery
            </button>
                        <button
              className={activeLayer === "landcover" ? "active" : ""}
              onClick={() => setActiveLayer("landcover")}
            >
              Land Cover
            </button>
            

          </div>
        </div>

        <div className="land-map">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            minZoom={2}
            maxZoom={8}
            scrollWheelZoom={true}
            style={{
              height: "100%",
              width: "100%",
              background: "#dce7d8",
            }}
          >
            {loadingVegetation && (
  <p>Fetching real NASA vegetation data... Please wait.</p>
)}

{vegetationError && (
  <p style={{ color: "red" }}>{vegetationError}</p>
)}
            {activeLayer === "landcover" ? (
  <WMSTileLayer
    key="landcover"
    url="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
    layers="MODIS_Combined_L3_IGBP_Land_Cover_Type_Annual"
    format="image/png"
    transparent={true}
    version="1.1.1"
    attribution="NASA EOSDIS GIBS"
  />
) : (
  <TileLayer
    key={activeLayer}
    url={layerUrl}
    attribution="NASA EOSDIS GIBS"
  />
)}

            <LocationSelector onSelect={handleLocationSelect} />

            {selectedLocation && (
              <CircleMarker
                center={[
                  selectedLocation.latitude,
                  selectedLocation.longitude,
                ]}
                radius={8}
                pathOptions={{
                  color: "#ffffff",
                  fillColor: "#d98f72",
                  fillOpacity: 1,
                  weight: 3,
                }}
              >
                <Popup>
                  <strong>Selected location</strong>
                  <br />
                  Latitude: {selectedLocation.latitude.toFixed(3)}
                  <br />
                  Longitude: {selectedLocation.longitude.toFixed(3)}
                </Popup>
              </CircleMarker>
            )}
          </MapContainer>
        </div>
      
{activeLayer === "vegetation" && (
  <section style={{
    marginTop: "35px",
    padding: "30px",
    background: "#e4e9dc",
    borderRadius: "20px"
  }}>
    <span style={{
      fontSize: "11px",
      letterSpacing: "3px",
      color: "#648267"
    }}>
      NASA DATA / VEGETATION MONITORING
    </span>

    <h2 style={{
      fontSize: "30px",
      fontWeight: 500,
      margin: "15px 0 8px"
    }}>
      Vegetation through time
    </h2>

    <p style={{
  color: "#647366",
  lineHeight: 1.7
}}>
  {selectedLocation
    ? `MODIS Terra NDVI observations for latitude ${selectedLocation.latitude.toFixed(4)}, longitude ${selectedLocation.longitude.toFixed(4)}.`
    : "Select a location on the map to retrieve real NASA vegetation observations."}
</p>

    <div style={{
      display: "flex",
      gap: "30px",
      flexWrap: "wrap",
      margin: "25px 0"
    }}>
      <div>
        <span style={{ color: "#647366", fontSize: "12px" }}>
          GOOD QUALITY OBSERVATIONS
        </span>
        <h2>{reliableNdviData.length} / {ndviData.length}</h2>
      </div>

      <div>
        <span style={{ color: "#647366", fontSize: "12px" }}>
          AVERAGE NDVI
        </span>
       <h2>
  {averageNDVI !== null ? averageNDVI.toFixed(4) : "N/A"}
</h2>
      </div>
    </div>
{ndviData.length === 0 && !loadingVegetation && (
  <p style={{ color: "#647366" }}>
    No vegetation observations available yet. Select a location on the map.
  </p>
)}
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={reliableNdviData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#c4cebd" />
         <XAxis
  dataKey="date"
  tick={{ fill: "#647366", fontSize: 11 }}
  tickFormatter={(value) =>
    new Date(value + "T00:00:00").toLocaleDateString(
      "en-IN",
      { month: "short", year: "2-digit" }
    )
  }
  interval={2}
/>
          <YAxis
            domain={[0, 1]}
            tick={{ fill: "#647366" }}
          />
          <Tooltip
  labelFormatter={(value) => `Observation: ${value}`}
  formatter={(value) => [
    Number(value).toFixed(4),
    "NDVI"
  ]}
  contentStyle={{
    background: "#f4f0e5",
    border: "1px solid #9aaa91",
    borderRadius: "12px",
    color: "#263d30",
    padding: "12px"
  }}
/>
        </LineChart>
      </ResponsiveContainer>
    </div>

    <p style={{
      fontSize: "11px",
      color: "#647366",
      marginTop: "15px"
    }}>
      Source: NASA MODIS/Terra MOD13Q1.061.
      Only observations marked good quality are plotted.
    </p>
  </section>
)}
    
{activeLayer === "landcover" && (
  <div style={{
    background: "#e4e9dc",
    padding: "22px",
    borderRadius: "16px",
    marginTop: "20px"
  }}>
    <h3 style={{ marginTop: 0 }}>
      NASA MODIS — Land Cover Classification
    </h3>

    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
      gap: "12px"
    }}>
      {[
        ["#218A21", "Evergreen Needleleaf Forests"],
        ["#31CC31", "Evergreen Broadleaf Forests"],
        ["#98CC31", "Deciduous Needleleaf Forests"],
        ["#96FA96", "Deciduous Broadleaf Forests"],
        ["#8DBA8D", "Mixed Forests"],
        ["#BA8D8D", "Closed Shrublands"],
        ["#F5DEB3", "Open Shrublands"],
        ["#DAEB9D", "Woody Savannas"],
        ["#FFD500", "Savannas"],
        ["#F0B967", "Grasslands"],
        ["#4783B5", "Permanent Wetlands"],
        ["#FAEF73", "Croplands"],
        ["#FF0000", "Urban and Built-up Lands"],
        ["#999356", "Cropland / Natural Vegetation"],
        ["#FFFFFF", "Permanent Snow and Ice"],
        ["#BFBFBD", "Barren Land"],
        ["#86CAE3", "Water Bodies"]
      ].map(([color, label]) => (
        <div key={label} style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          fontSize: "12px"
        }}>
          <span style={{
            width: "17px",
            height: "17px",
            flexShrink: 0,
            background: color,
            border: "1px solid #aab3a4",
            borderRadius: "4px"
          }} />
          {label}
        </div>
      ))}
    </div>

    <p style={{
      fontSize: "11px",
      color: "#647366",
      marginBottom: 0
    }}>
      Source: NASA MODIS Terra + Aqua, IGBP classification.
    </p>
  </div>
)}

        <p className="land-source">
  Data visualization: NASA EOSDIS Global Imagery Browse Services (GIBS).
  {activeLayer === "vegetation"
    ? " MODIS Terra NDVI 8-Day."
    : activeLayer === "landcover"
    ? " MODIS Combined Annual Land Cover — IGBP classification."
    : " MODIS Terra Corrected Reflectance True Color."}
</p>

        <div className="land-info">
          <div className="land-info-card">
            <h3>Vegetation index</h3>
            <p>
              NDVI measures the difference between near-infrared
              and red light reflected by vegetation. It helps
              scientists study vegetation greenness and changes
              in plant cover.
            </p>
          </div>

          <div className="land-info-card">
            <h3>Explore the planet</h3>
            <p>
              Select a location on the map to inspect its
              coordinates. Switch between NASA vegetation
              observations and true-colour satellite imagery.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
