import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("employee")
export class Employee {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    matricula: string;

    @Column({ name: "first_name" })
    firstName: string;

    @Column({ name: "last_name" })
    lastName: string;

    @Column()
    email: string;

    @Column()
    role: string;

    @Column()
    squad: string;

    @Column({ name: "shift_start" })
    shiftStart: string;

    @Column({ name: "shift_end" })
    shiftEnd: string;
}