import type { Request, Response } from "express";
import { AppDataSource } from "./data-source.js";
import { decryptSecret } from "./certificate-crypto.js";
import { Certificate } from "./entities/Certificate.js";

const fiscalApiUrl = process.env.FISCAL_API_URL ?? "http://localhost:5082";

async function certificateHeaders(request: Request): Promise<Record<string, string>> {
    const userId = request.header("X-User-Id")?.trim();
    if (!userId) {
        throw new Error("X-User-Id is required until JWT authentication is configured");
    }

    const certificate = await AppDataSource.getRepository(Certificate).findOne({
        where: { userId, status: "active" },
        order: { expiresAt: "DESC" },
    });
    if (!certificate || certificate.expiresAt <= new Date()) {
        throw new Error("No active certificate configured for this user");
    }

    const pfx = decryptSecret(certificate.encryptedCertificate);
    const password = decryptSecret(certificate.encryptedPassword).toString("utf8");
    return {
        "X-Certificado-Base64": pfx.toString("base64"),
        "X-Certificado-Senha": password,
    };
}

export async function proxyNfeRequest(request: Request, response: Response) {
    try {
        const headers = await certificateHeaders(request);
        const query = new URLSearchParams(
            Object.entries(request.query).flatMap(([key, value]) =>
                Array.isArray(value) ? value.map((item) => [key, String(item)]) : [[key, String(value)]],
            ),
        );
        const url = `${fiscalApiUrl}/api/v1/nfe${request.path}${query.size ? `?${query}` : ""}`;
        const upstream = await fetch(url, {
            method: request.method,
            headers: { ...headers, "Content-Type": "application/json" },
            body: ["GET", "HEAD"].includes(request.method) ? undefined : JSON.stringify(request.body),
        });
        const text = await upstream.text();
        response.status(upstream.status);
        response.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
        response.send(text);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not process fiscal request";
        response.status(message.includes("required") || message.includes("No active") ? 400 : 502).json({ message });
    }
}
