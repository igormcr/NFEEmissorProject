CREATE TABLE users (
    id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name nvarchar(100) NOT NULL,
    email nvarchar(255) NOT NULL UNIQUE,
    createdAt datetime2 NOT NULL CONSTRAINT DF_users_createdAt DEFAULT SYSUTCDATETIME()
);
