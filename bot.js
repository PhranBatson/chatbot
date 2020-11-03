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
    'whitephran'
  ] 
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Declare JSON
var gameJson = {
  players: 
    [{
      name: "playerName",
      class: "Wizard",
      exp: 10,
    },
    {
      name: "playerTwo",
      class: "Fighter",
      exp: 100,
    }]
}
// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message
  // const commandName = msg.trim();

  // Turn chat message into array
  const commandName = msg.split(' ');
  commandName.forEach(commandName => {cmdSwitch(commandName, target, context);});

}

// Function to call commands found in chat message
function cmdSwitch(commandName, target, context) {
  switch(commandName) {
    case '!dice':
      const num = rollDice();
      // console.log(context);
      client.say(target, `${context['display-name']} rolled a ${num}.`);
      console.log(`* Executed ${commandName} command`);
      break;
    case '!join':
      client.say(target, `${context['display-name']} joined the party!`);
      console.log(`* Executed ${commandName} command`);
      gameJson.players.push({name: context['display-name'], class: "Fighter", exp: 0,});
      console.log(gameJson.players);
      break;
    case '!party':
      var outString = "The party consists of ";
      gameJson.players.forEach(player => {outString += player.name + " the " + player.class + ", ";});
      client.say(target, outString);
      break;
    default:
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