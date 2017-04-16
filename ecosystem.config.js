// For development purposes
module.exports = {
  apps: [
    {
      name: "insta-slackbot",
      script: "./bin/www",
      watch: true,
      ignore_watch: ["resources/", ".git/"],
      log_date_format: "YYYY-MM-DD HH:mm Z"
    }
  ]
}
