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

        const user = userRepo.create(req.body as SystemUser);
        const result = await userRepo.save(user);

        await registerLog(
          "CREATE",
          `Usuário criado: ${result.email}`,
          getUserName(req)
        );

        res.json(result);
      } catch (error) {
        res.status(500).json({ error: "Erro ao criar usuário" });
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

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => console.log(error));