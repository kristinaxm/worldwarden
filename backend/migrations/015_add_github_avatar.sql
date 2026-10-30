-- The profile picture from GitHub, updated at every GitHub login.
-- avatar = 'github' means the user shows this picture instead of an emoji avatar.
ALTER TABLE users
  ADD COLUMN github_avatar_url VARCHAR(255) NULL;
