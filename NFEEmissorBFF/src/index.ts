import express from "express";
import { AppDataSource } from "./data-source.js";
import {
    certificateUpload,
    createCertificate,
    deleteCertificate,
    listCertificates,
} from "./certificate-routes.js";
import { proxyNfeRequest } from "./nfe-proxy.js";

const app = express();
app.use((request, response, next) => {
    const origin = request.header("Origin");
    if (origin === "http://localhost:8081" || origin === "http://127.0.0.1:8081") {
        response.header("Access-Control-Allow-Origin", origin);
        response.header("Vary", "Origin");
        response.header("Access-Control-Allow-Headers", "Content-Type, X-User-Id");
        response.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    }

    if (request.method === "OPTIONS") {
        response.sendStatus(204);
        return;
    }

    next();
});
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
    res.json({ service: "NFEEmissorBFF", status: "ok" });
});

app.post("/api/v1/certificados", certificateUpload, createCertificate);
app.get("/api/v1/certificados", listCertificates);
app.delete("/api/v1/certificados/:id", deleteCertificate);
app.use("/api/v1/nfe", proxyNfeRequest);

try {
    await AppDataSource.initialize();
    const port = Number(process.env.PORT ?? 3000);
    app.listen(port, () => console.log(`Running on http://localhost:${port}`));
} catch (error) {
    console.error("Could not initialize the BFF", error);
    process.exitCode = 1;
}