import { Router } from "express";
import { EmployeeController } from "../controllers/EmployeeController";
import { basicAuth } from "../middlewares/authMiddleware";

const router = Router();

router.use(basicAuth);

router.get("/", EmployeeController.list);
router.post("/", EmployeeController.create);
router.put("/:id", EmployeeController.update);
router.delete("/:id", EmployeeController.delete);

export default router;
