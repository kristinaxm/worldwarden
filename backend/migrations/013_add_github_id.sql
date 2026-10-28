-- GitHub accounts live in the users table like everyone else:
-- github_id identifies them and password_hash stays empty since they never set one.
ALTER TABLE users
  MODIFY COLUMN password_hash VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT '',
  ADD COLUMN github_id VARCHAR(20) CHARACTER SET ascii COLLATE ascii_bin NULL,
  ADD UNIQUE KEY users_github_id_unique (github_id);
