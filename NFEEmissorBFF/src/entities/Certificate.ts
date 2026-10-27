import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("certificates")
export class Certificate {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "nvarchar", length: 255 })
    userId!: string;

    @Column({ type: "nvarchar", length: 255, nullable: true })
    subject!: string | null;

    @Column({ type: "nvarchar", length: 14, nullable: true })
    cnpj!: string | null;

    @Column({ type: "nvarchar", length: 255, nullable: true })
    issuer!: string | null;

    @Column({ type: "nvarchar", length: 255, nullable: true })
    serialNumber!: string | null;

    @Column({ type: "datetime2" })
    validFrom!: Date;

    @Column({ type: "datetime2" })
    expiresAt!: Date;

    @Column({ type: "nvarchar", length: 20 })
    status!: "active" | "expired" | "revoked";

    @Column({ type: "nvarchar", length: "max" })
    encryptedCertificate!: string;

    @Column({ type: "nvarchar", length: "max" })
    encryptedPassword!: string;

    @Column({ type: "int", default: 1 })
    encryptionKeyVersion!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
