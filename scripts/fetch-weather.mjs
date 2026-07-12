// Cachea el clima actual y el pronóstico de Open-Meteo. No necesita API key.
// Uso: node scripts/fetch-weather.mjs --lat 13.74 --lng -90.05 --name "Mi destino"
import { mkdirSync, writeFileSync } from "node:fs";

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};
const lat = Number(arg("lat", "13.74"));
const lng = Number(arg("lng", "-90.05"));
const name = arg("name", "Destino seleccionado");
if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("--lat y --lng deben ser números.");

const url = new URL("https://api.open-meteo.com/v1/forecast");
url.search = new URLSearchParams({
  latitude: String(lat), longitude: String(lng), timezone: "auto",
  current: "temperature_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m",
  daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  forecast_days: "7",
}).toString();
const response = await fetch(url);
if (!response.ok) throw new Error(`Open-Meteo respondió HTTP ${response.status}`);
const forecast = await response.json();
const output = { source: "Open-Meteo", fetched_at: new Date().toISOString(), destination: { name, lat, lng }, current: forecast.current, daily: forecast.daily };
mkdirSync("data", { recursive: true });
writeFileSync("data/weather.json", JSON.stringify(output, null, 2));
console.log(`✓ Clima guardado en data/weather.json para ${name}`);
