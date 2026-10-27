import crypto from "node:crypto";

const algorithm = "aes-256-gcm";
const keyVersion = 1;

function getEncryptionKey(): Buffer {
    const encodedKey = process.env.CERTIFICATE_ENCRYPTION_KEY;

    if (!encodedKey) {
        throw new Error("Missing required environment variable: CERTIFICATE_ENCRYPTION_KEY");
    }

    const key = Buffer.from(encodedKey, "base64");
    if (key.length !== 32) {
        throw new Error("CERTIFICATE_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
    }

    return key;
}

export function encryptSecret(value: Buffer | string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(algorithm, getEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value), cipher.final()]);
    const tag = cipher.getAuthTag();

    return JSON.stringify({
        version: keyVersion,
        iv: iv.toString("base64"),
        tag: tag.toString("base64"),
        value: encrypted.toString("base64"),
    });
}

export function decryptSecret(serialized: string): Buffer {
    const payload = JSON.parse(serialized) as {
        version: number;
        iv: string;
        tag: string;
        value: string;
    };

    if (payload.version !== keyVersion) {
        throw new Error(`Unsupported certificate encryption key version: ${payload.version}`);
    }

    const decipher = crypto.createDecipheriv(
        algorithm,
        getEncryptionKey(),
        Buffer.from(payload.iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
    return Buffer.concat([
        decipher.update(Buffer.from(payload.value, "base64")),
        decipher.final(),
    ]);
}
