
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const NASA_EONET_API =
  "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=500";

const FIRMS_API =
  "http://127.0.0.1:5000/api/hazards/firms?days=3";

// Get the latest geographic position of a NASA EONET event
function getEventPosition(event) {
  const geometry =
    event.geometry?.[event.geometry.length - 1];

  if (!geometry || !geometry.coordinates) {
    return null;
  }

  function findCoordinates(coordinates) {
    if (!Array.isArray(coordinates)) {
      return null;
    }

    // GeoJSON coordinate pair: [longitude, latitude]
    if (
      coordinates.length >= 2 &&
      Number.isFinite(Number(coordinates[0])) &&
      Number.isFinite(Number(coordinates[1]))
    ) {
      return [
        Number(coordinates[1]),
        Number(coordinates[0]),
      ];
    }

    // Handle nested Polygon and MultiPolygon coordinates
    for (const item of coordinates) {
      const result = findCoordinates(item);

      if (result) {
        return result;
      }
    }

    return null;
  }

  return findCoordinates(geometry.coordinates);
}

// Detect clicks anywhere on the map
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng);
    },
  });

  return null;
}

// Calculate distance between two geographic locations
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return (
    6371 *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

// Movable NASA FIRMS map legend
function DraggableFireLegend() {
  const [position, setPosition] = useState({ x: 18, y: 18 });
  const dragRef = useRef(null);

  function handlePointerDown(e) {
    e.preventDefault();
    e.stopPropagation();

    const mapElement = e.currentTarget.closest(".leaflet-container");
    if (!mapElement) return;

    const mapRect = mapElement.getBoundingClientRect();

    dragRef.current = {
      offsetX: e.clientX - mapRect.left - position.x,
      offsetY: e.clientY - mapRect.top - position.y,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    const mapElement = e.currentTarget.closest(".leaflet-container");
    if (!mapElement) return;

    const mapRect = mapElement.getBoundingClientRect();

    const panelWidth = 235;
    const panelHeight = 190;

    setPosition({
      x: Math.max(
        0,
        Math.min(
          e.clientX - mapRect.left - dragRef.current.offsetX,
          mapRect.width - panelWidth
        )
      ),
      y: Math.max(
        0,
        Math.min(
          e.clientY - mapRect.top - dragRef.current.offsetY,
          mapRect.height - panelHeight
        )
      ),
    });
  }

  function handlePointerUp(e) {
    e.stopPropagation();
    dragRef.current = null;
  }

  const levels = [
    { color: "#ff4545", label: "High confidence" },
    { color: "#ffad42", label: "Nominal confidence" },
    { color: "#f6d65b", label: "Low / unknown" },
  ];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        zIndex: 1000,
        width: "235px",
        boxSizing: "border-box",
        padding: "15px",
        borderRadius: "16px",
        background: "rgba(9, 17, 31, 0.94)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(148, 183, 220, 0.22)",
        boxShadow: "0 12px 35px rgba(0,0,0,0.35)",
        color: "#f4f7fb",
        fontFamily: "inherit",
        pointerEvents: "auto",
      }}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
          paddingBottom: "12px",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.8px",
            }}
          >
            FIRMS HOTSPOTS
          </div>

          <div
            style={{
              color: "#8fa3bd",
              fontSize: "10px",
              marginTop: "3px",
            }}
          >
            NASA · THERMAL DETECTIONS
          </div>
        </div>

        <span style={{ color: "#9aadc4", fontSize: "19px" }}>
          ⠿
        </span>
      </div>

      <div style={{ paddingTop: "8px" }}>
        {levels.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "11px",
              padding: "7px 2px",
              fontSize: "12px",
              color: "#dce5f0",
            }}
          >
            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: item.color,
                boxShadow: `0 0 10px ${item.color}`,
                flexShrink: 0,
              }}
            />
            {item.label}
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.12)",
          marginTop: "8px",
          paddingTop: "10px",
          fontSize: "10px",
          color: "#8fa3bd",
          lineHeight: 1.5,
        }}
      >
        Drag this panel using the top bar
      </div>
    </div>
  );
}

export default function NaturalHazards() {
    const stormAudioRef = useRef(null);
const stormSpeechRef = useRef(null);
const fireAudioRef = useRef(null);
const fireSpeechRef = useRef(null);
const iceAudioRef = useRef(null);
const iceSpeechRef = useRef(null);
  const [firmsData, setFirmsData] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [nearbyFires, setNearbyFires] = useState([]);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [firmsError, setFirmsError] = useState("");

  const [activeCategory, setActiveCategory] = useState("all");
  const [activeHazard, setActiveHazard] = useState("wildfires");
  const [showAllEvents, setShowAllEvents] = useState(false);

  const [stormData, setStormData] = useState([]);
  const [stormDataError, setStormDataError] = useState("");
const [selectedStormLocation, setSelectedStormLocation] = useState(null);
const [nearbyStorms, setNearbyStorms] = useState([]);
const [iceData, setIceData] = useState(null);
const [iceDataLoading, setIceDataLoading] = useState(false);
const [iceDataError, setIceDataError] = useState("");
  // Canvas renderer for efficient FIRMS markers
  const firmsRenderer = useMemo(
    () => L.canvas({ padding: 0.5 }),
    []
  );

  // Limit visible FIRMS markers for map performance
  const visibleFirms = useMemo(() => {
    const maxMarkers = 2000;

    if (firmsData.length <= maxMarkers) {
      return firmsData;
    }

    const step = Math.ceil(firmsData.length / maxMarkers);

    return firmsData.filter((_, index) => index % step === 0);
  }, [firmsData]);

  // LOAD REAL NOAA STORM DATA
  useEffect(() => {
    let cancelled = false;

    async function fetchStormData() {
      try {
        setStormDataError("");

        const response = await fetch(
          "http://127.0.0.1:5000/api/hazards/storms"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load NOAA storm data");
        }

        if (!Array.isArray(data)) {
          throw new Error("NOAA response is not a valid array");
        }

        if (!cancelled) {
          setStormData(data);
          console.log("NOAA storms loaded:", data.length);
        }
      } catch (error) {
        console.error("NOAA storm loading error:", error);

        if (!cancelled) {
          setStormData([]);
          setStormDataError(error.message);
        }
      }
    }

    fetchStormData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load NASA EONET and FIRMS data
  async function loadEvents() {
    setLoading(true);
    setError("");
    setFirmsError("");

    const [eonetResult, firmsResult] = await Promise.allSettled([
      fetch(NASA_EONET_API),
      fetch(FIRMS_API),
    ]);

    try {
      if (eonetResult.status === "rejected") {
        throw eonetResult.reason;
      }

      if (!eonetResult.value.ok) {
        throw new Error("NASA EONET could not be reached.");
      }

      const eonetData = await eonetResult.value.json();
      setEvents(eonetData.events || []);
    } catch (err) {
      console.error("EONET loading error:", err);
      setError("NASA EONET data could not be loaded.");
    }

    try {
      if (firmsResult.status === "rejected") {
        throw firmsResult.reason;
      }

      if (!firmsResult.value.ok) {
        throw new Error("NASA FIRMS data could not be loaded.");
      }

      const firmsDataResult = await firmsResult.value.json();
      setFirmsData(firmsDataResult.observations || []);
    } catch (err) {
      console.error("FIRMS loading error:", err);
      setFirmsError("NASA FIRMS data could not be loaded.");
    }

    setLoading(false);
  }

  // Load EONET and FIRMS
  useEffect(() => {
    loadEvents();
  }, []);

  // Load NOAA storm observations
 useEffect(() => {
  let isMounted = true;

  const fetchIceData = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/hazards/sea-ice"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch sea ice data");
      }

      const result = await response.json();

      if (isMounted) {
        setIceData(result);
        setIceDataError("");
      }
    } catch (error) {
      if (isMounted) {
        setIceDataError(error.message);
      }
    } finally {
      if (isMounted) {
        setIceDataLoading(false);
      }
    }
  };

  setIceDataLoading(true);
  fetchIceData();

  const interval = setInterval(fetchIceData, 30 * 60 * 1000);

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
},  []);

  // Build NASA EONET category filters
  const categories = useMemo(() => {
    const categoryMap = new Map();

    events.forEach((event) => {
      event.categories?.forEach((category) => {
        categoryMap.set(category.id, category.title);
      });
    });

    return Array.from(categoryMap, ([id, title]) => ({
      id,
      title,
    }));
  }, [events]);

  // Filter NASA EONET events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesCategory =
        activeCategory === "all" ||
        event.categories?.some(
          (category) => category.id === activeCategory
        );

      return matchesCategory && getEventPosition(event);
    });
  }, [events, activeCategory]);

  // NASA EONET severe storm events
  const stormEvents = useMemo(() => {
    return events.filter(
      (event) =>
        event.categories?.some((category) =>
          /severe storm|tropical cyclone/i.test(category.title)
        ) && getEventPosition(event)
    );
  }, [events]);

  // NASA EONET sea and lake ice events
  const iceEvents = useMemo(() => {
    return events.filter(
      (event) =>
        event.categories?.some((category) =>
          /sea and lake ice/i.test(category.title)
        ) && getEventPosition(event)
    );
  }, [events]);

  // Search FIRMS observations within 50 km of clicked location
  function handleMapClick(latlng) {
    setSelectedLocation(latlng);

    const nearby = firmsData.filter((fire) => {
      const fireLat = Number(fire.latitude);
      const fireLng = Number(fire.longitude);

      if (
        !Number.isFinite(fireLat) ||
        !Number.isFinite(fireLng)
      ) {
        return false;
      }

      return (
        getDistanceKm(
          latlng.lat,
          latlng.lng,
          fireLat,
          fireLng
        ) <= 50
      );
    });

    setNearbyFires(nearby);
  }
