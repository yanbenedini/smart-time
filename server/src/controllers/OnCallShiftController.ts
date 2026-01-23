import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { OnCallShift } from "../entity/OnCallShift";
import { registerLog, getUserName } from "../utils/logger";

export class OnCallShiftController {
    static async list(req: Request, res: Response) {
        const onCallRepo = AppDataSource.getRepository(OnCallShift);
        const shifts = await onCallRepo.find({ order: { date: "DESC" } });
        return res.json(shifts);
    }

    static async create(req: Request, res: Response) {
        const onCallRepo = AppDataSource.getRepository(OnCallShift);
        try {
            if (req.body.id === "") delete req.body.id;

            const shift = onCallRepo.create(req.body as OnCallShift);
            const result = await onCallRepo.save(shift);

            await registerLog(
                "CREATE",
                `Plantão criado para data: ${result.date}`,
                getUserName(req)
            );

            return res.json(result);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Erro ao criar sobreaviso" });
        }
    }

    static async delete(req: Request, res: Response) {
        const onCallRepo = AppDataSource.getRepository(OnCallShift);
        await onCallRepo.delete(req.params.id);
        await registerLog(
            "DELETE",
            `Plantão removido ID: ${req.params.id}`,
            getUserName(req)
        );
        return res.json("Deleted");
    }
}
