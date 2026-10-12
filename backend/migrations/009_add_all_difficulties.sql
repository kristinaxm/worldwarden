-- All four difficulties can be saved. Which ones a user may play is decided by their level in the backend.
ALTER TABLE quiz_attempts
  MODIFY COLUMN difficulty ENUM('beginner', 'medium', 'advanced', 'expert') NOT NULL;
