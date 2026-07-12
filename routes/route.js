import { Router } from "express";
import { calculateSmartRoute } from "../controllers/route.controller.js";

const router = Router();

router.post("/calculate", calculateSmartRoute);

export default router;
