-- XP earned for this quiz, calculated by the server when the result is saved.
-- Max per quiz: 10 correct x 200 (expert) + 50 bonus = 2050.
ALTER TABLE quiz_attempts
  ADD COLUMN xp SMALLINT UNSIGNED NOT NULL DEFAULT 0;
