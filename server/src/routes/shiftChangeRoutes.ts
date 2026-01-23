import { Router } from "express";
import { ShiftChangeController } from "../controllers/ShiftChangeController";

const router = Router();

router.get("/", ShiftChangeController.list);
router.post("/", ShiftChangeController.create);
router.delete("/:id", ShiftChangeController.delete);

export default router;
