import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("clients")
export class Client {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "nvarchar", length: 255 })
    userId!: string;

    @Column({ type: "nvarchar", length: 255 })
    legalName!: string;

    @Column({ type: "nvarchar", length: 255, nullable: true })
    tradeName!: string | null;

    @Column({ type: "nvarchar", length: 14 })
    cnpj!: string;

    @Column({ type: "nvarchar", length: 30, nullable: true })
    stateRegistration!: string | null;

    @Column({ type: "nvarchar", length: 30, nullable: true })
    municipalRegistration!: string | null;

    @Column({ type: "nvarchar", length: 20, nullable: true })
    taxRegime!: string | null;

    @Column({ type: "nvarchar", length: 255, nullable: true })
    certificateId!: string | null;

    @Column({ type: "nvarchar", length: "max" })
    addressJson!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
