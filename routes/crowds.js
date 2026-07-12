import { Router } from "express";
import { getCrowds } from "../controllers/crowds.controller.js";

const router = Router();

// GET /api/crowds  → intensidad de gente por lugar (radar). ?refresh=1 fuerza actualizar.
router.get("/", getCrowds);

export default router;
