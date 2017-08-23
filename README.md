# Instagram Slackbot

[Instagram API](https://www.instagram.com/developer/endpoints/) and [Slack app](https://efishery.slack.com/apps) with [Botkit](https://github.com/howdyai/botkit). Built for quick marketing queries and announcing media posts with [NodeJS](http://nodejs.org/) and [MongoDB](https://www.mongodb.com/).

## Features

Currently, this bot only has two two features:
1. Broadcast Instagram media posts to a channel
2. Query Instagram media posts from a timerange (review, get most likes, get posts likes count)
3. Query bot administration (promote/demote admin, activate/deactivate channel broadcasting)

## Installation

To install this bot, follow these steps:
1. Clone this repository, `git clone https://github.com/Imballinst/insta-slackbot`
2. Change current directory to the cloned repo with `cd insta-slackbot`
3. Install the dependencies `npm install`
4. Install the PM2 (process manager) globally `npm install -g pm2`
4. Make sure you have created and authorized yourself in your Slack App and Instagram App.
5. Copy `.env.example` to `.env`, fill the variables according to your environment settings
6. Finally, to start the bot, run `npm start` and track the logs with `pm2 logs`

## Bot commands

There are two bot command types, media query and administration. Both of them use the database to do their job correctly. Media query commands are related to Instagram media posts, while administration commands are related to user privileges.

### Query Commands

Query commands are made in Bahasa Indonesia using regular expressions. Note that there are alternatives to these commands, for example, "jumlah likes" and "jumlah post likes" will yield the same result. Date parameters are parsed using [Moment.js](http://momentjs.com/).

#### List of Query Commands

Command         | Description                       | Status    |
--------------- | --------------------------------- | --------- |
review          | Review all media posts            | Available |
jumlah likes    | Count number of posts likes       | Available |
likes terbanyak | Show posts with most likes        | Available |

#### Query Commands Arguments

Argument | Alias / Shorthand  | Default         | Description                           | Available for  | Required |
-------- | ------------------ | --------------- | ------------------------------------- | -------------- | -------- |
dari     | dr                 | Last Monday     | Start date in `DD-MM-YYYY` format     | *all commands* | No       |
sampai   | smp, sampe. hingga | Next Sunday     | End date in `DD-MM-YYYY` format       | *all commands* | No       |
urutkan  | urutin             | `time membesar` | Sorting order in `field order` format | *review*       | No       |

Available sorting parameters for sort argument:

1. **field**: `time`, `likes`, `comments`, `tags`,
2. **order**: `membesar` (ascending), `mengecil` (descending).

#### Queries Example

1. Review media posts on this week: `review`
2. Get medias with most likes on certain period: `likes terbanyak dr 15-06-2017 smp 22-06-2017`

### Administration Commands

#### List of Administration Commands

Command       | Description                             | Status    |
------------- | --------------------------------------- | --------- |
bantuan       | Show list of commands                   | Available |
list admins   | Show list of admins                     | Available |
promosi       | Grant given user admin privilege        | Available |
demosi        | Remove privilege from given user        | Available |
list channels | Show list of broadcast channels         | Available |
aktifkan      | Activate a channel for broadcast        | Available |
nonaktifkan   | Disable a channel for broadcast         | Available |

#### Administration Commands Arguments

Argument     | Alias / Shorthand | Default          | Description             | Related commands          | Required |
------------ | ----------------- | ---------------- | ----------------------- | ------------------------- | -------- |
user         | pengguna          | -                | Slack username          | `promote`, `demote`       | Yes      |
channel      | kanal             | -                | Channel name or `~here` | `aktifkan`, `nonaktifkan` | Yes      |
