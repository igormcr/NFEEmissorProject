ALTER TABLE users ADD passwordHash nvarchar(255) NULL;

-- Existing users must define a password before they can log in.
-- The column is made mandatory after those records are migrated.
