DELIMITER //

-- Daily revenue aggregation
CREATE PROCEDURE IF NOT EXISTS sp_get_daily_revenue(IN p_date DATE)
BEGIN
    SELECT
        DATE(o.paid_at) AS revenue_date,
        COUNT(DISTINCT o.id) AS total_orders,
        COUNT(DISTINCT o.user_id) AS unique_customers,
        SUM(oi.price) AS gross_revenue,
        SUM(oi.price * (1 - COALESCE(o.discount, 0) / 100)) AS net_revenue,
        AVG(oi.price) AS average_order_value
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.payment_status = 'paid'
      AND DATE(o.paid_at) = p_date
    GROUP BY DATE(o.paid_at);
END //

-- Movie statistics
CREATE PROCEDURE IF NOT EXISTS sp_get_movie_stats(IN p_movie_id INT)
BEGIN
    SELECT
        m.id,
        m.title,
        m.status,
        COUNT(DISTINCT oi.order_id) AS total_purchases,
        COUNT(DISTINCT sl.id) AS total_streams,
        COUNT(DISTINCT sl.user_id) AS unique_viewers,
        COALESCE(AVG(r.rating), 0) AS average_rating,
        COUNT(DISTINCT r.id) AS rating_count,
        MAX(sl.started_at) AS last_streamed_at
    FROM movies m
    LEFT JOIN order_items oi ON oi.movie_id = m.id
    LEFT JOIN stream_log sl ON sl.movie_id = m.id
    LEFT JOIN reviews r ON r.movie_id = m.id
    WHERE m.id = p_movie_id
    GROUP BY m.id, m.title, m.status;
END //

-- User purchase history with details
CREATE PROCEDURE IF NOT EXISTS sp_get_user_purchase_history(IN p_user_id INT)
BEGIN
    SELECT
        o.id AS order_id,
        o.created_at AS order_date,
        o.payment_status,
        o.total_amount,
        m.id AS movie_id,
        m.title AS movie_title,
        m.poster_url,
        oi.price AS item_price,
        oi.created_at AS purchase_date
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN movies m ON m.id = oi.movie_id
    WHERE o.user_id = p_user_id
    ORDER BY o.created_at DESC;
END //

-- Daily platform stats aggregation
CREATE PROCEDURE IF NOT EXISTS sp_aggregate_platform_stats(IN p_date DATE)
BEGIN
    INSERT INTO platform_stats (stat_date, total_users, new_users, total_orders, total_revenue, total_streams, active_users)
    SELECT
        p_date,
        (SELECT COUNT(*) FROM users WHERE created_at <= p_date + INTERVAL 1 DAY),
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = p_date),
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = p_date),
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(paid_at) = p_date AND payment_status = 'paid'),
        (SELECT COUNT(*) FROM stream_log WHERE DATE(started_at) = p_date),
        (SELECT COUNT(DISTINCT user_id) FROM stream_log WHERE DATE(started_at) = p_date)
    ON DUPLICATE KEY UPDATE
        total_users = VALUES(total_users),
        new_users = VALUES(new_users),
        total_orders = VALUES(total_orders),
        total_revenue = VALUES(total_revenue),
        total_streams = VALUES(total_streams),
        active_users = VALUES(active_users);
END //

DELIMITER ;
