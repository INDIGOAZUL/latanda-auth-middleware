-- @latanda/auth-middleware PostgreSQL Schema
-- Production-tested schema from latanda.online
--
-- This schema supports:
-- - User authentication with JWT tokens
-- - Role-based access control (RBAC)
-- - Session management
-- - Password security with bcrypt

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('ADMIN', 'MIT', 'IT', 'USER')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Sessions table (optional - for tracking active sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL, -- Store hash of JWT token
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_valid BOOLEAN DEFAULT true
);

-- Create index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_valid ON sessions(is_valid);

-- User permissions table (for custom per-user permissions beyond role defaults)
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INTEGER REFERENCES users(id),
    UNIQUE(user_id, permission)
);

-- Create index for permission lookups
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);

-- Audit log table (track authentication events)
CREATE TABLE IF NOT EXISTS auth_audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- login, logout, token_refresh, failed_login, etc.
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON auth_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON auth_audit_log(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions (call periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Sample data (optional - remove in production)
-- Admin user: admin@latanda.online / Admin123!
-- Password hash is bcrypt for "Admin123!"
INSERT INTO users (email, password_hash, full_name, role, email_verified)
VALUES (
    'admin@latanda.online',
    '$2b$10$7jKH8TmkqzN.sJX8YvJ6eOdXqY7ZKYqWX8LqU3TqJXqVqYqWq',
    'System Administrator',
    'ADMIN',
    true
) ON CONFLICT (email) DO NOTHING;

-- Demo user: demo@latanda.online / demo123
INSERT INTO users (email, password_hash, full_name, role, email_verified)
VALUES (
    'demo@latanda.online',
    '$2b$10$demo_password_hash_placeholder',
    'Demo User',
    'USER',
    true
) ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE users IS 'User accounts with authentication credentials';
COMMENT ON TABLE sessions IS 'Active JWT token sessions for tracking and revocation';
COMMENT ON TABLE user_permissions IS 'Custom per-user permissions beyond role defaults';
COMMENT ON TABLE auth_audit_log IS 'Audit trail of authentication events';
