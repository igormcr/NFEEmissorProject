CREATE TABLE clients (
    id uniqueidentifier NOT NULL PRIMARY KEY,
    userId nvarchar(255) NOT NULL,
    legalName nvarchar(255) NOT NULL,
    tradeName nvarchar(255) NULL,
    cnpj nvarchar(14) NOT NULL,
    stateRegistration nvarchar(30) NULL,
    municipalRegistration nvarchar(30) NULL,
    taxRegime nvarchar(20) NULL,
    certificateId nvarchar(255) NULL,
    addressJson nvarchar(max) NOT NULL,
    createdAt datetime2 NOT NULL CONSTRAINT DF_clients_createdAt DEFAULT SYSUTCDATETIME(),
    updatedAt datetime2 NOT NULL CONSTRAINT DF_clients_updatedAt DEFAULT SYSUTCDATETIME()
);

CREATE INDEX IX_clients_userId ON clients (userId);
CREATE INDEX IX_clients_userId_cnpj ON clients (userId, cnpj);

ALTER TABLE certificates ADD clientId nvarchar(255) NULL;
CREATE INDEX IX_certificates_userId_clientId ON certificates (userId, clientId);
CREATE UNIQUE INDEX UX_certificates_userId_clientId
    ON certificates (userId, clientId)
    WHERE clientId IS NOT NULL;
ALTER TABLE certificates
    ADD CONSTRAINT FK_certificates_clients
    FOREIGN KEY (clientId) REFERENCES clients(id);
