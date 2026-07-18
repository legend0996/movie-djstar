-- ============================================================================
-- DJ Star Original Movies - Database Triggers
-- ============================================================================

-- Prevent deleting the last developer account
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_prevent_last_developer_delete
BEFORE DELETE ON users
FOR EACH ROW
BEGIN
  IF OLD.role_id = (SELECT id FROM roles WHERE slug = 'developer') THEN
    IF (SELECT COUNT(*) FROM users WHERE role_id = (SELECT id FROM roles WHERE slug = 'developer') AND deleted_at IS NULL) <= 1 THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot delete the last developer account';
    END IF;
  END IF;
END//
DELIMITER ;

-- Auto-set published_at when movie status changes to published
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_movie_published_at
BEFORE UPDATE ON movies
FOR EACH ROW
BEGIN
  IF NEW.status = 'published' AND (OLD.status != 'published' OR OLD.status IS NULL) THEN
    SET NEW.published_at = NOW();
  END IF;
END//
DELIMITER ;

-- Update movie popularity score on purchase
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_movie_popularity_purchase
AFTER UPDATE ON movies
FOR EACH ROW
BEGIN
  IF NEW.total_purchases > OLD.total_purchases THEN
    UPDATE movies SET popularity_score = (
      total_views * 1 + total_purchases * 10 + total_streams * 3 + total_downloads * 5
    ) WHERE id = NEW.id;
  END IF;
END//
DELIMITER ;

-- Log user status changes
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_user_status_change
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, created_at)
    VALUES (
      NEW.id,
      'user_status_changed',
      'user',
      NEW.id,
      JSON_OBJECT('status', OLD.status),
      JSON_OBJECT('status', NEW.status),
      NOW()
    );
  END IF;
END//
DELIMITER ;
