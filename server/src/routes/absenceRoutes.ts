import { Router } from "express";
import { AbsenceController } from "../controllers/AbsenceController";

const router = Router();

router.get("/", AbsenceController.list);
router.post("/", AbsenceController.create);
router.put("/:id", AbsenceController.update);
router.delete("/:id", AbsenceController.delete);

export default router;
