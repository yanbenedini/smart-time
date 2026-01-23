import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { SystemUser } from "../entity/SystemUser";
import bcrypt from "bcryptjs";

export const basicAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.setHeader("WWW-Authenticate", "Basic");
        return res.status(401).json({ message: "Autenticação necessária" });
    }

    try {
        const auth = Buffer.from(authHeader.split(" ")[1], "base64")
            .toString()
            .split(":");
        const email = auth[0];
        const password = auth[1];

        const userRepo = AppDataSource.getRepository(SystemUser);
        const user = await userRepo
            .createQueryBuilder("user")
            .addSelect("user.password")
            .where("user.email = :email", { email })
            .getOne();

        if (!user) {
            return res.status(401).json({ message: "Usuário não encontrado" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Senha incorreta" });
        }

        const isRestrictedRoute =
            req.path.startsWith("/logs") || req.path.startsWith("/users");

        if (isRestrictedRoute && !user.isAdmin && !user.isSuperAdmin) {
            // Basic Auth pode ser tricky com URLs, mas como estamos separando rotas,
            // essa verificação específica aqui pode precisar ser ajustada ou movida 
            // para um middleware de permissão dedicado. 
            // Por ora, mantive a lógica original.
            if (req.originalUrl.includes("/users") || req.originalUrl.includes("/logs")) {
                return res.status(403).json({
                    message: "Acesso negado: requer privilégios de administrador",
                });
            }
        }

        return next();
    } catch (error) {
        return res.status(500).json({ message: "Erro interno na autenticação" });
    }
};
