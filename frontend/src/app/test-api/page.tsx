"use client";

import { useState } from "react";

type WeatherForecast = {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary: string;
};

export default function TestApi() {
  const [data, setData] = useState<WeatherForecast[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchWeather() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/WeatherForecast");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Backend Communication Test</h1>
      <p className="mb-4 text-zinc-500">
        Calls <code>/api/WeatherForecast</code> → proxied to{" "}
        <code>http://localhost:5281/WeatherForecast</code>
      </p>
      <button
        onClick={fetchWeather}
        disabled={loading}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        {loading ? "Loading…" : "Fetch from Backend"}
      </button>

      {error && (
        <p className="mt-4 text-red-600 font-mono text-sm">{error}</p>
      )}

      {data && (
        <table className="mt-6 border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-100">
              <th className="border px-3 py-1">Date</th>
              <th className="border px-3 py-1">°C</th>
              <th className="border px-3 py-1">°F</th>
              <th className="border px-3 py-1">Summary</th>
            </tr>
          </thead>
          <tbody>
            {data.map((w) => (
              <tr key={w.date}>
                <td className="border px-3 py-1">{w.date}</td>
                <td className="border px-3 py-1">{w.temperatureC}</td>
                <td className="border px-3 py-1">{w.temperatureF}</td>
                <td className="border px-3 py-1">{w.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
