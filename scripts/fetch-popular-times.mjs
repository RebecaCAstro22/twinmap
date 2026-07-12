// Baja "Popular Times" (intensidad de gente) del Centro Histórico y cachea data/crowds.geojson.
// Usa la misma librería que el backend (lib/popular-times.js), así no hay código duplicado.
//
// Uso:  SERPAPI_KEY=tu_key node scripts/fetch-popular-times.mjs
// Free tier SerpAPI: 100 búsquedas/mes. Cada lugar = 1 búsqueda.

import { mkdirSync, writeFileSync } from "node:fs";
import { fetchCrowds } from "../lib/popular-times.js";

const KEY = process.env.SERPAPI_KEY;
if (!KEY) {
  console.error("✗ Falta la key.  Corre:  SERPAPI_KEY=tu_key node scripts/fetch-popular-times.mjs");
  process.exit(1);
}

console.log("Bajando Popular Times del Centro Histórico…");
const fc = await fetchCrowds(KEY);

for (const f of fc.features) {
  const p = f.properties;
  console.log(
    `  ${p.busyness != null ? "✓" : "·"} ${p.name.padEnd(42)} ` +
    `${p.busyness != null ? String(p.busyness).padStart(3) + "%" : "s/dato"}` +
    `${p.is_live ? "  EN VIVO: " + p.info : ""}`
  );
}

mkdirSync("data", { recursive: true });
writeFileSync("data/crowds.geojson", JSON.stringify(fc));
const withData = fc.features.filter((f) => f.properties.busyness != null).length;
console.log(`\n✓ Guardado data/crowds.geojson · ${withData}/${fc.features.length} lugares con dato de intensidad`);
