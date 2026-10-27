import forge from "node-forge";

export type ParsedCertificate = {
    subject: string | null;
    cnpj: string | null;
    issuer: string | null;
    serialNumber: string | null;
    validFrom: Date;
    expiresAt: Date;
};

function attribute(certificate: forge.pki.Certificate, name: string): string | null {
    const value = certificate.subject.attributes.find(
        (item) => item.shortName === name || item.name === name,
    )?.value;
    return typeof value === "string" ? value : null;
}

function findCnpj(certificate: forge.pki.Certificate): string | null {
    const values = certificate.subject.attributes
        .map((item) => item.value)
        .filter((value): value is string => typeof value === "string");
    const match = values.join(" ").match(/\d{14}/);
    return match?.[0] ?? null;
}

export function parsePfx(content: Buffer, password: string): ParsedCertificate {
    try {
        const asn1 = forge.asn1.fromDer(content.toString("binary"));
        const pkcs12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);
        const certBagOid = forge.pki.oids.certBag;
        const certificateBag = certBagOid
            ? pkcs12.getBags({ bagType: certBagOid })[certBagOid]?.[0]
            : undefined;
        const certificate = certificateBag?.cert;

        if (!certificate) {
            throw new Error("The PFX file does not contain a certificate");
        }

        return {
            subject: attribute(certificate, "CN"),
            cnpj: findCnpj(certificate),
            issuer: (certificate.issuer.attributes as Array<{ value?: unknown }>)
                .map((item) => item.value)
                .filter((value): value is string => typeof value === "string")
                .join(", ") || null,
            serialNumber: certificate.serialNumber || null,
            validFrom: certificate.validity.notBefore,
            expiresAt: certificate.validity.notAfter,
        };
    } catch {
        throw new Error("Invalid PFX certificate or password");
    }
}
