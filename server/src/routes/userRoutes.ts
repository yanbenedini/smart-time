import { Router } from "express";
import { UserController } from "../controllers/UserController";

const router = Router();

router.get("/", UserController.list);
router.post("/", UserController.create);
router.post("/login", UserController.login);
router.post("/change-password", UserController.changePassword);
router.put("/:id", UserController.update);
router.delete("/:id", UserController.delete);

export default router;
