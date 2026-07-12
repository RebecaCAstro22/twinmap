import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fetchCrowds } from "../lib/popular-times.js";

const CACHE_PATH = "data/crowds.geojson";
const CACHE_MINUTES = Number(process.env.CROWDS_CACHE_MINUTES || 30);

async function readCache() {
  try { return JSON.parse(await readFile(CACHE_PATH, "utf8")); } catch { return null; }
}

function ageMinutes(cache) {
  const t = cache?.metadata?.fetched_at;
  if (!t) return Infinity;
  return (Date.now() - new Date(t).getTime()) / 60000;
}

// GET /api/crowds        → sirve caché si es fresca; si no, refresca desde SerpAPI
// GET /api/crowds?refresh=1 → fuerza refresco (consume 1 búsqueda por lugar)
export const getCrowds = async (req, res) => {
  const force = req.query.refresh === "1" || req.query.refresh === "true";
  const cache = await readCache();

  // Servir caché si está fresca y no se fuerza
  if (!force && cache && ageMinutes(cache) < CACHE_MINUTES) {
    return res.json({ success: true, source: "cache", age_min: Math.round(ageMinutes(cache)), data: cache });
  }

  // Refrescar desde SerpAPI
  const key = process.env.SERPAPI_KEY;
  if (!key) {
    if (cache) return res.json({ success: true, source: "cache-stale", warning: "Falta SERPAPI_KEY; sirviendo caché vieja.", data: cache });
    return res.status(500).json({ success: false, error: "Falta SERPAPI_KEY y no hay caché." });
  }

  try {
    const fresh = await fetchCrowds(key);
    await mkdir("data", { recursive: true });
    await writeFile(CACHE_PATH, JSON.stringify(fresh));
    const withData = fresh.features.filter((f) => f.properties.busyness != null).length;
    return res.json({ success: true, source: "serpapi", places_with_data: withData, data: fresh });
  } catch (e) {
    if (cache) return res.json({ success: true, source: "cache-fallback", warning: e.message, data: cache });
    return res.status(502).json({ success: false, error: e.message });
  }
};
