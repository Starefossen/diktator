-- Add XP and level tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

-- Add XP awarded tracking to test_results for audit trail
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS xp_awarded INTEGER NOT NULL DEFAULT 0;

-- Index for efficient XP leaderboard queries (if ever needed) and level filtering
CREATE INDEX IF NOT EXISTS idx_users_total_xp ON users(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);

-- Award XP to existing test results retroactively
-- This uses the same formula as the XP service:
-- Base XP by mode, score multiplier, first-time bonus (3x), repetition decay
DO $$
DECLARE
    base_xp INTEGER;
    score_mult NUMERIC;
    first_time_mult NUMERIC;
    decay_mult NUMERIC;
    awarded_xp INTEGER;
    result_record RECORD;
    completion_count INTEGER;
    is_first_time BOOLEAN;
BEGIN
    -- Process each test result in chronological order
    FOR result_record IN
        SELECT id, user_id, word_set_id, mode, score, completed_at
        FROM test_results
        WHERE xp_awarded = 0
        ORDER BY user_id, completed_at
    LOOP
        -- Get base XP for mode
        base_xp := CASE result_record.mode
            WHEN 'letterTiles' THEN 10
            WHEN 'wordBank' THEN 15
            WHEN 'missingLetters' THEN 20
            WHEN 'translation' THEN 20
            WHEN 'keyboard' THEN 25
            WHEN 'flashcard' THEN 5
            WHEN 'lookCoverWrite' THEN 20
            ELSE 10
        END;

        -- Calculate score multiplier
        score_mult := CASE
            WHEN result_record.score >= 100 THEN 2.0
            WHEN result_record.score >= 90 THEN 1.5
            WHEN result_record.score >= 70 THEN 1.0
            WHEN result_record.score >= 50 THEN 0.75
            ELSE 0.5
        END;

        -- Check if this is first completion of this wordset+mode for this user
        SELECT COUNT(*) INTO completion_count
        FROM test_results
        WHERE user_id = result_record.user_id
          AND word_set_id = result_record.word_set_id
          AND mode = result_record.mode
          AND completed_at < result_record.completed_at;

        is_first_time := (completion_count = 0);

        -- First time bonus
        first_time_mult := CASE WHEN is_first_time THEN 3.0 ELSE 1.0 END;

        -- Repetition decay (for completions within 7 days prior)
        SELECT COUNT(*) INTO completion_count
        FROM test_results
        WHERE user_id = result_record.user_id
          AND word_set_id = result_record.word_set_id
          AND mode = result_record.mode
          AND completed_at < result_record.completed_at
          AND completed_at >= (result_record.completed_at - INTERVAL '7 days');

        decay_mult := CASE
            WHEN completion_count <= 1 THEN 1.0
            WHEN completion_count = 2 THEN 0.5
            WHEN completion_count = 3 THEN 0.25
            ELSE 0.1
        END;

        -- Calculate awarded XP (round up, minimum 1)
        awarded_xp := GREATEST(1, CEIL(base_xp * score_mult * first_time_mult * decay_mult));

        -- Update test result
        UPDATE test_results
        SET xp_awarded = awarded_xp
        WHERE id = result_record.id;

        -- Update user's total XP
        UPDATE users
        SET total_xp = total_xp + awarded_xp
        WHERE id = result_record.user_id;
    END LOOP;

    -- Update user levels based on total XP
    UPDATE users
    SET level = CASE
        WHEN total_xp < 100 THEN 1
        WHEN total_xp < 300 THEN 2
        WHEN total_xp < 600 THEN 3
        WHEN total_xp < 1000 THEN 4
        WHEN total_xp < 1500 THEN 5
        WHEN total_xp < 2100 THEN 6
        WHEN total_xp < 2800 THEN 7
        WHEN total_xp < 3600 THEN 8
        WHEN total_xp < 4500 THEN 9
        WHEN total_xp < 5500 THEN 10
        ELSE 10 + ((total_xp - 4500) / 1000)
    END
    WHERE total_xp > 0;
END $$;
