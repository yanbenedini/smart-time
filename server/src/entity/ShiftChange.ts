import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("shift_change")
export class ShiftChange {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "employee_id" })
  employeeId: string;

  @Column({ name: "original_shift_start" })
  originalShiftStart: string;

  @Column({ name: "original_shift_end" })
  originalShiftEnd: string;

  @Column({ name: "new_shift_start" })
  newShiftStart: string;

  @Column({ name: "new_shift_end" })
  newShiftEnd: string;

  @Column({ type: "date", name: "start_date" })
  startDate: string;

  @Column({ type: "date", name: "end_date" })
  endDate: string;

  @Column()
  reason: string;

  @Column({ name: "created_by", nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "updated_by", nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ name: "updated_at", nullable: true })
  updatedAt: Date;
}
