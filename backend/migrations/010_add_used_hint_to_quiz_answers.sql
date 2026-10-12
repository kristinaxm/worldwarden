-- A correct answer given after using a hint gives half XP.
ALTER TABLE quiz_answers
  ADD COLUMN used_hint BOOLEAN NOT NULL DEFAULT FALSE;
