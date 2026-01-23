import jwt from "jsonwebtoken";
import { SystemUser } from "../entity/SystemUser";

const JWT_SECRET = process.env.JWT_SECRET || "smart-time-secret-key-change-me";
const JWT_EXPIRES_IN = "24h";

export interface TokenPayload {
    userId: string;
    email: string;
    isAdmin: boolean;
}

export const generateToken = (user: SystemUser): string => {
    const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        return null;
    }
};
