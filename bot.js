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
    config.channel
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
      ac: 11,
      hitpoints: 20,
      dmgDone: 0,
    },
    {
      name: "OtherKyle",
      id: 1,
      class: "Fighter",
      exp: 100,
      ac: 18,
      hitpoints: 75,
      dmgDone: 0,
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
          ac: 18, 
          hitpoints: 75,
          dmgDone: 0,
        });
        console.log(`* Added  ${context['display-name']} to the party`);
      }
      break;
    case '!owlbear':
      gameJson.activeBattle = true;
      client.say(target, `THWOMP!!`)
      // create # of owlbears based on party size
      spawnOwlbears();
      gameJson.players.forEach(player => { player.dmgDone = 0; })
      gameJson.howManyRounds = 0;
      gameJson.howManyHeals = 0;
      while(gameJson.owlbears.length>0) {
        console.log(`Owlbear HP: ${gameJson.owlbears}`);
        combatRound();
      }
      gameJson.activeBattle = false;
      resetPlayerHP();
      reportCombat(target);
      console.log(`* Executed ${commandName} command`);
      break;
    case '!fighter':
      gameJson.players.forEach(player => {
        if(player.name === context['display-name']) {
          player.class = "Fighter";
          player.hitpoints = 75;
          player.ac = 17;
          console.log(`* Changed ${context['display-name']} class to Fighter.`);
      }});
      break;
    case '!cleric':
      gameJson.players.forEach(player => {
        if(player.name === context['display-name']) {
          player.class = "Cleric";
          player.hitpoints = 35;
          player.ac = 15;
          console.log(`* Changed ${context['display-name']} class to Cleric.`);
      }});
      break;
    case '!rogue':
      gameJson.players.forEach(player => {
        if(player.name === context['display-name']) {
          player.class = "Rogue";
          player.hitpoints = 30;
          player.ac = 13;
          console.log(`* Changed ${context['display-name']} class to Rogue.`);
      }});
      break;
    case '!wizard':
      gameJson.players.forEach(player => {
        if(player.name === context['display-name']) {
          player.class = "Wizard";
          player.hitpoints = 20;
          player.ac = 11;
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
  for (i=0; i<=gameJson.players.length; i+=2) {
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
  partyDmgTaken();
  owlbearDmgTaken();
}

//The owlbears damage the party
function partyDmgTaken() {
  var possibleOwlbearTargets = [];

  // look for fighters and add them to possible targets
  gameJson.players.forEach(player => {
    if(player.class === 'Fighter') {possibleOwlbearTargets.push(player.name);}
  });

  // if there were no fighters, add everyone in the party
  if(possibleOwlbearTargets.length <= 0) {
    gameJson.players.forEach(player => {
      possibleOwlbearTargets.push(player.name);
    });
  }

  console.log(`Owlbear targets: ${possibleOwlbearTargets}`);

  gameJson.owlbears.forEach(owlbear => {
    var target = rollDice(possibleOwlbearTargets.length);
    console.log(possibleOwlbearTargets[target-1]);
    // hurtPlayer(9, rollDice(6)+5, possibleOwlbearTargets[target-1]);
    hurtPlayer(9, rollDice(6)+5, possibleOwlbearTargets[target-1]);
    hurtPlayer(4, rollDice(8)+2, possibleOwlbearTargets[target-1]);
  })
}

//The party damages the owlbears
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
        if(gameJson.howManyHeals<2) {
          gameJson.players.forEach(player => {
            if(player.hitpoints <= 0) {
              player.hitpoints = rollDice(8) + rollDice(8) + rollDice(8) + 1;
              gameJson.howManyHeals++;
              console.log(`Healed for ${player.hitpoints}.`);
            }
          });
        }
        else if((toHit+4) >= owlbearAC) {
          dmg = rollDice(8);
          hurtOwlbear(dmg, 1);
          flanked = true;
        }
        break;
      case 'Wizard':
        if(gameJson.howManyRounds<4) {
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

// Called to reduce player's hp
function hurtPlayer (hitMod, dmg, who) {
  var toHit = rollDice(20) + hitMod;
  gameJson.players.forEach(player => {
    if(player.name === who) {
      if(toHit >= player.ac) {
        player.hitpoints -= dmg;
        console.log(`${who} was hurt for ${dmg} damage. Now they have ${player.hitpoints} hitpoints.`);
      }
  }})
}

// Called to reduce owlbear hp and remove dead ones
function hurtOwlbear (dmg, howmany) {
  for (i=0; i<howmany; i++) {
    if(gameJson.owlbears[i]>=0) {gameJson.owlbears[i] -= dmg;}
  }
  if(gameJson.owlbears[0]<=0) {gameJson.owlbears.shift();}
}

// Function to report the combat's results to chat
function reportCombat (target) {
  var outstring = "Combat completed.";
  client.say(target, outstring);
}

// Function to return player hitpoints to full after combat is finished
function resetPlayerHP () {
  gameJson.players.forEach(player => {
    switch(player.class) {
      case 'Fighter':
        player.hitpoints = 75;
        break;
      case 'Cleric':
        player.hitpoints = 35;
        break;
      case 'Wizard':
        player.hitpoints = 20;
        break;
      case 'Rogue':
        player.hitpoints = 30;
        break;
  }})
}

// Function called when the "dice" command is issued
function rollDice (sides) {
  return Math.floor(Math.random() * sides) + 1;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}