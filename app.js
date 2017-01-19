const Discord = require("discord.js");
const Evaluator = require("poker-evaluator");
const pokerBot = new Discord.Client();
const prefix = "$";

var round = 9,
    dealt = 0,
    startMoney = 100,
    eval,
    maxIndex = 0,
    flop;
var nextMsg = "Use **$deal** to start the next round...";
var _s = "   ";

var shorthand = {
    T: "10",
    c: ":clubs:",
    d: ":diamonds:",
    h: ":hearts:",
    s: ":spades:"
};

var fullname = {
    "high card": "High Card :top:",
    "one pair": "Pair :pear:",
    "two pairs": "Two Pair :pear::pear:",
    "three of a kind": "Three of a Kind :slot_machine:",
    "straight": "Straight :heart::yellow_heart::green_heart::blue_heart::purple_heart:",
    "flush": "Flush :toilet:",
    "full house": "Full House :house_with_garden:",
    "four of a kind": "Four of a Kind :dart::dart::dart::dart:",
    "straight flush": "Straight/Royal Flush :dollar::crown::moneybag:"
}

pokerBot.on("ready", () => {
    console.log("Poker Bot v0.6 loaded.");
});

function shuffle(array) { //Shuffle Cards
    var cur = array.length,
        temp, rand;
    while (0 !== cur) {
        rand = Math.floor(Math.random() * cur);
        cur -= 1;
        temp = array[cur];
        array[cur] = array[rand];
        array[rand] = temp;
    }
    return array;
}

playerArray = [];
playerCount = 0;

function Player(name, money) {
    this.name name;
    this.hand = [];
    this.handVal = 0;
    this.handName = "";
    this.money = money;
};

var Poker = {};
Poker.community = [];
Poker.rankArray = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
Poker.suitArray = ["c", "d", "h", "s"];
Poker.newDeck = function() {
    Poker.deck = [];
    Poker.deckDisplay = [];
    for (i = 0; i < Poker.rankArray.length; i++) {
        for (j = 0; j < Poker.suitArray.length; j++) {
            Poker.deck.push(Poker.rankArray[i] + Poker.suitArray[j]);
        }
    }
}
Poker.calcHands = function() {
    for(i=0; i < Player.count; i++) {
        eval = Evaluator.evalHand(Player.hands[i].concat(Poker.community));
        Player.handsVal[i] = eval.value;
        Player.handsName[i] = eval.handName;
    }
    maxIndex = Player.handsVal.indexOf(Math.max(...Player.handsVal));
    return maxIndex;
}

pokerBot.on("guildMemberAdd", guild => {
    member.guild.defaultChannel.sendMessage(`Welcome ${member.user.username}! Type $help to get started...`);
})

