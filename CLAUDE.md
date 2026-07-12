# TwinMap · Digital Twin Turístico — Documentación del proyecto

> Contexto para Claude Code y para el equipo. Estado al 2026-07-11.

## Qué es

Prototipo de **gemelo digital turístico** para el reto **TWINMAP** de un hackathon.
Caso piloto: **Barra de Santiago, El Salvador** (humedal RAMSAR, manglar, ecoturismo
comunitario, aves migratorias y tortugas). Centro base: `lat 13.74, lng -90.05`.

Enfoque **"low twin"**: no hay sensores IoT ni ML entrenado. Se combinan pocas fuentes de
datos abiertas y se simulan datos con reglas realistas cuando no hay API real. El **mapa es
el core obligatorio**; encima se agregan capas de diferenciación (rutas, dashboard, etc.).

## Arquitectura (3 piezas)

```
┌─────────────────┐        ┌──────────────────────┐        ┌─────────────────────┐
│  FRONTEND        │  HTTP  │  BACKEND (Express)    │  HTTP  │  n8n (orquestación)  │
│  index.html      │───────▶│  server.js :3001      │───────▶│  webhook digital twin│
│  (estático)      │        │  /api/routes/calculate│        │  + fallback Mapbox   │
└─────────────────┘        └──────────────────────┘        └─────────────────────┘
        │                            
        │ carga cache local          
        ▼                            
┌─────────────────┐   generado por   ┌─────────────────┐
│  data/*.geojson │◀─────────────────│  scripts/ (Node/ │
│  data/*.json    │   (correr 1 vez) │  Python fetchers)│
└─────────────────┘                  └─────────────────┘
```

- **Frontend** (`index.html`): mapa Mapbox + capas + UI. Sitio estático, sin build.
- **Backend** (`server.js` + `routes/` + `controllers/`): API Express que calcula rutas
  inteligentes. Llama al webhook de **n8n**; si falla, usa **Mapbox Directions** como fallback.
- **Scripts** (`scripts/`): traen datos de APIs abiertas y los cachean en `data/`. Se corren
  a mano, no en producción.

⚠️ **Estado de integración:** el frontend **todavía NO está conectado** al backend ni a los
datos nuevos (biodiversity/weather). Esa es la tarea pendiente principal (ver Roadmap).

## Stack

| Área | Tecnología | Key / env |
|---|---|---|
| Mapa | Mapbox GL JS **v3.17.0** (satélite + terreno/edificios 3D) | Token en `config.js` |
| Buscador | Plugin `mapbox-gl-geocoder` v5.0.3 | mismo token |
| Backend | **Express 5** + axios + dotenv (Node, ESM) | `.env` |
| Rutas | n8n webhook → fallback **Mapbox Directions API** | `N8N_ROUTE_WEBHOOK_URL`, `MAPBOX_ACCESS_TOKEN` |
| POIs | Overpass API (OpenStreetMap) | sin key |
| Límites país/deptos | geoBoundaries API | sin key |
| Biodiversidad | **GBIF** API | sin key |
| Clima | **Open-Meteo** API | sin key |
| Tendencias | Google Trends vía **pytrends** (Python, no oficial) | sin key |
| Hosting | Frontend estático + backend Node | — |

## Flujo de carpetas

```
twinmap/
│  ── FRONTEND ──
├── index.html              ← Mapa + capas + UI (un solo archivo, ~475 líneas)
├── config.js               ← Token Mapbox público (navegador).  ⚠️ NO se sube (.gitignore)
├── config.example.js       ← Plantilla del config
│
│  ── BACKEND (Express API) ──
├── server.js               ← Servidor Express, puerto 3001, monta /api/routes y /health
├── routes/
│   └── route.js            ← Define POST /api/routes/calculate
├── controllers/
│   └── route.controller.js ← calculateSmartRoute: llama n8n → fallback Mapbox Directions
├── package.json            ← deps: express, axios, dotenv. Scripts: start / dev (--watch)
├── .env                    ← Secretos del backend.  ⚠️ NO se sube (crear desde .env.example)
├── .env.example            ← Plantilla: N8N_ROUTE_WEBHOOK_URL, MAPBOX_ACCESS_TOKEN, PORT
│
│  ── DATOS (scripts → cache) ──
├── scripts/
│   ├── fetch-pois.mjs          → data/pois.geojson        (3102 POIs de El Salvador, Overpass)
│   ├── fetch-departments.mjs   → data/departments.geojson (14 deptos con color, geoBoundaries)
│   ├── fetch-mask.mjs          → data/mask.geojson + elsalvador.geojson (modo isla)
│   ├── fetch-biodiversity.mjs  → data/biodiversity.geojson (avistamientos GBIF reales)
│   ├── fetch-weather.mjs       → data/weather.json         (clima Open-Meteo, actual+7 días)
│   └── fetch-trends.py         → data/trends.json          (Google Trends, requiere pytrends)
├── requirements.txt        ← Dependencias Python (pytrends) para fetch-trends.py
├── data/                   ← Cache local (el frontend carga de aquí)
│   ├── pois.geojson        (576K)
│   ├── departments.geojson (984K)
│   ├── mask.geojson        (8K)
│   ├── elsalvador.geojson  (272K)
│   ├── biodiversity.geojson(64K)  ← NUEVO, datos reales GBIF
│   └── weather.json        (1K)   ← NUEVO
│
│  ── DOCS / CONFIG ──
├── CLAUDE.md               ← Este archivo
├── README.md               ← Setup y deploy
├── .gitignore              ← Ignora config.js, .env, node_modules
└── .claude/launch.json     ← Server local del frontend (npx serve, puerto 3000)
```