// Handle clicks on the Severe Storms map
function handleStormMapClick(latlng) {
  setSelectedStormLocation(latlng);

  const nearby = stormData.filter((storm) => {
    const lat = Number(storm.LAT);
    const lon = Number(storm.LON);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return false;
    }

    return (
      getDistanceKm(
        latlng.lat,
        latlng.lng,
        lat,
        lon
      ) <= 150
    );
  });

  setNearbyStorms(nearby);
}
// ================= NSIDC SEA ICE DATA =================

useEffect(() => {
  let cancelled = false;

  async function fetchIceData() {
    try {
      setIceDataLoading(true);
      setIceDataError("");

      const response = await fetch(
        "http://127.0.0.1:5000/api/hazards/sea-ice"
      );

      if (!response.ok) {
        throw new Error("Could not retrieve sea ice data.");
      }

      const data = await response.json();

      if (!cancelled) {
        setIceData(data);
      }
    } catch (error) {
      if (!cancelled) {
        setIceDataError(error.message);
      }
    } finally {
      if (!cancelled) {
        setIceDataLoading(false);
      }
    }
  }

  fetchIceData();

  return () => {
    cancelled = true;
  };
}, []);
// Play storm data as sound
// Accessible storm sonification
function playStormSound(storm) {
  stopStormSound();

  const wind = Number(storm.USA_WIND);
const pressure = Number(storm.USA_PRES);

console.log("Playing storm:", storm.NAME);
console.log("Wind:", wind);
console.log("Pressure:", pressure);

  const pressureText = Number.isFinite(pressure)
    ? `${pressure} hectopascals`
    : "Pressure unavailable";

  const message =
    `Storm name: ${storm.NAME || "Unknown"}. ` +
    `Wind speed: ${wind} knots. ` +
    `Atmospheric pressure: ${pressureText}. ` +
    `Last observation: ${storm.ISO_TIME || "Unavailable"}.`;

  if ("speechSynthesis" in window) {
    const speech = new SpeechSynthesisUtterance(message);

    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;

    stormSpeechRef.current = speech;

    speech.onend = () => {
      if (stormSpeechRef.current !== speech) return;

      stormSpeechRef.current = null;
      playStormTone(wind, pressure);
    };

    window.speechSynthesis.speak(speech);
  } else {
    playStormTone(wind, pressure);
  }
}
function playStormTone(wind, pressure) {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  const safeWind = Math.max(0, Math.min(wind, 150));

  const safePressure = Number.isFinite(pressure)
    ? Math.max(850, Math.min(pressure, 1050))
    : 1000;

  // Lower pressure produces a higher pitch
  const frequency =
    250 + ((1050 - safePressure) / 200) * 500;

  // Higher wind speed produces a louder tone
  const volume = 0.08 + (safeWind / 150) * 0.25;

  oscillator.type = "sine";
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const now = audioContext.currentTime;

  for (let i = 0; i < 4; i++) {
    const start = now + i * 0.55;

    oscillator.frequency.setValueAtTime(
      frequency + i * 35,
      start
    );

    gainNode.gain.setValueAtTime(0, start);
    gainNode.gain.linearRampToValueAtTime(volume, start + 0.08);
    gainNode.gain.setValueAtTime(volume, start + 0.25);
    gainNode.gain.linearRampToValueAtTime(0, start + 0.4);
  }

  oscillator.start(now);
  oscillator.stop(now + 2.3);

  stormAudioRef.current = {
    oscillator,
    audioContext,
  };

  oscillator.onended = () => {
    audioContext.close();
    stormAudioRef.current = null;
  };
}
// Stop storm sound

  function stopStormSound() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  stormSpeechRef.current = null;

  if (stormAudioRef.current) {
    try {
      stormAudioRef.current.oscillator.stop();
    } catch (error) {}

    stormAudioRef.current.audioContext.close();
    stormAudioRef.current = null;
  }
}
// ================= STOP ICE SOUND =================


function stopIceSound() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  iceSpeechRef.current = null;

  if (iceAudioRef.current) {
    const audio = iceAudioRef.current;

    try {
      audio.oscillator.stop();
    } catch (error) {}

    try {
      audio.bass.stop();
    } catch (error) {}

    audio.audioContext.close();
    iceAudioRef.current = null;
  }
}



<p
  style={{
    color: "#a9bbb2",
    fontSize: "12px",
    marginTop: "18px",
    lineHeight: "1.7",
  }}
