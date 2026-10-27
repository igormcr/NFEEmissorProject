CREATE TABLE certificates (
    id uniqueidentifier NOT NULL PRIMARY KEY,
    userId nvarchar(255) NOT NULL,
    subject nvarchar(255) NULL,
    cnpj nvarchar(14) NULL,
    issuer nvarchar(255) NULL,
    serialNumber nvarchar(255) NULL,
    validFrom datetime2 NOT NULL,
    expiresAt datetime2 NOT NULL,
    status nvarchar(20) NOT NULL,
    encryptedCertificate nvarchar(max) NOT NULL,
    encryptedPassword nvarchar(max) NOT NULL,
    encryptionKeyVersion int NOT NULL CONSTRAINT DF_certificates_encryptionKeyVersion DEFAULT 1,
    createdAt datetime2 NOT NULL CONSTRAINT DF_certificates_createdAt DEFAULT SYSUTCDATETIME(),
    updatedAt datetime2 NOT NULL CONSTRAINT DF_certificates_updatedAt DEFAULT SYSUTCDATETIME()
);

CREATE INDEX IX_certificates_userId ON certificates (userId);
