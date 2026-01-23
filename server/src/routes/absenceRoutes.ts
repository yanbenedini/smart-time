import { Router } from "express";
import { AbsenceController } from "../controllers/AbsenceController";
import { basicAuth } from "../middlewares/authMiddleware";

const router = Router();

router.use(basicAuth);

router.get("/", AbsenceController.list);
router.post("/", AbsenceController.create);
router.put("/:id", AbsenceController.update);
router.delete("/:id", AbsenceController.delete);

export default router;
