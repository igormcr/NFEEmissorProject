import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { AppDataSource } from "./data-source.js";
import { User } from "./entities/User.js";

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters");
}
const signingSecret: string = jwtSecret;

type AuthenticatedRequest = Request & { userId?: string };

function base64Url(value: string | Buffer): string {
    return Buffer.from(value).toString("base64url");
}

function signToken(userId: number): string {
    const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = base64Url(JSON.stringify({ sub: String(userId), exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }));
    const content = `${header}.${payload}`;
    const signature = createHmac("sha256", signingSecret).update(content).digest("base64url");
    return `${content}.${signature}`;
}

function readToken(token: string): string | null {
    const parts = token.split(".");
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;

    const expected = createHmac("sha256", signingSecret).update(`${parts[0]}.${parts[1]}`).digest();
    const received = Buffer.from(parts[2], "base64url");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

    try {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { sub?: string; exp?: number };
        if (!payload.sub || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
        return payload.sub;
    } catch {
        return null;
    }
}

export function hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
    if (!storedHash) return false;
    const [salt, expectedHex] = storedHash.split(":");
    if (!salt || !expectedHex) return false;
    const expected = Buffer.from(expectedHex, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return expected.length > 0 && timingSafeEqual(actual, expected);
}

export function createAccessToken(user: User): string {
    return signToken(user.id);
}

export function publicUser(user: User) {
    return { id: String(user.id), name: user.name, email: user.email };
}

export function authenticateRequest(request: Request, response: Response, next: NextFunction): void {
    const authorization = request.header("Authorization");
    const userId = authorization?.startsWith("Bearer ") ? readToken(authorization.slice(7).trim()) : null;
    if (!userId) {
        response.status(401).json({ message: "Authentication required" });
        return;
    }

    (request as AuthenticatedRequest).userId = userId;
    next();
}

export function getAuthenticatedUserId(request: Request): string {
    const userId = (request as AuthenticatedRequest).userId;
    if (!userId) {
        throw new Error("Authentication required");
    }
    return userId;
}

export async function findUserByEmail(email: string): Promise<User | null> {
    return AppDataSource.getRepository(User).findOne({ where: { email } });
}
