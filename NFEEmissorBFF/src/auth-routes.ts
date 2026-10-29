import type { Request, Response } from "express";
import { AppDataSource } from "./data-source.js";
import { createAccessToken, findUserByEmail, getAuthenticatedUserId, hashPassword, publicUser, verifyPassword } from "./auth.js";
import { User } from "./entities/User.js";

function credentials(request: Request): { email: string; password: string; name?: string } {
    const { email, password, name } = request.body ?? {};
    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || password.length < 8) {
        throw new Error("A valid email and a password with at least 8 characters are required");
    }
    return { email: email.trim().toLowerCase(), password, name: typeof name === "string" ? name.trim() : undefined };
}

export async function register(request: Request, response: Response) {
    try {
        const { email, password, name } = credentials(request);
        if (!name) {
            response.status(400).json({ message: "Name is required" });
            return;
        }
        if (await findUserByEmail(email)) {
            response.status(409).json({ message: "Email is already registered" });
            return;
        }
        const user = await AppDataSource.getRepository(User).save(
            AppDataSource.getRepository(User).create({ name, email, passwordHash: hashPassword(password) }),
        );
        response.status(201).json({ token: createAccessToken(user), user: publicUser(user) });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not register user";
        response.status(message.includes("required") ? 400 : 500).json({ message });
    }
}

export async function login(request: Request, response: Response) {
    try {
        const { email, password } = credentials(request);
        const user = await findUserByEmail(email);
        if (!user || !verifyPassword(password, user.passwordHash)) {
            response.status(401).json({ message: "Invalid email or password" });
            return;
        }
        response.json({ token: createAccessToken(user), user: publicUser(user) });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not log in";
        response.status(message.includes("required") ? 400 : 500).json({ message });
    }
}

export async function currentUser(request: Request, response: Response) {
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: Number(getAuthenticatedUserId(request)) } });
    if (!user) {
        response.status(401).json({ message: "User not found" });
        return;
    }
    response.json({ user: publicUser(user) });
}
