import { Router } from "express";
import { EmployeeController } from "../controllers/EmployeeController";

const router = Router();

router.get("/", EmployeeController.list);
router.post("/", EmployeeController.create);
router.put("/:id", EmployeeController.update);
router.delete("/:id", EmployeeController.delete);

export default router;