## Cómo correr

**Frontend** (mapa):
```bash
# token ya en config.js
npx serve -l 3000 .        # abrir http://localhost:3000
```

**Backend** (API de rutas):
```bash
npm install                # ya hecho (express, axios, dotenv)
cp .env.example .env       # y editar: pegar MAPBOX_ACCESS_TOKEN y el webhook n8n
npm run dev                # server en http://localhost:3001 (--watch)
# probar:  POST http://localhost:3001/api/routes/calculate
#          body: { "origin":{"lat":13.7,"lng":-89.2}, "destination":{"lat":13.5,"lng":-89.3} }
```

**Refrescar datos** (opcional):
```bash
node scripts/fetch-pois.mjs
node scripts/fetch-biodiversity.mjs --lat 13.74 --lng -90.05 --radius 25
node scripts/fetch-weather.mjs --lat 13.74 --lng -90.05
pip install -r requirements.txt && python scripts/fetch-trends.py --term "turismo El Salvador" --geo SV
```

## API del backend

`POST /api/routes/calculate`
- Body: `{ origin:{lat,lng}, destination:{lat,lng}, departureTime? (ISO) }`
- Flujo: intenta `N8N_ROUTE_WEBHOOK_URL` (el "cerebro" del gemelo en n8n). Si n8n no responde
  en 4s, cae al **fallback de Mapbox Directions** (conducción). Responde `{success, source, data}`
  donde `source` = `n8n-digital-twin` o `mapbox-fallback`.
- `GET /health` → `{ ok: true }`

## Funcionalidades del frontend (index.html)

Dentro de `boot()` → `map.on("style.load")`:

1. **Mapa base 3D** — `satellite-streets-v12`, terreno DEM, niebla, pitch 60°.
2. **Edificios 3D** — `fill-extrusion` (capa `3d-buildings`). Barra es rural: casi no hay.
3. **POIs con clustering** — `loadPOIs()` desde `data/pois.geojson`, colores por categoría + leyenda.
4. **Departamentos** — `addDepartments()` choropleth de 14 colores, visible al alejar.
5. **Modo Isla** — `toggleIsland()`: máscara océano + oculta etiquetas base → El Salvador como isla.
6. **Buscador global** — geocoder Mapbox en `#search`.
7. **Ocupación** — `addOccupancyHeat()` heatmap simulado.
8. **Biodiversidad** — `addBiodiversity()` ⚠️ AÚN HARDCODED (no usa `data/biodiversity.geojson`).

Hooks de depuración: `window._twinmap`.

## Gotchas aprendidos

- **Estilo Mapbox "Standard"/"standard-satellite" NO carga** (imports se cuelgan). Usar
  `satellite-streets-v12` + edificios 3D manuales con `fill-extrusion`.
- **Overpass da HTTP 406** con el User-Agent default de curl/node. Mandar `User-Agent` propio.
- **Máscara isla no pintaba** porque el contorno tiene 11168 puntos y earcut falla. Simplificar
  con Douglas-Peucker a ~313 puntos (`fetch-mask.mjs`).
- **El Browser pane de Claude no compositea WebGL de Mapbox**: screenshots se cuelgan,
  `queryRenderedFeatures` da 0. Verificar por estado JS, no por captura.

## Roadmap (lo que falta)

- [ ] **Conectar frontend ↔ backend**: que el mapa llame a `/api/routes/calculate` para las rutas.
- [ ] **Conectar biodiversidad real**: que `addBiodiversity()` cargue `data/biodiversity.geojson`
      (GBIF) en vez de los 3 puntos hardcoded.
- [ ] **Dashboard "signos vitales"** en el mapa usando `data/weather.json` (clima) + marea
      (StormGlass, key gratis pendiente). La marea es clave: el acceso a la Barra depende de ella.
- [ ] **Montar el flujo n8n** detrás del webhook (scoring de 3 rutas + explicación LLM vía OpenRouter).
- [ ] **Trends** (`data/trends.json`) para la predicción de afluencia.
- [ ] **Deploy**: frontend estático (Vercel) + backend Node (Railway/Render). Restringir token
      público por URL en Mapbox.
```

## APIs: cuáles necesitan key

- **Sin key:** Mapbox (1 token cubre mapa+geocoder+directions), Overpass, geoBoundaries,
  Open-Meteo, GBIF, Google Trends (vía pytrends, no oficial).
- **Key gratis pendiente:** StormGlass (marea), eBird (aves), OpenRouter (LLM para explicaciones).
- **Solo pitch (no son APIs REST):** DIGESTYC (censo), MITUR (turismo) — "fuente de verdad futura".
