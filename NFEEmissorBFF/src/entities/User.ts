import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "nvarchar", length: 100 })
    name!: string;

    @Column({ type: "nvarchar", length: 255, unique: true })
    email!: string;

    @Column({ type: "nvarchar", length: 255 })
    passwordHash!: string;

    @CreateDateColumn()
    createdAt!: Date;
}