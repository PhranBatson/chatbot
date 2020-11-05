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
  howManyHeals: 0,
  owlbears: [],
  players: 
    [{
      name: "Kyle",
      id: 0,
      class: "Wizard",
      exp: 10,
      hitpoints: 40,
    },
    {
      name: "OtherKyle",
      id: 1,
      class: "Fighter",
      exp: 100,
      hitpoints: 40,
    }],
}

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat message
  // const commandName = msg.trim();

  // Turn chat message into array
  const commandName = msg.split(' ');
  // Sends each word in the array to the switch looking for commands
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
        gameJson.players.push({
          name: context['display-name'], 
          id: gameJson.players.length,
          class: "Fighter", 
          exp: 0, 
          hitpoints: 40,
        });
        console.log(`* Added  ${context['display-name']} to the party`);
      }
      break;
    case '!owlbear':
      gameJson.activeBattle = true;
      client.say(target, `THWOMP!!`)
      // create # of owlbears based on party size
      spawnOwlbears();
      gameJson.howManyRounds = 0;
      while(gameJson.owlbears.length>0) {
        console.log(`Owlbear HP: ${gameJson.owlbears}`);
        combatRound();
      }
      gameJson.activeBattle = false;
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
function spawnOwlbears () {
  var owlbearArr = [];
  var partySize = gameJson.players.length;
  for (i=0; i<=partySize; i+=2) {
    var hp = 25;
    for (j=1; j<=5; j++)  {
      hp += rollDice(10);
    }
    owlbearArr.push(hp);
  }
  gameJson.owlbears = owlbearArr;
}

// Function to simulate one combat round
// -returns changed owlbear array
function combatRound() {
  gameJson.howManyRounds++;

  owlbearDmgTaken();
}

function owlbearDmgTaken() {
  var owlbearAC = 15;

  var dmg = 0;
  var flanked = false;
  gameJson.players.forEach(player => {
    var toHit = rollDice(20);
    switch(player.class) {
      case 'Fighter':
        if((toHit+8) >= owlbearAC) {
          dmg = rollDice(8) + 3;
          hurtOwlbear(dmg, 1);
          flanked = true;
          console.log(`Hit for ${dmg} damage.`);
        }
        break;
      case 'Cleric':
        var lowHP;
        gameJson.players.forEach(player => {
          // find who has least hp
          if(player.hitpoints<40) {

          }
        });
        break;
      case 'Wizard':
        if(gameJson.howManyRounds<=4) {
          dmg = rollDice(6) + rollDice(6) + 2;
          hurtOwlbear(dmg, 3);
          console.log(`Magicd for ${dmg} damage.`);
        }
        else if((toHit+1) >= owlbearAC) {
          dmg = rollDice(6) - 1;
          hurtOwlbear(dmg, 1);
          flanked = true;
        }
        break;
    }
  });
  gameJson.players.forEach(player => {
    if(player.class === 'Rogue') {
      var toHit = rollDice(20);
      if((toHit+4) >= owlbearAC) {
        dmg = rollDice(8);
        if(flanked) {dmg += rollDice(6) + rollDice(6) + rollDice(6);}
        hurtOwlbear(dmg, 1);
        console.log(`Rogued for ${dmg} damage.`);
      }
  }});
}

// Called to hurt the first owlbear in the array
function hurtOwlbear (dmg, howmany) {
  for (i=0; i<howmany; i++) {
    if(gameJson.owlbears[i]>=0) {gameJson.owlbears[i] -= dmg;}
  }
  if(gameJson.owlbears[0]<=0) {gameJson.owlbears.shift();}
}

// Function called when the "dice" command is issued
function rollDice (sides) {
  return Math.floor(Math.random() * sides) + 1;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}