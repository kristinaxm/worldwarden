-- The answer for capital questions (medium, and expert later)
ALTER TABLE quiz_answers
  ADD COLUMN capital_answer VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL AFTER country_answer;
