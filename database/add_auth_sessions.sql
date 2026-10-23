-- Apply before deploying persistent sessions; safe to run more than once.
BEGIN;

CREATE TABLE IF NOT EXISTS t_auth_session (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES t_user(id),
    credentials_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_refresh_token (
    token_hash VARCHAR(64) PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES t_auth_session(id),
    consumed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_auth_session_user ON t_auth_session(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_session_expiry ON t_auth_session(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_token_session ON t_refresh_token(session_id);

COMMIT;
