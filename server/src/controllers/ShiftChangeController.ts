import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { ShiftChange } from "../entity/ShiftChange";
import { registerLog, getUserName } from "../utils/logger";

export class ShiftChangeController {
    static async list(req: Request, res: Response) {
        const shiftChangeRepo = AppDataSource.getRepository(ShiftChange);
        const changes = await shiftChangeRepo.find({
            order: { startDate: "DESC" },
        });
        return res.json(changes);
    }

    static async create(req: Request, res: Response) {
        const shiftChangeRepo = AppDataSource.getRepository(ShiftChange);
        try {
            if (req.body.id === "") delete req.body.id;

            const change = shiftChangeRepo.create(req.body as ShiftChange);
            const result = await shiftChangeRepo.save(change);

            await registerLog(
                "CREATE",
                `Troca de turno criada: ${result.reason}`,
                getUserName(req)
            );

            return res.json(result);
        } catch (error) {
            return res.status(500).json({ error: "Erro ao criar troca" });
        }
    }

    static async delete(req: Request, res: Response) {
        const shiftChangeRepo = AppDataSource.getRepository(ShiftChange);
        await shiftChangeRepo.delete(req.params.id);
        await registerLog(
            "DELETE",
            `Troca de turno removida ID: ${req.params.id}`,
            getUserName(req)
        );
        return res.json("Deleted");
    }
}
