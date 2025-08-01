-- Add password reset fields to users table
ALTER TABLE users 
ADD COLUMN "resetPasswordToken" TEXT,
ADD COLUMN "resetPasswordExpires" TIMESTAMP(6);

-- Add comments for documentation
COMMENT ON COLUMN users."resetPasswordToken" IS 'For password reset functionality';
COMMENT ON COLUMN users."resetPasswordExpires" IS 'Token expiration for password reset'; 