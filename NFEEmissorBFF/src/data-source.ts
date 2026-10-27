import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User.js";

const requiredEnvironmentVariables = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"] as const;

for (const variable of requiredEnvironmentVariables) {
    if (!process.env[variable]) {
        throw new Error(`Missing required environment variable: ${variable}`);
    }
}

export const AppDataSource = new DataSource({
    type: "mssql",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 1433),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User],           // import classes directly; avoids glob issues with ESM/tsx
    synchronize: false,         // never true in production
    logging: process.env.NODE_ENV !== "production",
    options: {
        encrypt: true,                  // required for Azure SQL
        trustServerCertificate: true,   // local dev only
    },
    pool: { max: 10 },
});