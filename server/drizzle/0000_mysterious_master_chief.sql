CREATE TABLE `connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('mysql','redis','mongodb') NOT NULL,
	`name` varchar(50) NOT NULL,
	`host` varchar(100) NOT NULL,
	`port` int NOT NULL,
	`username` varchar(100),
	`password` varchar(100),
	`database` varchar(100),
	`creator` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` datetime DEFAULT NULL,
	CONSTRAINT `connections_id` PRIMARY KEY(`id`)
);
