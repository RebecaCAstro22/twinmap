# Arquitectura

## Vista general

La versión actual de Digital Map es un frontend estático. No hay backend, base de datos, APIs externas ni servicios de autenticación.

```txt
Usuario
  ↓
Navegador
  ↓
Servidor estático local
  ↓
index.html
  ├── src/css/styles.css
  └── src/js/script.js
```

## Componentes

### `index.html`

Contiene la estructura de todas las pantallas:

- Landing page.
- Inicio interno.
- Explorar mapa.
- Mi bitácora.
- Guardados.
- Números de emergencia.
- Configuración.
- Acerca de.

### `src/css/styles.css`

Contiene los estilos del mockup:

- Layout general.
- Topbar.
- Landing.
- Panel de inicio.
- Mapa simulado.
- Capas.
- Filtros.
- Tarjetas de recomendaciones.
- Responsive básico.

### `src/js/script.js`

Contiene la lógica mínima de navegación:

- Detecta botones con `data-view`.
- Muestra la sección correspondiente con `data-panel`.
- Activa el estado visual de la opción de navegación.
- Oculta la topbar en la landing y la muestra dentro de la app.

## Flujo de navegación

```txt
Landing
  ↓ Comenzar
Inicio interno
  ├── Explorar mapa
  ├── Mi bitácora
  ├── Guardados
  ├── Números de emergencia
  └── Configuración
```

## Integraciones futuras sugeridas

- API de mapas para renderizar ubicaciones reales.
- Backend para lugares, usuarios, bitácora y guardados.
- Servicio de autenticación.
- Base de datos para persistencia.
- Motor de recomendaciones o integración con IA.
