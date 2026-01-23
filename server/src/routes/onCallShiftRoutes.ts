import { Router } from "express";
import { OnCallShiftController } from "../controllers/OnCallShiftController";
import { basicAuth } from "../middlewares/authMiddleware";

const router = Router();

router.use(basicAuth);

router.get("/", OnCallShiftController.list);
router.post("/", OnCallShiftController.create);
router.delete("/:id", OnCallShiftController.delete);

export default router;
