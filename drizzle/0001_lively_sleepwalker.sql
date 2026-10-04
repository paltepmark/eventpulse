CREATE TABLE `agentActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`symbol` varchar(16) NOT NULL,
	`title` varchar(180) NOT NULL,
	`detail` text NOT NULL,
	`confidence` double NOT NULL DEFAULT 0,
	`decision` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentActivities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`symbol` varchar(16) NOT NULL,
	`name` varchar(120) NOT NULL,
	`side` enum('long','short') NOT NULL DEFAULT 'long',
	`quantity` int NOT NULL,
	`entryPrice` double NOT NULL,
	`markPrice` double NOT NULL,
	`pnl` double NOT NULL DEFAULT 0,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `riskSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`maxPositionValue` double NOT NULL DEFAULT 5000,
	`dailyLossLimit` double NOT NULL DEFAULT 3000,
	`volatilityThreshold` enum('low','medium','high') NOT NULL DEFAULT 'high',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `riskSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `risk_settings_user_id_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`symbol` varchar(16) NOT NULL,
	`eventTitle` varchar(180) NOT NULL,
	`signal` varchar(16) NOT NULL,
	`quantity` int NOT NULL,
	`price` double NOT NULL,
	`notional` double NOT NULL,
	`confidence` double NOT NULL DEFAULT 0,
	`status` enum('approved','rejected') NOT NULL DEFAULT 'approved',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`startingBalance` double NOT NULL DEFAULT 100000,
	`cashBalance` double NOT NULL DEFAULT 100000,
	`equity` double NOT NULL DEFAULT 100000,
	`todayPnl` double NOT NULL DEFAULT 0,
	`realizedPnl` double NOT NULL DEFAULT 0,
	`winRate` double NOT NULL DEFAULT 0,
	`totalTrades` int NOT NULL DEFAULT 0,
	`wins` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	`eventsScanned` int NOT NULL DEFAULT 0,
	`analyses` int NOT NULL DEFAULT 0,
	`decisions` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaces_user_id_unique` UNIQUE(`userId`)
);
