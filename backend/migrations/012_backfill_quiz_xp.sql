-- Gives XP to quizzes finished before XP was calculated (same rules as src/xpLevels.js).
-- No hints existed then, so every correct answer gives full XP.
UPDATE quiz_attempts
SET xp = score * CASE difficulty
    WHEN 'beginner' THEN 50
    WHEN 'medium' THEN 100
    WHEN 'advanced' THEN 150
    WHEN 'expert' THEN 200
  END + IF(score = total_questions, 50, 0)
WHERE completed_at IS NOT NULL AND xp = 0 AND score > 0;
