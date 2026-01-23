import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { basicAuth } from "../middlewares/authMiddleware";

const router = Router();

// Public Routes
router.post("/login", UserController.login);

// Protected Routes
router.use(basicAuth);

router.get("/", UserController.list);
router.post("/", UserController.create);
router.post("/change-password", UserController.changePassword);
router.put("/:id", UserController.update);
router.delete("/:id", UserController.delete);

export default router;
