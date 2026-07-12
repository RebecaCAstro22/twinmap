import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import routeRouter from "./routes/route.js";
import crowdsRouter from "./routes/crowds.js";
import birdsRouter from "./routes/birds.js";
import assistantRouter from "./routes/assistant.js";
import trafficRouter from "./routes/traffic.js";
import configRouter from "./routes/config.js";
import newsRouter from "./routes/news.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3001;
const frontendDir = path.join(__dirname, "frontend");

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: "100kb" }));
app.use("/data", express.static(path.join(__dirname, "data")));
app.use("/api/routes", routeRouter);
app.use("/api/crowds", crowdsRouter);
app.use("/api/birds", birdsRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/traffic", trafficRouter);
app.use("/api/config", configRouter);
app.use("/api/news", newsRouter);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    tomtom: Boolean(process.env.TOMTOM_API_KEY || process.env.TOMTOM_KEY),
  });
});

app.get("/api/config", (_req, res) => {
  const token = process.env.MAPBOX_ACCESS_TOKEN || "";
  res.json({
    mapboxToken: token.startsWith("pk.") ? token : "",
    apiBaseUrl: `http://localhost:${port}`,
  });
});


// Railway entrega la aplicación completa desde el mismo proceso Express.
app.get(["/", "/frontend", "/frontend/"], (_req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});
app.get(["/map", "/index.html"], (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.use(express.static(frontendDir, { index: false }));
app.use(express.static(__dirname, { index: false }));

app.listen(port, () => {
  console.log(`Mirus API escuchando en http://localhost:${port}`);
});
