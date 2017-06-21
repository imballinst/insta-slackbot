# Instagram Slackbot

[Instagram API](https://www.instagram.com/developer/endpoints/) and [Slack app](https://efishery.slack.com/apps) with [Botkit](https://github.com/howdyai/botkit). Built for quick marketing queries and announcing media posts with [NodeJS](http://nodejs.org/) and [MongoDB](https://www.mongodb.com/).

## Bot commands (Work In Progress)

There are two bot command types, media query and administration. Both of them use the database to do their job correctly. Media query commands are related to Instagram media posts, while administration commands are related to user privileges.

### Query Commands

#### List of Query Commands

Command     | Description                 |
----------- | --------------------------- |
!help       | Show list of commands       |
!review     | Review all media posts      |
!count      | Count number of media posts |
!mostlikes  | Show posts with most likes  |

#### Query Commands Arguments

Argument     | Shorthand     | Default          | Description                           |
------------ | ------------- | ---------------- | ------------------------------------- |
--from       | -f            | Last Monday      | Start date in *DD-MM-YYYY* format     |
--to         | -t            | Next Sunday      | End date in *DD-MM-YYYY* format       |
--sort       | -s            | -                | Sorting order in *field:order* format |

Available sorting parameters for sort argument:

1. **field**: *time*, *likes*, *comments*, *tags*,
2. **order**: *asc* (ascending), *desc* (descending).

#### Queries Example

1. Review media posts on this week: `!review`
2. Get medias with most likes on certain period, sorted ascending on likes field: `!mostlikes -f 15-06-2017 -t 22-06-2017 -s likes:asc`

### Administration Commands

#### List of Administration Commands

Command     | Description                       |
----------- | --------------------------------- |
!promote    | Grants given user admin privilege |
!demote     | Removes privilege from given user |

#### Administration Commands Arguments

Argument     | Shorthand     | Default          | Description    |
------------ | ------------- | ---------------- | -------------- |
--user       | -u            | -                | Slack username |
