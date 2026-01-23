import { Request } from "express";
import { AppDataSource } from "../data-source";
import { SystemLog } from "../entity/SystemLog";

export const getUserName = (req: Request): string => {
    const headerUser = req.headers["x-user-name"];
    if (Array.isArray(headerUser)) return headerUser[0];
    return headerUser || "Sistema";
};

export const registerLog = async (
    action: string,
    description: string,
    userName: string
) => {
    const logRepo = AppDataSource.getRepository(SystemLog);
    try {
        const newLog = logRepo.create({
            action,
            description,
            userName,
            createdAt: new Date(),
        });
        await logRepo.save(newLog);
        console.log(`[LOG] ${userName} - ${action}: ${description}`);
    } catch (error) {
        console.error("Falha ao salvar log:", error);
    }
};
