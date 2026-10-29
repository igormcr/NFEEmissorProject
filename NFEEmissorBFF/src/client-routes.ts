import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { AppDataSource } from "./data-source.js";
import { Client } from "./entities/Client.js";
import { getAuthenticatedUserId } from "./auth.js";

function publicClient(client: Client) {
    let address: unknown;
    try {
        address = JSON.parse(client.addressJson);
    } catch {
        address = {};
    }

    return {
        id: client.id,
        legalName: client.legalName,
        tradeName: client.tradeName,
        cnpj: client.cnpj,
        stateRegistration: client.stateRegistration,
        municipalRegistration: client.municipalRegistration,
        taxRegime: client.taxRegime,
        certificateId: client.certificateId,
        address,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
    };
}

function readClientBody(request: Request) {
    const { legalName, tradeName, cnpj, stateRegistration, municipalRegistration, taxRegime, certificateId, address } =
        request.body ?? {};
    if (typeof legalName !== "string" || !legalName.trim() || typeof cnpj !== "string" || !cnpj.trim()) {
        throw new Error("legalName and cnpj are required");
    }
    if (!address || typeof address !== "object" || Array.isArray(address)) {
        throw new Error("address is required");
    }

    return {
        legalName: legalName.trim(),
        tradeName: typeof tradeName === "string" ? tradeName.trim() || null : null,
        cnpj: cnpj.replace(/\D/g, ""),
        stateRegistration: typeof stateRegistration === "string" ? stateRegistration.trim() || null : null,
        municipalRegistration: typeof municipalRegistration === "string" ? municipalRegistration.trim() || null : null,
        taxRegime: typeof taxRegime === "string" ? taxRegime.trim() || null : null,
        certificateId: typeof certificateId === "string" ? certificateId.trim() || null : null,
        addressJson: JSON.stringify(address),
    };
}

export async function listClients(request: Request, response: Response) {
    try {
        const clients = await AppDataSource.getRepository(Client).find({
            where: { userId: getAuthenticatedUserId(request) },
            order: { legalName: "ASC" },
        });
        response.json(clients.map(publicClient));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not list clients";
        response.status(message.includes("required") ? 400 : 500).json({ message });
    }
}

export async function createClient(request: Request, response: Response) {
    try {
        const userId = getAuthenticatedUserId(request);
        const client = AppDataSource.getRepository(Client).create({
            id: randomUUID(),
            userId,
            ...readClientBody(request),
        });
        const saved = await AppDataSource.getRepository(Client).save(client);
        response.status(201).json(publicClient(saved));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not create client";
        response.status(message.includes("required") ? 400 : 500).json({ message });
    }
}

export async function updateClient(request: Request, response: Response) {
    try {
        const userId = getAuthenticatedUserId(request);
        const id = request.params.id;
        if (!id || Array.isArray(id)) {
            response.status(400).json({ message: "Invalid client id" });
            return;
        }
        const repository = AppDataSource.getRepository(Client);
        const client = await repository.findOne({ where: { id, userId } });
        if (!client) {
            response.status(404).json({ message: "Client not found" });
            return;
        }
        repository.merge(client, readClientBody(request));
        response.json(publicClient(await repository.save(client)));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not update client";
        response.status(message.includes("required") ? 400 : 500).json({ message });
    }
}

export async function deleteClient(request: Request, response: Response) {
    try {
        const userId = getAuthenticatedUserId(request);
        const id = request.params.id;
        if (!id || Array.isArray(id)) {
            response.status(400).json({ message: "Invalid client id" });
            return;
        }
        const result = await AppDataSource.getRepository(Client).delete({ id, userId });
        if (!result.affected) {
            response.status(404).json({ message: "Client not found" });
            return;
        }
        response.status(204).send();
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not delete client";
        response.status(message.includes("required") ? 400 : 500).json({ message });
    }
}
