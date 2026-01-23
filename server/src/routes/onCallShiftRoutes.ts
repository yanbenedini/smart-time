import { Router } from "express";
import { OnCallShiftController } from "../controllers/OnCallShiftController";

const router = Router();

router.get("/", OnCallShiftController.list);
router.post("/", OnCallShiftController.create);
router.delete("/:id", OnCallShiftController.delete);

export default router;
