CREATE TABLE `champions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`wins` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `champions_id` PRIMARY KEY(`id`),
	CONSTRAINT `champions_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `match_players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`team` int NOT NULL,
	`champion` varchar(100),
	`position` varchar(50),
	CONSTRAINT `match_players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchDate` varchar(20) NOT NULL,
	`title` varchar(200),
	`team1Name` varchar(100) NOT NULL DEFAULT '팀 1',
	`team2Name` varchar(100) NOT NULL DEFAULT '팀 2',
	`winner` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`wins` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	`mainPosition` varchar(50),
	`memo` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`),
	CONSTRAINT `players_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `sync_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`syncType` varchar(50) NOT NULL,
	`status` varchar(20) NOT NULL,
	`message` text,
	`playersCount` int DEFAULT 0,
	`championsCount` int DEFAULT 0,
	`matchesCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sync_logs_id` PRIMARY KEY(`id`)
);
