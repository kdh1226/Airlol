CREATE TABLE `player_champion_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`position` varchar(50) NOT NULL,
	`championName` varchar(100) NOT NULL,
	`wins` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	CONSTRAINT `player_champion_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_matchup_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`position` varchar(50) NOT NULL,
	`opponentName` varchar(100) NOT NULL,
	`wins` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	CONSTRAINT `player_matchup_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_position_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerName` varchar(100) NOT NULL,
	`position` varchar(50) NOT NULL,
	`wins` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	CONSTRAINT `player_position_stats_id` PRIMARY KEY(`id`)
);
