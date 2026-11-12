
import { useEffect, useState } from "react";

export default function OceanData({ onData }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchOceanData() {
    try {
      setLoading(true);
      setError("");

      // Arabian Sea demonstration coordinates
      const url =
        "https://marine-api.open-meteo.com/v1/marine" +
        "?latitude=15&longitude=72.5" +
        "&current=wave_height,wave_direction,wave_period,sea_surface_temperature,ocean_current_velocity" +
        "&timezone=auto";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Ocean API request failed");
      }

      const result = await response.json();
      setData(result.current);
      onData?.(result.current);
    } catch (err) {
      setError("Could not load ocean measurements. Please retry.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOceanData();

    const timer = setInterval(fetchOceanData, 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="ocean-data-panel">
      <p className="ocean-eyebrow">NASA SATELLITE + MARINE DATA EXPERIENCE</p>
      <h2>Ocean conditions</h2>
      <p>Arabian Sea · 15°N, 72.5°E</p>

      {loading && <p>Loading ocean measurements...</p>}
      {error && <p>{error}</p>}

      {data && (
        <div className="ocean-data-grid">
          <div className="ocean-data-card">
            <span>WAVE HEIGHT</span>
            <strong>{data.wave_height ?? "--"} m</strong>
          </div>

          <div className="ocean-data-card">
            <span>WAVE PERIOD</span>
            <strong>{data.wave_period ?? "--"} s</strong>
          </div>

          <div className="ocean-data-card">
            <span>SEA SURFACE TEMP.</span>
            <strong>{data.sea_surface_temperature ?? "--"} °C</strong>
          </div>

          <div className="ocean-data-card">
            <span>OCEAN CURRENT</span>
            <strong>{data.ocean_current_velocity ?? "--"} km/h</strong>
          </div>
        </div>
      )}

      <button onClick={fetchOceanData}>Refresh ocean data</button>
    </div>
  );
}
