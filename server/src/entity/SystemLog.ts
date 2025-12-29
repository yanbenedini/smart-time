import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("system_log")
export class SystemLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  action: string; // Ex: "CREATE", "DELETE", "LOGIN"

  @Column()
  description: string; // Detalhes do que aconteceu

  @Column({ name: "user_name", nullable: true })
  userName: string; // Quem fez a ação

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
