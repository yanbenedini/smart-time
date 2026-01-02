import "reflect-metadata";
import { DataSource } from "typeorm";
import { Employee } from "./entity/Employee";
import { Absence } from "./entity/Absence";
import { ShiftChange } from "./entity/ShiftChange";
import { OnCallShift } from "./entity/OnCallShift";
import { SystemUser } from "./entity/SystemUser";
import { SystemLog } from "./entity/SystemLog";
import * as dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  // host: process.env.DB_HOST || "db",
  host: "localhost",
  // port: Number(process.env.DB_PORT) || 5432,
  port: 5433,
  username: process.env.DB_USER || "postgres",
  // password: process.env.DB_PASSWORD || "postgres",
  password: "password123",
  database: process.env.DB_NAME || "smart_time_db",
  synchronize: false, // CUIDADO: Cria tabelas automaticamente (true apenas para dev)
  logging: false,
  entities: [
    Employee,
    Absence,
    ShiftChange,
    OnCallShift,
    SystemUser,
    SystemLog,
  ],
  subscribers: [],
  migrations: [],
});
