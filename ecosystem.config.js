// For development purposes
module.exports = {
  apps: [
    {
      name: "insta-slackbot",
      script: "./bin/www",
      watch: true,
      ignore_watch: [".git/"]
    }
  ]
}
