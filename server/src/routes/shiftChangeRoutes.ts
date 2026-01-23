import { Router } from "express";
import { ShiftChangeController } from "../controllers/ShiftChangeController";
import { basicAuth } from "../middlewares/authMiddleware";

const router = Router();

router.use(basicAuth);

router.get("/", ShiftChangeController.list);
router.post("/", ShiftChangeController.create);
router.delete("/:id", ShiftChangeController.delete);

export default router;
