-- Värden styr när spelet går vidare, i stället för en timer per fråga.
-- current_question är frågan rummet visar just nu (1-10).
ALTER TABLE coplay_rooms
  ADD COLUMN current_question TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER started_at;

-- Ett svar per spelare och fråga, sparat direkt när spelaren svarar.
-- Behövs för att räkna hur många som svarat på den aktuella frågan: i quiz_answers
-- är ett överhoppat svar också NULL, så där går det inte att se vem som svarat.
CREATE TABLE IF NOT EXISTS coplay_answers (
  room_id BIGINT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  question_number TINYINT UNSIGNED NOT NULL,
  country_answer VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  capital_answer VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (room_id, user_id, question_number),
  CONSTRAINT coplay_answers_room_fk FOREIGN KEY (room_id) REFERENCES coplay_rooms(id) ON DELETE CASCADE,
  CONSTRAINT coplay_answers_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
