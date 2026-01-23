import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { SystemUser } from "../entity/SystemUser";
import { registerLog, getUserName } from "../utils/logger";
import { generateToken, verifyToken } from "../utils/token";
import bcrypt from "bcryptjs";

export class UserController {
    static async list(req: Request, res: Response) {
        const userRepo = AppDataSource.getRepository(SystemUser);
        const users = await userRepo.find();
        return res.json(users);
    }

    static async create(req: Request, res: Response) {
        const userRepo = AppDataSource.getRepository(SystemUser);
        try {
            if (req.body.id === "") delete req.body.id;

            const { name, email, password, isAdmin, mustChangePassword } = req.body;

            const userExists = await userRepo.findOneBy({ email: email });

            if (userExists) {
                return res.status(400).json({ message: "Este email já está em uso." });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = userRepo.create({
                name,
                email,
                password: hashedPassword,
                isAdmin: isAdmin || false,
                mustChangePassword: mustChangePassword ?? true,
            });

            const result = await userRepo.save(user);

            const userResponse = { ...result };
            delete (userResponse as any).password;

            await registerLog(
                "CREATE",
                `Usuário criado: ${result.email}`,
                getUserName(req)
            );

            return res.json(userResponse);
        } catch (error) {
            console.error("Erro POST /users:", error);
            return res.status(500).json({ error: "Erro ao criar usuário" });
        }
    }

    static async update(req: Request, res: Response) {
        const userRepo = AppDataSource.getRepository(SystemUser);
        try {
            const user = await userRepo.findOneBy({ id: req.params.id });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const { password, ...updateData } = req.body;

            if (password && password.trim() !== "") {
                const hashedPassword = await bcrypt.hash(password, 10);
                userRepo.merge(user, { ...updateData, password: hashedPassword });
            } else {
                userRepo.merge(user, updateData);
            }

            const result = await userRepo.save(user);

            const userResponse = { ...result };
            delete (userResponse as any).password;

            await registerLog(
                "UPDATE",
                `Usuário atualizado: ${result.name}`,
                getUserName(req)
            );

            return res.json(userResponse);
        } catch (error) {
            console.error("Erro PUT /users:", error);
            return res.status(500).json({ error: "Erro ao atualizar usuário" });
        }
    }

    static async delete(req: Request, res: Response) {
        const userRepo = AppDataSource.getRepository(SystemUser);
        const userToRemove = await userRepo.findOneBy({ id: req.params.id });

        if (userToRemove) {
            await userRepo.remove(userToRemove);

            await registerLog(
                "DELETE",
                `Usuário removido: ${userToRemove.name}`,
                getUserName(req)
            );

            return res.json("Deleted");
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    }

    static async login(req: Request, res: Response) {
        const userRepo = AppDataSource.getRepository(SystemUser);
        try {
            const { email, password } = req.body;

            const user = await userRepo
                .createQueryBuilder("user")
                .addSelect("user.password")
                .where("user.email = :email", { email })
                .getOne();

            if (!user) {
                return res.status(401).json({ message: "Email ou senha inválidos" });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ message: "Email ou senha inválidos" });
            }

            const { password: _, ...userSafe } = user;

            const token = generateToken(user);

            await registerLog("LOGIN", `Login realizado com sucesso`, userSafe.name);

            return res.json({ user: userSafe, token });
        } catch (error) {
            console.error("Erro interno no login:", error);
            return res.status(500).json({ message: "Erro interno no servidor" });
        }
    }

    static async changePassword(req: Request, res: Response) {
        const userRepo = AppDataSource.getRepository(SystemUser);
        try {
            const { userId, currentPassword, newPassword } = req.body;

            if (newPassword === currentPassword)
                return res
                    .status(400)
                    .json({ message: "A nova senha deve ser diferente da atual." });
            if (newPassword.length < 8)
                return res
                    .status(400)
                    .json({ message: "A senha deve ter no mínimo 8 caracteres." });

            // ... (outras validações omitidas para brevidade, mas podem ser adicionadas)

            const authHeader = req.headers.authorization;
            if (!authHeader)
                return res.status(401).json({ message: "Não autenticado." });

            const token = authHeader.split(" ")[1];
            const decoded = verifyToken(token);

            if (!decoded) {
                return res.status(401).json({ message: "Sessão inválida ou expirada." });
            }

            const emailLogado = decoded.email;

            const loggedUser = await userRepo.findOneBy({ email: emailLogado });

            if (!loggedUser || loggedUser.id !== userId) {
                return res.status(403).json({
                    message:
                        "Você não tem permissão para alterar a senha de outro usuário.",
                });
            }

            const user = await userRepo
                .createQueryBuilder("user")
                .addSelect("user.password")
                .where("user.id = :id", { id: userId })
                .getOne();

            if (!user) {
                return res.status(404).json({ message: "Usuário não encontrado." });
            }

            const isPasswordValid = await bcrypt.compare(
                currentPassword,
                user.password
            );

            if (!isPasswordValid) {
                return res.status(401).json({ message: "A senha atual está incorreta." });
            }

            const newHashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = newHashedPassword;
            user.mustChangePassword = false;

            await userRepo.save(user);

            await registerLog(
                "UPDATE",
                `Senha alterada pelo próprio usuário`,
                user.name
            );

            return res.json({ message: "Senha alterada com sucesso!" });
        } catch (error) {
            console.error("Erro ao trocar senha:", error);
            return res.status(500).json({ message: "Erro interno ao trocar senha." });
        }
    }
}
