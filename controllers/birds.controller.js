import { readFile, writeFile, mkdir } from "node:fs/promises";

const CACHE_PATH = "data/birds.geojson";
const CACHE_MINUTES = Number(process.env.BIRDS_CACHE_MINUTES || 60);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
async function readCache() { try { return JSON.parse(await readFile(CACHE_PATH, "utf8")); } catch { return null; } }
function ageMinutes(cache) { const t = cache?.metadata?.fetched_at; return t ? (Date.now() - new Date(t).getTime()) / 60000 : Infinity; }
function score(observation) {
  const date = new Date(observation.obsDt); const days = Number.isNaN(date.getTime()) ? 30 : (Date.now() - date.getTime()) / 86400000;
  const freshness = 35 * (1 - clamp(days, 0, 30) / 30);
  const abundance = 40 * clamp(Math.log10((observation.howMany || 1) + 1) / 2, 0, 1);
  return Math.round(clamp(freshness + abundance + (observation.obsReviewed ? 15 : 6) + (observation.obsValid ? 10 : 0), 0, 100));
}
const level = (value) => value >= 70 ? "alta" : value >= 40 ? "media" : "baja";

export const getBirds = async (req, res) => {
  const force = req.query.refresh === "1" || req.query.refresh === "true";
  const back = clamp(Number(req.query.back || 30), 1, 30);
  const cache = await readCache();
  if (!force && cache && ageMinutes(cache) < CACHE_MINUTES) return res.json({ success: true, source: "cache", age_min: Math.round(ageMinutes(cache)), data: cache });
  if (!process.env.EBIRD_API_KEY) return res.status(500).json({ success: false, error: "Falta EBIRD_API_KEY." });
  try {
    const url = new URL("https://api.ebird.org/v2/data/obs/SV/recent");
    url.search = new URLSearchParams({ back: String(back), hotspot: "true", maxResults: "5000", sppLocale: "es" }).toString();
    const response = await fetch(url, { headers: { "X-eBirdApiToken": process.env.EBIRD_API_KEY } });
    const observations = await response.json();
    if (!response.ok) throw new Error(observations?.message || "eBird HTTP " + response.status);
    const features = observations.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng)).map((item) => {
      const prediction = score(item);
      return { type: "Feature", geometry: { type: "Point", coordinates: [item.lng, item.lat] }, properties: { name: item.comName || item.sciName, scientific_name: item.sciName || "", observed_at: item.obsDt || "", quantity: item.howMany || null, location: item.locName || "", reviewed: Boolean(item.obsReviewed), prediction_score: prediction, prediction_level: level(prediction), source: "eBird" } };
    });
    const data = { type: "FeatureCollection", metadata: { source: "eBird", fetched_at: new Date().toISOString(), days_back: back, prediction: "Probabilidad basada en recencia, cantidad y validaci?n; no es una ruta GPS." }, features };
    await mkdir("data", { recursive: true }); await writeFile(CACHE_PATH, JSON.stringify(data));
    return res.json({ success: true, source: "ebird", observations: features.length, data });
  } catch (error) {
    if (cache) return res.json({ success: true, source: "cache-fallback", warning: error.message, data: cache });
    return res.status(502).json({ success: false, error: error.message });
  }
};