>
  🎼 Musical interpretation of daily sea ice extent.
  Rising melody represents increasing extent.
  Falling melody represents decreasing extent.
  A rhythmic bass accompanies the melody.
  Spoken measurements communicate the exact scientific values.
  This is generated sonification, not an actual ice recording.
</p>
function playIceSound(region) {
  stopIceSound();

  if (!iceData || !iceData[region]) {
    console.error("Sea ice data is unavailable.");
    return;
  }

  const data = iceData[region];
  const extent = data.latest.extent;
  const change = data.change_since_previous_observation ?? 0;

  const direction =
    change > 0 ? "increased" :
    change < 0 ? "decreased" :
    "remained almost unchanged";

  const message =
    `${region === "arctic" ? "Arctic" : "Antarctic"} sea ice report. ` +
    `Latest extent is ${extent.toFixed(3)} million square kilometres. ` +
    `Compared with the previous observation, sea ice extent has ${direction}. ` +
    `The change is ${Math.abs(change).toFixed(3)} million square kilometres. ` +
    `Observation date ${data.latest.date}.`;

  if ("speechSynthesis" in window) {
    const speech = new SpeechSynthesisUtterance(message);
    speech.rate = 0.92;
    speech.pitch = 1;
    speech.volume = 1;

    iceSpeechRef.current = speech;

    speech.onend = () => {
      if (iceSpeechRef.current !== speech) return;
      iceSpeechRef.current = null;
      playIceTone(change);
    };

    window.speechSynthesis.speak(speech);
  } else {
    playIceTone(change);
  }
}

function playIceTone(change) {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();

  const master = audioContext.createGain();
  master.gain.value = 0.7;
  master.connect(audioContext.destination);

  const melody = audioContext.createOscillator();
  const melodyGain = audioContext.createGain();

  const bass = audioContext.createOscillator();
  const bassGain = audioContext.createGain();

  melody.type = "triangle";
  bass.type = "sine";

  melody.connect(melodyGain);
  melodyGain.connect(master);

  bass.connect(bassGain);
  bassGain.connect(master);

  // Rising extent = uplifting melody
  // Falling extent = descending melody
  const notes =
    change >= 0
      ? [
          261.63, 329.63, 392.00, 523.25,
          392.00, 440.00, 523.25, 587.33
        ]
      : [
          523.25, 440.00, 392.00, 329.63,
          392.00, 329.63, 293.66, 261.63
        ];

  const start = audioContext.currentTime + 0.1;
  const beat = 60 / 112;

  melody.start(start);
  bass.start(start);

  // Main rhythmic melody
  notes.forEach((frequency, index) => {
    const noteStart = start + index * beat * 0.5;
    const noteEnd = noteStart + beat * 0.38;

    const volume = index % 2 === 0 ? 0.24 : 0.16;

    melody.frequency.setValueAtTime(
      frequency,
      noteStart
    );

    melodyGain.gain.setValueAtTime(0, noteStart);

    melodyGain.gain.linearRampToValueAtTime(
      volume,
      noteStart + 0.04
    );

    melodyGain.gain.setValueAtTime(
      volume,
      noteEnd - 0.04
    );

    melodyGain.gain.linearRampToValueAtTime(
      0,
      noteEnd
    );
  });

  // Rhythmic bass accompaniment
  const bassNotes = [130.81, 130.81, 196.00, 196.00];

  bassNotes.forEach((frequency, index) => {
    const bassStart = start + index * beat;
    const bassEnd = bassStart + beat * 0.65;

    bass.frequency.setValueAtTime(
      frequency,
      bassStart
    );

    bassGain.gain.setValueAtTime(0, bassStart);

    bassGain.gain.linearRampToValueAtTime(
      0.20,
      bassStart + 0.05
    );

    bassGain.gain.linearRampToValueAtTime(
      0,
      bassEnd
    );
  });

  const duration = beat * 4 + 0.2;

  melody.stop(start + duration);
  bass.stop(start + duration);

  iceAudioRef.current = {
    oscillator: melody,
    bass,
    audioContext,
  };

  melody.onended = () => {
    if (iceAudioRef.current?.oscillator === melody) {
      iceAudioRef.current = null;
    }

    audioContext.close();
  };
}


function playFireSound(fire) {
  stopFireSound();

  const frp = Number(fire.frp) || 0;
  const brightness = Number(fire.bright_ti4) || 300;

  const message =
    `Wildfire observation. Latitude ${fire.latitude}. ` +
    `Longitude ${fire.longitude}. ` +
    `Fire radiative power ${frp} megawatts. ` +
    `Brightness ${brightness} kelvin. ` +
    `Confidence ${fire.confidence || "unavailable"}. ` +
    `Date ${fire.acq_date || "unavailable"}. ` +
    `Time UTC ${fire.acq_time || "unavailable"}.`;

  if ("speechSynthesis" in window) {
    const speech = new SpeechSynthesisUtterance(message);
    speech.rate = 0.9;
    speech.volume = 1;

    fireSpeechRef.current = speech;

    speech.onend = () => {
      if (fireSpeechRef.current !== speech) return;
      fireSpeechRef.current = null;
      playFireTone(frp, brightness);
    };

    window.speechSynthesis.speak(speech);
  } else {
    playFireTone(frp, brightness);
  }
}

function playFireTone(frp, brightness) {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  const safeFRP = Math.max(0, Math.min(frp, 500));
  const safeBrightness = Math.max(250, Math.min(brightness, 500));

  const frequency =
    250 + ((safeBrightness - 250) / 250) * 600;

  const volume = 0.05 + (safeFRP / 500) * 0.25;

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const now = audioContext.currentTime;

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.15);
  gainNode.gain.setValueAtTime(volume, now + 1.2);
  gainNode.gain.linearRampToValueAtTime(0, now + 1.8);

  oscillator.start(now);
  oscillator.stop(now + 1.8);

  fireAudioRef.current = { oscillator, audioContext };

  oscillator.onended = () => {
    audioContext.close();
    if (fireAudioRef.current?.oscillator === oscillator) {
      fireAudioRef.current = null;
    }
  };
}

