import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "on_call_shift" })
export class OnCallShift {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "employee_id" })
    employeeId: string;

    @Column({ type: "date" })
    date: string;

    @Column({ name: "start_time" })
    startTime: string;

    @Column({ name: "end_time" })
    endTime: string;

    @Column({ type: "text", nullable: true })
    observation: string;

    @Column({ name: "created_by", nullable: true })
    createdBy: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @Column({ name: "updated_by", nullable: true })
    updatedBy: string;

    @UpdateDateColumn({ name: "updated_at", nullable: true })
    updatedAt: Date;
}