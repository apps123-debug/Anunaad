
import { useEffect, useRef, useState } from "react";
import "./ClimateExperience.css";

const NASA_CSV =
  "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function ClimateExperience() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const positionRef = useRef(0);

  useEffect(() => {
    let active = true;

    async function loadNASAData() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(NASA_CSV);

        if (!response.ok) {
          throw new Error("NASA data could not be downloaded.");
        }

        const csv = await response.text();
        const lines = csv.trim().split(/\r?\n/);

        const headerIndex = lines.findIndex((line) =>
          line.startsWith("Year,")
        );

        if (headerIndex === -1) {
          throw new Error("NASA data format was not recognized.");
        }

        const parsed = [];

        for (const line of lines.slice(headerIndex + 1)) {
          const columns = line.split(",");
          const year = Number(columns[0]);

          if (!Number.isFinite(year)) continue;

          for (let i = 0; i < 12; i++) {
            const value = Number(columns[i + 1]);

            if (
              columns[i + 1] &&
              columns[i + 1].trim() !== "***" &&
              Number.isFinite(value)
            ) {
              parsed.push({
                year,
                month: i,
                value,
                label: `${MONTHS[i]} ${year}`,
              });
            }
          }
        }

        if (!parsed.length) {
          throw new Error("No temperature observations were found.");
        }

        if (active) {
          setRecords(parsed.slice(-24));
        }
      } catch (err) {
        if (active) {
          setError(
            err.message +
              " Check your internet connection or try again later."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadNASAData();

    return () => {
      active = false;
    };
  }, []);

  const latest = records[records.length - 1];

  function stopAudio() {
    clearTimeout(timerRef.current);

    try {
      oscillatorRef.current?.stop();
    } catch {
      // Oscillator may already have stopped.
    }

    oscillatorRef.current = null;
    gainRef.current = null;
    positionRef.current = 0;
    setPlaying(false);
    setPaused(false);
    setProgress(0);
  }

  function startSound(fromPosition = 0) {
    if (!records.length) return;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      setError("Your browser does not support Web Audio.");
      return;
    }

    const context =
      audioRef.current || new AudioContextClass();

    audioRef.current = context;

    if (context.state === "suspended") {
      context.resume();
    }

    try {
      oscillatorRef.current?.stop();
    } catch {
      // Previous sound may already have ended.
    }

    clearTimeout(timerRef.current);

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    gain.gain.value = 0.0001;

    oscillator.connect(gain);
    gain.connect(context.destination);

    const startAt = context.currentTime + 0.08;
    const noteDuration = 0.42;
    const remaining = records.slice(fromPosition);

    remaining.forEach((record, index) => {
      const time = startAt + index * noteDuration;

      // Map the NASA temperature anomaly to a musical pitch.
      const frequency = Math.max(
        150,
        Math.min(650, 330 + record.value * 115)
      );

      oscillator.frequency.setValueAtTime(frequency, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.07);
      gain.gain.setValueAtTime(0.12, time + 0.24);
      gain.gain.linearRampToValueAtTime(
        0.0001,
        time + noteDuration - 0.03
      );
    });

    const totalDuration = remaining.length * noteDuration;

    oscillator.start(startAt);
    oscillator.stop(startAt + totalDuration);

    oscillatorRef.current = oscillator;
    gainRef.current = gain;
    positionRef.current = fromPosition;
    startTimeRef.current = Date.now();

    setPlaying(true);
    setPaused(false);

    timerRef.current = window.setTimeout(() => {
      setProgress(100);
      setPlaying(false);
      setPaused(false);
      positionRef.current = 0;
      oscillatorRef.current = null;
      gainRef.current = null;
    }, totalDuration * 1000 + 150);
  }

  function play() {
    if (!records.length) return;

    if (paused && audioRef.current) {
      audioRef.current.resume();
      setPaused(false);
      setPlaying(true);
      return;
    }

    startSound(0);
  }

  function pause() {
    if (audioRef.current && playing) {
      audioRef.current.suspend();
      setPaused(true);
      setPlaying(false);
    }
  }

  function replay() {
    if (audioRef.current) {
      audioRef.current.resume();
    }
    startSound(0);
  }

  useEffect(() => {
    if (!playing) return;

    const interval = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const duration = records.length * 0.42;

      setProgress(
        Math.min(100, (elapsed / duration) * 100)
      );
    }, 100);

    return () => window.clearInterval(interval);
  }, [playing, records.length]);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);

      try {
        oscillatorRef.current?.stop();
      } catch {
        // Already stopped.
      }

      audioRef.current?.close();
    };
  }, []);

  return (
    <section className="climate-experience" id="climate-experience">
      <div className="climate-inner">
        <div className="climate-intro">
          <span className="climate-eyebrow">
            NASA GISS · CLIMATE SONIFICATION
          </span>

          <h2>
            Listen to the
            <br />
            <span>temperature of Earth.</span>
          </h2>

          <p>
            Every note represents a real monthly global
            temperature observation. Listen to how our
            planet's temperature has changed.
          </p>
        </div>

        <div className="climate-panel">
          <div className="climate-panel-top">
            <span>GLOBAL TEMPERATURE ANOMALY</span>
            <span className="climate-source-dot">
              ● NASA GISS
            </span>
          </div>

          {loading && (
            <p className="climate-status">
              Loading observations from NASA...
            </p>
          )}

          {error && (
            <div className="climate-error">
              {error}
              <button onClick={() => window.location.reload()}>
                Reload page
              </button>
            </div>
          )}

          {!loading && !error && latest && (
            <>
              <div className="climate-stat">
                <div>
                  <span className="climate-stat-label">
                    LATEST AVAILABLE MONTH
                  </span>
                  <strong>
                    {latest.value > 0 ? "+" : ""}
                    {latest.value.toFixed(2)}°C
                  </strong>
                  <small>{latest.label}</small>
                </div>

                <span className="climate-stat-unit">
                  ANOMALY
                </span>
              </div>

              <div className="climate-chart">
                <div className="climate-chart-labels">
                  <span>WARMER</span>
                  <span>MONTHLY OBSERVATIONS</span>
                </div>

                <svg
                  viewBox="0 0 600 190"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="NASA monthly global temperature anomaly observations"
                >
                  <defs>
                    <linearGradient
                      id="climateArea"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#d98f72"
                        stopOpacity=".45"
                      />
                      <stop
                        offset="100%"
                        stopColor="#d98f72"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>

                  {[35, 80, 125, 170].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      x2="600"
                      y1={y}
                      y2={y}
                      stroke="#789b84"
                      strokeOpacity=".2"
                      strokeDasharray="4 6"
                    />
                  ))}

                  {records.length > 1 && (() => {
                    const min = Math.min(
                      ...records.map((r) => r.value),
                      0
                    );
                    const max = Math.max(
                      ...records.map((r) => r.value),
                      0.5
                    );
                    const range = max - min || 1;

                    const points = records.map((r, i) => ({
                      x: (i / (records.length - 1)) * 600,
                      y: 165 - ((r.value - min) / range) * 135,
                    }));

                    const path = points
                      .map((p, i) =>
                        `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`
                      )
                      .join(" ");

                    return (
                      <>
                        <path
                          d={`${path} L 600 190 L 0 190 Z`}
                          fill="url(#climateArea)"
                        />
                        <path
                          d={path}
                          fill="none"
                          stroke="#c77d59"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {points.map((p, i) => (
                          <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r={i === points.length - 1 ? 5 : 2.2}
                            fill="#c77d59"
                          />
                        ))}
                      </>
                    );
                  })()}
                </svg>

                <div className="climate-chart-labels">
                  <span>{records[0]?.label}</span>
                  <span>{latest.label}</span>
                </div>
              </div>

              <div className="climate-audio">
                <div className="climate-audio-heading">
                  <div>
                    <span className="climate-stat-label">
                      DATA SONIFICATION
                    </span>
                    <h3>
                      Hear Earth's changing temperature
                    </h3>
                  </div>

                  <span className={playing ? "audio-live" : "audio-idle"}>
                    {playing ? "● PLAYING" : paused ? "Ⅱ PAUSED" : "○ READY"}
                  </span>
                </div>

                <div className={`climate-wave ${playing ? "is-playing" : ""}`}>
                  {Array.from({ length: 48 }, (_, i) => (
                    <span
                      key={i}
                      style={{
                        "--wave-height": `${15 + ((i * 19 + i * i) % 75)}%`,
                      }}
                    />
                  ))}
                </div>

                <div className="climate-progress">
                  <div style={{ width: `${progress}%` }} />
                </div>

                <div className="climate-controls">
                  <button onClick={play} disabled={playing || !records.length}>
                    ▶ Play
                  </button>

                  <button onClick={pause} disabled={!playing}>
                    Ⅱ Pause
                  </button>

                  <button onClick={replay} disabled={!records.length}>
                    ↺ Replay
                  </button>

                  <button onClick={stopAudio} disabled={!playing && !paused}>
                    ■ Stop
                  </button>
                </div>

                <p className="climate-audio-note">
                  24 recent monthly observations · Each note's pitch
                  represents its temperature anomaly. This is a
                  simple illustrative sonification, not recorded
                  environmental audio.
                </p>
              </div>
            </>
          )}

          <div className="climate-attribution">
            Source: NASA Goddard Institute for Space Studies,
            GISTEMP v4 · Global land-ocean temperature index.
          </div>
        </div>
      </div>
    </section>
  );
}
