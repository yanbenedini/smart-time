import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { basicAuth } from "./middlewares/authMiddleware";

// Rotas
import employeeRoutes from "./routes/employeeRoutes";
import absenceRoutes from "./routes/absenceRoutes";
import shiftChangeRoutes from "./routes/shiftChangeRoutes";
import onCallShiftRoutes from "./routes/onCallShiftRoutes";
import userRoutes from "./routes/userRoutes";
import logRoutes from "./routes/logRoutes";
import { Employee } from "./entity/Employee";
import { Absence } from "./entity/Absence";


const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

AppDataSource.initialize()
  .then(async () => {
    console.log("Data Source has been initialized!");

    // --- Middleware Global de Auth ---


    // --- Definição das Rotas ---
    app.use("/employees", employeeRoutes);
    app.use("/absences", absenceRoutes);
    app.use("/shift-changes", shiftChangeRoutes);
    app.use("/on-call", onCallShiftRoutes);
    app.use("/users", userRoutes); // Inclui login e change-password
    app.use("/logs", logRoutes);

    // --- Rotas Específicas que não se encaixaram CRUD padrão ---
    // (Poderiam ir para um Controller específico, mas mantendo simples por enquanto)

    app.post("/check-coverage", basicAuth, async (req, res) => {
      try {
        const { employeeId, role, squad, date, startTime, endTime } = req.body;
        const employeeRepo = AppDataSource.getRepository(Employee);
        const absenceRepo = AppDataSource.getRepository(Absence);

        // 1. Busca colegas da mesma squad e cargo
        const peers = await employeeRepo.find({
          where: { role: role, squad: squad },
        });

        // Remove o próprio funcionário da lista
        const potentialCovers = peers.filter((p) => p.id !== employeeId);

        // 2. Filtra quem trabalha no horário solicitado
        const shiftCoveringPeers = potentialCovers.filter(
          (peer) => peer.shiftStart <= startTime && peer.shiftEnd >= endTime,
        );

        if (shiftCoveringPeers.length === 0) {
          return res.json({ hasCoverage: false });
        }

        // 3. Verifica se esses colegas têm ausência marcada no mesmo dia/hora
        let availablePeerFound = false;

        for (const peer of shiftCoveringPeers) {
          const conflict = await absenceRepo
            .createQueryBuilder("absence")
            .where("absence.employeeId = :peerId", { peerId: peer.id })
            .andWhere("absence.date <= :date", { date })
            .andWhere("absence.endDate >= :date", { date })
            .andWhere("absence.startTime < :endTime", { endTime })
            .andWhere("absence.endTime > :startTime", { startTime })
            .getOne();

          if (!conflict) {
            availablePeerFound = true;
            break;
          }
        }

        return res.json({ hasCoverage: availablePeerFound });
      } catch (error) {
        console.error("Erro check-coverage:", error);
        return res.status(500).json({ hasCoverage: false });
      }
    });


    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => console.log(error));