pokerBot.on("message", message => {
    function code(lang, arg) {
        message.channel.sendCode(lang, arg);
    }
    
    function dm(arg) {
        message.author.sendMessage(arg);
    }

    function embed(titleArg, desc) {
        message.channel.sendEmbed({
            title: titleArg,
            description: desc
        });
    }

    function msg(arg) {
        message.channel.sendMessage(arg);
    }
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    var command = message.content.split(" ")[0];
    command = command.slice(prefix.length);

    var args = message.content.split(" ").slice(1);

    if (command === "poker" || command === "new") {
        if (playerCount >= 2 && playerCount <= 9) {
            Poker.newDeck(Player.count, args[0]);
            shuffle(Poker.deck);
            for (i = 0; i < Poker.deck.length; i++) {
                Poker.deckDisplay.push("**" + Poker.deck[i].replace(/T|c|d|h|s/gi, function(matched) {
                    return shorthand[matched];
                }) + "**");
            }
            //embed("Shuffled Deck", Poker.deckDisplay.toString().replace(/,/g, _s));
            round = 0;
            dealt = 0;
            Player.hands = [];
            Player.handsVal = [];
            Player.handsName = [];
            Poker.community = [];
            msg("Deck shuffled. Use **$deal** to start the game...");
        } else {
            msg("You need 2-9 players to start a game. Use **$player** for more info...");
        }
    }

    if (command === "player" || command === "p") {
        switch (args[0]) {
            case "add":
                if (typeof args[1] === 'string' && args[1].substr(0,1) == "@") { //Better test for username needed
                    playerArray.push(new Player(args[1], startMoney));
                    msg(`${args[1]} was added to the game.`);
                } else {
                    msg('Invalid username.');
                }
                break;
            case "del":
                if (typeof args[1] === 'string' && args[1].substr(0,1) == "@") {
                    if (Player.players.indexOf(args[1] > -1)) {
                        Player.players.splice(args[1], 1);
                        msg(`${args[1]} was removed to the game.`);
                    }
                } else {
                    msg('Invalid username.');
                }
                break;
            case "clr":
                Player.players = [];
                msg('Players reset.');
                break;
            case "list":
                msg(Player.players.toString());
                break;
            default:
                msg("```Fix\n$player [add/del] {name} - Add/remove players to the game```");
                break;
        }
        Player.count = Player.players.length;
    }
    
    if (command === "ante") {
        //Send message: message.author.send("starting hand");
    }

    if (command === "deal") {
        switch (round) {
            case 0:
                round++;
                embed("Round 1: Pre-Flop");
                msg("Please wait until all cards are dealt...");
                for (i = 0; i < Player.count * 2 - 1; i += 2) {
                    embed(Player.players[i / 2] + "'s Cards", Poker.deckDisplay[i] + _s + Poker.deckDisplay[i + 1]);
                    Player.hands[i / 2] = [Poker.deck[i], Poker.deck[i + 1]];
                }
                msg(nextMsg);
                dealt = 4;
                break;
            case 1:
                round++;
                flop = Poker.deckDisplay[dealt] + _s + Poker.deckDisplay[dealt + 1] + _s + Poker.deckDisplay[dealt + 2];
                embed("Round 2: Flop", flop);
                msg(nextMsg);
                break;
            case 2:
                round++;
                embed("Round 3: Turn", `${flop}   ${Poker.deckDisplay[dealt + 3]}`);
                msg(nextMsg);
                break;
            case 3:
                round = 9;
                embed("Final Round: River", `${flop}   ${Poker.deckDisplay[dealt + 3]}   ${Poker.deckDisplay[dealt + 4]}`);
                for (j=0; j < 5; j++) {
                    Poker.community.push(Poker.deck[dealt + j]);
                }
                maxIndex = Poker.calcHands();
                msg(`${Player.players[maxIndex]} wins with a **${Player.handsName[maxIndex].replace(/^high card$|^one pair$|^two pairs$|^three of a kind$|^straight$|^flush$|^full house$|^four of a kind$|^straight flush$/gi, function(matched) {
                    return fullname[matched];
                })}**`);
                embed(Player.players[maxIndex] + "'s Cards", Poker.deckDisplay[2*maxIndex] + _s + Poker.deckDisplay[2*maxIndex + 1]);
                msg("Play again with **$new** or **$poker**!");
                break;
            case 9:
                msg("Use **$poker** to shuffle and start again");
                break;
        }
    }

    if (command === "draw") {
        msg("Your card is: ");
        embed(null, Poker.deck[Math.random * Poker.deck.length]);
    }

    if (command === "help" || command === "commands") {
        code("fix",`$help/$commands - Display this command list
$deal - Deals cards to all players
$draw - Draw a random card from the deck
$money {amount} - Set the starting balance for each player
$player/$p [add/del/clr/list] - Add/remove/clear/list players
$poker/$new - Shuffles the deck and starts a new game`);
    }
});

pokerBot.login("MjcxMDgyOTE0NTQyOTExNDkw.C2E3GQ.YPOqT8xC60_cCrxZCoQ-ZrJuPiE");