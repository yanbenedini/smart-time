import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Absence {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "employee_id" })
    employeeId: string;

    @Column()
    reason: string;

    @Column({ type: "date" })
    date: string;

    @Column({ type: "date", name: "end_date" })
    endDate: string;

    @Column({ name: "start_time" })
    startTime: string;

    @Column({ name: "end_time" })
    endTime: string;

    @Column({ name: "duration_minutes" })
    durationMinutes: number;

    @Column({ type: "text", nullable: true })
    observation: string;

    @Column({ default: true })
    approved: boolean;

    @Column({ name: "created_by", nullable: true })
    createdBy: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @Column({ name: "updated_by", nullable: true })
    updatedBy: string;

    @UpdateDateColumn({ name: "updated_at", nullable: true })
    updatedAt: Date;
}