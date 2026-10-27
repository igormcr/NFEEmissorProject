import "dotenv/config";
import sql from "mssql";

export const poolPromise = new sql.ConnectionPool({
    server: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT ?? 1433),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options: { encrypt: true, trustServerCertificate: true }, // trustServerCertificate only for local dev
}).connect();