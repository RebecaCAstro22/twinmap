// Comprobador de Foursquare: prueba las DOS APIs (legacy y nueva) con tu key
// y te dice cuál funciona y con qué config exacta configurar n8n.
//
// Uso:
//   FSQ_KEY=tu_key node scripts/test-foursquare.mjs
//   FSQ_KEY=tu_key node scripts/test-foursquare.mjs --ne 13.80,-89.10 --sw 13.60,-89.35

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const KEY = process.env.FSQ_KEY;
if (!KEY) {
  console.error("✗ Falta la key.  Corre:  FSQ_KEY=tu_key node scripts/test-foursquare.mjs");
  process.exit(1);
}

const ne = arg("ne", "13.80,-89.10"); // esquina noreste "lat,lng" (San Salvador aprox)
const sw = arg("sw", "13.60,-89.35"); // esquina suroeste
const params = new URLSearchParams({ ne, sw, limit: "10", fields: "name,popularity,location" }).toString();

async function probe(label, url, headers) {
  process.stdout.write(`\n── ${label}\n   ${url.split("?")[0]}\n`);
  try {
    const res = await fetch(url, { headers });
    const body = await res.text();
    console.log(`   [HTTP ${res.status}]`);
    if (res.ok) {
      const n = (JSON.parse(body).results || []).length;
      console.log(`   ✓ FUNCIONA — devolvió ${n} lugares`);
      return true;
    }
    console.log(`   ✗ ${body.slice(0, 160)}`);
  } catch (e) {
    console.log(`   ✗ error de red: ${e.message}`);
  }
  return false;
}

console.log("Probando tu key contra ambas APIs de Foursquare…");

// 1) API legacy
const legacyOk = await probe(
  "LEGACY  (api.foursquare.com/v3)",
  `https://api.foursquare.com/v3/places/search?${params}`,
  { Authorization: KEY, Accept: "application/json" }
);

// 2) API nueva
const newOk = await probe(
  "NUEVA   (places-api.foursquare.com)",
  `https://places-api.foursquare.com/places/search?${params}`,
  { Authorization: `Bearer ${KEY}`, "X-Places-Api-Version": "2025-06-17", Accept: "application/json" }
);

console.log("\n══════════ RESULTADO ══════════");
if (legacyOk) {
  console.log("Tu key es LEGACY. En n8n usa:");
  console.log("  URL:  https://api.foursquare.com/v3/places/search");
  console.log("  Credential 'Header Auth' →  Name: Authorization   Value: TU_KEY");
} else if (newOk) {
  console.log("Tu key es del NUEVO servicio. En n8n usa:");
  console.log("  URL:  https://places-api.foursquare.com/places/search");
  console.log("  Credential 'Custom Auth' con:");
  console.log('  {"headers":{"Authorization":"Bearer TU_KEY","X-Places-Api-Version":"2025-06-17"}}');
} else {
  console.log("Ninguna funcionó → la key es inválida o está mal copiada (revisa espacios).");
}
