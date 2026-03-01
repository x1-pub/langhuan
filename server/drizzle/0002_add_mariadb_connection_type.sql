ALTER TABLE `connections`
MODIFY COLUMN `type` enum('mysql','mariadb','redis','mongodb','pgsql') NOT NULL;
