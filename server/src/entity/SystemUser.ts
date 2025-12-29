import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("system_user")
export class SystemUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: "is_admin", default: false })
  isAdmin: boolean;
}
