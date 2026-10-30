-- Co-play: one room per hosted game. The questions are built once and stored here,
-- so every player in the room gets exactly the same questions and answer options.
CREATE TABLE IF NOT EXISTS coplay_rooms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code CHAR(6) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  host_id INT UNSIGNED NOT NULL,
  difficulty ENUM('beginner','medium','advanced','expert') NOT NULL,
  questions JSON NOT NULL,
  started_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT coplay_rooms_host_fk FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY coplay_rooms_code_unique (code),
  INDEX coplay_rooms_created (created_at)
) ENGINE=InnoDB;

-- One row per player. attempt_id is the player's own quiz_attempts row, so a co-play
-- quiz counts exactly like a normal quiz for results, XP and medals.
CREATE TABLE IF NOT EXISTS coplay_players (
  room_id BIGINT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  attempt_id BIGINT UNSIGNED NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (room_id, user_id),
  CONSTRAINT coplay_players_room_fk FOREIGN KEY (room_id) REFERENCES coplay_rooms(id) ON DELETE CASCADE,
  CONSTRAINT coplay_players_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT coplay_players_attempt_fk FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE SET NULL
) ENGINE=InnoDB;
