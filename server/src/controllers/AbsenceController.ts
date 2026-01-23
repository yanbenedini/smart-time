import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Absence } from "../entity/Absence";
import { Employee } from "../entity/Employee";
import { registerLog, getUserName } from "../utils/logger";

export class AbsenceController {
    static async list(req: Request, res: Response) {
        const absenceRepo = AppDataSource.getRepository(Absence);
        const absences = await absenceRepo.find({ order: { date: "DESC" } });
        return res.json(absences);
    }

    static async create(req: Request, res: Response) {
        const absenceRepo = AppDataSource.getRepository(Absence);
        try {
            if (req.body.id === "") delete req.body.id;

            const absence = absenceRepo.create(req.body as Absence);
            const result = await absenceRepo.save(absence);

            await registerLog(
                "CREATE",
                `Ausência registrada: ${result.reason}`,
                getUserName(req)
            );

            return res.json(result);
        } catch (error) {
            return res.status(500).json({ error: "Erro ao criar ausência" });
        }
    }

    static async update(req: Request, res: Response) {
        const absenceRepo = AppDataSource.getRepository(Absence);
        const employeeRepo = AppDataSource.getRepository(Employee);
        const absence = await absenceRepo.findOneBy({ id: req.params.id });

        if (absence) {
            absenceRepo.merge(absence, req.body);
            const result = await absenceRepo.save(absence);

            let employeeName = "Funcionário Desconhecido";
            if (result.employeeId) {
                const emp = await employeeRepo.findOneBy({ id: result.employeeId });
                if (emp) {
                    employeeName = `${emp.firstName} ${emp.lastName}`;
                }
            }

            await registerLog(
                "UPDATE",
                `Ausência atualizada para: ${employeeName} - Motivo: ${result.reason}`,
                getUserName(req)
            );

            return res.json(result);
        } else {
            return res.status(404).send("Absence not found");
        }
    }

    static async delete(req: Request, res: Response) {
        const absenceRepo = AppDataSource.getRepository(Absence);
        const absence = await absenceRepo.findOneBy({ id: req.params.id });
        if (absence) {
            await absenceRepo.remove(absence);
            await registerLog(
                "DELETE",
                `Ausência removida ID: ${req.params.id}`,
                getUserName(req)
            );
            return res.json("Deleted");
        } else {
            return res.status(404).json({ message: "Not found" });
        }
    }
}
