import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Employee } from "../entity/Employee";
import { registerLog, getUserName } from "../utils/logger";

export class EmployeeController {
    static async list(req: Request, res: Response) {
        const employeeRepo = AppDataSource.getRepository(Employee);
        const employees = await employeeRepo.find({
            order: { firstName: "ASC" },
        });
        return res.json(employees);
    }

    static async create(req: Request, res: Response) {
        const employeeRepo = AppDataSource.getRepository(Employee);
        try {
            if (req.body.id === "") delete req.body.id;

            const employee = employeeRepo.create(req.body as Employee);
            const result = await employeeRepo.save(employee);

            await registerLog(
                "CREATE",
                `Funcionário criado: ${result.firstName} ${result.lastName}`,
                getUserName(req)
            );

            return res.json(result);
        } catch (error) {
            return res.status(500).json({ error: "Erro ao criar funcionário" });
        }
    }

    static async update(req: Request, res: Response) {
        const employeeRepo = AppDataSource.getRepository(Employee);
        const employee = await employeeRepo.findOneBy({ id: req.params.id });

        if (employee) {
            employeeRepo.merge(employee, req.body);
            const result = await employeeRepo.save(employee);

            await registerLog(
                "UPDATE",
                `Funcionário atualizado: ${result.firstName} ${result.lastName}`,
                getUserName(req)
            );

            return res.json(result);
        } else {
            return res.status(404).json({ message: "Employee not found" });
        }
    }

    static async delete(req: Request, res: Response) {
        const employeeRepo = AppDataSource.getRepository(Employee);
        const employee = await employeeRepo.findOneBy({ id: req.params.id });

        if (employee) {
            await employeeRepo.remove(employee);

            await registerLog(
                "DELETE",
                `Funcionário removido: ${employee.firstName} ${employee.lastName}`,
                getUserName(req)
            );

            return res.json({ message: "Deleted" });
        } else {
            return res.status(404).json({ message: "Not found" });
        }
    }
}
