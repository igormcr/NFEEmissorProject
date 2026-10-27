import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import multer from "multer";
import { AppDataSource } from "./data-source.js";
import { encryptSecret } from "./certificate-crypto.js";
import { parsePfx } from "./certificate-service.js";
import { Certificate } from "./entities/Certificate.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

function getUserId(request: Request): string {
    const userId = request.header("X-User-Id")?.trim();
    if (!userId) {
        throw new Error("X-User-Id is required until JWT authentication is configured");
    }
    return userId;
}

function publicCertificate(certificate: Certificate) {
    return {
        id: certificate.id,
        subject: certificate.subject,
        cnpj: certificate.cnpj,
        issuer: certificate.issuer,
        serialNumber: certificate.serialNumber,
        validFrom: certificate.validFrom,
        expiresAt: certificate.expiresAt,
        status: certificate.status,
    };
}

export const certificateUpload = upload.single("file");

export async function createCertificate(request: Request, response: Response) {
    try {
        const userId = getUserId(request);
        const password = request.body.password;
        const file = request.file;

        if (!file || !password || typeof password !== "string") {
            response.status(400).json({ message: "A PFX file and its password are required" });
            return;
        }

        const metadata = parsePfx(file.buffer, password);
        const certificate = AppDataSource.getRepository(Certificate).create({
            id: randomUUID(),
            userId,
            ...metadata,
            status: metadata.expiresAt <= new Date() ? "expired" : "active",
            encryptedCertificate: encryptSecret(file.buffer),
            encryptedPassword: encryptSecret(password),
            encryptionKeyVersion: 1,
        });
        const saved = await AppDataSource.getRepository(Certificate).save(certificate);

        response.status(201).json(publicCertificate(saved));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not save certificate";
        const status = message.includes("required") || message.includes("Invalid") ? 400 : 500;
        console.error(`Certificate upload failed (${status}): ${message}`);
        response.status(status).json({ message });
    }
}

export async function listCertificates(request: Request, response: Response) {
    try {
        const userId = getUserId(request);
        const certificates = await AppDataSource.getRepository(Certificate).find({
            where: { userId },
            order: { createdAt: "DESC" },
        });
        response.json(certificates.map(publicCertificate));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not list certificates";
        response.status(message.includes("required") ? 400 : 500).json({ message });
    }
}

export async function deleteCertificate(request: Request, response: Response) {
    try {
        const userId = getUserId(request);
        const repository = AppDataSource.getRepository(Certificate);
        const id = request.params.id;
        if (!id || Array.isArray(id)) {
            response.status(400).json({ message: "Invalid certificate id" });
            return;
        }
        const result = await repository.delete({ id, userId });
        if (!result.affected) {
            response.status(404).json({ message: "Certificate not found" });
            return;
        }
        response.status(204).send();
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not delete certificate";
        response.status(message.includes("required") ? 400 : 500).json({ message });
    }
}
