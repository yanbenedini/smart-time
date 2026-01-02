import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { Employee } from "./entity/Employee";
import { Absence } from "./entity/Absence";
import { ShiftChange } from "./entity/ShiftChange";
import { OnCallShift } from "./entity/OnCallShift";
import { SystemUser } from "./entity/SystemUser";
import { SystemLog } from "./entity/SystemLog";
import bcrypt from "bcryptjs";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

AppDataSource.initialize()
  .then(async () => {
    console.log("Data Source has been initialized!");

    // Repositórios
    const employeeRepo = AppDataSource.getRepository(Employee);
    const absenceRepo = AppDataSource.getRepository(Absence);
    const shiftChangeRepo = AppDataSource.getRepository(ShiftChange);
    const onCallRepo = AppDataSource.getRepository(OnCallShift);
    const userRepo = AppDataSource.getRepository(SystemUser);
    const logRepo = AppDataSource.getRepository(SystemLog);

    // --- HELPER: Pega o nome do header enviado pelo Frontend ---
    const getUserName = (req: express.Request): string => {
      const headerUser = req.headers["x-user-name"];
      if (Array.isArray(headerUser)) return headerUser[0];
      return headerUser || "Sistema";
    };

    // --- FUNÇÃO AUXILIAR PARA LOGAR ---
    const registerLog = async (
      action: string,
      description: string,
      userName: string
    ) => {
      try {
        const newLog = logRepo.create({
          action,
          description,
          userName,
          createdAt: new Date(),
        });
        await logRepo.save(newLog);
        // Log no terminal também mostra quem fez a ação
        console.log(`[LOG] ${userName} - ${action}: ${description}`);
      } catch (error) {
        console.error("Falha ao salvar log:", error);
      }
    };

    // --- LOGS ---
    app.get("/logs", async (req, res) => {
      const logs = await logRepo.find({
        order: { createdAt: "DESC" },
        take: 100,
      });
      res.json(logs);
    });

    app.post("/logs", async (req, res) => {
      const log = logRepo.create(req.body);
      const result = await logRepo.save(log);
      res.json(result);
    });

    // --- EMPLOYEES ---
    app.get("/employees", async (req, res) => {
      const employees = await employeeRepo.find({
        order: { firstName: "ASC" },
      });
      res.json(employees);
    });

    app.post("/employees", async (req, res) => {
      try {
        if (req.body.id === "") delete req.body.id;

        const employee = employeeRepo.create(req.body as Employee);
        const result = await employeeRepo.save(employee);

        await registerLog(
          "CREATE",
          `Funcionário criado: ${result.firstName} ${result.lastName}`,
          getUserName(req)
        );

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: "Erro ao criar funcionário" });
      }
    });

    app.put("/employees/:id", async (req, res) => {
      const employee = await employeeRepo.findOneBy({ id: req.params.id });
      if (employee) {
        employeeRepo.merge(employee, req.body);
        const result = await employeeRepo.save(employee);

        await registerLog(
          "UPDATE",
          `Funcionário atualizado: ${result.firstName} ${result.lastName}`,
          getUserName(req)
        );

        res.json(result);
      } else {
        res.status(404).send("Employee not found");
      }
    });

    app.delete("/employees/:id", async (req, res) => {
      const employee = await employeeRepo.findOneBy({ id: req.params.id });
      if (employee) {
        await employeeRepo.remove(employee);

        await registerLog(
          "DELETE",
          `Funcionário removido: ${employee.firstName} ${employee.lastName}`,
          getUserName(req)
        );

        res.json({ message: "Deleted" });
      } else {
        res.status(404).json({ message: "Not found" });
      }
    });

    // --- ABSENCES ---
    app.get("/absences", async (req, res) => {
      const absences = await absenceRepo.find({ order: { date: "DESC" } });
      res.json(absences);
    });

    app.post("/absences", async (req, res) => {
      try {
        if (req.body.id === "") delete req.body.id;

        const absence = absenceRepo.create(req.body as Absence);
        const result = await absenceRepo.save(absence);

        await registerLog(
          "CREATE",
          `Ausência registrada: ${result.reason}`,
          getUserName(req)
        );

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: "Erro ao criar ausência" });
      }
    });

    app.put("/absences/:id", async (req, res) => {
      const absence = await absenceRepo.findOneBy({ id: req.params.id });

      if (absence) {
        absenceRepo.merge(absence, req.body);
        const result = await absenceRepo.save(absence);

        // Lógica para pegar o nome do funcionário
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

        res.json(result);
      } else {
        res.status(404).send("Absence not found");
      }
    });

    app.delete("/absences/:id", async (req, res) => {
      const absence = await absenceRepo.findOneBy({ id: req.params.id });
      if (absence) {
        await absenceRepo.remove(absence);
        await registerLog(
          "DELETE",
          `Ausência removida ID: ${req.params.id}`,
          getUserName(req)
        );
        res.json("Deleted");
      } else {
        res.status(404).json({ message: "Not found" });
      }
    });

    // --- SHIFT CHANGES ---
    app.get("/shift-changes", async (req, res) => {
      const changes = await shiftChangeRepo.find({
        order: { startDate: "DESC" },
      });
      res.json(changes);
    });

    app.post("/shift-changes", async (req, res) => {
      try {
        if (req.body.id === "") delete req.body.id;

        const change = shiftChangeRepo.create(req.body as ShiftChange);
        const result = await shiftChangeRepo.save(change);

        await registerLog(
          "CREATE",
          `Troca de turno criada: ${result.reason}`,
          getUserName(req)
        );

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: "Erro ao criar troca" });
      }
    });

    app.delete("/shift-changes/:id", async (req, res) => {
      await shiftChangeRepo.delete(req.params.id);
      await registerLog(
        "DELETE",
        `Troca de turno removida ID: ${req.params.id}`,
        getUserName(req)
      );
      res.json("Deleted");
    });

    // --- ON CALL ---
    app.get("/on-call", async (req, res) => {
      const shifts = await onCallRepo.find({ order: { date: "DESC" } });
      res.json(shifts);
    });

    app.post("/on-call", async (req, res) => {
      try {
        if (req.body.id === "") delete req.body.id;

        const shift = onCallRepo.create(req.body as OnCallShift);
        const result = await onCallRepo.save(shift);

        await registerLog(
          "CREATE",
          `Plantão criado para data: ${result.date}`,
          getUserName(req)
        );

        res.json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao criar sobreaviso" });
      }
    });

    app.delete("/on-call/:id", async (req, res) => {
      await onCallRepo.delete(req.params.id);
      await registerLog(
        "DELETE",
        `Plantão removido ID: ${req.params.id}`,
        getUserName(req)
      );
      res.json("Deleted");
    });

    // --- USERS ---
    app.get("/users", async (req, res) => {
      const users = await userRepo.find();
      res.json(users);
    });

    app.post("/users", async (req, res) => {
      try {
        if (req.body.id === "") delete req.body.id;

        const { name, email, password, isAdmin, mustChangePassword } = req.body;

        const userExists = await userRepo.findOneBy({ email: email });

        if (userExists) {
          // Caminho 1: Retorna erro 400
          return res
            .status(400)
            .json({ message: "Este email já está em uso." });
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

        // Caminho 2: Adicionado 'return' aqui para consistência
        return res.json(userResponse);
      } catch (error) {
        console.error("Erro POST /users:", error);
        // Caminho 3: Adicionado 'return' aqui também
        return res.status(500).json({ error: "Erro ao criar usuário" });
      }
    });

    app.put("/users/:id", async (req, res) => {
      try {
        const user = await userRepo.findOneBy({ id: req.params.id });

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Separa a senha do resto dos dados que vieram no corpo
        const { password, ...updateData } = req.body;

        // LÓGICA DE SENHA:
        // Só criptografa e atualiza se o usuário enviou uma nova senha válida
        if (password && password.trim() !== "") {
          const hashedPassword = await bcrypt.hash(password, 10);
          // Atualiza tudo + a nova senha criptografada
          userRepo.merge(user, { ...updateData, password: hashedPassword });
        } else {
          // Atualiza apenas os outros dados (mantém a senha antiga do banco)
          userRepo.merge(user, updateData);
        }

        const result = await userRepo.save(user);

        // Remove a senha do objeto de retorno (Segurança)
        const userResponse = { ...result };
        delete (userResponse as any).password;

        // Log
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
    });

    app.delete("/users/:id", async (req, res) => {
      const userToRemove = await userRepo.findOneBy({ id: req.params.id });

      if (userToRemove) {
        await userRepo.remove(userToRemove);

        await registerLog(
          "DELETE",
          `Usuário removido: ${userToRemove.name}`,
          getUserName(req)
        );

        res.json("Deleted");
      } else {
        res.status(404).json({ message: "User not found" });
      }
    });

    // --- ROTA DE LOGIN ---
    app.post("/login", async (req, res) => {
      try {
        const { email, password } = req.body;

        // Logs de Debug (para vermos no terminal o que está chegando)
        console.log("--- TENTATIVA DE LOGIN ---");
        console.log("Email recebido:", email);
        console.log("Senha digitada:", password);

        // 1. Busca o usuário trazendo explicitamente a senha (que está oculta por padrão)
        const user = await userRepo
          .createQueryBuilder("user")
          .addSelect("user.password") // Força a vinda da senha oculta
          .where("user.email = :email", { email })
          .getOne();

        if (!user) {
          console.log("ERRO: Usuário não encontrado no banco.");
          return res.status(401).json({ message: "Email ou senha inválidos" });
        }

        console.log("Usuário encontrado:", user.name);
        console.log("Hash salvo no banco:", user.password);

        // 2. Compara a senha digitada com o Hash do banco usando bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password);

        console.log("A senha bate com o hash?", isPasswordValid);

        if (!isPasswordValid) {
          console.log("ERRO: Senha incorreta.");
          return res.status(401).json({ message: "Email ou senha inválidos" });
        }

        // 3. Se deu certo, remove a senha do objeto antes de devolver
        const { password: _, ...userSafe } = user;

        // Log de auditoria (Opcional)
        await registerLog(
          "LOGIN",
          `Login realizado com sucesso`,
          userSafe.name
        );

        console.log("SUCESSO: Login aprovado.");
        return res.json(userSafe);
      } catch (error) {
        console.error("Erro interno no login:", error);
        return res.status(500).json({ message: "Erro interno no servidor" });
      }
    });

    // --- ROTA DE TROCA DE SENHA ---
    app.post("/change-password", async (req, res) => {
      try {
        const { userId, currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({ message: "Dados incompletos." });
        }

        // 1. Busca o usuário trazendo a senha (que é oculta)
        const user = await userRepo.createQueryBuilder("user")
            .addSelect("user.password")
            .where("user.id = :id", { id: userId })
            .getOne();

        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        // 2. Verifica se a senha ATUAL informada bate com o Hash do banco
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            // Se falhar aqui, é porque o usuário digitou a senha atual errada
            return res.status(401).json({ message: "A senha atual está incorreta." });
        }

        // 3. Gera o Hash da NOVA senha
        const newHashedPassword = await bcrypt.hash(newPassword, 10);

        // 4. Atualiza o usuário
        user.password = newHashedPassword;
        user.mustChangePassword = false; // Tira a obrigatoriedade de troca

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
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => console.log(error));
