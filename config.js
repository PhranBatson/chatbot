const config = {}

config.account = process.env.BOT_USERNAME;
config.authKey = process.env.OAUTH_TOKEN;
config.channel = process.env.CHANNEL_NAME;

module.exports = config;