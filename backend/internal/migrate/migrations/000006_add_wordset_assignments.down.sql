-- Rollback: Remove wordset assignments

DROP TRIGGER IF EXISTS enforce_wordset_assignment_child ON wordset_assignments;
DROP FUNCTION IF EXISTS check_wordset_assignment_is_child();
DROP TABLE IF EXISTS wordset_assignments;
