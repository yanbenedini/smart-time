import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token";

export const basicAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token não fornecido" });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2) {
        return res.status(401).json({ message: "Erro no Token" });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ message: "Token malformatado" });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ message: "Token inválido ou expirado" });
    }

    (req as any).user = decoded; // Attach user to request

    const isRestrictedRoute =
        req.path.startsWith("/logs") || req.path.startsWith("/users");

    if (isRestrictedRoute && !decoded.isAdmin) {
        if (req.originalUrl.includes("/users") || req.originalUrl.includes("/logs")) {
            return res.status(403).json({
                message: "Acesso negado: requer privilégios de administrador",
            });
        }
    }

    return next();
};
