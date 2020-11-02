require('dotenv').config();
const tmi = require('tmi.js');
const config = require("./config");

// Define configuration options
const opts = {
  identity: {
    username: config.account,
    password: config.authKey
  },
  channels: [
    // config.channel
    'highonshrugs'
  ] 
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message
  const commandName = msg.trim();

  // If the command is known, let's execute it
  if (context.mod) {
    client.say(target, `This game is not for mods, ${context['display-name']}.`);
  }else if (commandName === '!dice') {
    const num = rollDice();
    // console.log(context);
    client.say(target, `${context['display-name']} rolled a ${num}.`);
    console.log(`* Executed ${commandName} command`);
  } else {
    console.log(`* Unknown command ${commandName}`);
  }
}
// Function called when the "dice" command is issued
function rollDice () {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}
// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}