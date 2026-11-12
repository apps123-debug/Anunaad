
import { useEffect, useRef, useState } from "react";
import Earth3D from "./Earth3D";
import OceanMap from "./OceanMap";
import "./App.css";
import ClimateMap from "./ClimateMap";
import LandExperience from "./LandExperience";


const topics = [
  {
    number: "01",
    title: "Climate Change",
    detail: "Listen to the changing temperature of our planet.",
    icon: "◉",
    visual: "climate",
    label: "GLOBAL TEMPERATURE",
    value: "NASA DATA",
  },
  {
    number: "02",
    title: "Ocean Dynamics",
    detail: "Explore the rhythm of our oceans and currents.",
    icon: "〰",
    visual: "ocean",
    label: "OCEAN MOVEMENT",
    value: "IN MOTION",
  },
  {
    number: "03",
    title: "Land & Ecosystems",
    detail: "Discover how Earth's living landscapes evolve.",
    icon: "⌁",
    visual: "land",
    label: "LIVING LANDSCAPES",
    value: "EVOLVING",
  },
  {
    number: "04",
    title: "Natural Hazards",
    detail: "Hear the patterns behind our planet's extremes.",
    icon: "✳",
    visual: "hazards",
    label: "PLANETARY ACTIVITY",
    value: "DETECTING",
  },
];

/* ---------------------------------------
   HOMEPAGE VISUALS
--------------------------------------- */

function MiniChart({ type = "line" }) {
  return (
    <svg viewBox="0 0 260 90" className="mini-chart" aria-hidden="true">
      <path
        d={
          type === "wave"
            ? "M0 48 Q20 10 40 48 T80 48 T120 48 T160 48 T200 48 T260 48"
            : "M0 70 C20 64 25 40 45 52 S75 18 100 35 S135 55 155 28 S190 12 210 24 S240 10 260 5"
        }
        fill="none"
        stroke="#61c9ed"
        strokeWidth="2"
      />
      <path d="M0 89 H260" stroke="currentColor" opacity=".15" />
    </svg>
  );
}

function DataGlobe() {
  return (
    <div className="data-globe-wrap">
      <div className="globe-orbit orbit-one" />
      <div className="globe-orbit orbit-two" />
      <div className="data-globe">
        <div className="globe-grid" />
        <div className="globe-dots" />
        <div className="globe-shine" />
      </div>
      <span className="globe-label label-top">EARTH SYSTEMS</span>
      <span className="globe-label label-bottom">
        OUR PLANET · ONE CONNECTED SYSTEM
      </span>
    </div>
  );
}

function Dashboard() {
  return (
    <section className="dashboard-section" id="discover">
      <div className="section-heading">
        <div>
          <span className="eyebrow">THE PLANET, IN PERSPECTIVE</span>
          <h2>Every change has a story.</h2>
        </div>
        <p>
          Explore patterns across our planet through Earth science
          visualizations — and experience the data through sound.
        </p>
      </div>

      <div className="dashboard">
        <div className="dashboard-sidebar">
          <span className="panel-label">EARTH DATA / OVERVIEW</span>

          <div className="metric-card">
            <span>GLOBAL TEMPERATURE</span>
            <strong>Explore</strong>
            <small>NASA climate observations</small>
            <MiniChart type="area" />
          </div>

          <div className="metric-card">
            <span>ATMOSPHERIC PATTERNS</span>
            <strong>Changing</strong>
            <small>Earth system patterns</small>
            <MiniChart />
          </div>

          <div className="metric-card">
            <span>OCEAN SIGNAL</span>
            <strong>In motion</strong>
            <small>Planetary processes</small>
            <MiniChart type="wave" />
          </div>
        </div>

        <div className="dashboard-main">
          <div className="dashboard-topline">
            <span>EARTH SYSTEMS</span>
            <span className="live-indicator">● EXPLORATION</span>
          </div>
          <DataGlobe />
          <div className="dashboard-legend">
            <span><i className="legend-dot cyan" /> Temperature</span>
            <span><i className="legend-dot blue" /> Ocean patterns</span>
            <span><i className="legend-dot gold" /> Land systems</span>
          </div>
        </div>

        <div className="dashboard-footer">
          <span>ANUWAAD / EARTH DATA EXPERIENCE</span>
          <span>NASA EARTH SCIENCE</span>
        </div>
      </div>
    </section>
  );
}

function TopicVisual({ type }) {
  return (
    <div className={`topic-visual topic-visual-${type}`} aria-hidden="true">
      {type === "climate" && (
        <>
          <div className="climate-ring ring-one" />
          <div className="climate-ring ring-two" />
          <div className="climate-ring ring-three" />
          <div className="climate-core">°C</div>
          <div className="climate-scan" />
        </>
      )}

      {type === "ocean" && (
        <>
          <div className="ocean-orb" />
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`ocean-wave wave-${["one", "two", "three", "four"][n - 1]}`} />
          ))}
        </>
      )}

      {type === "land" && (
        <>
          <div className="land-orb">
            <div className="land-continent continent-one" />
            <div className="land-continent continent-two" />
            <div className="land-continent continent-three" />
          </div>
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={`land-particle particle-${["one", "two", "three", "four"][n - 1]}`} />
          ))}
        </>
      )}

      {type === "hazards" && (
        <>
          <div className="hazard-ring hazard-ring-one" />
          <div className="hazard-ring hazard-ring-two" />
          <div className="hazard-ring hazard-ring-three" />
          <div className="hazard-core">!</div>
          <div className="hazard-crosshair" />
        </>
      )}
    </div>
  );
}

/* ---------------------------------------
   CLIMATE EXPERIENCE
--------------------------------------- */

const monthNames = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const shortMonths = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function ClimateExperience({ onBack }) {
  const [records, setRecords] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(null);
  const [landMessage, setLandMessage] = useState("");
  const [selectedClimateLocation, setSelectedClimateLocation] = useState(null);
const [locationTemperature, setLocationTemperature] = useState(null);
const [locationLoading, setLocationLoading] = useState(false);
const [locationError, setLocationError] = useState("");
const [locationDetails, setLocationDetails] = useState(null);
const [locationNameLoading, setLocationNameLoading] = useState(false);
const climateTheme = !locationTemperature
  ? "moderate"
  : locationTemperature.value < 15
    ? "cool"
    : locationTemperature.value <= 30
      ? "moderate"
      : "hot";
      
useEffect(() => {
  if (!selectedClimateLocation) {
    setLocationDetails(null);
    return;
  }

  let active = true;

  async function identifyLocation() {
    try {
      setLocationNameLoading(true);
      setLocationDetails(null);

      const { latitude, longitude } = selectedClimateLocation;

      const url =
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Location lookup failed");
      }

      const data = await response.json();

      if (active) {
        setLocationDetails({
          place:
            data.locality ||
            data.city ||
            data.principalSubdivision ||
            "Selected location",
          state: data.principalSubdivision || "",
          country: data.countryName || "Unknown country",
          continent: data.continent || "Unknown continent",
        });
      }
    } catch (error) {
      if (active) {
        setLocationDetails(null);
      }
    } finally {
      if (active) {
        setLocationNameLoading(false);
      }
    }
  }

  identifyLocation();

  return () => {
    active = false;
  };
}, [selectedClimateLocation]);

function handleClimateLocationSelect(location) {
  setSelectedClimateLocation(location);
  setLandMessage("");
}

function handleClimateWaterSelect() {
  setLandMessage(
    "Oops! That's the ocean! 🌊 Select a land location to explore its air temperature."
  );
}
  const timerRef = useRef(null);
  const indexRef = useRef(0);
  const recordsRef = useRef([]);

  /* LOAD NASA DATA */
  
useEffect(() => {
  async function loadClimateData() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/nasa-gistemp.csv");

      if (!response.ok) {
        throw new Error("Could not load NASA temperature data.");
      }

      const csvText = await response.text();
      const lines = csvText.split(/\r?\n/);

      const headerIndex = lines.findIndex((line) =>
        line.startsWith("Year,")
      );

      if (headerIndex === -1) {
        throw new Error("NASA CSV format not recognised.");
      }

      const parsed = [];

      const monthNames = [
        "Jan", "Feb", "Mar", "Apr",
        "May", "Jun", "Jul", "Aug",
        "Sep", "Oct", "Nov", "Dec"
      ];

      for (let i = headerIndex + 1; i < lines.length; i++) {
        const columns = lines[i].split(",");

        if (columns.length < 13) continue;

        const year = Number(columns[0]);

        if (!Number.isFinite(year)) continue;

        for (let month = 0; month < 12; month++) {
          const rawValue = columns[month + 1]?.trim();

          if (!rawValue || rawValue === "***") continue;

          const value = Number(rawValue);

          if (!Number.isFinite(value)) continue;

          parsed.push({
            year,
            month,
            monthName: monthNames[month],
            value
          });
        }
      }

      const latestRecords = parsed.slice(-12);

      if (latestRecords.length === 0) {
        throw new Error("No temperature records found.");
      }

      setRecords(latestRecords);
      recordsRef.current = latestRecords;
      setSelectedIndex(latestRecords.length - 1);
      indexRef.current = 0;

    } catch (err) {
      console.error("NASA climate data error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  loadClimateData();
}, []);


  /* LOAD LOCATION-SPECIFIC NASA POWER DATA */

  useEffect(() => {
    if (!selectedClimateLocation) {
      setLocationTemperature(null);
      setLocationLoading(false);
      return;
    }

    let active = true;

    async function loadLocationTemperature() {
      try {
        setLocationLoading(true);
        setLocationError("");
        setLocationTemperature(null);

        const { latitude, longitude } = selectedClimateLocation;

        // NASA POWER daily data may have a short processing delay.
        const endDate = new Date();
        endDate.setUTCDate(endDate.getUTCDate() - 3);

        const startDate = new Date(endDate);
        startDate.setUTCDate(startDate.getUTCDate() - 6);

        function formatDate(date) {
          return (
            date.getUTCFullYear() +
            String(date.getUTCMonth() + 1).padStart(2, "0") +
            String(date.getUTCDate()).padStart(2, "0")
          );
        }

        const start = formatDate(startDate);
        const end = formatDate(endDate);

        const url =
          "https://power.larc.nasa.gov/api/temporal/daily/point" +
          `?parameters=T2M&community=SB` +
          `&longitude=${longitude}` +
          `&latitude=${latitude}` +
          `&start=${start}&end=${end}` +
          "&format=JSON&time-standard=UTC";

        console.log("NASA POWER URL:", url);

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("NASA POWER request failed.");
        }

        const result = await response.json();

        console.log("NASA POWER RESPONSE:", result);

        const temperatureData =
          result.properties?.parameter?.T2M;

        if (!temperatureData) {
          throw new Error("NASA returned no temperature data.");
        }

        const validReadings = Object.entries(temperatureData)
          .filter(([date, value]) =>
            value !== -999 &&
            Number.isFinite(Number(value))
          )
          .sort(([dateA], [dateB]) =>
            dateA.localeCompare(dateB)
          );

        if (validReadings.length === 0) {
          throw new Error("No valid temperature readings found.");
        }

        const [date, value] = validReadings[validReadings.length - 1];

        if (active) {
          setLocationTemperature({
            value: Number(value),
            date,
            latitude,
            longitude,
          });
        }

      } catch (err) {
        console.error("NASA POWER error:", err);

        if (active) {
          setLocationError(err.message);
        }

      } finally {
        if (active) {
          setLocationLoading(false);
        }
      }
    }

    loadLocationTemperature();

    return () => {
      active = false;
    };
  }, [selectedClimateLocation]);


