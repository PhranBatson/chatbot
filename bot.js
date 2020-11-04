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
  activeBattle: false,
  howManyRounds: 0,
  players: 
    [{
      name: "playerName",
      class: "Wizard",
      exp: 10,
      hitpoints: 100,
    },
    {
      name: "playerTwo",
      class: "Fighter",
      exp: 100,
      hitpoints: 100,
    }],
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
  if (!gameJson.activeBattle) {
  switch(commandName) {
    case '!dice':
      const num = rollDice(20);
      // console.log(context);
      client.say(target, `${context['display-name']} rolled a ${num}.`);
      console.log(`* Executed ${commandName} command`);
      break;
    case '!join':
      var dupe = false;
      gameJson.players.forEach(player => {
        if(player.name === context['display-name']) {
          dupe = true;
      }});
      if(!dupe) {
        client.say(target, `${context['display-name']} joined the party!`);
        gameJson.players.push({name: context['display-name'], class: "Fighter", exp: 0, hitpoints: 100,});
        console.log(`* Added  ${context['display-name']} to the party`);
      }
      break;
    case '!owlbear':
      // gameJson.activeBattle = true;
      client.say(target, `THWOMP!!`)
      // create owlbear with hp based on party size
      var owlbearHP = spawnOwlbear(gameJson.players.length);
      console.log(owlbearHP);
      gameJson.howManyRounds = 0;
      while(owlbearHP>0) {
        owlbearHP -= combatRound();
      }
      console.log(`* Executed ${commandName} command`);
      break;
    case '!fighter':
      gameJson.players.forEach(player => {
        if(player.name === context['display-name']) {
          player.class = "Fighter";
          console.log(`* Changed ${context['display-name']} class to Fighter.`);
      }});
      break;
    case '!cleric':
      gameJson.players.forEach(player => {
        if(player.name === context['display-name']) {
          player.class = "Cleric";
          console.log(`* Changed ${context['display-name']} class to Cleric.`);
      }});
      break;
    case '!rogue':
      gameJson.players.forEach(player => {
        if(player.name === context['display-name']) {
          player.class = "Rogue";
          console.log(`* Changed ${context['display-name']} class to Rogue.`);
      }});
      break;
    case '!wizard':
      gameJson.players.forEach(player => {
        if(player.name === context['display-name']) {
          player.class = "Wizard";
          console.log(`* Changed ${context['display-name']} class to Wizard.`);
      }});
      break;
    case '!party':
      var outString = "The party consists of ";
      gameJson.players.forEach(player => {outString += player.name + " the " + player.class + ", ";});
      client.say(target, outString);
      console.log(gameJson.players);
      break;
    default:
      console.log(`* Unknown command ${commandName}`);
  }}
  else console.log(`* Command received during active battle.`)

}

// Function to calculate owlbear size
function spawnOwlbear (partySize) {
  var hp = 21;
  for (i=0; i<=partySize; i++)  {
    hp += rollDice(10);
  }
  return hp;
}

// Function to simulate one combat round
// -returns change to owlbear hp
function combatRound() {
  gameJson.howManyRounds++;

  return owlbearDmgTaken();
}

function owlbearDmgTaken() {
  var dmg = 0;
  var flanked = false;
  gameJson.players.forEach(player => {
    var toHit = rollDice(20);
    switch(player.class) {
      case 'Fighter':
        if((toHit+3) >= 13) {
          dmg += rollDice(8) + 2;
          flanked = true;
        }
        break;
      case 'Cleric':
        break;
      case 'Wizard':
        if(gameJson.howManyRounds<=3) {
          dmg += rollDice(12) + rollDice(12) + 2;
        }
        else if((toHit-1) >= 13) {
          dmg += rollDice(4) - 1;
          flanked = true;
        }
        break;
    }
  });
  gameJson.players.forEach(player => {
    if(player.class === "Rogue") {

  }});

  return dmg;
}

// Function called when the "dice" command is issued
function rollDice (sides) {
  return Math.floor(Math.random() * sides) + 1;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}