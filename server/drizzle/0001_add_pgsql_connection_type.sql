ALTER TABLE `connections`
MODIFY COLUMN `type` enum('mysql','redis','mongodb','pgsql') NOT NULL;