/* AUDIO ENGINE */

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopAudio() {
    stopTimer();

    if (audioRef.current) {
      const context = audioRef.current;
      audioRef.current = null;

      if (context.state !== "closed") {
        context.close();
      }
    }

    setIsPlaying(false);
  }

  function playTemperatureSound(reading, isLocationTemperature = false) {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      setError("Your browser does not support audio playback.");
      return;
    }

    if (!audioRef.current || audioRef.current.state === "closed") {
      audioRef.current = new AudioContextClass();
    }

    const context = audioRef.current;

    if (context.state === "suspended") {
      context.resume();
    }

    const now = context.currentTime;

    // Convert the NASA temperature anomaly into musical parameters.
    const normalized = isLocationTemperature
  ? Math.max(0, Math.min(1, reading.value / 40))
  : Math.max(0, Math.min(1, (reading.value + 0.5) / 2.5));

    const frequency = 110 + normalized * 220;
    const volume = 0.08 + normalized * 0.12;

    const master = context.createGain();
    const filter = context.createBiquadFilter();
    const oscillator = context.createOscillator();
    const harmonic = context.createOscillator();
    const bass = context.createOscillator();

    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(volume, now + 0.35);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450 + normalized * 2200, now);

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);

    harmonic.type = "sine";
    harmonic.frequency.setValueAtTime(frequency * 2, now);

    bass.type = "sine";
    bass.frequency.setValueAtTime(frequency / 2, now);

    const harmonicGain = context.createGain();
    harmonicGain.gain.value = 0.28;

    const bassGain = context.createGain();
    bassGain.gain.value = 0.5;

    oscillator.connect(filter);
    filter.connect(master);

    harmonic.connect(harmonicGain);
    harmonicGain.connect(master);

    bass.connect(bassGain);
    bassGain.connect(master);

    master.connect(context.destination);

    oscillator.start(now);
    harmonic.start(now);
    bass.start(now);

    oscillator.stop(now + 2.6);
    harmonic.stop(now + 2.6);
    bass.stop(now + 2.6);
  }

  function playSelectedReading(index) {
    const reading = recordsRef.current[index];
    if (!reading) return;

    indexRef.current = index;
    setSelectedIndex(index);
    playTemperatureSound(reading);
  }
  function playLocationTemperatureSound() {
  if (!locationTemperature) return;

  stopTimer();

  playTemperatureSound(
    { value: locationTemperature.value },
    true
  );
}

  function startPlayback() {
    if (!recordsRef.current.length) return;

    stopTimer();

    let next = indexRef.current;

    if (next >= recordsRef.current.length) next = 0;

    setIsPlaying(true);
    playSelectedReading(next);

    timerRef.current = setInterval(() => {
      next += 1;

      if (next >= recordsRef.current.length) {
        stopTimer();
        setIsPlaying(false);
        return;
      }

      playSelectedReading(next);
    }, 2600);
  }

  function togglePlayback() {
    if (isPlaying) {
      stopTimer();
      if (audioRef.current) audioRef.current.suspend();
      setIsPlaying(false);
    } else {
      if (audioRef.current?.state === "suspended") {
        audioRef.current.resume();
      }
      startPlayback();
    }
  }

  function replayPlayback() {
    stopTimer();

    if (audioRef.current?.state === "running") {
      audioRef.current.suspend();
    }

    indexRef.current = 0;
    setSelectedIndex(0);
    startPlayback();
  }

  function chooseMonth(index) {
    stopTimer();

    if (audioRef.current?.state === "running") {
      audioRef.current.suspend();
    }

    setIsPlaying(false);
    indexRef.current = index;
    setSelectedIndex(index);
  }

  useEffect(() => {
    return () => {
      stopTimer();

      if (audioRef.current) {
        audioRef.current.close();
        audioRef.current = null;
      }
    };
  }, []);

  /* DATA AND VISUAL CALCULATIONS */

  const selected = records[selectedIndex];
  const latest = records[records.length - 1];

  const values = records.map((record) => record.value);

  const minValue = Math.min(...values, 0) - 0.15;
  const maxValue = Math.max(...values, 0) + 0.15;

  const chartPoints = records.map((record, index) => {
    const x = records.length === 1
      ? 600
      : 50 + index * (1100 / (records.length - 1));

    const y = 300 -
      ((record.value - minValue) / (maxValue - minValue)) * 230;

    return { x, y };
  });

  const linePath = chartPoints
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");

  const areaPath = `${linePath} L 1150 330 L 50 330 Z`;

  const selectedPoint = chartPoints[selectedIndex];

  const heat = selected
    ? Math.max(0, Math.min(100, ((selected.value + 0.5) / 2.5) * 100))
    : 50;

  const temperatureColor = heat > 65
    ? "#d98265"
    : heat > 40
      ? "#d8a078"
      : "#69aaa0";

  function formatTemperature(value) {
    if (value === undefined) return "—";
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
  }

  const monthLabel = selected
    ? `${monthNames[selected.month]} ${selected.year}`
    : "Loading...";

  return (
    <main className={`living-page ${climateTheme}-theme`}>
      <style>{`
        .living-page {
          --forest:#355e4b;
          --ivory:#f4f0e5;
          --sage:#8abf9f;
          --ocean:#65b9c5;
          --terra:#d98f72;
          --ink:#293d35;
          background:var(--ivory);
          color:var(--ink);
          min-height:100vh;
          overflow:hidden;
          font-family:inherit;
        }
          /* COOL TEMPERATURE THEME */
.living-page.cool-theme {
  --forest: #315b78;
  --ivory: #e8f1f5;
  --sage: #91bdca;
  --ocean: #579bb5;
  --terra: #83aebf;
  --ink: #263f50;
}

/* MODERATE TEMPERATURE THEME */
.living-page.moderate-theme {
  --forest: #355e4b;
  --ivory: #f4f0e5;
  --sage: #8abf9f;
  --ocean: #65b9c5;
  --terra: #d98f72;
  --ink: #293d35;
}

/* HOT TEMPERATURE THEME */
.living-page.hot-theme {
  --forest: #a94f32;
  --ivory: #fff0df;
  --sage: #e6a16e;
  --ocean: #d98769;
  --terra: #e46e4c;
  --ink: #583426;
}
  /* FULL PAGE THEME TRANSITIONS */
.living-page {
  transition: background 0.5s ease, color 0.5s ease;
}

.living-page.cool-theme {
  background: #dcecf5;
  color: #193e55;
}

.living-page.moderate-theme {
  background: #f4f0e5;
  color: #293d35;
}

.living-page.hot-theme {
  background: #ffe1c5;
  color: #583426;
}

/* Make sections inherit the selected theme */
.living-page section,
.living-page .living-section {
  transition: background 0.5s ease, color 0.5s ease;
}

.living-page.cool-theme section {
  background-color: #e8f4fa;
}

.living-page.moderate-theme section {
  background-color: #f4f0e5;
}

.living-page.hot-theme section {
  background-color: #ffead8;
}
        .living-page * { box-sizing:border-box; }
        .living-nav {
          height:78px;padding:0 7%;display:flex;align-items:center;
          justify-content:space-between;border-bottom:1px solid #355e4b22;
        }
        .living-brand {font-size:25px;font-weight:700;color:var(--forest);text-decoration:none}
        .living-nav-label {font-size:10px;letter-spacing:2px;color:#829084}
        .living-back {
          border:1px solid #355e4b55;border-radius:30px;padding:11px 18px;
          color:var(--forest);background:transparent;cursor:pointer;
        }
        .living-hero {
          min-height:450px;padding:75px 9%;display:grid;
          grid-template-columns:1.1fr .9fr;align-items:center;gap:40px;
          background:radial-gradient(ellipse at 78% 50%,#65b9c522,transparent 45%),#f4f0e5;
        }
        .living-kicker {font-size:10px;letter-spacing:2.5px;color:#6d8978}
        .living-kicker i {display:inline-block;width:7px;height:7px;background:#d98f72;border-radius:50%;margin-right:10px}
        .living-hero h1 {font-size:clamp(55px,7vw,100px);line-height:.95;letter-spacing:-5px;font-weight:500;color:var(--forest);margin:25px 0}
        .living-hero h1 em,.living-section-title em {font-family:Georgia,serif;color:#c47e61;font-weight:400}
        .living-hero p {max-width:480px;line-height:1.9;color:#718176;font-size:15px}
        .living-hero-planet {width:min(100%,380px);aspect-ratio:1;border-radius:50%;margin:auto;position:relative;display:grid;place-items:center}
        .living-planet-core {
          width:60%;aspect-ratio:1;border-radius:50%;
          background:radial-gradient(circle at 30% 25%,#d6e7c4,#72b9b1 48%,#286c6a 85%);
          box-shadow:inset -25px -20px 35px #173f3b55,0 0 75px #65b9c555;
          animation:planetFloat 7s ease-in-out infinite;position:relative;overflow:hidden;
        }
        .living-planet-core:before,.living-planet-core:after {
          content:"";position:absolute;width:45%;height:25%;background:#a7bd8d;
          border-radius:60% 35% 50% 30%;left:18%;top:25%;transform:rotate(-25deg);
        }
        .living-planet-core:after {left:52%;top:53%;width:25%;height:35%;transform:rotate(20deg)}
        .living-planet-orbit {position:absolute;width:100%;height:38%;border:1px solid #65aaa066;border-radius:50%;transform:rotate(-28deg);animation:planetOrbit 18s linear infinite}
        .living-planet-orbit.two {width:115%;height:50%;transform:rotate(35deg);border-color:#d98f7266;animation-duration:25s}
        @keyframes planetFloat {50%{transform:translateY(-12px) rotate(5deg)}}
        @keyframes planetOrbit {to{rotate:360deg}}
        .living-data-section {padding:90px 6%;background:#e9eee3}
        .living-section-title {max-width:1300px;margin:0 auto 35px}
        .living-section-title h2 {font-size:clamp(38px,5vw,65px);font-weight:500;letter-spacing:-2px;color:var(--forest);margin:18px 0}
        .living-section-title p {color:#758579;line-height:1.8}
        .living-data-top {display:flex;justify-content:space-between;align-items:end;gap:20px;max-width:1300px;margin:0 auto 25px}
        .living-current-date {font-size:11px;letter-spacing:2px;color:#718176}
        .living-big-number {font-size:clamp(60px,9vw,115px);font-weight:500;letter-spacing:-6px;color:${temperatureColor};line-height:1}
        .living-big-number small {font-size:.35em;letter-spacing:0}
        .living-chart-shell {
          max-width:1400px;margin:auto;position:relative;overflow:hidden;
          min-height:480px;padding:25px 3% 20px;border-radius:24px;
          background:linear-gradient(145deg,#fbf9f0,#e3eee5);
          border:1px solid #355e4b22;box-shadow:0 25px 70px #355e4b0c;
        }
        .living-chart-top {display:flex;justify-content:space-between;color:#829084;font-size:9px;letter-spacing:2px}
        .living-chart-ghost {
          position:absolute;top:70px;left:50%;transform:translateX(-50%);
          font-size:clamp(100px,17vw,220px);font-weight:700;letter-spacing:-12px;
          color:#355e4b0d;white-space:nowrap;pointer-events:none;
        }
        .living-chart-svg {position:relative;z-index:2;width:100%;height:350px;overflow:visible;margin-top:25px}
        .living-chart-svg .gridline {stroke:#355e4b20;stroke-dasharray:4 8}
        .living-month-buttons {display:grid;grid-template-columns:repeat(12,1fr);gap:4px;margin-top:15px}
        .living-month-buttons button {
          background:transparent;border:0;padding:8px 1px;cursor:pointer;
          color:#859388;font-size:10px;letter-spacing:1px;
        }
        .living-month-buttons button:before {
          content:"";display:block;width:6px;height:6px;border-radius:50%;
          background:#aab9aa;margin:0 auto 10px;transition:.2s;
        }
        .living-month-buttons button.active {color:var(--forest);font-weight:800}
        .living-month-buttons button.active:before {width:12px;height:12px;background:#d98f72;box-shadow:0 0 0 5px #d98f7222}
        .living-chart-foot {display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap;margin-top:25px;color:#829084;font-size:9px;letter-spacing:1.5px}
        .living-explorer {padding:100px 9%;display:grid;grid-template-columns:.8fr 1.2fr;gap:8%;align-items:center;background:#f4f0e5}
        .living-explorer h2 {font-size:clamp(40px,5vw,65px);font-weight:500;color:var(--forest);line-height:1.05}
        .living-explorer p {color:#718176;line-height:1.9;font-size:14px}
        .living-control-card {padding:35px;background:#fffdf7;border:1px solid #355e4b22;border-radius:22px;box-shadow:0 20px 60px #355e4b0c}
        .living-control-card label {font-size:10px;letter-spacing:2px;color:#829084}
        .living-range {width:100%;margin:28px 0;accent-color:#c47e61;cursor:pointer}
        .living-stats {display:grid;grid-template-columns:repeat(3,1fr);gap:15px;padding-top:22px;border-top:1px solid #355e4b20}
        .living-stats span {display:block;font-size:9px;letter-spacing:1px;color:#87958a}
        .living-stats strong {display:block;margin-top:9px;color:var(--forest);font-size:14px}
        .living-sound-section {padding:100px 9%;display:grid;grid-template-columns:1fr 1fr;gap:8%;align-items:center;background:#e5eee5}
        .living-sound-section h2 {font-size:clamp(45px,5.5vw,75px);font-weight:500;line-height:1.03;color:var(--forest)}
        .living-sound-section h2 em {font-family:Georgia,serif;color:#c47e61}
        .living-sound-section p {max-width:480px;color:#718176;line-height:1.9;font-size:14px}
        .living-play,.living-replay {
          border-radius:30px;padding:15px 22px;cursor:pointer;font:inherit;font-size:12px;margin:12px 8px 0 0;transition:.2s
        }
        .living-play {background:var(--forest);color:white;border:1px solid var(--forest)}
        .living-replay {background:transparent;color:var(--forest);border:1px solid #355e4b66}
        .living-play:hover,.living-replay:hover {transform:translateY(-2px)}
        .living-sound-art {height:400px;position:relative;display:grid;place-items:center}
        .living-sound-orbit {position:absolute;width:90%;height:35%;border:1px solid #65aaa066;border-radius:50%;transform:rotate(-30deg)}
        .living-sound-orbit.two {transform:rotate(35deg);width:105%;height:50%;border-color:#d98f7266}
        .living-sound-core {width:155px;height:155px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#fff8e4,#c6e1d3);box-shadow:0 0 65px #65b9c544;color:var(--forest);font-size:35px;z-index:2}
        .living-wave {position:absolute;bottom:15px;left:0;right:0;height:100px;display:flex;align-items:center;justify-content:center;gap:4px}
        .living-wave i {width:4px;height:var(--h);border-radius:5px;background:linear-gradient(to top,#65aaa0,#d98f72);opacity:.65;transform:scaleY(.25)}
        .living-wave.playing i {animation:waveMove .7s ease-in-out infinite alternate;animation-delay:var(--d)}
        @keyframes waveMove {to{transform:scaleY(1);opacity:1}}
        .living-method {padding:100px 9%;background:#f8f5ec}
        .living-method h2 {font-size:clamp(38px,5vw,60px);font-weight:500;color:var(--forest);margin:20px 0 45px}
        .living-method-grid {display:grid;grid-template-columns:repeat(3,1fr);gap:25px}
        .living-method-grid article {padding:25px;border-top:1px solid #355e4b55;background:#ffffff66}
        .living-method-grid article>span {color:#c47e61;font-size:13px;letter-spacing:2px}
        .living-method-grid h3 {color:var(--forest);font-size:22px;font-weight:500}
        .living-method-grid p {color:#718176;font-size:13px;line-height:1.8}
        .living-source {padding:25px 0;margin-top:55px;border-top:1px solid #355e4b33;border-bottom:1px solid #355e4b33;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
        .living-source span {font-size:9px;letter-spacing:2px;color:#829084}
        .living-source a {color:#b86f55;font-size:12px;text-decoration:none}
        .living-footer {padding:30px 7%;display:flex;justify-content:space-between;align-items:center;gap:20px;background:#e7ece2}
        .living-footer span {font-size:10px;letter-spacing:1.5px;color:#829084}
        .living-footer button {border:0;background:none;color:var(--forest);cursor:pointer}
        .living-error {padding:35px;margin:30px auto;max-width:900px;background:white;border-radius:15px;color:#9d5949}
        @media(max-width:850px) {
          .living-hero,.living-explorer,.living-sound-section {grid-template-columns:1fr;text-align:center}
          .living-hero p,.living-sound-section p {margin-left:auto;margin-right:auto}
          .living-hero-planet {max-width:330px}
          .living-data-top {align-items:start;flex-direction:column}
          .living-method-grid {grid-template-columns:1fr}
          .living-sound-art {max-width:500px;width:100%;margin:auto}
        }
        @media(max-width:550px) {
          .living-nav {padding:0 5%;height:68px}
          .living-nav-label {display:none}
          .living-hero {padding:65px 7%}
          .living-hero h1 {font-size:62px;letter-spacing:-3px}
          .living-data-section,.living-explorer,.living-sound-section,.living-method {padding:70px 5%}
          .living-chart-shell {padding:20px 3%;min-height:390px;border-radius:15px}
          .living-chart-svg {height:250px}
          .living-chart-ghost {top:85px;font-size:100px}
          .living-month-buttons button {font-size:7px}
          .living-month-buttons button:before {width:5px;height:5px}
          .living-stats {grid-template-columns:1fr}
          .living-footer {flex-wrap:wrap}
          .living-footer span {width:100%}
        }
          /* DARK THERMAL ATMOSPHERE */
.living-page {
  background: #081b2b !important;
  color: #edf3f4;
  position: relative;
  isolation: isolate;
}

.living-page::before {
  content: "";
  position: absolute;
  inset: -10%;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 18% 20%, #087b9560, transparent 38%),
    radial-gradient(ellipse at 78% 18%, #bd713b45, transparent 35%),
    radial-gradient(ellipse at 65% 75%, #164d6955, transparent 42%),
    radial-gradient(ellipse at 20% 85%, #087b9540, transparent 35%);
  filter: blur(65px);
}

.living-page section {
  background-color: transparent !important;
  color: #edf3f4;
  position: relative;
}

.living-nav {
  border-bottom-color: #ffffff20;
}

.living-hero {
  background:
    radial-gradient(ellipse at 78% 50%, #c17b3b30, transparent 45%),
    radial-gradient(ellipse at 20% 40%, #087b9530, transparent 50%),
    transparent !important;
}

.living-data-section,
.living-explorer,
.living-sound-section,
.living-method,
.living-footer {
  background: transparent !important;
}

.living-chart-shell {
  background: linear-gradient(145deg, #102c40, #142b3a) !important;
  border: 1px solid #ffffff20;
  box-shadow: 0 25px 70px #00000035;
}

.living-control-card {
  background: #102c40 !important;
  border-color: #ffffff25;
}

.living-method-grid article {
  background: #102c4070;
  border-color: #ffffff30;
}
  /* HERO SECTION — DARK THEME TYPOGRAPHY */

.living-brand {
  color: #e6f1f2 !important;
  letter-spacing: 0.5px;
}

.living-nav-label {
  color: #9bb6c0;
}

.living-back {
  color: #dcebed;
  border-color: #ffffff40;
}

.living-kicker {
  color: #80c4c9;
}

.living-kicker i {
  background: #d99b62;
}

.living-hero h1 {
  color: #eaf2f2;
}

.living-hero h1 em {
  color: #d9a16d;
}

.living-hero p {
  color: #b2c4cb;
}

.living-section-title h2,
.living-explorer h2,
.living-sound-section h2,
.living-method h2 {
  color: #eaf2f2;
}

.living-section-title p,
.living-explorer p,
.living-sound-section p,
.living-method-grid p {
  color: #b2c4cb;
}
  /* TEMPERATURE DATA SECTION */

.living-current-date,
.living-chart-top,
.living-chart-foot {
  color: #9bb6c0 !important;
}

.living-big-number {
  text-shadow: 0 0 25px #d99b6230;
}

.living-chart-shell {
  background: linear-gradient(145deg, #102c40, #18394a) !important;
  border: 1px solid #6a9eae40 !important;
  border-radius: 22px;
  box-shadow: 0 20px 60px #00000035;
}

.living-chart-ghost {
  color: #d8eaf00b !important;
}

.living-chart-svg .gridline {
  stroke: #b8d1dc30 !important;
}

.living-month-buttons button {
  color: #9bb6c0 !important;
}

.living-month-buttons button.active {
  color: #f0c18e !important;
}

.living-month-buttons button:before {
  background: #668a9a !important;
}

.living-month-buttons button.active:before {
  background: #e3a56d !important;
  box-shadow: 0 0 0 5px #e3a56d25 !important;
}
  /* LOCATION EXPLORER */

.living-explorer {
  background: transparent !important;
}

.living-explorer h2 {
  color: #eaf2f2 !important;
}

.living-explorer p {
  color: #b2c4cb !important;
}

.living-control-card {
  background: linear-gradient(145deg, #102c40, #18394a) !important;
  border: 1px solid #6a9eae40 !important;
  box-shadow: 0 20px 55px #00000030;
}

.living-control-card label {
  color: #9bb6c0 !important;
}

.living-stats {
  border-color: #ffffff25 !important;
}

.living-stats span {
  color: #9bb6c0 !important;
}

.living-stats strong {
  color: #e9bd8d !important;
}

.living-range {
  accent-color: #e3a56d;
}
  /* TEMPERATURE SOUND EXPERIENCE */

.living-sound-section {
  background: transparent !important;
}

.living-sound-section h2 {
  color: #eaf2f2 !important;
}

.living-sound-section h2 em {
  color: #dfa36f !important;
}

.living-sound-section p {
  color: #b2c4cb !important;
}

.living-sound-core {
  background: radial-gradient(
    circle at 35% 30%,
    #d8c39e,
    #4c8490 75%
  ) !important;
  color: #102c40 !important;
  box-shadow: 0 0 65px #65b9c555;
}

.living-sound-orbit {
  border-color: #65b9c555 !important;
}

.living-sound-orbit.two {
  border-color: #d99b6266 !important;
}

.living-wave i {
  background: linear-gradient(to top, #20a8b7, #dfa36f) !important;
}
  /* METHODOLOGY SECTION */

.living-method {
  background: transparent !important;
}

.living-method h2,
.living-method-grid h3 {
  color: #eaf2f2 !important;
}

.living-method-grid article {
  background: #102c4070 !important;
  border-top-color: #6a9eae60 !important;
  border-radius: 12px;
}

.living-method-grid article > span {
  color: #dfa36f !important;
}

.living-source {
  border-color: #ffffff30 !important;
}

.living-source span {
  color: #9bb6c0 !important;
}

.living-source a {
  color: #e3a56d !important;
}

/* BUTTONS */

.living-play {
  background: #d99b62 !important;
  border-color: #d99b62 !important;
  color: #102c40 !important;
}

.living-replay {
  color: #dcebed !important;
  border-color: #ffffff55 !important;
}

/* FOOTER */

.living-footer {
  background: #081522 !important;
}

.living-footer span {
  color: #9bb6c0 !important;
}

.living-footer button {
  color: #e3a56d !important;
}
  /* LAPTOP & DESKTOP LAYOUT */

@media (min-width: 851px) {

  .living-hero {
    min-height: 560px;
    padding: 85px 8%;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 55px;
  }

  .living-hero-planet {
    width: min(100%, 440px);
  }

  .living-hero h1 {
    font-size: clamp(65px, 6.5vw, 92px);
    line-height: 1.02;
  }

  .living-data-section,
  .living-explorer,
  .living-sound-section,
  .living-method {
    padding-top: 105px;
    padding-bottom: 105px;
  }

  .living-explorer {
    gap: 7%;
  }

  .living-sound-section {
    gap: 9%;
  }

  .living-section-title {
    margin-bottom: 45px;
  }

  .living-chart-shell {
    min-height: 500px;
    padding: 32px 4%;
  }

  .living-chart-svg {
    height: 370px;
  }

  .living-method-grid {
    gap: 30px;
  }

  .living-method-grid article {
    padding: 32px;
  }
}

/* MEDIUM LAPTOPS */

@media (min-width: 851px) and (max-width: 1100px) {

  .living-hero {
    padding-left: 6%;
    padding-right: 6%;
    gap: 25px;
  }

  .living-explorer,
  .living-sound-section,
  .living-method {
    padding-left: 6%;
    padding-right: 6%;
  }
}
  /* TABLET RESPONSIVENESS */

@media (min-width: 551px) and (max-width: 850px) {

  .living-nav {
    padding: 0 5%;
  }

  .living-hero {
    padding: 65px 7%;
    gap: 25px;
  }

  .living-hero h1 {
    font-size: clamp(52px, 8vw, 72px);
    letter-spacing: -3px;
  }

  .living-hero-planet {
    max-width: 340px;
  }

  .living-data-section,
  .living-explorer,
  .living-sound-section,
  .living-method {
    padding: 75px 6%;
  }

  .living-explorer,
  .living-sound-section {
    gap: 45px;
  }

  .living-chart-shell {
    min-height: 420px;
    padding: 25px 4%;
  }

  .living-chart-svg {
    height: 300px;
  }

  .living-method-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
  }

  .living-sound-art {
    height: 330px;
  }
}
  /* MOBILE RESPONSIVENESS */

@media (max-width: 550px) {

  /* NAVIGATION */
  .living-nav {
    height: 68px;
    padding: 0 5%;
    gap: 10px;
  }

  .living-brand {
    font-size: 20px;
  }

  .living-back {
    padding: 9px 13px;
    font-size: 12px;
  }

  /* HERO */
  .living-hero {
    min-height: auto;
    padding: 55px 7% 65px;
    grid-template-columns: 1fr;
    gap: 35px;
    text-align: center;
  }

  .living-hero h1 {
    font-size: clamp(48px, 12vw, 62px);
    letter-spacing: -2px;
    line-height: 1.05;
  }

  .living-hero p {
    font-size: 14px;
    margin: auto;
  }

  .living-hero-planet {
    width: 100%;
    max-width: 290px;
  }

  /* SECTION SPACING */
  .living-data-section,
  .living-explorer,
  .living-sound-section,
  .living-method {
    padding: 65px 6%;
  }

  .living-section-title h2,
  .living-explorer h2,
  .living-sound-section h2,
  .living-method h2 {
    font-size: 39px;
    letter-spacing: -1px;
  }

  /* TEMPERATURE GRAPH */
  .living-chart-shell {
    min-height: 360px;
    padding: 18px 12px;
    border-radius: 15px;
  }

  .living-chart-top {
    font-size: 8px;
    letter-spacing: 1px;
  }

  .living-chart-svg {
    height: 230px;
    margin-top: 20px;
  }

  .living-chart-ghost {
    font-size: 85px;
    letter-spacing: -5px;
  }

  .living-month-buttons {
    grid-template-columns: repeat(12, minmax(30px, 1fr));
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .living-month-buttons button {
    font-size: 8px;
  }

  /* LOCATION EXPLORER */
  .living-explorer {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .living-control-card {
    padding: 23px 18px;
  }

  .living-stats {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  /* SOUND EXPERIENCE */
  .living-sound-section {
    grid-template-columns: 1fr;
    gap: 25px;
    text-align: center;
  }

  .living-sound-art {
    height: 290px;
  }

  .living-play,
  .living-replay {
    margin: 8px 4px;
  }

  /* METHODOLOGY */
  .living-method-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .living-method-grid article {
    padding: 23px;
  }

  .living-source {
    align-items: flex-start;
    flex-direction: column;
  }

  /* FOOTER */
  .living-footer {
    padding: 25px 6%;
    flex-wrap: wrap;
    gap: 15px;
  }
}
      `}</style>

      <header className="living-nav">
        <a href="#home" className="living-brand" onClick={onBack}>
          ✧ अनुवाद
        </a>
        <span className="living-nav-label">
          EARTH SYSTEMS <i>/</i> CLIMATE CHANGE
        </span>
        <button className="living-back" onClick={onBack}>
          ← Back to Earth
        </button>
      </header>

      {/* INTRO */}

      <section className="living-hero">
        <div>
          <span className="living-kicker">
            <i /> NASA EARTH OBSERVATIONS / 01
          </span>
          <h1>
            The planet
            <br />
            is <em>changing.</em>
          </h1>
          <p>
            Every fraction of a degree tells a story.
            Explore the changing temperature of Earth,
            watch its patterns unfold, and listen to the data.
          </p>
        </div>

        <div className="living-hero-planet">
          <div className="living-planet-orbit" />
          <div className="living-planet-orbit two" />
          <div className="living-planet-core" />
        </div>
      </section>

      {loading && (
        <div className="living-message">
          <h2>Reading the planet...</h2>
          <p>Loading NASA global temperature observations.</p>
        </div>
      )}

      {error && (
        <div className="living-error">
          <h2>Unable to load NASA data</h2>
          <p>{error}</p>
          <p>Check that your CSV file is saved as public/nasa-gistemp.csv.</p>
        </div>
      )}

      {!loading && !error && selected && (
        <>
          {/* GIANT TEMPERATURE VISUALIZATION */}

          <section className="living-data-section">
            <div className="living-section-title">
              <span className="living-kicker">
                <i /> 01 / THE TEMPERATURE RIVER
              </span>
              <h2>
                One year.
                <br />
                <em>One changing planet.</em>
              </h2>
              <p>
                Follow the rise and fall of global temperature anomalies
                through the latest 12 available NASA monthly observations.
              </p>
            </div>

            <div className="living-data-top">
              <div>
                <div className="living-current-date">
                  SELECTED OBSERVATION / {monthLabel.toUpperCase()}
                </div>
                <div className="living-big-number">
                  {formatTemperature(selected.value)}
                  <small>°C</small>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div className="living-current-date">LATEST AVAILABLE READING</div>
                <div style={{ fontSize: 25, color: "#355e4b", marginTop: 10 }}>
                  {formatTemperature(latest.value)}°C
                </div>
                <div className="living-current-date">
                  {monthNames[latest.month]} {latest.year}
                </div>
              </div>
            </div>

            <div className="living-chart-shell" style={{ "--heat": heat }}>
              <div className="living-chart-top">
                <span>GLOBAL TEMPERATURE ANOMALY</span>
                <span>NASA GISTEMP V4 / °C</span>
              </div>

              <div className="living-chart-ghost">
                {formatTemperature(selected.value)}°
              </div>

              <svg
                className="living-chart-svg"
                viewBox="0 0 1200 360"
                preserveAspectRatio="none"
                role="img"
                aria-label="Interactive chart of monthly global temperature anomalies"
              >
                <defs>
                  <linearGradient id="riverGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={temperatureColor} stopOpacity=".48" />
                    <stop offset="100%" stopColor={temperatureColor} stopOpacity=".015" />
                  </linearGradient>
                  <linearGradient id="riverStroke" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#70b8aa" />
                    <stop offset="55%" stopColor="#d5a477" />
                    <stop offset="100%" stopColor="#d77e60" />
                  </linearGradient>
                </defs>

                {[70, 140, 210, 280].map((y) => (
                  <line
                    key={y}
                    className="gridline"
                    x1="40"
                    x2="1160"
                    y1={y}
                    y2={y}
                  />
                ))}

                <path d={areaPath} fill="url(#riverGradient)" />

                <path
                  d={linePath}
                  fill="none"
                  stroke="url(#riverStroke)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {chartPoints.map((point, index) => (
                  <g
                    key={index}
                    onClick={() => chooseMonth(index)}
                    style={{ cursor: "pointer" }}
                  >
                    {index === selectedIndex && (
                      <>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="24"
                          fill={temperatureColor}
                          opacity=".15"
                        />
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="15"
                          fill="none"
                          stroke={temperatureColor}
                          strokeWidth="2"
                          opacity=".7"
                        />
                      </>
                    )}

                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={index === selectedIndex ? 8 : 5}
                      fill={index === selectedIndex ? temperatureColor : "#fffdf5"}
                      stroke={temperatureColor}
                      strokeWidth="3"
                    />
                  </g>
                ))}

                {selectedPoint && (
                  <line
                    x1={selectedPoint.x}
                    x2={selectedPoint.x}
                    y1={selectedPoint.y + 20}
                    y2="330"
                    stroke={temperatureColor}
                    strokeDasharray="5 7"
                    strokeWidth="2"
                    opacity=".7"
                  />
                )}
              </svg>

              <div className="living-month-buttons">
                {records.map((record, index) => (
                  <button
                    key={`${record.year}-${record.month}`}
                    className={selectedIndex === index ? "active" : ""}
                    onClick={() => chooseMonth(index)}
                    title={`${monthNames[record.month]} ${record.year}: ${formatTemperature(record.value)}°C`}
                  >
                    {shortMonths[record.month]}
                  </button>
                ))}
              </div>

              <div className="living-chart-foot">
                <span>← COOLER ANOMALIES</span>
                <span>MONTHLY NASA OBSERVATIONS</span>
                <span>WARMER ANOMALIES →</span>
              </div>
            </div>
          </section>
          <section className="living-sound-section">
            <div>
              <span className="living-kicker">
                <i /> 02 / HEAR THE TEMPERATURE
              </span>

              <h2>
                What does
                <br />
                warming <em>sound like?</em>
              </h2>

              <p>
                Each NASA temperature observation becomes a musical
                signal. Higher anomalies produce higher pitches and
                brighter tones. Lower anomalies produce deeper,
                softer tones.
              </p>

              <div style={{
                padding: "17px 0",
                borderTop: "1px solid #355e4b33",
                borderBottom: "1px solid #355e4b33",
                maxWidth: 390,
                display: "flex",
                justifyContent: "space-between",
                gap: 10
              }}>
                <span style={{ fontSize: 10, color: "#829084", letterSpacing: 1 }}>
                  CURRENT SOUND SIGNAL
                </span>
                <strong style={{ color: "#355e4b", fontSize: 13 }}>
                  {monthLabel}
                </strong>
              </div>

              <button
                className="living-play"
                onClick={togglePlayback}
                disabled={!records.length}
              >
                {isPlaying ? "Ⅱ  Pause journey" : "▶  Listen to the data"}
              </button>

              <button
                className="living-replay"
                onClick={replayPlayback}
                disabled={!records.length}
              >
                ↻ Replay
              </button>

              <div style={{
                color: "#829084",
                fontSize: 9,
                letterSpacing: 1.4,
                marginTop: 20
              }}>
                DATA-DRIVEN SONIFICATION · HEADPHONES RECOMMENDED
              </div>
            </div>

            <div className="living-sound-art">
              <div className="living-sound-orbit" />
              <div className="living-sound-orbit two" />

              <div className="living-sound-core">
                {formatTemperature(selected.value)}°
              </div>

              <div className={`living-wave ${isPlaying ? "playing" : ""}`}>
                {Array.from({ length: 55 }, (_, index) => (
                  <i
                    key={index}
                    style={{
                      "--h": `${12 + ((index * 19 + index * index * 3) % 75)}px`,
                      "--d": `${index * 0.025}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        </>
      )}

          {/* INTERACTIVE EXPLORER */}

          <section className="living-explorer">
            <div>
              <span className="living-kicker">
                <i /> 02 / EXPLORE THE DATA
              </span>
              <h2>
                Move through
                <br />
                <em>the months.</em>
              </h2>
              <p>
                Drag the timeline to travel through the observations.
                Every selection changes the temperature visualization
                and the sound generated from that reading.
              </p>
            </div>

            <div className="living-control-card">
  {records.length > 0 && selected && latest ? (
    <>
      <label>YOUR SELECTED OBSERVATION</label>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
        marginTop: 15
      }}>
        <strong style={{ color: "#355e4b", fontSize: 21 }}>
          {monthLabel}
        </strong>
        <strong style={{ color: temperatureColor, fontSize: 32 }}>
          {formatTemperature(selected.value)}°
        </strong>
      </div>

      <input
        className="living-range"
        type="range"
        min="0"
        max={records.length - 1}
        value={selectedIndex}
        onChange={(event) => chooseMonth(Number(event.target.value))}
        aria-label="Select a monthly temperature observation"
      />

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        color: "#829084",
        fontSize: 10
      }}>
        <span>{monthNames[records[0].month]} {records[0].year}</span>
        <span>{monthNames[latest.month]} {latest.year}</span>
      </div>

      <div className="living-stats">
        <div>
          <span>BASELINE</span>
          <strong>1951–1980</strong>
        </div>
        <div>
          <span>DATA TYPE</span>
          <strong>Temperature anomaly</strong>
        </div>
        <div>
          <span>UNIT</span>
          <strong>Degrees Celsius</strong>
        </div>
      </div>
    </>
  ) : (
    <p style={{ padding: 20, color: "#355e4b" }}>
      Loading NASA temperature observations...
    </p>
  )}
</div>
          </section>

          {/* DATA SONIFICATION */}
          
          {/* LOCATION-BASED NASA TEMPERATURE EXPLORER */}

          <section className="living-data-section">
            <div className="living-section-title">
              <span className="living-kicker">
                <i /> 03 / EXPLORE YOUR PLANET
              </span>

              <h2>
                Every place.
                <br />
                <em>A different temperature story.</em>
              </h2>

              <p>
                Select any land location to explore its
                temperature using NASA POWER climate data.
              </p>
            </div>

            <div style={{
              maxWidth: 1300,
              margin: "auto",
              background: "#fffdf7",
              padding: 20,
              borderRadius: 22
            }}>
              <ClimateMap
                onLocationSelect={handleClimateLocationSelect}
                onWaterSelect={handleClimateWaterSelect}
              />

              {landMessage && (
                <p style={{
                  color: "#b86f55",
                  textAlign: "center",
                  padding: 15
                }}>
                  {landMessage}
                </p>
              )}

              {locationLoading && (
                <p style={{
                  textAlign: "center",
                  padding: 20,
                  color: "#355e4b"
                }}>
                  Retrieving NASA temperature data...
                </p>
              )}

              {locationError && (
                <p style={{
                  textAlign: "center",
                  padding: 20,
                  color: "#b86f55"
                }}>
                  {locationError}
                </p>
              )}

              {locationTemperature && (
                <>
                <div style={{
                  marginTop: 25,
                  padding: 25,
                  borderRadius: 16,
                  background: "#e9eee3"
                }}>
                  <span className="living-kicker">
                    NASA POWER / LOCATION REPORT
                  </span>

                  <h2 style={{
                    color: "#355e4b",
                    fontSize: 55,
                    margin: "15px 0"
                  }}>
                    {locationTemperature.value.toFixed(2)}°C
                  </h2>

                  <p style={{ color: "#718176" }}>
                    Air temperature at 2 metres
                  </p>

                  <p style={{ color: "#718176" }}>
                    Latitude: {locationTemperature.latitude.toFixed(3)}
                    <br />
                    Longitude: {locationTemperature.longitude.toFixed(3)}
                    <br />
                    Observation date: {
                      locationTemperature.date.slice(0, 4)
                    }-{
                      locationTemperature.date.slice(4, 6)
                    }-{
                      locationTemperature.date.slice(6, 8)
                    }
                  </p>

                  <p style={{
                    fontSize: 11,
                    color: "#829084",
                    marginTop: 15
                  }}>
                    Source: NASA POWER Daily API · T2M · °C
                                      
                  </p>
                </div>
                <section className="living-sound-section">
  <div>
    <span className="living-kicker">
      <i /> LISTEN TO THIS LOCATION
    </span>
    {locationNameLoading && (
  <p style={{ color: "#718176" }}>
    Identifying location...
  </p>
)}

{locationDetails && (
  <div style={{
    marginTop: 12,
    marginBottom: 15,
    color: "#355e4b"
  }}>
    <h3 style={{ fontSize: 25, margin: "8px 0" }}>
      📍 {locationDetails.place}
    </h3>

    {locationDetails.state && (
      <p>State / Region: {locationDetails.state}</p>
    )}

    <p>Country: {locationDetails.country}</p>
    <p>Continent: {locationDetails.continent}</p>
  </div>
)}

    <h2>
      What does this
      <br />
      <em>place sound like?</em>
    </h2>

    <p>
      Hear the temperature of this location
      transformed into a musical experience.
    </p>

    <button
      className="living-play"
      onClick={playLocationTemperatureSound}
    >
      ▶ Listen to this location
    </button>
  </div>
</section>
</>
              )}
            </div>
          </section>


          

      {/* HOW IT WORKS */}

      <section className="living-method">
        <span className="living-kicker">
          <i /> 04 / BEHIND THE EXPERIENCE
        </span>

        <h2>
          From observation
          <br />
          to <em>experience.</em>
        </h2>

        <div className="living-method-grid">
          <article>
            <span>01</span>
            <h3>Observe</h3>
            <p>
              NASA GISTEMP provides monthly global temperature
              anomalies based on land and ocean observations.
            </p>
          </article>

          <article>
            <span>02</span>
            <h3>Visualize</h3>
            <p>
              Each observation becomes a point in the temperature
              river, revealing the pattern across the selected months.
            </p>
          </article>

          <article>
            <span>03</span>
            <h3>Listen</h3>
            <p>
              The same temperature values control the pitch and
              intensity of a synthesized sound.
            </p>
          </article>
        </div>

        <div className="living-source">
          <div>
            <span>DATA SOURCE</span>
            <strong>NASA GISS Surface Temperature Analysis — GISTEMP v4</strong>
          </div>
          <a
            href="https://data.giss.nasa.gov/gistemp/"
            target="_blank"
            rel="noreferrer"
          >
            Explore official NASA data ↗
          </a>
        </div>

        <p style={{
          color: "#829084",
          fontSize: 11,
          lineHeight: 1.8,
          marginTop: 20
        }}>
          Temperature values are anomalies relative to the 1951–1980
          average. The sound is generated by Anuwaad from the data;
          it is not a recording of the Earth's natural sounds.
          This visualization uses global monthly values, not
          geographic temperature maps.
        </p>
      </section>

      <footer className="living-footer">
        <a href="#home" className="living-brand" onClick={onBack}>
          ✧ अनुवाद
        </a>
        <span>BRINGING EARTH SCIENCE TO THE SENSES.</span>
        <button onClick={onBack}>BACK TO EARTH ↑</button>
      </footer>
    </main>
  );
}

/* ---------------------------------------
   OCEAN DYNAMICS EXPERIENCE
--------------------------------------- */


function OceanExperience({ onBack }) {
  
const [playing, setPlaying] = useState(false);
const [waveType, setWaveType] = useState("gentle");
const [oceanData, setOceanData] = useState(null);
const [dataLoading, setDataLoading] = useState(true);
const [dataError, setDataError] = useState("");
const audioRef = useRef(null);
const [selectedOcean, setSelectedOcean] = useState(null);
const [landMessage, setLandMessage] = useState("");
useEffect(() => {
  if (!selectedOcean) {
    setOceanData(null);
    setDataLoading(false);
    return;
  }

  let active = true;

  async function loadOceanData() {
    try {
      setDataLoading(true);
      setDataError("");

      const latitude = selectedOcean.latitude;
      const longitude = selectedOcean.longitude;

      const url =
        "https://marine-api.open-meteo.com/v1/marine" +
        `?latitude=${latitude}&longitude=${longitude}` +
        "&current=wave_height,wave_direction,wave_period,sea_surface_temperature,ocean_current_velocity" +
        "&timezone=auto";

      const response = await fetch(url);

      console.log("API STATUS:", response.status);
      console.log("API URL:", url);

      const result = await response.json();

      console.log("FULL API RESPONSE:", result);

      if (!response.ok) {
        throw new Error(
          result.reason || "Marine data request failed"
        );
      }

      if (!result.current) {
        throw new Error("No marine measurements available");
      }

      if (active) {
        setOceanData(result.current);
      }
    } catch (error) {
      console.error("Ocean data error:", error);

      if (active) {
        setOceanData(null);
        setDataError(
          "Marine measurements are unavailable at this location. Try another ocean point."
        );
      }
    } finally {
      if (active) {
        setDataLoading(false);
      }
    }
  }

  loadOceanData();

  const interval = setInterval(
    loadOceanData,
    15 * 60 * 1000
  );

  return () => {
    active = false;
    clearInterval(interval);
  };
}, [selectedOcean]);




function getOceanSoundSettings(type) {
  // Actual wave measurements at the selected coordinates
  const rawHeight = Number(oceanData?.wave_height);
  const rawPeriod = Number(oceanData?.wave_period);

  const waveHeight = Number.isFinite(rawHeight)
    ? Math.max(0, rawHeight)
    : 1;

  const wavePeriod = Number.isFinite(rawPeriod)
    ? Math.max(3, rawPeriod)
    : 8;

  // Wave height controls sound intensity
  const heightIntensity = Math.min(waveHeight / 4, 1);

  // Wave period controls playback rhythm
  const periodFactor = Math.min(
    Math.max((wavePeriod - 3) / 12, 0),
    1
  );

  // Your three selectable sound modes
  const baseVolume = {
    gentle: 0.35,
    rolling: 0.65,
    crashing: 0.95,
  };

  const baseSpeed = {
    gentle: 0.90,
    rolling: 1.00,
    crashing: 1.08,
  };

  // Longer wave periods create slower playback
  const periodSpeed = 1.12 - periodFactor * 0.22;

  return {
    volume: Math.min(
      1,
      baseVolume[type] * (0.55 + heightIntensity * 0.45)
    ),

    speed: Math.min(
      1.3,
      Math.max(0.75, baseSpeed[type] * periodSpeed)
    ),
  };
}

async function startOcean() {
  try {
    if (!audioRef.current) {
      const audio = new Audio("/ocean-waves.ogg");
      audio.loop = true;
      audio.preload = "auto";
      audioRef.current = audio;
    }

    const audio = audioRef.current;
    const settings = getOceanSoundSettings(waveType);

    audio.volume = settings.volume;
    audio.playbackRate = settings.speed;

    await audio.play();

    setPlaying(true);
  } catch (error) {
    console.error("Ocean audio error:", error);
    alert("Ocean audio could not play. Check the browser console.");
    setPlaying(false);
  }
}
useEffect(() => {
  if (audioRef.current && oceanData) {
    const settings = getOceanSoundSettings(waveType);

    audioRef.current.volume = settings.volume;
    audioRef.current.playbackRate = settings.speed;
  }
}, [oceanData, waveType]);


function stopOcean() {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }

  setPlaying(false);
}

function changeWave(type) {
  setWaveType(type);

  if (audioRef.current) {
    const settings = getOceanSoundSettings(type);

    audioRef.current.volume = settings.volume;
    audioRef.current.playbackRate = settings.speed;
  }
}

useEffect(() => {
  return () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };
}, []);



const nasaDate = new Date(
  Date.now() - 2 * 24 * 60 * 60 * 1000
).toISOString().slice(0, 10);

const nasaSSTImage = selectedOcean
  ? (() => {
      const lat = selectedOcean.latitude;
      const lon = selectedOcean.longitude;

      const minLon = Math.max(-180, lon - 7);
      const maxLon = Math.min(180, lon + 7);
      const minLat = Math.max(-85, lat - 4);
      const maxLat = Math.min(85, lat + 4);

      return (
        "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi" +
        "?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1" +
        "&LAYERS=GHRSST_L4_MUR_Sea_Surface_Temperature" +
        "&STYLES=&FORMAT=image/png&TRANSPARENT=true" +
        "&SRS=EPSG:4326" +
        `&BBOX=${minLon},${minLat},${maxLon},${maxLat}` +
        "&WIDTH=1000&HEIGHT=500" +
        `&TIME=${nasaDate}`);
    })()
  : null;

const seaState = (() => {
  if (!selectedOcean) {
    return {
      label: "Select an ocean",
      description: "Choose a blue location on the map."
    };
  }

  if (dataLoading) {
    return {
      label: "Analysing waves...",
      description: "Reading the selected ocean's conditions."
    };
  }

  if (oceanData?.wave_height == null) {
    return {
      label: "Data unavailable",
      description: "Try selecting another ocean location."
    };
  }

  const height = Number(oceanData.wave_height);

  if (height < 0.5) {
    return {
      label: "Calm Ocean",
      description: "Gentle waves and relatively peaceful conditions."
    };
  }

  if (height < 1.25) {
    return {
      label: "Gentle Waves",
      description: "Soft, low waves moving across the ocean."
    };
  }

  if (height < 2.5) {
    return {
      label: "Moderate Waves",
      description: "Noticeable wave movement and stronger surf."
    };
  }

  if (height < 4) {
    return {
      label: "Rough Ocean",
      description: "Powerful waves and intense ocean movement."
    };
  }

  return {
    label: "Very Rough Ocean",
    description: "Strong wave conditions with high intensity."
  };
})();
  return (
    <main className="ocean-page">
      <style>{`
        .ocean-page {
          --ocean-dark:#063b46;
          --ocean-mid:#087e8b;
          --ocean-bright:#38b9b0;
          --ocean-foam:#b9dfd7;
          background:#063b46;
          color:#f0fbf8;
          min-height:100vh;
          overflow:hidden;
          font-family:inherit;
        }
        .ocean-page * {box-sizing:border-box}
        .ocean-nav {
          height:76px;padding:0 7%;display:flex;
          justify-content:space-between;align-items:center;
          border-bottom:1px solid #b9dfd722;
          position:relative;z-index:5;
        }
        .ocean-brand {font-size:24px;font-weight:700;color:#b9dfd7;text-decoration:none}
        .ocean-nav-label {font-size:10px;letter-spacing:2px;color:#8db9b6}
        .ocean-back {
          color:#d8f4ee;background:transparent;
          border:1px solid #b9dfd766;border-radius:30px;
          padding:11px 18px;cursor:pointer;
        }
        .ocean-hero {
          min-height:650px;position:relative;display:flex;
          align-items:center;padding:90px 9%;overflow:hidden;
          background:
            radial-gradient(ellipse at 75% 30%,#168b91 0%,transparent 42%),
            linear-gradient(145deg,#063b46,#075866 55%,#063b46);
        }
        .ocean-hero-copy {position:relative;z-index:3;max-width:650px}
        .ocean-eyebrow {font-size:10px;letter-spacing:3px;color:#9edbd0}
        .ocean-hero h1 {
          font-size:clamp(60px,9vw,120px);line-height:.9;
          font-weight:500;letter-spacing:-6px;margin:30px 0;
          color:#f1fbf6;
        }
        .ocean-hero h1 em {font-family:Georgia,serif;color:#72d1c5;font-weight:400}
        .ocean-hero p {max-width:480px;color:#b2d4d0;line-height:1.9;font-size:15px}
        .ocean-hero-art {
          position:absolute;width:52%;height:100%;right:-4%;top:0;
          display:flex;align-items:center;justify-content:center;
          pointer-events:none;
        }
        .ocean-sphere {
          width:min(42vw,440px);aspect-ratio:1;border-radius:50%;
          position:relative;overflow:hidden;
          background:
            radial-gradient(circle at 32% 25%,#8de4d2,#24a9a5 35%,#08717c 67%,#043d4b 100%);
          box-shadow:inset -45px -35px 70px #002b37aa,0 0 100px #43c8bb33;
          animation:oceanFloat 8s ease-in-out infinite;
        }
        .ocean-sphere:before {
          content:"";position:absolute;inset:-40%;
          background:repeating-radial-gradient(ellipse at 40% 45%,transparent 0 20px,#d7fff044 22px 24px,transparent 26px 42px);
          transform:rotate(-22deg);animation:waterTexture 18s linear infinite;
        }
        .ocean-sphere:after {
          content:"";position:absolute;inset:0;
          background:linear-gradient(120deg,#ffffff44,transparent 40%,#002f4055);
        }
        .ocean-orbit {
          position:absolute;width:115%;height:42%;border:1px solid #a8eee066;
          border-radius:50%;transform:rotate(-25deg);
          animation:oceanOrbit 20s linear infinite;
        }
        .ocean-orbit.two {width:130%;height:55%;transform:rotate(35deg);border-color:#9de6dc44;animation-duration:28s}
        @keyframes oceanFloat {50%{transform:translateY(-18px) rotate(4deg)}}
        @keyframes waterTexture {to{transform:rotate(338deg)}}
        @keyframes oceanOrbit {to{rotate:360deg}}
        .ocean-hero-bottom {
          position:absolute;bottom:25px;left:9%;right:9%;
          display:flex;justify-content:space-between;
          color:#8cbab5;font-size:9px;letter-spacing:2px;
        }
        .ocean-intro {
          padding:95px 9%;background:#e5f2ed;color:#123f47;
          display:grid;grid-template-columns:1fr 1fr;gap:8%;align-items:center;
        }
        .ocean-intro h2 {font-size:clamp(42px,5vw,70px);font-weight:500;line-height:1.02}
        .ocean-intro h2 em {font-family:Georgia,serif;color:#128d8c}
        .ocean-intro p {font-size:14px;line-height:1.9;color:#527779}
        .ocean-scene {
          height:540px;position:relative;overflow:hidden;
          background:linear-gradient(180deg,#0b7180 0%,#075765 45%,#063b46 100%);
        }
        .ocean-sunlight {
          position:absolute;top:-20%;left:48%;width:40%;height:90%;
          background:linear-gradient(180deg,#e2fff066,transparent);
          filter:blur(35px);transform:rotate(12deg);
        }
        .ocean-surface {
          position:absolute;top:0;left:-10%;width:120%;height:140px;
          background:repeating-linear-gradient(175deg,#c3f1e955 0 2px,transparent 3px 20px);
          border-radius:0 0 50% 50%;animation:surfaceMove 8s ease-in-out infinite alternate;
        }
        @keyframes surfaceMove {to{transform:translateX(4%) translateY(15px)}}
        .ocean-wave-layer {
          position:absolute;left:-10%;width:120%;height:180px;
          border-radius:48% 52% 0 0;
          border-top:2px solid #b9eee766;
          background:linear-gradient(180deg,#31aaa455,transparent);
          animation:waveTravel 9s ease-in-out infinite alternate;
        }
        .ocean-wave-layer.wave-a {top:38%;transform:rotate(-3deg)}
        .ocean-wave-layer.wave-b {top:53%;animation-duration:12s;animation-direction:alternate-reverse;opacity:.7}
        .ocean-wave-layer.wave-c {top:68%;animation-duration:15s;opacity:.5}
        @keyframes waveTravel {to{transform:translateX(7%) translateY(-22px) rotate(3deg)}}
        .ocean-particle {
          position:absolute;width:4px;height:4px;border-radius:50%;
          background:#d4fff2;box-shadow:0 0 12px #b9fff4;
          animation:bubbleRise 8s linear infinite;
        }
        @keyframes bubbleRise {from{transform:translateY(100px);opacity:0}20%{opacity:.8}to{transform:translateY(-550px);opacity:0}}
        .ocean-scene-label {
          position:absolute;top:35px;left:7%;font-size:10px;
          letter-spacing:3px;color:#d1f4eb;
        }
        .ocean-scene-caption {
          position:absolute;bottom:30px;left:7%;right:7%;
          display:flex;justify-content:space-between;color:#b0d9d3;
          font-size:9px;letter-spacing:2px;
        }
        .ocean-sound {
          background:#063b46;padding:100px 9%;
          display:grid;grid-template-columns:1fr 1fr;gap:8%;align-items:center;
        }
        .ocean-sound h2 {font-size:clamp(45px,6vw,78px);font-weight:500;line-height:1;color:#f0fbf8}
        .ocean-sound h2 em {font-family:Georgia,serif;color:#65c9be}
        .ocean-sound p {color:#a6cbc5;line-height:1.9;font-size:14px}
        .ocean-control {
          padding:35px;border:1px solid #b9dfd733;border-radius:22px;
          background:linear-gradient(145deg,#0b5260,#073d49);
        }
        .ocean-control-label {font-size:10px;letter-spacing:2px;color:#8fc9c1}
        .ocean-options {display:flex;gap:10px;flex-wrap:wrap;margin:25px 0}
        .ocean-options button {
          border:1px solid #8bcac255;color:#b9dfd7;background:transparent;
          border-radius:25px;padding:11px 16px;cursor:pointer;font:inherit;font-size:12px;
        }
        .ocean-options button.active {background:#38b9b0;color:#063b46;border-color:#38b9b0}
        .ocean-listen {
          width:100%;border:0;border-radius:30px;padding:16px;
          color:#063b46;background:#9be1d3;font:inherit;font-size:13px;
          cursor:pointer;font-weight:700;
        }
        .ocean-listen:hover {background:#d1f4e8}
        .ocean-audio-note {font-size:10px;color:#85b5b0;line-height:1.7;margin-top:18px}
        .ocean-sound-visual {
          height:360px;position:relative;display:flex;
          align-items:center;justify-content:center;overflow:hidden;
        }
        .ocean-sound-ring {
          position:absolute;width:80%;height:35%;border:1px solid #65c9be66;
          border-radius:50%;transform:rotate(-20deg);
          animation:oceanOrbit 20s linear infinite;
        }
        .ocean-sound-ring.two {width:100%;height:55%;transform:rotate(30deg);animation-duration:28s}
        .ocean-sound-center {
          width:150px;height:150px;border-radius:50%;
          background:radial-gradient(circle at 30% 25%,#d7fff0,#38b9b0 60%,#08717c);
          box-shadow:0 0 75px #38b9b055;display:grid;place-items:center;
          color:#063b46;font-size:35px;z-index:2;
        }
        .ocean-footer {
          padding:30px 7%;background:#042f39;display:flex;
          justify-content:space-between;align-items:center;gap:20px;
        }
        .ocean-footer span {font-size:10px;letter-spacing:1.5px;color:#83b4ae}
        .ocean-footer button {background:none;border:0;color:#b9dfd7;cursor:pointer}
        @media(max-width:800px) {
          .ocean-hero-art {opacity:.35;width:100%;right:-25%}
          .ocean-hero-copy {max-width:100%}
          .ocean-intro,.ocean-sound {grid-template-columns:1fr;text-align:center}
          .ocean-intro p,.ocean-sound p {margin-left:auto;margin-right:auto}
        }
        @media(max-width:550px) {
          .ocean-nav {padding:0 5%}
          .ocean-nav-label {display:none}
          .ocean-hero {padding:70px 7%;min-height:570px}
          .ocean-hero h1 {font-size:65px;letter-spacing:-3px}
          .ocean-intro,.ocean-sound {padding:70px 6%}
          .ocean-scene {height:420px}
          .ocean-control {padding:24px}
          .ocean-footer {flex-wrap:wrap}
          .ocean-footer span {width:100%}
        }
          
/* =================================
   VISUAL HIERARCHY POLISH
================================= */

/* Smoother section transitions */
.living-page section {
  transition:
    background-color 0.5s ease,
    color 0.5s ease;
}

/* Better section spacing */
.living-hero {
  padding: clamp(55px, 7vw, 95px) 8%;
  gap: clamp(30px, 5vw, 75px);
}

.living-data-section {
  padding: clamp(65px, 8vw, 100px) 6%;
}

.living-explorer,
.living-sound-section,
.living-method {
  padding: clamp(65px, 8vw, 105px) 8%;
}

/* Clearer heading hierarchy */
.living-section-title h2,
.living-explorer h2,
.living-sound-section h2,
.living-method h2 {
  line-height: 1.08;
  letter-spacing: -1.8px;
  margin-bottom: 22px;
}

/* More comfortable paragraph reading */
.living-section-title p,
.living-explorer p,
.living-sound-section p,
.living-method-grid p {
  max-width: 620px;
  line-height: 1.85;
  font-size: 14px;
}

/* Consistent section labels */
.living-kicker {
  display: inline-block;
  font-weight: 600;
  line-height: 1.6;
}

/* Responsive spacing and typography */
@media (max-width: 550px) {
  .living-hero {
    padding: 55px 7%;
  }

  .living-hero h1 {
    line-height: 1.05;
  }

  .living-section-title h2,
  .living-explorer h2,
  .living-sound-section h2,
  .living-method h2 {
    font-size: clamp(34px, 9vw, 48px);
    letter-spacing: -1px;
    line-height: 1.12;
  }

  .living-section-title p,
  .living-explorer p,
  .living-sound-section p {
    font-size: 14px;
    line-height: 1.75;
  }
}

      `}</style>

      <header className="ocean-nav">
        <a className="ocean-brand" href="#home" onClick={onBack}>
          ✧ अनुवाद
        </a>
        <span className="ocean-nav-label">
          EARTH SYSTEMS / OCEAN DYNAMICS
        </span>
        <button className="ocean-back" onClick={onBack}>
          ← Back to Earth
        </button>
      </header>

      <section className="ocean-hero">
        <div className="ocean-hero-copy">
          <span className="ocean-eyebrow">
            02 / THE BLUE HEART OF OUR PLANET
          </span>
          <h1>
            Listen to
            <br />
            the <em>Ocean.</em>
          </h1>
          <p>
            Beneath every wave is a moving world.
            Explore the motion of our oceans through
            immersive visuals and the natural rhythm of water.
          </p>
        </div>

        <div className="ocean-hero-art">
          <div className="ocean-orbit" />
          <div className="ocean-orbit two" />
          <div className="ocean-sphere" />
        </div>

        <div className="ocean-hero-bottom">
          <span>OCEAN / CURRENTS / WAVES</span>
          <span>ANUWAAD — EARTH IN SOUND</span>
        </div>
      </section>

      <section className="ocean-intro">
        <div>
          <span className="ocean-eyebrow">A WORLD IN CONSTANT MOTION</span>
          <h2>
            The ocean never
            <br />
            <em>stands still.</em>
          </h2>
        </div>
        <p>
          Experience real recorded ocean waves, with different wave
          intensities and rhythms. NASA satellite observations will
          control how the sound changes as ocean conditions change.
        </p>
      </section>

<section style={{
  background: "#e5f2ed",
  color: "#123f47",
  padding: "75px 9%"
}}>
  <span style={{
    color: "#087e8b",
    letterSpacing: "3px",
    fontSize: "11px"
  }}>
    03 / OCEAN INTELLIGENCE
    <div style={{ marginTop: "30px" }}>
  <h3 style={{ fontSize: "24px" }}>
    Choose your ocean.
  </h3>

  <p style={{ color: "#527779", lineHeight: 1.8 }}>
    Click anywhere on the world map. Select the blue
    oceans to discover their changing conditions.
  </p>

  <OceanMap
    onOceanSelect={(location) => {
      setSelectedOcean(location);
      setLandMessage("");
    }}
    onLandSelect={(location) => {
      setSelectedOcean(null);

      setLandMessage(
        "Oops! You've wandered onto land. 🌱 The waves are a little further away. Try the blue side of the planet!"
      );
    }}
  />

  {landMessage && (
    <div style={{
      marginTop: "20px",
      padding: "22px",
      borderRadius: "14px",
      background: "#ffffff",
      color: "#087e8b",
      lineHeight: 1.8,
      fontSize: "15px"
    }}>
      {landMessage}
    </div>
  )}

  {selectedOcean && (
    <p style={{
      color: "#087e8b",
      marginTop: "18px",
      fontWeight: "600"
    }}>
      Selected ocean coordinates:{" "}
      {selectedOcean.latitude.toFixed(2)}°,
      {" "}
      {selectedOcean.longitude.toFixed(2)}°
    </p>
  )}
</div>
  </span>

  <h2 style={{fontSize: "42px", margin: "15px 0"}}>
    The ocean, measured.
  </h2>

  <p style={{color: "#527779", lineHeight: 1.8}}>
    Explore marine conditions in the Arabian Sea using
    numerical marine forecasts and NASA satellite imagery.
  </p>

  {dataLoading && <p>Loading ocean measurements...</p>}
  {dataError && <p>{dataError}</p>}

  {oceanData && (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
      gap: "15px",
      margin: "30px 0"
    }}>
      {[
        ["WAVE HEIGHT", oceanData.wave_height, "m"],
        ["WAVE PERIOD", oceanData.wave_period, "s"],
        ["SEA SURFACE TEMP.", oceanData.sea_surface_temperature, "°C"],
        ["OCEAN CURRENT", oceanData.ocean_current_velocity, "km/h"]
      ].map(([label, value, unit]) => (
        <div key={label} style={{
          background: "#ffffff",
          padding: "22px",
          borderRadius: "14px",
          border: "1px solid #c5ded6"
        }}>
          <div style={{
            fontSize: "10px",
            letterSpacing: "1px",
            color: "#527779"
          }}>{label}</div>

          <strong style={{
            display: "block",
            fontSize: "27px",
            marginTop: "12px"
          }}>
            {value ?? "--"} {unit}
          </strong>
        </div>
      ))}
    </div>
  )}

  {selectedOcean && (
  <>
    <h3 style={{ marginTop: "45px" }}>
      NASA Sea Surface Temperature
    </h3>

    <img
      src={nasaSSTImage}
      alt="NASA satellite sea surface temperature imagery"
      style={{
        width: "100%",
        maxHeight: "450px",
        objectFit: "cover",
        borderRadius: "16px",
        marginTop: "15px",
        background: "#063b46"
      }}
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />

    <p style={{
      fontSize: "11px",
      color: "#527779",
      marginTop: "12px"
    }}>
      Satellite imagery: NASA GIBS / GHRSST MUR.
      Numerical marine conditions: Open-Meteo Marine API.
      Selected location: {selectedOcean.latitude.toFixed(2)}°,
      {" "}
      {selectedOcean.longitude.toFixed(2)}°.
    </p>
  </>
)}
</section>

      <section className="ocean-scene">
        <div className="ocean-sunlight" />
        <div className="ocean-surface" />
        <div className="ocean-wave-layer wave-a" />
        <div className="ocean-wave-layer wave-b" />
        <div className="ocean-wave-layer wave-c" />

        {Array.from({ length: 22 }, (_, index) => (
          <span
            key={index}
            className="ocean-particle"
            style={{
              left: `${(index * 37) % 100}%`,
              bottom: `${(index * 19) % 45}%`,
              animationDelay: `${(index % 8) * -1.1}s`,
              animationDuration: `${6 + (index % 5)}s`,
            }}
          />
        ))}

        <span className="ocean-scene-label">
          THE LIVING OCEAN / ANIMATED WATER STUDY
        </span>

        <div className="ocean-scene-caption">
          <span>ABOVE THE SURFACE</span>
          <span>BELOW THE SURFACE</span>
        </div>
      </section>

      <section className="ocean-sound">
        <div>
          <span className="ocean-eyebrow">03 / THE SOUND OF WATER</span>
          <h2>
            Let the waves
            <br />
            <em>take over.</em>
          </h2>
          <p>
             Listen to real recorded ocean waves. Choose between
             gentle waves, rolling surf and powerful crashing waves.
             Marine wave measurements influence the playback
             intensity and speed, connecting the sound to changing
             ocean conditions.
          </p>
        </div>

        <div className="ocean-control">
  <span className="ocean-control-label">
    LIVE OCEAN CONDITION
  </span>

  <div style={{
    background: "#ffffff12",
    border: "1px solid #b9dfd744",
    borderRadius: "14px",
    padding: "20px",
    marginTop: "18px",
    marginBottom: "25px"
  }}>
    <div style={{
      color: "#8fc9c1",
      fontSize: "10px",
      letterSpacing: "2px"
    }}>
      CURRENT SEA STATE
    </div>

    <h3 style={{
      color: "#9be1d3",
      fontSize: "25px",
      margin: "12px 0 6px"
    }}>
      {seaState.label}
    </h3>

    <p style={{
      color: "#b9dfd7",
      fontSize: "12px",
      margin: 0
    }}>
      {seaState.description}
    </p>

    {oceanData && (
      <p style={{
        color: "#8fc9c1",
        fontSize: "11px",
        marginTop: "12px"
      }}>
        Wave height: {oceanData.wave_height} m
      </p>
    )}
  </div>

  <span className="ocean-control-label">
    CHOOSE YOUR SOUND STYLE
  </span>

          <div className="ocean-options">
            <button
              className={waveType === "gentle" ? "active" : ""}
              onClick={() => changeWave("gentle")}
            >
              Gentle waves
            </button>
            <button
              className={waveType === "rolling" ? "active" : ""}
              onClick={() => changeWave("rolling")}
            >
              Rolling surf
            </button>
            <button
              className={waveType === "crashing" ? "active" : ""}
              onClick={() => changeWave("crashing")}
            >
              Crashing waves
            </button>
          </div>

          <button
            className="ocean-listen"
            onClick={playing ? stopOcean : startOcean}
          >
            {playing ? "Ⅱ  Stop ocean sound" : "▶  Listen to the ocean"}
          </button>

          <p className="ocean-audio-note">
             REAL OCEAN FIELD RECORDING · MARINE DATA-DRIVEN SOUND · HEADPHONES RECOMMENDED
          </p>
        </div>

        <div className="ocean-sound-visual">
          <div className="ocean-sound-ring" />
          <div className="ocean-sound-ring two" />
          <div className="ocean-sound-center">≈</div>
        </div>
      </section>

      <footer className="ocean-footer">
        <a className="ocean-brand" href="#home" onClick={onBack}>
          ✧ अनुवाद
        </a>
        <span>THE BLUE HEART OF OUR PLANET.</span>
        <button onClick={onBack}>BACK TO EARTH ↑</button>
      </footer>
    </main>
  );
}

/* ---------------------------------------
   MAIN WEBSITE
--------------------------------------- */

function App() {
  const [activeTopic, setActiveTopic] = useState(null);

  if (activeTopic === "climate") {
  return (
    <ClimateExperience
      onBack={() => {
        setActiveTopic(null);
        window.location.hash = "home";
      }}
    />
  );
}

if (activeTopic === "ocean") {
  return (
    <OceanExperience
      onBack={() => {
        setActiveTopic(null);
        window.location.hash = "home";
      }}
    />
  );
}
if (activeTopic === "land") {
  return (
    <LandExperience
      onBack={() => {
        setActiveTopic(null);
        window.location.hash = "home";
      }}
    />
  );
}

  return (
    <main>
      <div className="space-background" aria-hidden="true">
        <div className="stars stars-one" />
        <div className="stars stars-two" />
        <div className="nebula" />
      </div>

      <header className="navbar">
        <a href="#home" className="brand" aria-label="Anuwaad home">
          <span className="brand-symbol">✧</span>
          <span>अनुवाद</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#discover">Discover</a>
          <a href="#experience">Experience</a>
          <a href="#topics">Earth Through Time</a>
          <a href="#about">About</a>
        </nav>

        <a href="#discover" className="nav-button">
          Explore Earth <span>↗</span>
        </a>
      </header>

      <section className="hero" id="home">
        <div className="hero-copy">
          <span className="eyebrow hero-eyebrow">
            <span className="eyebrow-line" />
            AN EARTH SCIENCE EXPERIENCE
          </span>

          <h1>
            Hear the
            <br />
            Heartbeat
            <br />
            <span>of Earth.</span>
          </h1>

          <p className="hero-description">
            What if you could hear our planet changing?
            Explore NASA Earth science through visualizations
            transformed into sound.
          </p>

          
          </div>

          

        <div className="hero-visual">
          <div className="hero-orbit orbit-a" />
          <div className="hero-orbit orbit-b" />
          <div className="hero-orbit orbit-c" />
          <div className="earth-halo" />

          <Earth3D />

          <div className="earth-caption">
            <span className="caption-dot" />
            <span>OUR HOME · ONE CONNECTED PLANET</span>
          </div>

          <div className="floating-coordinate coordinate-one">
            <span>01 / 04</span>
            <small>ATMOSPHERE</small>
          </div>

          <div className="floating-coordinate coordinate-two">
            <span>EARTH</span>
            <small>IN MOTION</small>
          </div>
        </div>

        
      </section>

      <Dashboard />

      <section className="topics-section" id="topics">
        <div className="topics-atmosphere" aria-hidden="true">
          <span className="topic-star star-a" />
          <span className="topic-star star-b" />
          <span className="topic-star star-c" />
          <span className="topic-star star-d" />
          <div className="topics-glow" />
          <div className="topics-orbit" />
        </div>

        <div className="section-heading topics-heading">
          <div>
            <span className="eyebrow">
              <span className="eyebrow-line" />
              EXPLORE OUR LIVING PLANET
            </span>
            <h2>
              One planet.
              <br />
              <span className="topics-heading-accent">Many stories.</span>
            </h2>
          </div>

          <p>
            Four interconnected Earth systems. Countless stories
            hidden in the data. Choose a world to explore.
          </p>
        </div>

        <div className="topic-grid">
          {topics.map((topic) => (
            <a
  className={`topic-card topic-card-${topic.visual}`}
  href="#"
  key={topic.number}
  onClick={(event) => {
    if (
  topic.visual === "climate" ||
  topic.visual === "ocean" ||
  topic.visual === "land"
)  {
      event.preventDefault();
      setActiveTopic(topic.visual);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.hash = "experience";
    }
  }}
>
              <div className="topic-card-top">
                <span className="topic-number">
                  <span className="topic-number-dot" />
                  {topic.number}
                </span>
                <span className="topic-icon">{topic.icon}</span>
              </div>

              <TopicVisual type={topic.visual} />

              <div className="topic-card-content">
                <span className="topic-data-label">{topic.label}</span>
                <h3>{topic.title}</h3>
                <p>{topic.detail}</p>
              </div>

              <div className="topic-card-bottom">
                <span className="topic-value">{topic.value}</span>
                <span className="topic-arrow">↗</span>
              </div>

              <div className="topic-card-shine" />
            </a>
          ))}
        </div>

        <div className="topics-footer-line">
          <span>01 — 04 / EARTH SYSTEMS</span>
          <span>CONNECTED BY ONE PLANET</span>
        </div>
      </section>

      <section className="experience-section" id="experience">
        <div className="experience-copy">
          <span className="eyebrow">BEYOND WHAT WE CAN SEE</span>
          <h2>
            What does Earth <span>sound like?</span>
          </h2>
          <p>
            Sonification translates data into sound. In Anuwaad,
            patterns in NASA Earth observations shape pitch,
            rhythm and intensity — helping everyone experience
            the planet in a new way.
          </p>
          <a href="#topics" className="primary-button">
            Explore the experience <span>↗</span>
          </a>
        </div>

        <div className="sound-visual">
          <div className="sound-orbit" />
          <div className="waveform">
            {Array.from({ length: 50 }, (_, i) => (
              <span
                key={i}
                style={{
                  "--bar": `${12 + ((i * 17 + i * i * 3) % 72)}%`,
                }}
              />
            ))}
          </div>
          <div className="sound-caption">
            <span>DATA → SOUND</span>
            <span>SONIFICATION PREVIEW</span>
          </div>
        </div>
      </section>

      <section className="about-section" id="about">
        <span className="eyebrow">ABOUT ANUWAAD</span>
        <h2>
          Making Earth science
          <br />
          more <span>human.</span>
        </h2>
        <p>
          Anuwaad is an interactive Earth science experience inspired
          by NASA's Earth Information Center. It makes complex
          planetary data more accessible by bringing visual
          exploration and data-driven sound together.
        </p>
        <span className="about-footnote">
          A HACKATHON PROJECT · BUILT TO EXPLORE OUR PLANET DIFFERENTLY
        </span>
      </section>

      <footer className="footer">
        <a href="#home" className="brand">
          <span className="brand-symbol">✧</span>
          <span>अनुवाद</span>
        </a>
        <span>BRINGING EARTH SCIENCE TO THE SENSES.</span>
        <a href="#home">BACK TO TOP ↑</a>
      </footer>
    </main>
  );
}

export default App;
