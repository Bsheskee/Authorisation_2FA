CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT    UNIQUE NOT NULL,
    password_hash   TEXT    NOT NULL,
    totp_secret     TEXT,
    is_2fa_enabled  INTEGER DEFAULT 0,
    failed_attempts INTEGER DEFAULT 0,
    locked_until    TEXT,
    created_at      TEXT    DEFAULT (datetime('now')),
    updated_at      TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER,
    action      TEXT    NOT NULL,
    ip_address  TEXT,
    user_agent  TEXT,
    details     TEXT,
    created_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
