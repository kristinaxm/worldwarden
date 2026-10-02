CREATE TABLE IF NOT EXISTS countries (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code CHAR(2) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  UNIQUE KEY countries_code_unique (code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  difficulty ENUM('beginner') NOT NULL,
  score TINYINT UNSIGNED NOT NULL DEFAULT 0,
  total_questions TINYINT UNSIGNED NOT NULL DEFAULT 10,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  CONSTRAINT quiz_attempts_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS quiz_answers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  attempt_id BIGINT UNSIGNED NOT NULL,
  country_id INT UNSIGNED NOT NULL,
  question_number TINYINT UNSIGNED NOT NULL,
  country_answer VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT quiz_answers_attempt_fk FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  CONSTRAINT quiz_answers_country_fk FOREIGN KEY (country_id) REFERENCES countries(id),
  UNIQUE KEY quiz_answers_attempt_question_unique (attempt_id, question_number)
) ENGINE=InnoDB;
