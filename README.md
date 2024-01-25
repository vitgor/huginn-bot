# Hello, i'm Huginn!

Huginn is a simple chatbot for Discord guild server. Huginn is based on discord-js librady, and it can be runned as a NodeJS application, it needs MySQL databse too.

### Features
* joined members are automatically added to the database
* give an achievement by the command sent (available for administrators only)
* toss a coin to the guild member by the command sent (available for administrators only)
* show guild member profile with current level, coins amount and earned achievements list
* create an event by the command sent (available for administrators only)
* guild users registration to the event, 
* shows registered users list
* roll a dice (d6-d20) and show a random card out from the deck of playing cards 
* generates a Bifrost "join to play" link to enable joining Steam lobby from the Discord server

### Technical requirements
Ensure that neede software is installed on your server:
* Node.JS >= 16.19.1
* MySQL >= 5.5

## Installation How-to
Create a config.json file in a directory that contains the following configuration.
```json
{
    "token": "your Discord bot token here",
    "client_id": "your Application ID here",
    "guild_id": "your Discord Server ID here",
    "log_channel_id": "read-only log channel ID here",
    "event_notify_role_id": "Role, which will be notified when an event created",
    "admin_roles": "Moderator & Admin roles titles here",
    "db_config": {
        "host": "localhost",
        "dbname": "database title",
        "dbuser": "database username",
        "dbpass": "database user password"
    },
    "bifrost_config": {
        "roleid": "Your bifrost role_id here"
    },
    "ui": {
        "icon_url": "Your bot icon URL here",
        "title":    "Your server or bot title here"
    }
}
```
Run the bot commands registration in a Discord guild server:
```bash
npm run bot.install
```
Create an a new MySQL database using the following structure:
```mysql
SET NAMES utf8;

CREATE DATABASE `sfx_drdbot` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `sfx_drdbot`;

DROP TABLE IF EXISTS `drd_levels`;
CREATE TABLE `drd_levels` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `level` smallint(6) NOT NULL,
  `title` varchar(55) NOT NULL,
  `symbol` varchar(55) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `drd_achievements`;
CREATE TABLE `drd_achievements` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `code` smallint(6) NOT NULL,
  `level` smallint(6) NOT NULL,
  `title` varchar(55) NOT NULL,
  `description` varchar(512) DEFAULT NULL,
  `coins` smallint(3) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `drd_users`;
CREATE TABLE `drd_users` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `uid` varchar(55) NOT NULL,
  `level` smallint(6) NOT NULL,
  `coins` smallint(3) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `drd_usr_ach`;
CREATE TABLE `drd_usr_ach` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ach_id` varchar(55) NOT NULL,
  `user_id` varchar(55) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id` int(10) NOT NULL  AUTO_INCREMENT,
  `event_title` varchar(500) NOT NULL,
  `event_date` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `event_location` varchar(500) NOT NULL,
  `event_description` varchar(2000) DEFAULT NULL,
  `event_url` varchar(1000) DEFAULT NULL,
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `quests`;
CREATE TABLE `quests` (
  `id` int(10) NOT NULL  AUTO_INCREMENT,
  `quest_title` varchar(1000) NOT NULL,
  `quest_description` varchar(2000) NOT NULL,
  `quest_date` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `quest_reward` varchar(200) NOT NULL,
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `events_usr`;
CREATE TABLE `events_usr` (
  `id` int(10) NOT NULL  AUTO_INCREMENT,
  `event_id` int(10) DEFAULT NULL,
  `user_uid` varchar(55) NOT NULL,
  `user_status` enum('0','1') NOT NULL DEFAULT '0',
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `quests_usr`;
CREATE TABLE `quests_usr` (
  `id` int(10) NOT NULL  AUTO_INCREMENT,
  `quest_id` int(10) NOT NULL,
  `user_uid` varchar(55) NOT NULL,
  `user_status` enum('0','1') NOT NULL DEFAULT '0',
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `drd_bifrost`;
CREATE TABLE `drd_bifrost` (
  `id` int(10) NOT NULL  AUTO_INCREMENT,
  `user_uid` varchar(55) NOT NULL,
  `steam_id` varchar(55) DEFAULT NULL,
  `xbox_id` varchar(55) DEFAULT NULL,
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
```

Attention: You also need to fill drd_levels and drd_achievements tables with your data before to run the bot.

## Running the bot
Being in a bot directory, run a command to start it:
```bash
npm run bot.start
```

I'm recommending to use the pm2 process management tool to automate bot start/restart process.

Read more:
- https://discord.js.org/docs/packages/discord.js/main
- https://pm2.keymetrics.io/docs/usage/quick-start/
