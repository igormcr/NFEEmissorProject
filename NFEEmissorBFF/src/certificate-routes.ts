import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import multer from "multer";
import { AppDataSource } from "./data-source.js";
import { encryptSecret } from "./certificate-crypto.js";
import { parsePfx } from "./certificate-service.js";
import { Certificate } from "./entities/Certificate.js";
import { Client } from "./entities/Client.js";
import { getAuthenticatedUserId } from "./auth.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

function publicCertificate(certificate: Certificate, client?: Client | null) {
    return {
        id: certificate.id,
        subject: certificate.subject,
        cnpj: certificate.cnpj,
        issuer: certificate.issuer,
        serialNumber: certificate.serialNumber,
        clientId: certificate.clientId,
        clientName: client?.legalName ?? null,
        clientCnpj: client?.cnpj ?? null,
        validFrom: certificate.validFrom,
        expiresAt: certificate.expiresAt,
        status: certificate.status,
    };
}

export const certificateUpload = upload.single("file");

export async function createCertificate(request: Request, response: Response) {
    try {
        const userId = getAuthenticatedUserId(request);
        const clientId = request.header("X-Client-Id")?.trim();
        const password = request.body.password;
        const file = request.file;

        if (!clientId) {
            response.status(400).json({ message: "X-Client-Id is required to associate the certificate with a client" });
            return;
        }
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
        let client: Client | null = null;
        client = await AppDataSource.getRepository(Client).findOne({ where: { id: clientId, userId } });
        if (!client) {
            response.status(400).json({ message: "Client not found" });
            return;
        }
        certificate.clientId = client.id;
        const saved = await AppDataSource.getRepository(Certificate).save(certificate);
        if (saved.clientId) {
            await AppDataSource.getRepository(Client).update(
                { id: saved.clientId, userId },
                { certificateId: saved.id },
            );
        }

        response.status(201).json(publicCertificate(saved, client));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not save certificate";
        const status = message.includes("required") || message.includes("Invalid") ? 400 : 500;
        console.error(`Certificate upload failed (${status}): ${message}`);
        response.status(status).json({ message });
    }
}

export async function listCertificates(request: Request, response: Response) {
    try {
        const userId = getAuthenticatedUserId(request);
        const certificates = await AppDataSource.getRepository(Certificate).find({
            where: { userId },
            order: { createdAt: "DESC" },
        });
        const clients = await AppDataSource.getRepository(Client).find({ where: { userId } });
        const clientsById = new Map(clients.map((client) => [client.id, client]));
        response.json(certificates.map((certificate) => publicCertificate(certificate, certificate.clientId ? clientsById.get(certificate.clientId) : null)));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not list certificates";
        response.status(message.includes("required") ? 400 : 500).json({ message });
    }
}

export async function deleteCertificate(request: Request, response: Response) {
    try {
        const userId = getAuthenticatedUserId(request);
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

export async function associateCertificateClient(request: Request, response: Response) {
    try {
        const userId = getAuthenticatedUserId(request);
        const certificateId = request.params.id;
        const clientId = request.body?.clientId;
        if (!certificateId || Array.isArray(certificateId) || typeof clientId !== "string" || !clientId.trim()) {
            response.status(400).json({ message: "A certificate id and clientId are required" });
            return;
        }

        const certificateRepository = AppDataSource.getRepository(Certificate);
        const clientRepository = AppDataSource.getRepository(Client);
        const certificate = await certificateRepository.findOne({ where: { id: certificateId, userId } });
        const client = await clientRepository.findOne({ where: { id: clientId, userId } });
        if (!certificate || !client) {
            response.status(404).json({ message: "Certificate or client not found" });
            return;
        }

        if (client.certificateId && client.certificateId !== certificate.id) {
            response.status(409).json({ message: "This client already has another certificate" });
            return;
        }

        if (certificate.clientId && certificate.clientId !== client.id) {
            await clientRepository.update({ id: certificate.clientId, userId }, { certificateId: null });
        }
        certificate.clientId = client.id;
        await certificateRepository.save(certificate);
        await clientRepository.update({ id: client.id, userId }, { certificateId: certificate.id });
        response.json(publicCertificate(certificate, client));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not associate certificate";
        response.status(message.includes("required") ? 400 : 500).json({ message });
    }
}
