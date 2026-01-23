import { Router } from "express";
import { AppDataSource } from "../data-source";
import { SystemLog } from "../entity/SystemLog";

const router = Router();

router.get("/", async (req, res) => {
    const logRepo = AppDataSource.getRepository(SystemLog);
    const logs = await logRepo.find({
        order: { createdAt: "DESC" },
        take: 100,
    });
    res.json(logs);
});

router.post("/", async (req, res) => {
    const logRepo = AppDataSource.getRepository(SystemLog);
    const log = logRepo.create(req.body);
    const result = await logRepo.save(log);
    res.json(result);
});

export default router;
