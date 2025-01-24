-- Clean existing data
TRUNCATE TABLE users CASCADE;

-- Insert test users
-- Note: password is 'password123' encrypted with bcrypt
INSERT INTO users (id, username, password, image, "createdAt", "updatedAt")
VALUES 
  ('usr_01', 'zhangsan', '$2a$10$xWkqQh6rUu.4HYzKxEJqK.KzHjzp8fFZn3HzAK8t9TgmqFrXCR1Hy', 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usr_02', 'lisi', '$2a$10$xWkqQh6rUu.4HYzKxEJqK.KzHjzp8fFZn3HzAK8t9TgmqFrXCR1Hy', 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usr_03', 'wangwu', '$2a$10$xWkqQh6rUu.4HYzKxEJqK.KzHjzp8fFZn3HzAK8t9TgmqFrXCR1Hy', 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
