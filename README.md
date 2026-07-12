# TwinMap · Digital Twin Turístico

Mapa base (core) del gemelo digital turístico de **Barra de Santiago, El Salvador**.
Mapbox GL JS + capas activables: edificios/terreno 3D, POIs en vivo (OpenStreetMap),
heatmap de afluencia simulada y zonas de biodiversidad.

## 1. Configurar el token

1. Crea cuenta gratis en https://account.mapbox.com y copia tu **Default public token** (`pk...`).
2. Pega el token en `config.js` (ya existe; no se sube a git).

## 2. Correr en local

Necesita un servidor (no abrir el `.html` directo, o `fetch` de Overpass falla por CORS/file://):

```bash
npx serve .        # o:  python -m http.server 8000
```

Abre http://localhost:3000 (o el puerto que indique).

## 3. Desplegar (elige uno)

- **Vercel** (recomendado, 2 min): `npm i -g vercel` → `vercel` en esta carpeta. Sitio estático, deploy instantáneo.
- **Netlify**: arrastra la carpeta a https://app.netlify.com/drop
- **GitHub Pages**: sube el repo → Settings → Pages → deploy desde `main` / raíz.

> Nota de seguridad: el token público de Mapbox queda visible en el frontend (es normal).
> En producción, restríngelo por **URL (referrer)** desde el dashboard de Mapbox para que
> solo funcione en tu dominio de deploy.

## Estructura

```
index.html          Mapa + panel de capas (todo el frontend)
config.js           Tu token + centro/zoom (NO se sube a git)
config.example.js   Plantilla del config
```

## Próximos pasos del gemelo (roadmap)

- [ ] Dashboard "signos vitales" (clima Open-Meteo, mareas StormGlass, afluencia)
- [ ] Asistente conversacional (OpenRouter) que interpreta las capas
- [ ] Simulador de rutas personalizadas (n8n: Overpass + Open-Meteo + scoring por pesos)
- [ ] Pipeline de predicción de afluencia (Firecrawl noticias + LLM razonando)