function stopFireSound() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  fireSpeechRef.current = null;

  if (fireAudioRef.current) {
    try {
      fireAudioRef.current.oscillator.stop();
    } catch (error) {}

    fireAudioRef.current.audioContext.close();
    fireAudioRef.current = null;
  }
}

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#071311",
        color: "#e8f3ed",
        padding: "30px",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "auto" }}>
        <p style={{ color: "#8ac5a5", letterSpacing: "3px" }}>
          EARTH JUKEBOX / LIVE EARTH
        </p>

        <h1 style={{ fontSize: "38px", marginBottom: "8px" }}>
          Natural Hazards
        </h1>

        {/* HAZARD NAVIGATION */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            margin: "22px 0",
          }}
        >
          {[
            { id: "wildfires", label: "🔥 Wildfires" },
            { id: "storms", label: "🌪️ Severe Storms" },
            { id: "ice", label: "🧊 Sea and Lake Ice" },
          ].map((hazard) => (
            <button
              key={hazard.id}
              onClick={() => {
                  stopFireSound();
  stopStormSound();
  stopIceSound();
  setActiveHazard(hazard.id);
  setSelectedLocation(null);
  setNearbyFires([]);
  setSelectedStormLocation(null);
  setNearbyStorms([]);
}}
              style={{
                padding: "11px 20px",
                borderRadius: "10px",
                border: "1px solid #527b65",
                background:
                  activeHazard === hazard.id
                    ? "#315b45"
                    : "#10251e",
                color: "#e8f3ed",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {hazard.label}
            </button>
          ))}
        </div>

        {/* ================= WILDFIRES SECTION ================= */}
        {activeHazard === "wildfires" && (
          <>
            <p style={{ color: "#a9bbb2" }}>
              Explore active natural events and satellite-based
              wildfire observations from NASA.
            </p>

            {/* WILDFIRE STATISTICS - ONLY VISIBLE IN WILDFIRES TAB */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                margin: "25px 0",
              }}
            >
              <div style={statStyle}>
                <strong>{events.length}</strong>
                <span>Active NASA events</span>
              </div>

              <div style={statStyle}>
                <strong>{categories.length}</strong>
                <span>Event categories</span>
              </div>

              <div style={statStyle}>
                <strong>{filteredEvents.length}</strong>
                <span>Events displayed</span>
              </div>

              <div style={statStyle}>
                <strong>{firmsData.length.toLocaleString()}</strong>
                <span>FIRMS observations loaded</span>
              </div>
            </div>

            {loading ? (
              <p>Loading NASA wildfire observations...</p>
            ) : (
              <>
                <h2>Global Wildfire Map</h2>

                <p style={{ color: "#a9bbb2" }}>
                  Click anywhere on the map to investigate NASA
                  FIRMS thermal detections within 50 km of that
                  location.
                </p>

                {/* WILDFIRE MAP */}
                <div
                  style={{
                    height: "530px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "1px solid #29453b",
                  }}
                >
                  <MapContainer
                    center={[20, 0]}
                    zoom={2}
                    minZoom={2}
                    maxZoom={10}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* MAP CLICK HANDLER */}
                    <MapClickHandler onMapClick={handleMapClick} />

                    <DraggableFireLegend />

                    {/* NASA FIRMS WILDFIRE THERMAL DETECTIONS */}
                    {visibleFirms.map((fire, index) => {
                      const lat = Number(fire.latitude);
                      const lng = Number(fire.longitude);

                      if (
                        !Number.isFinite(lat) ||
                        !Number.isFinite(lng)
                      ) {
                        return null;
                      }

                      const confidence = String(
                        fire.confidence || ""
                      ).toLowerCase();

                      const markerColor =
                        confidence === "h"
                          ? "#ff3030"
                          : confidence === "n"
                          ? "#ff9f0a"
                          : "#ffd60a";

                      return (
                        <CircleMarker
                          key={`firms-${index}`}
                          center={[lat, lng]}
                          radius={3}
                          renderer={firmsRenderer}
                          pathOptions={{
                            color: markerColor,
                            fillColor: markerColor,
                            fillOpacity: 0.8,
                            weight: 1,
                          }}
                        >
                          <Popup>
                            <strong>
                              NASA FIRMS Thermal Detection
                            </strong>
                            <p>Latitude: {lat}</p>
                            <p>Longitude: {lng}</p>
                            <p>Date: {fire.acq_date}</p>
                            <p>Time UTC: {fire.acq_time}</p>
                            <p>
                              Brightness T4: {fire.bright_ti4} K
                            </p>
                            <p>
                              Brightness T5: {fire.bright_ti5} K
                            </p>
                            <p>Confidence: {fire.confidence}</p>
                            <p>FRP: {fire.frp} MW</p>
                            <p>Satellite: {fire.satellite}</p>
                            <p>Day/Night: {fire.daynight}</p>
                          </Popup>
                        </CircleMarker>
                      );
                    })}

                    {/* NASA EONET EVENT MARKERS */}
                    {filteredEvents.map((event) => {
                      const position = getEventPosition(event);

                      if (!position) return null;

                      return (
                        <CircleMarker
                          key={event.id}
                          center={position}
                          radius={7}
                          pathOptions={{
                            color: "#ff795e",
                            fillColor: "#ff4f36",
                            fillOpacity: 0.8,
                          }}
                        >
                          <Popup>
                            <strong>{event.title}</strong>
                            <br />
                            {event.categories
                              ?.map((category) => category.title)
                              .join(", ")}
                            <br />
                            {event.description ||
                              "No additional description."}
                            <br />
                            {event.geometry?.[
                              event.geometry.length - 1
                            ]?.date || "Date unavailable"}
                            <br />

                            {event.sources?.[0]?.url && (
                              <a
                                href={event.sources[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "#8ac5a5",
                                  fontSize: "11px",
                                }}
                              >
                                View event source details ↗
                              </a>
                            )}
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>
                </div>

                {/* SELECTED LOCATION RESULTS */}
                {selectedLocation && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "22px",
                      borderRadius: "14px",
                      background: "#10251e",
                      border: "1px solid #315b45",
                      color: "#e8f3ed",
                    }}
                  >
                    <p
                      style={{
                        color: "#8ac5a5",
                        fontSize: "13px",
                        letterSpacing: "2px",
                      }}
                    >
                      SELECTED LOCATION
                    </p>

                    <p>
                      Latitude: {selectedLocation.lat.toFixed(4)}
                      {" | "}
                      Longitude: {selectedLocation.lng.toFixed(4)}
                    </p>

                    {firmsError ? (
                      <p style={{ color: "#ff9b91" }}>
                        {firmsError}
                      </p>
                    ) : nearbyFires.length > 0 ? (
                      <>
                        <h2 style={{ color: "#ff795e" }}>
                          🔥 Well, this part of Earth is running hot!
                        </h2>

                        <h3>
                          {nearbyFires.length} NASA FIRMS detections
                          within 50 km
                        </h3>

                        {nearbyFires.slice(0, 10).map((fire, index) => (
                          <div
                            key={`${fire.latitude}-${fire.longitude}-${fire.acq_date}-${fire.acq_time}-${index}`}
                            style={{
                              background: "#19352a",
                              padding: "14px",
                              borderRadius: "9px",
                              marginTop: "10px",
                            }}
                          >
                            <strong>
                              🔥 Detection {index + 1}
                            </strong>

                            <p>
                              Date: {fire.acq_date || "Not available"}
                            </p>

                            <p>
                              Acquisition time (UTC):{" "}
                              {fire.acq_time || "Not available"}
                            </p>

                            <p>
                              Coordinates: {fire.latitude},{" "}
                              {fire.longitude}
                            </p>

                            <p>
                              Brightness T4:{" "}
                              {fire.bright_ti4 ?? "Not available"} K
                            </p>

                            <p>
                              Brightness T5:{" "}
                              {fire.bright_ti5 ?? "Not available"} K
                            </p>

                            <p>
                              Confidence:{" "}
                              {fire.confidence ?? "Not available"}
                            </p>

                            <p>
                              Fire Radiative Power:{" "}
                              {fire.frp ?? "Not available"} MW
                            </p>

                            <p>
                              Satellite:{" "}
                              {fire.satellite ?? "Not available"}
                            </p>

                            <p>
                              Day/Night:{" "}
                              {fire.daynight ?? "Not available"}
                            </p>
                          </div>
                        ))}

                        <p
                          style={{
                            fontSize: "12px",
                            color: "#a9bbb2",
                            marginTop: "15px",
                          }}
                        >
                          NASA FIRMS thermal detections are satellite
                          observations of heat. They are not confirmed
                          wildfire perimeters.
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 style={{ color: "#8ac5a5" }}>
                          🌿 Phew! Earth is keeping its cool here!
                        </h2>

                        <p>
                          NASA FIRMS found no thermal anomaly detections
                          within 50 km of this location during the
                          loaded observation period.
                        </p>

                        <p>
                          No fire signals spotted here. Earth gets
                          a little breathing room! 🌍
                        </p>
                      </>
                    )}
                  </div>
                )}

                {firmsError && (
                  <p
                    style={{
                      color: "#ff9b91",
                      marginTop: "15px",
                    }}
                  >
                    FIRMS data unavailable: {firmsError}
                  </p>
                )}

                {error && (
                  <p style={{ color: "#ff9b91" }}>{error}</p>
                )}

                {/* ================= WILDFIRE SYMPHONY ================= */}

                <div
                  style={{
                    marginTop: "28px",
                    padding: "25px",
                    background: "linear-gradient(135deg, #10251e, #18372b)",
                    border: "1px solid #42634e",
                    borderRadius: "16px",
                    color: "#e8f3ed",
                  }}
                >
                  <p
                    style={{
                      color: "#8ac5a5",
                      fontSize: "11px",
                      letterSpacing: "3px",
                    }}
                  >
                    EARTH JUKEBOX / DATA SONIFICATION
                  </p>

                  <h2 style={{ color: "#ffb347" }}>
                    🔥 WILDFIRE SYMPHONY
                  </h2>

                  <p style={{ color: "#b8c9bf", lineHeight: "1.7" }}>
                    Listen to satellite-based wildfire observations
                    transformed into sound.
                  </p>

                  <div
                    style={{
                      background: "#10251e",
                      padding: "18px",
                      borderRadius: "10px",
                      marginTop: "18px",
                      lineHeight: "1.7",
                    }}
                  >
                    <h3 style={{ color: "#ffb347" }}>
                      🔊 HOW IT WORKS
                    </h3>

                    <p>
                      🔥 <strong>Fire Radiative Power → Volume</strong>
                      <br />
                      Higher FRP produces a louder sound.
                    </p>

                    <p>
                      🌡️ <strong>Brightness → Pitch</strong>
                      <br />
                      Higher brightness produces a higher-pitched sound.
                    </p>

                    <p>
                      🗣️ <strong>Speech → Accessibility</strong>
                      <br />
                      The system reads the fire observation details aloud.
                    </p>
                  </div>

                  {nearbyFires.length > 0 ? (
                    <>
                      <label
                        htmlFor="fireAudioSelect"
                        style={{
                          display: "block",
                          margin: "20px 0 10px",
                          color: "#a9dfb9",
                        }}
                      >
                        SELECT FIRE OBSERVATION
                      </label>

                      <select
                        id="fireAudioSelect"
                        style={{
                          width: "100%",
                          maxWidth: "420px",
                          padding: "12px",
                          background: "#0b1c16",
                          color: "#e8f3ed",
                          border: "1px solid #42634e",
                          borderRadius: "8px",
                        }}
                      >
                        {nearbyFires.slice(0, 50).map((fire, index) => (
                          <option key={index} value={index}>
                            {`Detection ${index + 1} | FRP: ${fire.frp ?? "N/A"} MW`}
                          </option>
                        ))}
                      </select>

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          flexWrap: "wrap",
                          marginTop: "20px",
                        }}
                      >
                        <button
                          onClick={() => {
                            const select =
                              document.getElementById("fireAudioSelect");

                            const fire =
                              nearbyFires[Number(select.value)];

                            if (fire) playFireSound(fire);
                          }}
                          style={{
                            background: "#ffb347",
                            color: "#17251d",
                            border: "none",
                            borderRadius: "9px",
                            padding: "12px 22px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          ▶ PLAY FIRE SONIFICATION
                        </button>

                        <button
                          onClick={stopFireSound}
                          style={{
                            background: "transparent",
                            color: "#e8f3ed",
                            border: "1px solid #70917b",
                            borderRadius: "9px",
                            padding: "12px 22px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          ■ STOP
                        </button>
                      </div>
                    </>
                  ) : (
                    <p style={{ color: "#ffb347", marginTop: "18px" }}>
                      Click a location on the wildfire map to find
                      nearby observations and activate the sonification.
                    </p>
                  )}

                  <p
                    style={{
                      color: "#81968b",
                      fontSize: "11px",
                      marginTop: "20px",
                    }}
                  >
                    Audio is generated from NASA FIRMS measurements.
                    It is not a recording of an actual wildfire.
                  </p>
                </div>

                {/* NASA EONET EVENT CARDS */}
                <div style={{ marginTop: "22px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <h2 style={{ margin: 0, fontSize: "19px" }}>
                      Active Natural Events ({filteredEvents.length})
                    </h2>

                    {filteredEvents.length > 6 && (
                      <button
                        onClick={() =>
                          setShowAllEvents((prev) => !prev)
                        }
                        style={{
                          background: "transparent",
                          border: "1px solid #527b65",
                          color: "#8ac5a5",
                          padding: "6px 12px",
                          borderRadius: "7px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        {showAllEvents
                          ? "View Less ↑"
                          : "View More ↓"}
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    {(showAllEvents
                      ? filteredEvents
                      : filteredEvents.slice(0, 6)
                    ).map((event) => {
                      const geometry =
                        event.geometry?.[event.geometry.length - 1];

                      const position = getEventPosition(event);

                      return (
                        <div
                          key={event.id}
                          style={{
                            background: "#10251e",
                            border: "1px solid #315b45",
                            borderRadius: "10px",
                            padding: "12px",
                            color: "#e8f3ed",
                          }}
                        >
                          <strong style={{ fontSize: "14px" }}>
                            {event.title}
                          </strong>

                          <p
                            style={{
                              color: "#a9bbb2",
                              fontSize: "11px",
                              margin: "5px 0",
                            }}
                          >
                            {event.categories
                              ?.map((category) => category.title)
                              .join(" · ")}
                          </p>

                          <p style={{ fontSize: "11px", margin: "4px 0" }}>
                            Date: {geometry?.date || "Not available"}
                          </p>

                          {position && (
                            <p
                              style={{
                                fontSize: "11px",
                                margin: "4px 0",
                              }}
                            >
                              Coordinates: {position[0].toFixed(3)},{" "}
                              {position[1].toFixed(3)}
                            </p>
                          )}

                          <p
                            style={{
                              fontSize: "12px",
                              lineHeight: "1.4",
                              margin: "7px 0",
                            }}
                          >
                            {event.description ||
                              "No additional description available."}
                          </p>

                          {event.sources?.[0]?.url && (
                            <a
                              href={event.sources[0].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#8ac5a5",
                                fontSize: "11px",
                              }}
                            >
                              View event source ↗
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ================= SEVERE STORMS SECTION ================= */}
{activeHazard === "storms" && (
          <div style={{ marginTop: "25px" }}>
            <h2>🌪️ Global Severe Storms Map</h2>

            <p style={{ color: "#a9bbb2" }}>
              Explore storm reports from NASA EONET and NOAA
              storm-track observations.
            </p>

            <h3>
              {stormData.length.toLocaleString()} NOAA storm-track
              observations
            </h3>

            <p style={{ color: "#a9bbb2", fontSize: "13px" }}>
              Click the orange markers to view storm measurements.
              Each marker represents an observation at a particular
              time, not a separate storm.
            </p>

            {stormDataError && (
              <p style={{ color: "#ff7777" }}>
                NOAA data unavailable: {stormDataError}
              </p>
            )}

            {stormEvents.length === 0 && stormData.length === 0 ? (
              <p style={{ color: "#a9bbb2" }}>
                No storm observations are currently available.
              </p>
            ) : (
              <>
                {/* STORM MAP */}
                <div
                  style={{
                    height: "530px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "1px solid #29453b",
                  }}
                >
                  <MapContainer
                    center={[20, 0]}
                    zoom={2}
                    minZoom={2}
                    maxZoom={10}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
<MapClickHandler onMapClick={handleStormMapClick} />
                    {/* NOAA STORM TRACK OBSERVATIONS */}
                    {stormData.map((storm, index) => {
                      const lat = Number(storm.LAT);
                      const lon = Number(storm.LON);

                      if (
                        !Number.isFinite(lat) ||
                        !Number.isFinite(lon)
                      ) {
                        return null;
                      }

                      return (
                        <CircleMarker
                          key={`${storm.SID}-${storm.ISO_TIME}-${index}`}
                          center={[lat, lon]}
                          radius={6}
                          pathOptions={{
                            color: "#ffb347",
                            fillColor: "#ff7043",
                            fillOpacity: 0.85,
                          }}
                        >
                          <Popup>
                            <strong>
                              {storm.NAME || "Unnamed storm"}
                            </strong>
                            <br />
                            Storm ID: {storm.SID}
                            <br />
                            Date: {storm.ISO_TIME}
                            <br />
                            Wind speed:{" "}
                            {storm.USA_WIND || "Unavailable"} knots
                            <br />
                            Pressure:{" "}
                            {storm.USA_PRES || "Unavailable"} hPa
                            <br />
                            Basin: {storm.BASIN || "Unavailable"}
                          </Popup>
                        </CircleMarker>
                      );
                    })}

                    {/* NASA EONET STORM EVENTS */}
                    {stormEvents.map((event) => {
                      const position = getEventPosition(event);

                      if (!position) return null;

                      return (
                        <CircleMarker
                          key={event.id}
                          center={position}
                          radius={8}
                          pathOptions={{
                            color: "#ffb347",
                            fillColor: "#ff7043",
                            fillOpacity: 0.85,
                          }}
                        >
                          <Popup>
                            <strong>{event.title}</strong>
                            <p>
                              {event.categories
                                ?.map((category) => category.title)
                                .join(", ")}
                            </p>
                            <p>
                              {event.geometry?.[
                                event.geometry.length - 1
                              ]?.date || "Date unavailable"}
                            </p>
                            <p>
                              {event.description ||
                                "No additional description available."}
                            </p>

                            {event.sources?.[0]?.url && (
                              <a
                                href={event.sources[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View event source ↗
                              </a>
                            )}
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>
                </div>
                
{/* STORM SONIFICATION PANEL */}
<div
  style={{
    marginTop: "25px",
    padding: "28px",
    background: "linear-gradient(135deg, #10251e, #18372b)",
    border: "1px solid #42634e",
    borderRadius: "18px",
    color: "#e8f3ed",
    boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "12px",
    }}
  >
    <div>
      <p
        style={{
          color: "#8ac5a5",
          fontSize: "11px",
          letterSpacing: "3px",
          margin: "0 0 8px",
        }}
      >
        EARTH JUKEBOX / DATA SONIFICATION
      </p>

      <h2
        style={{
          color: "#ffb347",
          fontSize: "25px",
          margin: 0,
        }}
      >
        🎵 STORM SYMPHONY
      </h2>
    </div>

    <span
      style={{
        background: "#254a37",
        color: "#a9dfb9",
        padding: "7px 13px",
        borderRadius: "20px",
        fontSize: "11px",
        letterSpacing: "1px",
      }}
    >
      ● LIVE DATA
    </span>
  </div>

  <p
    style={{
      color: "#b8c9bf",
      lineHeight: "1.7",
      marginTop: "18px",
      maxWidth: "650px",
    }}
  >
    Listen to the changing intensity of tropical storms
    through sound generated from real NOAA observations.
    Wind speed influences sound intensity, while atmospheric
    pressure influences pitch.
  </p>

{/* HOW STORM SONIFICATION WORKS */}
<div
  style={{
    marginTop: "20px",
    marginBottom: "22px",
    padding: "20px",
    background: "#18372b",
    border: "1px solid #42634e",
    borderRadius: "12px",
    lineHeight: "1.7",
  }}
>
  <h3 style={{ color: "#ffb347", marginTop: 0 }}>
    🔊 HOW STORM SONIFICATION WORKS
  </h3>

  <p>
    Real NOAA storm measurements are converted into audio
    signals. Each storm can sound different depending on
    its recorded data.
  </p>

  <h4 style={{ color: "#8ac5a5" }}>
    🌬️ Wind Speed → Volume
  </h4>
  <p>
    Higher wind speed produces a louder sound.
    Lower wind speed produces a softer sound.
  </p>

  <h4 style={{ color: "#8ac5a5" }}>
    🎵 Atmospheric Pressure → Pitch
  </h4>
  <p>
    Lower pressure produces a higher-pitched tone.
    Higher pressure produces a lower-pitched tone.
  </p>

  <h4 style={{ color: "#8ac5a5" }}>
    🗣️ Spoken Storm Information
  </h4>
  <p>
    The system reads the storm name, wind speed,
    pressure and observation time aloud.
  </p>

  <p style={{ color: "#ffb347", fontWeight: "bold" }}>
    Purpose: Make storm data easier to understand
    through both hearing and listening.
  </p>
</div>

  <div
    style={{
      display: "flex",
      gap: "12px",
      flexWrap: "wrap",
      margin: "22px 0",
    }}
  >
    <div
      style={{
        background: "#0b1c16",
        border: "1px solid #315b45",
        borderRadius: "10px",
        padding: "13px 18px",
        minWidth: "150px",
      }}
    >
      <p style={{ color: "#8ac5a5", fontSize: "11px", margin: 0 }}>
        AVAILABLE OBSERVATIONS
      </p>
      <h2 style={{ margin: "7px 0 0", color: "#ffb347" }}>
        {stormData.length.toLocaleString()}
      </h2>
    </div>

    <div
      style={{
        background: "#0b1c16",
        border: "1px solid #315b45",
        borderRadius: "10px",
        padding: "13px 18px",
        minWidth: "150px",
      }}
    >
      <p style={{ color: "#8ac5a5", fontSize: "11px", margin: 0 }}>
        SOUND SOURCE
      </p>
      <h3 style={{ margin: "9px 0 0", fontSize: "15px" }}>
        NOAA Storm Data
      </h3>
    </div>
  </div>

  {stormData.length > 0 ? (
    <>
      <label
        htmlFor="stormAudioSelect"
        style={{
          display: "block",
          color: "#a9dfb9",
          fontSize: "13px",
          marginBottom: "9px",
        }}
      >
        SELECT A STORM TO LISTEN TO
      </label>

      <select
        id="stormAudioSelect"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "13px",
          borderRadius: "9px",
          background: "#0b1c16",
          color: "#e8f3ed",
          border: "1px solid #42634e",
          fontSize: "14px",
          outline: "none",
          cursor: "pointer",
        }}
      >
        {Array.from(
          new Map(
            stormData.map((storm) => [storm.SID, storm])
          ).values()
        ).map((storm) => (
          <option key={storm.SID} value={storm.SID}>
            {storm.NAME || "Unnamed storm"}
          </option>
        ))}
      </select>

      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginTop: "20px",
        }}
      >
        <button
          onClick={() => {
            const select = document.getElementById("stormAudioSelect");
            const selectedStorm = stormData.find(
              (storm) => storm.SID === select?.value
            );

            if (selectedStorm) {
              playStormSound(selectedStorm);
            }
          }}
          style={{
            background: "#ffb347",
            color: "#17251d",
            border: "none",
            borderRadius: "9px",
            padding: "12px 23px",
            fontWeight: "bold",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          ▶ PLAY SONIFICATION
        </button>

        <button
          onClick={stopStormSound}
          style={{
            background: "transparent",
            color: "#e8f3ed",
            border: "1px solid #70917b",
            borderRadius: "9px",
            padding: "12px 23px",
            fontWeight: "bold",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          ■ STOP
        </button>
      </div>
    </>
  ) : (
    <p style={{ color: "#ffb347" }}>
      Waiting for storm observations...
    </p>
  )}

  <p
    style={{
      color: "#81968b",
      fontSize: "11px",
      marginTop: "22px",
      lineHeight: "1.6",
    }}
  >
    Audio is generated from storm measurements; it is not
    a recording of the actual storm.
  </p>
</div>

                

{/* SELECTED STORM LOCATION MESSAGE */}
{selectedStormLocation && (
  <div
    style={{
      marginTop: "20px",
      padding: "22px",
      background: "#10251e",
      border: "1px solid #42634e",
      borderRadius: "12px",
      color: "#e8f3ed",
    }}
  >
    <h2 style={{ color: "#ffb347" }}>
      📍 SELECTED LOCATION
    </h2>

    <p>
      Latitude: {selectedStormLocation.lat.toFixed(4)}
    </p>

    <p>
      Longitude: {selectedStormLocation.lng.toFixed(4)}
    </p>

    <h3 style={{ color: "#8ac5a5" }}>
      🌪️ Nearby Storm Reports
    </h3>

    {nearbyStorms.length > 0 ? (
      <>
        <p>
          {nearbyStorms.length} storm observations
          found within 150 km.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "15px",
            marginTop: "18px",
          }}
        >
          {nearbyStorms.map((storm, index) => (
            <div
              key={`${storm.SID || storm.NAME || "storm"}-${index}`}
              style={{
                background: "#18372b",
                padding: "18px",
                borderRadius: "12px",
                border: "1px solid #42634e",
              }}
            >
              <h3 style={{ color: "#ffb347" }}>
                🌪️ {storm.NAME || "Unnamed Storm"}
              </h3>

              <p>
                Wind speed: {storm.USA_WIND || "Unavailable"} knots
              </p>

              <p>
                Pressure: {storm.USA_PRES || "Unavailable"} hPa
              </p>

              <p>
                Observation: {storm.ISO_TIME || "Unavailable"}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "12px",
                }}
              >
                <button onClick={() => playStormSound(storm)}>
                  ▶ Play Storm Sound
                </button>

                <button onClick={stopStormSound}>
                  ■ Stop Sound
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
    ) : (
      <p style={{ color: "#ffb347" }}>
        No storm observations found within 150 km.
      </p>
    )}
  </div>
)}


{/* NASA EONET STORM EVENT CARDS */}
<h3 style={{ marginTop: "22px" }}>
  NASA EONET Active Storm Reports
</h3>

{stormEvents.length === 0 ? (
  <p style={{ color: "#a9bbb2" }}>
    No active storm events are currently available
    in the NASA EONET feed. NOAA observations are
    displayed on the map above.
  </p>
) : (
  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "10px",
    }}
  >
    {stormEvents.map((event) => (
      <div
        key={event.id}
        style={{
          background: "#10251e",
          border: "1px solid #315b45",
          borderRadius: "10px",
          padding: "14px",
        }}
      >
        <strong>{event.title}</strong>

        <p
          style={{
            fontSize: "12px",
            color: "#a9bbb2",
          }}
        >
          {event.categories
            ?.map((category) => category.title)
            .join(" · ")}
        </p>

        <p style={{ fontSize: "12px" }}>
          {event.description ||
            "No additional description available."}
        </p>
      </div>
    ))}
  </div>
)}

                {/* NASA EONET STORM EVENT CARDS */}
                <h3 style={{ marginTop: "22px" }}>
                  NASA EONET Active Storm Reports
                </h3>

                {stormEvents.length === 0 ? (
                  <p style={{ color: "#a9bbb2" }}>
                    No active storm events are currently available
                    in the NASA EONET feed. NOAA observations are
                    displayed on the map above.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "10px",
                    }}
                  >
                   
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ================= SEA AND LAKE ICE SECTION ================= */}
        {activeHazard === "ice" && (
          <div style={{ marginTop: "25px" }}>
            {/* ================= SEA ICE DATA DASHBOARD ================= */}

<div
  style={{
    marginBottom: "25px",
    padding: "22px",
    background: "#10251e",
    border: "1px solid #315b45",
    borderRadius: "14px",
  }}
>
  <h2 style={{ color: "#8be9fd", marginTop: 0 }}>
    ❄️ GLOBAL SEA ICE INTELLIGENCE
  </h2>

  <p style={{ color: "#a9bbb2", fontSize: "13px" }}>
    Real satellite-derived daily sea ice extent measurements.
    Source: NSIDC Sea Ice Index v4.0.
  </p>

  {iceDataLoading && (
    <p style={{ color: "#8be9fd" }}>
      Loading latest sea ice measurements...
    </p>
  )}

  {iceDataError && (
    <p style={{ color: "#ff7777" }}>
      {iceDataError}
    </p>
  )}

  {iceData && (
    <>
      <p style={{ color: "#a9bbb2", fontSize: "12px" }}>
        Latest observation: {iceData.arctic.latest.date}
        {" | "}Unit: million km²
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "15px",
        }}
      >
        {[
          {
            name: "ARCTIC SEA ICE",
            hemisphere: "Northern Hemisphere",
            data: iceData.arctic,
          },
          {
            name: "ANTARCTIC SEA ICE",
            hemisphere: "Southern Hemisphere",
            data: iceData.antarctic,
          },
        ].map((item) => (
          <div
            key={item.name}
            style={{
              background: "#0b1b24",
              border: "1px solid #287a9b",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <h3 style={{ color: "#38bdf8" }}>
              {item.name}
            </h3>

            <p style={{ color: "#a9bbb2", fontSize: "12px" }}>
              {item.hemisphere}
            </p>

            <h1 style={{ color: "#ffffff", fontSize: "32px" }}>
              {item.data.latest.extent.toFixed(3)}
            </h1>

            <p style={{ color: "#a9bbb2", fontSize: "12px" }}>
              Million square kilometres
            </p>

            <p style={{ color: "#a9bbb2" }}>
              Previous:{" "}
              {item.data.previous?.extent.toFixed(3) ?? "N/A"}
            </p>

            <p
              style={{
                color:
                  item.data.change_since_previous_observation >= 0
                    ? "#55d6a0"
                    : "#ff8585",
                fontWeight: "bold",
              }}
            >
              Change:{" "}
              {item.data.change_since_previous_observation > 0
                ? "+"
                : ""}
              {item.data.change_since_previous_observation?.toFixed(3) ?? "N/A"}
              {" "}million km²
            </p>
          </div>
        ))}
      </div>

      <h3 style={{ color: "#8be9fd", marginTop: "25px" }}>
        📊 Recent Sea Ice Observations
      </h3>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "#e8f3ed",
            fontSize: "13px",
            textAlign: "left",
          }}
        >
          <thead>
            <tr style={{ background: "#18372b" }}>
              <th style={{ padding: "12px" }}>Date</th>
              <th style={{ padding: "12px" }}>Arctic (million km²)</th>
              <th style={{ padding: "12px" }}>Antarctic (million km²)</th>
            </tr>
          </thead>

          <tbody>
            {iceData.arctic.recent_records
              .slice(-7)
              .map((record) => {
                const antarcticRecord =
                  iceData.antarctic.recent_records.find(
                    (item) => item.date === record.date
                  );

                return (
                  <tr
                    key={record.date}
                    style={{ borderBottom: "1px solid #315b45" }}
                  >
                    <td style={{ padding: "12px" }}>
                      {record.date}
                    </td>

                    <td style={{ padding: "12px" }}>
                      {record.extent.toFixed(3)}
                    </td>

                    <td style={{ padding: "12px" }}>
                      {antarcticRecord
                        ? antarcticRecord.extent.toFixed(3)
                        : "Unavailable"}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "14px",
          background: "#18372b",
          borderRadius: "9px",
        }}
      >
        <p style={{ color: "#8be9fd", fontWeight: "bold" }}>
          DATA SOURCE
        </p>

        <p style={{ color: "#a9bbb2", fontSize: "12px" }}>
          {iceData.dataset}
        </p>

        <p style={{ color: "#a9bbb2", fontSize: "12px" }}>
          Provider: {iceData.source}
        </p>

        <a
          href="https://nsidc.org/data/g02135/versions/4"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#38bdf8", fontSize: "13px" }}
        >
          View official dataset documentation ↗
        </a>
      </div>
    </>
  )}
</div>

{/* ================= END SEA ICE DATA DASHBOARD ================= */}
            
            
{/* ================= ICE SONIFICATION PANEL ================= */}

<div
  style={{
    marginTop: "25px",
    padding: "25px",
    background: "#10251e",
    border: "1px solid #315b45",
    borderRadius: "14px",
    color: "#e8f3ed",
  }}
>
  <h2 style={{ color: "#8be9fd" }}>
    🎵 SEA ICE SYMPHONY
  </h2>

  <p style={{ color: "#a9bbb2", lineHeight: "1.7" }}>
    Listen to real daily sea ice extent measurements from
    the Arctic and Antarctic. Spoken descriptions explain
    the measurements, followed by a tone representing the
    direction and magnitude of daily change.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "15px",
      marginTop: "20px",
    }}
  >
    {/* ARCTIC */}

    <div
      style={{
        padding: "20px",
        background: "#0b1b24",
        border: "1px solid #287a9b",
        borderRadius: "12px",
      }}
    >
      <h3 style={{ color: "#38bdf8" }}>❄️ ARCTIC</h3>

      <p style={{ color: "#a9bbb2", fontSize: "13px" }}>
        Northern Hemisphere sea ice
      </p>

      <button
        onClick={() => playIceSound("arctic")}
        disabled={!iceData || iceDataLoading}
        style={{
          background: "#167ca3",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "12px 20px",
          fontWeight: "bold",
          cursor: "pointer",
          marginTop: "10px",
        }}
      >
        ▶ PLAY ARCTIC SOUND
      </button>
    </div>

    {/* ANTARCTIC */}

    <div
      style={{
        padding: "20px",
        background: "#0b1b24",
        border: "1px solid #287a9b",
        borderRadius: "12px",
      }}
    >
      <h3 style={{ color: "#38bdf8" }}>❄️ ANTARCTIC</h3>

      <p style={{ color: "#a9bbb2", fontSize: "13px" }}>
        Southern Hemisphere sea ice
      </p>

      <button
        onClick={() => playIceSound("antarctic")}
        disabled={!iceData || iceDataLoading}
        style={{
          background: "#167ca3",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "12px 20px",
          fontWeight: "bold",
          cursor: "pointer",
          marginTop: "10px",
        }}
      >
        ▶ PLAY ANTARCTIC SOUND
      </button>
    </div>
  </div>

  <button
    onClick={stopIceSound}
    style={{
      marginTop: "20px",
      background: "transparent",
      color: "#e8f3ed",
      border: "1px solid #70917b",
      borderRadius: "8px",
      padding: "11px 25px",
      fontWeight: "bold",
      cursor: "pointer",
    }}
  >
    ■ STOP SOUND
  </button>

  <p
    style={{
      color: "#a9bbb2",
      fontSize: "12px",
      marginTop: "18px",
      lineHeight: "1.6",
    }}
  >
    Higher pitch = increase in sea ice extent.
    Lower pitch = decrease in sea ice extent.
    Spoken measurements provide the exact values.
    These are generated sounds, not actual recordings of ice.
  </p>
</div>

{/* ================= END ICE SONIFICATION PANEL ================= */}
        </div>
        )}
        

        {/* DATA SOURCES */}
        <p
          style={{
            color: "#81968b",
            marginTop: "25px",
            fontSize: "12px",
          }}
        >
          Data sources: NASA EONET, NASA FIRMS and NOAA IBTrACS.
          FIRMS observations are satellite thermal detections and
          may not represent every fire on Earth. NOAA storm-track
          records include observations from the dataset and are
          not necessarily all current storms.
        </p>
      </div>
    </div>
  );
}

const statStyle = {
  background: "#10251e",
  border: "1px solid #315b45",
  borderRadius: "12px",
  padding: "18px 22px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: "150px",
};

const filterStyle = (active) => ({
  background: active ? "#315b45" : "#10251e",
  color: active ? "#ffffff" : "#a9bbb2",
  border: "1px solid #527b65",
  borderRadius: "20px",
  padding: "8px 15px",
  cursor: "pointer",
  fontSize: "13px",
});
