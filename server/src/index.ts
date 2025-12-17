
import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { Employee } from "./entity/Employee";
import { Absence } from "./entity/Absence";
import { ShiftChange } from "./entity/ShiftChange";
import { OnCallShift } from "./entity/OnCallShift";
import { SystemUser } from "./entity/SystemUser";

const app = express();
// Using standard express and cors middleware with default imports to resolve type definition conflicts
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

AppDataSource.initialize().then(async () => {
    console.log("Data Source has been initialized!");

    // Repositories
    const employeeRepo = AppDataSource.getRepository(Employee);
    const absenceRepo = AppDataSource.getRepository(Absence);
    const shiftChangeRepo = AppDataSource.getRepository(ShiftChange);
    const onCallRepo = AppDataSource.getRepository(OnCallShift);
    const userRepo = AppDataSource.getRepository(SystemUser);

    // --- EMPLOYEES ---
    app.get("/employees", async (req, res) => {
        const employees = await employeeRepo.find({ order: { firstName: "ASC" } });
        res.json(employees);
    });

    app.post("/employees", async (req, res) => {
        const employee = employeeRepo.create(req.body);
        const results = await employeeRepo.save(employee);
        res.json(results);
    });

    app.put("/employees/:id", async (req, res) => {
        const employee = await employeeRepo.findOneBy({ id: req.params.id });
        if (employee) {
            employeeRepo.merge(employee, req.body);
            const results = await employeeRepo.save(employee);
            res.json(results);
        } else {
            res.status(404).send("Employee not found");
        }
    });

    app.delete("/employees/:id", async (req, res) => {
        const results = await employeeRepo.delete(req.params.id);
        res.json(results);
    });

    // --- ABSENCES ---
    app.get("/absences", async (req, res) => {
        const absences = await absenceRepo.find({ order: { date: "DESC" } });
        res.json(absences);
    });

    app.post("/absences", async (req, res) => {
        const absence = absenceRepo.create(req.body);
        const results = await absenceRepo.save(absence);
        res.json(results);
    });

    app.delete("/absences/:id", async (req, res) => {
        await absenceRepo.delete(req.params.id);
        res.json("Deleted");
    });

    // --- SHIFT CHANGES ---
    app.get("/shift-changes", async (req, res) => {
        const changes = await shiftChangeRepo.find({ order: { startDate: "DESC" } });
        res.json(changes);
    });

    app.post("/shift-changes", async (req, res) => {
        const change = shiftChangeRepo.create(req.body);
        const results = await shiftChangeRepo.save(change);
        res.json(results);
    });

    app.delete("/shift-changes/:id", async (req, res) => {
        await shiftChangeRepo.delete(req.params.id);
        res.json("Deleted");
    });

    // --- ON CALL ---
    app.get("/on-call", async (req, res) => {
        const shifts = await onCallRepo.find({ order: { date: "DESC" } });
        res.json(shifts);
    });

    app.post("/on-call", async (req, res) => {
        const shift = onCallRepo.create(req.body);
        const results = await onCallRepo.save(shift);
        res.json(results);
    });

    app.delete("/on-call/:id", async (req, res) => {
        await onCallRepo.delete(req.params.id);
        res.json("Deleted");
    });

    // --- USERS ---
    app.get("/users", async (req, res) => {
        const users = await userRepo.find();
        res.json(users);
    });

    app.post("/users", async (req, res) => {
        const user = userRepo.create(req.body);
        const results = await userRepo.save(user);
        res.json(results);
    });

    app.delete("/users/:id", async (req, res) => {
        await userRepo.delete(req.params.id);
        res.json("Deleted");
    });

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

}).catch(error => console.log(error));
