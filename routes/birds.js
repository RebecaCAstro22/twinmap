import { Router } from "express";
import { getBirds } from "../controllers/birds.controller.js";

const router = Router();
router.get("/", getBirds);
export default router;
