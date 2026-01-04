CREATE TABLE user
(
    id    TEXT NOT NULL PRIMARY KEY,
    token TEXT NOT NULL
) STRICT;

CREATE UNIQUE INDEX idx_user_token ON USER (token);

CREATE TABLE document
(
    id       TEXT    NOT NULL PRIMARY KEY,
    user_id  TEXT REFERENCES USER (id) ON DELETE CASCADE,
    version  INTEGER NOT NULL,
    name     TEXT    NOT NULL,
    password TEXT
) STRICT;

CREATE UNIQUE INDEX idx_document_name ON DOCUMENT (name)
