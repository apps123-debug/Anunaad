
import { useEffect, useRef, useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const shortMonths = MONTHS.map((month) => month.slice(0, 3));

function makeRiverPath(records, width, height, min, max) {
  if (!records.length) return "";

  const points = records.map((record, index) => {
    const x = 30 + (index / Math.max(records.length - 1, 1)) * (width - 60);
    const y = height - 35 -
      ((record.value - min) / Math.max(max - min, 0.01)) * (height - 80);
    return { x, y };
  });

  return points.map((point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const middle = (previous.x + point.x) / 2;
    return `C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`;
  }).join(" ");
}

export default function ClimateUniverse({ onBack }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const playIndexRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const response = await fetch("/nasa-gistemp.csv");

        if (!response.ok) {
          throw new Error("NASA data file not found. Place nasa-gistemp.csv inside the public folder.");
        }

        const csv = await response.text();
        const lines = csv.split(/\r?\n/);
        const headerIndex = lines.findIndex((line) =>
          line.trim().startsWith("Year,")
        );

        if (headerIndex < 0) {
          throw new Error("The NASA CSV format could not be recognized.");
        }

        const parsed = [];

        for (const line of lines.slice(headerIndex + 1)) {
          const columns = line.split(",");
          const year = Number(columns[0]);

          if (!Number.isFinite(year)) continue;

          for (let month = 0; month < 12; month++) {
            const raw = columns[month + 1]?.trim();

            if (!raw || raw === "***") continue;

            const value = Number(raw);

            if (Number.isFinite(value)) {
              parsed.push({ year, month, value: value / 100 });
            }
          }
        }

        if (!parsed.length) {
          throw new Error("No temperature observations were found in the NASA file.");
        }

        if (!cancelled) {
          setRecords(parsed.slice(-12));
          setSelectedIndex(0);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
      window.clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.close();
    };
  }, []);

  const selected = records[selectedIndex];
  const latest = records[records.length - 1];

  const values = records.map((item) => item.value);
  const min = values.length ? Math.min(...values, 0) - 0.15 : -0.5;
  const max = values.length ? Math.max(...values, 0) + 0.15 : 1.5;

  const riverPath = makeRiverPath(records, 1100, 430, min, max);
  const areaPath = records.length
    ? `${riverPath} L 1070 430 L 30 430 Z`
    : "";

  const heat = selected
    ? Math.max(0, Math.min(1, (selected.value + 0.2) / 2))
    : 0.5;

  const temperatureColor = heat > 0.65
    ? "#d77d5e"
    : heat > 0.4
      ? "#d8ad70"
      : "#62aeb0";

  function stopPlayback() {
    window.clearInterval(timerRef.current);
    timerRef.current = null;
    setIsPlaying(false);
  }

  function playNote(record) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioRef.current || audioRef.current.state === "closed") {
      audioRef.current = new AudioContextClass();
    }

    const context = audioRef.current;

    if (context.state === "suspended") context.resume();

    const normalized = Math.max(0, Math.min(1, (record.value + 0.5) / 2.5));
    const frequency = 150 + normalized * 360;
    const now = context.currentTime;

    const oscillator = context.createOscillator();
    const overtone = context.createOscillator();
    const gain = context.createGain();
    const overtoneGain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);

    overtone.type = "triangle";
    overtone.frequency.setValueAtTime(frequency * 1.5, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

    overtoneGain.gain.setValueAtTime(0.0001, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.025, now + 0.12);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    oscillator.connect(gain);
    overtone.connect(overtoneGain);
    gain.connect(context.destination);
    overtoneGain.connect(context.destination);

    oscillator.start(now);
    overtone.start(now);
    oscillator.stop(now + 1.6);
    overtone.stop(now + 1.3);
  }

  function playSelected() {
    if (!selected) return;
    stopPlayback();
    playNote(selected);
  }

  function startSequence() {
    if (!records.length) return;

    stopPlayback();
    playIndexRef.current = selectedIndex;
    setIsPlaying(true);

    const playNext = () => {
      const index = playIndexRef.current;

      if (index >= records.length) {
        stopPlayback();
        return;
      }

      setSelectedIndex(index);
      playNote(records[index]);
      playIndexRef.current += 1;
    };

    playNext();
    timerRef.current = window.setInterval(playNext, 1700);
  }

  function togglePlayback() {
    if (isPlaying) {
      stopPlayback();
    } else {
      startSequence();
    }
  }

  function replay() {
    stopPlayback();
    setSelectedIndex(0);
    playIndexRef.current = 0;

    window.setTimeout(() => {
      playIndexRef.current = 0;
      startSequence();
    }, 50);
  }

  function formatValue(value) {
    if (value === undefined) return "—";
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}°`;
  }

  return (
    <main className="living-climate">
      <style>{`
        .living-climate {
          min-height: 100vh;
          background: #f4f0e5;
          color: #293d35;
          font-family: inherit;
          overflow: hidden;
        }
        .living-nav {
          height: 76px;
          padding: 0 6vw;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(53,94,75,.16);
        }
        .living-brand {
          color: #355e4b;
          text-decoration: none;
          font-size: 22px;
          font-weight: 700;
        }
        .living-nav-label {
          font-size: 10px;
          letter-spacing: 2px;
          color: #718579;
        }
        .living-back {
          border: 1px solid #9eb4a4;
          background: transparent;
          border-radius: 30px;
          padding: 10px 18px;
          color: #355e4b;
          cursor: pointer;
        }
        .living-intro {
          padding: 65px 7vw 25px;
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 30px;
        }
        .living-kicker {
          color: #668b76;
          font-size: 11px;
          letter-spacing: 2.5px;
          font-weight: 700;
        }
        .living-intro h1 {
          font-size: clamp(42px, 6vw, 82px);
          line-height: .98;
          letter-spacing: -4px;
          font-weight: 500;
          margin: 22px 0 14px;
          max-width: 760px;
        }
        .living-intro h1 span { color: #4e9b91; }
        .living-intro p {
          max-width: 340px;
          line-height: 1.8;
          color: #718078;
          font-size: 14px;
        }
        .living-stage {
          position: relative;
          margin: 20px 4vw 0;
          min-height: 520px;
          border-radius: 28px;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 50% 90%, rgba(216,173,112,.30), transparent 55%),
            linear-gradient(145deg, #e5eee2, #d5e9e4 48%, #f0e6d3);
          border: 1px solid rgba(53,94,75,.16);
          box-shadow: 0 24px 70px rgba(53,94,75,.10);
          transition: background 1s ease;
        }
        .living-stage-top {
          position: absolute;
          top: 30px;
          left: 38px;
          right: 38px;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          letter-spacing: 2px;
          color: #668174;
        }
        .living-reading {
          position: absolute;
          z-index: 2;
          left: 7%;
          top: 105px;
        }
        .living-reading small {
          display: block;
          font-size: 10px;
          letter-spacing: 2px;
          color: #668174;
          margin-bottom: 12px;
        }
        .living-reading strong {
          display: block;
          font-size: clamp(64px, 10vw, 132px);
          line-height: .9;
          letter-spacing: -7px;
          font-weight: 500;
          color: #355e4b;
          transition: color .5s ease;
        }
        .living-reading span {
          display: block;
          margin-top: 17px;
          font-size: 15px;
          color: #587468;
        }
        .living-river {
          position: absolute;
          width: 100%;
          height: 100%;
          inset: 0;
          opacity: .95;
        }
        .living-river svg { width: 100%; height: 100%; overflow: visible; }
        .river-line {
          fill: none;
          stroke: ${temperatureColor};
          stroke-width: 4;
          stroke-linecap: round;
          stroke-dasharray: 14 12;
          animation: riverFlow 18s linear infinite;
          transition: stroke .5s ease;
        }
        .river-area {
          fill: url(#riverFill);
          transition: opacity .5s ease;
        }
        .river-orbit {
          fill: none;
          stroke: rgba(53,94,75,.16);
          stroke-width: 1;
          stroke-dasharray: 3 10;
          transform-origin: center;
          animation: riverRotate 55s linear infinite;
        }
        .river-pulse {
          fill: ${temperatureColor};
          opacity: .55;
          transform-origin: center;
          animation: riverPulse 3s ease-in-out infinite;
        }
        @keyframes riverFlow { to { stroke-dashoffset: -520; } }
        @keyframes riverRotate { to { transform: rotate(360deg); } }
        @keyframes riverPulse { 50% { opacity: .18; transform: scale(.75); } }
        .living-stage-bottom {
          position: absolute;
          bottom: 28px;
          left: 38px;
          right: 38px;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          gap: 15px;
          font-size: 10px;
          letter-spacing: 1.5px;
          color: #668174;
        }
        .living-timeline {
          margin: 42px 7vw 0;
          padding: 28px 32px;
          border-radius: 22px;
          background: #fffdf7;
          border: 1px solid rgba(53,94,75,.12);
        }
        .living-timeline-heading {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 22px;
        }
        .living-timeline-heading strong {
          font-size: 13px;
          letter-spacing: 1.5px;
        }
        .living-timeline-heading span {
          color: #829287;
          font-size: 12px;
        }
        .living-range {
          width: 100%;
          accent-color: #4e9b91;
          cursor: pointer;
        }
        .living-months {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          gap: 4px;
        }
        .living-months button {
          border: 0;
          background: transparent;
          color: #829287;
          font-size: 11px;
          padding: 7px 4px;
          cursor: pointer;
          border-radius: 8px;
        }
        .living-months button.active {
          color: #fff;
          background: #4e8d7d;
        }
        .living-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 30px 7vw 0;
          flex-wrap: wrap;
        }
        .living-play {
          border: 0;
          background: #355e4b;
          color: white;
          border-radius: 40px;
          padding: 15px 25px;
          font-size: 13px;
          cursor: pointer;
        }
        .living-replay, .living-single {
          border: 1px solid #9eb4a4;
          background: transparent;
          color: #355e4b;
          border-radius: 40px;
          padding: 14px 22px;
          cursor: pointer;
        }
        .living-hint {
          margin-left: auto;
          font-size: 11px;
          color: #829287;
          letter-spacing: 1px;
        }
        .living-facts {
          margin: 70px 7vw;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        .living-fact {
          padding: 25px;
          border-top: 1px solid #b9c9bd;
        }
        .living-fact small {
          color: #789083;
          font-size: 10px;
          letter-spacing: 1.5px;
        }
        .living-fact strong {
          display: block;
          font-size: 30px;
          font-weight: 500;
          margin: 12px 0;
          color: #355e4b;
        }
        .living-fact p {
          color: #78877e;
          font-size: 13px;
          line-height: 1.7;
        }
        .living-source {
          margin: 0 7vw 55px;
          padding-top: 22px;
          border-top: 1px solid #cbd5c9;
          color: #78877e;
          font-size: 12px;
          line-height: 1.8;
        }
        .living-source a { color: #39877e; }
        .living-error {
          margin: 30px 7vw;
          padding: 25px;
          background: #fffdf7;
          border-radius: 16px;
          color: #9a5949;
        }
        @media (max-width: 700px) {
          .living-nav-label { display: none; }
          .living-intro { display: block; padding-top: 45px; }
          .living-intro h1 { letter-spacing: -2px; }
          .living-intro p { max-width: 100%; }
          .living-stage { min-height: 460px; margin: 15px 3vw 0; }
          .living-reading { top: 100px; left: 7%; }
          .living-reading strong { letter-spacing: -4px; }
          .living-stage-top, .living-stage-bottom { left: 20px; right: 20px; }
          .living-stage-bottom { font-size: 8px; }
          .living-timeline { margin: 28px 3vw 0; padding: 20px 15px; }
          .living-months button { font-size: 9px; padding: 6px 2px; }
          .living-controls { margin: 25px 4vw 0; }
          .living-hint { width: 100%; margin-left: 0; }
          .living-facts { margin: 50px 5vw; grid-template-columns: 1fr; gap: 8px; }
          .living-source { margin: 0 5vw 40px; }
        }
      `}</style>

      <header className="living-nav">
        <a className="living-brand" href="#home">✧ अनुवाद</a>
        <span className="living-nav-label">EARTH SYSTEMS / CLIMATE CHANGE</span>
        <button className="living-back" onClick={onBack}>← Back to Anuwaad</button>
      </header>

      <section className="living-intro">
        <div>
          <span className="living-kicker">NASA EARTH OBSERVATIONS / 01</span>
          <h1>Feel the rise.<br /><span>Hear the change.</span></h1>
        </div>
        <p>
          Twelve recent monthly observations. One changing global
          temperature signal. Move through the data and hear each
          reading become sound.
        </p>
      </section>

      {loading && <div className="living-error">Loading NASA observations…</div>}
      {error && <div className="living-error">{error}</div>}

      {!loading && !error && selected && (
        <>
          <section
            className="living-stage"
            style={{
              background: `radial-gradient(ellipse at 75% 75%, ${temperatureColor}35, transparent 48%), linear-gradient(145deg, #e5eee2, #d5e9e4 48%, #f0e6d3)`,
            }}
          >
            <div className="living-stage-top">
              <span>GLOBAL TEMPERATURE ANOMALY</span>
              <span>NASA GISTEMP v4 · MONTHLY</span>
            </div>

            <div className="living-reading">
              <small>SELECTED OBSERVATION / °C</small>
              <strong style={{ color: temperatureColor }}>
                {formatValue(selected.value)}
              </strong>
              <span>{MONTHS[selected.month]} {selected.year}</span>
            </div>

            <div className="living-river">
              <svg viewBox="0 0 1100 430" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="riverFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={temperatureColor} stopOpacity=".42" />
                    <stop offset="100%" stopColor={temperatureColor} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <ellipse className="river-orbit" cx="770" cy="260" rx="350" ry="130" />
                <ellipse className="river-orbit" cx="770" cy="260" rx="270" ry="95" />
                {records.length > 1 && (
                  <>
                    <path className="river-area" d={areaPath} />
                    <path className="river-line" d={riverPath} />
                    {records.map((item, index) => {
                      const x = 30 + (index / Math.max(records.length - 1, 1)) * 1040;
                      const y = 395 -
                        ((item.value - min) / Math.max(max - min, 0.01)) * 350;
                      return (
                        <circle
                          key={`${item.year}-${item.month}`}
                          cx={x}
                          cy={y}
                          r={index === selectedIndex ? 11 : 4}
                          fill={index === selectedIndex ? temperatureColor : "#fffdf7"}
                          stroke={temperatureColor}
                          strokeWidth="2"
                          opacity={index === selectedIndex ? 1 : .55}
                        />
                      );
                    })}
                  </>
                )}
                <circle className="river-pulse" cx="770" cy="260" r={55 + heat * 65} />
              </svg>
            </div>

            <div className="living-stage-bottom">
              <span>1951–1980 BASELINE</span>
              <span>GLOBAL MEAN TEMPERATURE · NOT A LOCAL READING</span>
            </div>
          </section>

          <section className="living-timeline">
            <div className="living-timeline-heading">
              <strong>MOVE THROUGH TIME</strong>
              <span>{selectedIndex + 1} / {records.length} OBSERVATIONS</span>
            </div>

            <input
              className="living-range"
              type="range"
              min="0"
              max={records.length - 1}
              value={selectedIndex}
              onChange={(event) => {
                stopPlayback();
                setSelectedIndex(Number(event.target.value));
              }}
            />

            <div className="living-months">
              {records.map((item, index) => (
                <button
                  key={`${item.year}-${item.month}`}
                  className={selectedIndex === index ? "active" : ""}
                  onClick={() => {
                    stopPlayback();
                    setSelectedIndex(index);
                  }}
                  title={`${MONTHS[item.month]} ${item.year}`}
                >
                  {shortMonths[item.month]}
                </button>
              ))}
            </div>
          </section>

          <div className="living-controls">
            <button className="living-play" onClick={togglePlayback}>
              {isPlaying ? "Ⅱ  Pause journey" : "▶  Play data journey"}
            </button>
            <button className="living-single" onClick={playSelected}>
              ♪ Hear selected month
            </button>
            <button className="living-replay" onClick={replay}>
              ↻ Replay
            </button>
            <span className="living-hint">
              HEADPHONES RECOMMENDED · DATA-DRIVEN SONIFICATION
            </span>
          </div>

          <section className="living-facts">
            <div className="living-fact">
              <small>SELECTED MONTH</small>
              <strong>{MONTHS[selected.month]} {selected.year}</strong>
              <p>The month currently selected on the NASA observation timeline.</p>
            </div>
            <div className="living-fact">
              <small>SELECTED ANOMALY</small>
              <strong>{formatValue(selected.value)}C</strong>
              <p>Difference from the 1951–1980 average, not the absolute air temperature.</p>
            </div>
            <div className="living-fact">
              <small>LATEST AVAILABLE OBSERVATION</small>
              <strong>{formatValue(latest.value)}C</strong>
              <p>{MONTHS[latest.month]} {latest.year} · Latest record in the downloaded file.</p>
            </div>
          </section>
        </>
      )}

      <footer className="living-source">
        <strong>DATA & METHOD</strong><br />
        Source: NASA GISS Surface Temperature Analysis (GISTEMP v4).
        Monthly global temperature anomalies are expressed relative to
        the 1951–1980 average. Anuwaad maps each selected anomaly to
        synthesized sound; this is not a recording of Earth's natural sounds.
        <br />
        <a href="https://data.giss.nasa.gov/gistemp/" target="_blank" rel="noreferrer">
          Explore the official NASA dataset ↗
        </a>
      </footer>
    </main>
  );
}
