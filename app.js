const 	express 					= require('express'),
		bodyParser 					= require("body-parser"),
		mongoose 					= require('mongoose'),
		passport					= require("passport"),
		LocalStrategy				= require("passport-local"),
		passportLocalMongoose		= require("passport-local-mongoose"),
		User						= require("./models/user"),
		Night						= require("./models/night"),
		middleware 	              	= require ("./middleware/index"),
		dealtCardObj				= require ("./models/dealtCard"),
		seedNightDB 				= require ("./routes/seedNight"),
	  	methodOverride				= require("method-override"),
		flash						= require("connect-flash");

		  
var myConfig                    	= require ("./config"); // global variables available and changeable by all routes, I hope
var cardSecrets                    	= require ("./cardSecrets"); // global objects available and changeable by all routes, I hope
var formatDistanceToNowStrict 		= require('date-fns/formatDistanceToNowStrict') // to check the age of most recent "night" record
var cardDeck						= require("card-deck");

const  	indexRoutes					= require("./routes/index"),
		gameRoutes                  = require("./routes/game"),
		nightRoutes					= require("./routes/night"),
		playRoutes					= require("./routes/play");

const	app 						= express();
const	server 						= require('http').createServer(app);   //passed to http server
const 	io 							= require('socket.io')(server);        //http server passed to socket.io




if (process.env.NODE_ENV !== 'production') {
    const dotenv    = require("dotenv");
    dotenv.config();
  }

//============
//BRING IN LOCAL VARIABLES
//=============
app.locals.myConfig = myConfig;
app.locals.cardSecrets = cardSecrets;

app.use(require("express-session")({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false
}));

app.set("view engine","ejs");
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
//method override is needed so we can send PUT or DELETE requests from HTML forms that otherwise wouldn't support them
app.use(methodOverride("_method"));
app.use(flash());


//===================
//PASSPORT CONFIG
//===================
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//===========
//ROUTES SETUP
//============
app.use(function(req,res,next){
	//this adds a middleware function to EVERY route
	//also note: this block of code has to be ABOVE the code where we app.use the various external route js files
	res.locals.currentUser = req.user;
	//the line above creates an object called currentUser, taken from the user object if logged in, and sends it to the rendered destination view
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
	//need the next statement, or else the route handling process is halted here in the middleware
	});

//the first argument in the lines below sends that string to route so it's assumed to be part of the routes in those files
// app.use("/campgrounds", campgroundRoutes);
// app.use("/campgrounds/:id/comments", commentRoutes);
app.use(indexRoutes);
app.use(gameRoutes);
app.use(nightRoutes);
app.use(playRoutes);



mongoose.connect(process.env.DATABASEURL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
	useCreateIndex: true	
	})
	.then(() => console.log('Connected to DB!'))
	.catch(error => console.log(error.message));

//seedNightDB(); // remove all records and replace with the test records in the seedNight file

const PORT = process.env.PORT || 3000;
// with ||: 1st expression is always outputted. The 2nd expression only gets outputted if the 1st expression is falsy.
// with &&: 1st expression is outputted if it's FALSY. The 2nd expression only get outputted if the 1st expression is truthy.
server.listen(PORT, () => { // previously was app.listen, in case this change breaks something
	console.log(`Our app is running on port ${ PORT }`);
	
});


//========================
// CARD DECK SETUP
//=========================

const allCards = new cardDeck(cardSecrets.allCards);


//==========================
// HANDY FUNCTIONS FOR SOCKET EVENT HANDLING
//===========================

function getPlayerIndex (userID, array){
	for (let i=0; i<array.length;i++){
	  if (array[i].playerUser._id===userID){
		return i;
	  }
	}
  }

  function getPlayerSocketID (index, array){
	let id = array[index].playerUser._id;
	for (let i=0; i<myConfig.tonight.players.length;i++){
		if (myConfig.tonight.players[i].playerUser._id===id){
			return myConfig.tonight.players[i].socketID;
	 	}
	}
  }

function isEverybodyIn (currentGame, numTonightPlayers){
	if (currentGame.playersInGame.length + currentGame.playersOutOfGame.length === numTonightPlayers){ //all of tonight's players have either ante'd in, or are sitting out, for the current game
	  return true;
	} else {
	  return false;
	}
  }

function instructDealer (){
	let players = myConfig.tonight.players;
	//loop thru players and find out which index is the dealer
	for (let i=0; i<players.length; i++){
		if (players[i].isDealer===true){
		io.emit('status update',"Ready for dealer to take the next step.");
		//emit to dealer with 'dealer instruction' so they can take the next step in the game's playSequence
		// console.log(`At time of sending dealer instruction, MyConfig.tonight:
		// ${JSON.stringify(myConfig.tonight)}`);
		io.to(players[i].socketID).emit('dealer instruction',myConfig);
		break;
		}
	}
}

function getDealablePlayers (dealerIndex){
	myConfig.tonight.games[myConfig.tonight.games.length-1].dealablePlayers = [];
    for (let i=dealerIndex+1;i<myConfig.tonight.players.length+dealerIndex+1;i++){ //start with player to dealer's right, or next higher index in tonight.players
		let j = i%myConfig.tonight.players.length;
		//get that player's playerUser._id
		let jId = myConfig.tonight.players[j].playerUser._id;
		//loop thru playersInGame using k as counter
		for (let k = 0; k<myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length;k++){
			//if k's playerUser._id === j's, push that player object to myConfig.currentGame.dealablePlayers array
			let kId = myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[k].playerUser._id;
			if (jId===kId){
				myConfig.tonight.games[myConfig.tonight.games.length-1].dealablePlayers.push(myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[k]);
			}
		}
	}
}

function buildNextDealtCard (dealString){
		//remove first item from shuffledDeck array, add properties to create a dealtCard object
		let cardSeed = {};
		cardSeed.string = cardSecrets.shuffledDeck.shift();
		cardSeed.rank = "";
		switch(cardSeed.string.substr(0, 1)){
			case "t":
				cardSeed.rank = "10";
				break;
			case "j":
				cardSeed.rank = "Jack";
				break;
			case "q":
				cardSeed.rank = "Queen";
				break;
			case "k":
				cardSeed.rank = "King";
				break;
			case "a":
				cardSeed.rank = "Ace";
				break;
			default:
				cardSeed.rank = cardSeed.string.substr(0, 1);
		}
		cardSeed.suit = "";
		switch(cardSeed.string.substr(1, 1)){
			case "s":
				cardSeed.suit = "Spades";
				break;
			case "c":
				cardSeed.suit = "Clubs";
				break;
			case "d":
				cardSeed.suit = "Diamonds";
				break;
			case "h":
				cardSeed.suit = "Hearts";
				break;
		}
		cardSeed.rankvalue = 0; // placeholder for future functionality
		cardSeed.imgPath = `../images/cards/${cardSeed.string}.png`;
		cardSeed.faceUp = dealString.includes('FaceUp');
		cardSeed.peekable = myConfig.tonight.games[myConfig.tonight.games.length-1].peekAllowed;
		cardSeed.dealtCardsIndex = cardSecrets.dealtCards.length;
		//push this object onto dealtCards array
		cardSecrets.dealtCards.push(cardSeed);
		return cardSeed;
}

function getStringFromDCI (dci){
	let string = cardSecrets.dealtCards[dci].string;
	return string;
}

function getOverlayFromString (string){
	let suitHTMLEntity = "";
	let colorClass = "";
	let char1 = string.substr(0, 1);
    char1 = char1.toUpperCase();
	if (char1==="T"){
		char1 = "10";
	}
    let char2 = string.substr(1, 1);
	switch(char2){
	case "s":
		suitHTMLEntity = "&spades;";
		colorClass = "black";
		break;
	case "c":
		suitHTMLEntity = "&clubs;";
		colorClass = "black";
		break;
	case "d":
		suitHTMLEntity = "&diams;";
		colorClass = "red";
		break;
	case "h":
		suitHTMLEntity = "&hearts;";
		colorClass = "red";
		break;
	}
    overlayHTML = `<span class="cardOverlay ${colorClass}">${char1}&nbsp;<br>${suitHTMLEntity}</span>`;
	return overlayHTML;
}

function getNextBettorIndex (index){
	//figure out whose turn it will be next, by getting the player index of the NEXT person in the players-in-game array after the tonight index we pass to the function;
	//make sure it can loop around back to the beginning if needed
	for (let j=0;j<myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length;j++){
		if (myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[j].playerUser._id===myConfig.tonight.players[index].playerUser._id){
			//we found the person who checked
			let k=0;
			if (j<myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length-1){ // sent index is not the last in players-in-game array
				k=j+1; // k is the index of the next bettor in the players-in-game array, defaults to zero if the checker IS at the end of the array
			}
			let kId = myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[k].playerUser._id; // get next bettor's ID
			return getPlayerIndex (kId, myConfig.tonight.players);
		}
	}
}

function isPotGood(){
	let potIsGood = true;
	for (let i=0;i<myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length;i++){
		if (myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[i].amtBetInRound!==myConfig.bettingRound.amtBetInRound){
			potIsGood = false;
			break;
		}
	}
	return potIsGood;
}

function endBettingRound () {
	//loop thru all tonight's players and change their amtBetInRound back to zero
	for (let i=0;i<myConfig.tonight.players.length;i++){
		myConfig.tonight.players[i].amtBetInRound = 0;
	}
	//change myConfig.bettingRound to {}
	myConfig.bettingRound = {};
	//emit broadcast of "betting round ended", send myConfig(?)
	io.emit('betting round ended',myConfig);
	isGameOver();
}

function getDeclaredPlayers(myConfig) {
	let declaredPlayers = [];
	let jPlayerIndex = -1;
	let jPlayerCombinedString = ""
	for (let j=0; j<myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length;j++){
		jPlayerIndex = getPlayerIndex (myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[j].playerUser._id, myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame);
		if (myConfig.tonight.players[jPlayerIndex].declaration!==""){ // this player has declared
			jPlayerCombinedString = `${jPlayerIndex}${myConfig.tonight.players[jPlayerIndex].declaration}`; // e.g. "0high" if tonight player 0 went high
			declaredPlayers.push(jPlayerCombinedString);
		}
	}
	return declaredPlayers;
}

function isGameOver () {
	let myPlaySequence = myConfig.tonight.games[myConfig.tonight.games.length-1].playSequence;
	let myPlaySequenceLocation = myConfig.tonight.games[myConfig.tonight.games.length-1].playSequenceLocation;
	let declaredPlayers = [];
	if (myPlaySequenceLocation<myPlaySequence.length-1){ //we are not yet at the end of the playSequence
		//increment the game's playSequenceLocation by 1
		myPlaySequenceLocation += 1;
		myConfig.tonight.games[myConfig.tonight.games.length-1].playSequenceLocation = myPlaySequenceLocation
		//issue the new dealer instruction
		instructDealer();
	} else { // we have reached the end of the play sequence
		//emit a command that lets all players see all dealt cards
		io.emit('autoreveal all cards',cardSecrets.dealtCards);
		io.emit('status update','Time for dealer to select or confirm winners');
		//loop thru players and find out which index is the dealer
		let players = myConfig.tonight.players;
		for (let i=0; i<players.length; i++){
			if (players[i].isDealer===true){
			io.to(players[i].socketID).emit('choose winners',myConfig); // instruct dealer to choose winners
			break;
			}
		}
	}
}

function allocateWinnings (myConfig) {
	let winnersShare = 0;
	let lowWinnersShare = 0;
	let highWinnersShare = 0;
	let amtPotCarryOver = 0;
	let lowHalfPot = 0;
	let highHalfPot = 0;
	if (myConfig.tonight.games[myConfig.tonight.games.length-1].hilo==="High Only" || myConfig.tonight.games[myConfig.tonight.games.length-1].hilo==="Low Only"){
		//count the number of elements in the game.winners array, divide the amtPot equally among them, put any leftovers into the carry over for next game
		winnersShare = myConfig.tonight.games[myConfig.tonight.games.length-1].amtPot / myConfig.tonight.games[myConfig.tonight.games.length-1].winners.length;
		winnersShare = parseInt(winnersShare.toFixed(2),10);
		//assign the winnings amt to each of the winners in the array
		myConfig.tonight.games[myConfig.tonight.games.length-1].winners.forEach(element => {
			element.amt = winnersShare;
			myConfig.tonight.players[element.index].balanceForNight += winnersShare;
		});
		amtPotCarryOver = myConfig.tonight.games[myConfig.tonight.games.length-1].amtPot - (winnersShare * myConfig.tonight.games[myConfig.tonight.games.length-1].winners.length);
		// amtPotCarryOver = Number.parseFloat(amtPotCarryOver.toFixed(2));  //should not be necessary since previous line involves subtraction of integers
	} else { // it must be high-low
		//make sure at least one person went high and at least one went low; otherwise, all of the pot is shared among those who DID bid
		if (myConfig.tonight.games[myConfig.tonight.games.length-1].lowWinners.length>0){ //at least one low
			if (myConfig.tonight.games[myConfig.tonight.games.length-1].highWinners.length>0) { //at least one high
				//low folks get half the pot
				lowHalfPot = myConfig.tonight.games[myConfig.tonight.games.length-1].amtPot / 2;
				lowHalfPot = parseInt(lowHalfPot.toFixed(2),10);
			} else { //nobody went high, so low folks share the entire pot
				lowHalfPot = myConfig.tonight.games[myConfig.tonight.games.length-1].amtPot;
			}
		lowWinnersShare = lowHalfPot / myConfig.tonight.games[myConfig.tonight.games.length-1].lowWinners.length;
		lowWinnersShare = parseInt(lowWinnersShare.toFixed(2),10);
		//assign the winnings amt to each of the winners in the array
		myConfig.tonight.games[myConfig.tonight.games.length-1].lowWinners.forEach(element => {
			element.amt = lowWinnersShare;
			myConfig.tonight.players[element.index].balanceForNight += lowWinnersShare;
			});
		}
		if (myConfig.tonight.games[myConfig.tonight.games.length-1].highWinners.length>0){ //at least one high
			if (myConfig.tonight.games[myConfig.tonight.games.length-1].lowWinners.length>0) { //at least one low
				//high folks get half the pot
				highHalfPot = myConfig.tonight.games[myConfig.tonight.games.length-1].amtPot / 2;
				highHalfPot = parseInt(highHalfPot.toFixed(2),10);
			} else { //nobody went low, so high folks share the entire pot
				highHalfPot = myConfig.tonight.games[myConfig.tonight.games.length-1].amtPot;
			}
		highWinnersShare = highHalfPot / myConfig.tonight.games[myConfig.tonight.games.length-1].highWinners.length;
		highWinnersShare = parseInt(highWinnersShare.toFixed(2),10);
		//assign the winnings amt to each of the winners in the array
		myConfig.tonight.games[myConfig.tonight.games.length-1].highWinners.forEach(element => {
			element.amt = highWinnersShare;
			myConfig.tonight.players[element.index].balanceForNight += highWinnersShare;
			});
		}
		amtPotCarryOver = myConfig.tonight.games[myConfig.tonight.games.length-1].amtPot - ((lowWinnersShare * myConfig.tonight.games[myConfig.tonight.games.length-1].lowWinners.length) + (highWinnersShare * myConfig.tonight.games[myConfig.tonight.games.length-1].highWinners.length));
		// amtPotCarryOver = Number.parseFloat(amtPotCarryOver.toFixed(2));  //should not be needed
	}

	myConfig.amtPotCarryOver = amtPotCarryOver;
	console.log(`Here at the end of the allocation function:
	The game's pot was: ${myConfig.tonight.games[myConfig.tonight.games.length-1].amtPot} cents

	The winners array is:
	${JSON.stringify(myConfig.tonight.games[myConfig.tonight.games.length-1].winners)}

	The lowWinners array is:
	${JSON.stringify(myConfig.tonight.games[myConfig.tonight.games.length-1].lowWinners)}

	The highWinners array is:
	${JSON.stringify(myConfig.tonight.games[myConfig.tonight.games.length-1].highWinners)}

	The pot carry over is:
	${myConfig.amtPotCarryOver} cents
	`);
}


//=========================
//======SOCKET SERVER LOGIC
//=========================

io.on('connection', (socket) => {

	console.log('a user connected');

    socket.on('iAmConnected', (myConnectObject) => {
		//load the tonight object from database, populating players
		Night.findById(myConnectObject.tonightID, function (err, tonight) {
				if (err || !tonight){ //any random ID with proper number of characters can get a null return, not object but also not error, from MongoDB
					// req.flash("error","Could not find the data to load a game with that ID number for tonight. Please contact the host offline.");
					console.log("Getting ready to redirect to /game/wait ... ");
					res.redirect("/game/wait");
				} else { //success in database lookup of tonight ID
					console.log("Length of players array is " + tonight.players.length);
					//loop thru tonight's player array until you find the one with a user ID that matches passed userID
					for (let i=0; i<tonight.players.length; i++){
						if (tonight.players[i].playerUser.id===myConnectObject.userID){ //we have a match
							if (tonight.players[i].socketID === ""){ // new player connecting for the 1st time tonight, not reconnecting
								tonight.players[i].socketID = myConnectObject.socketID; //add the socketID from newly connected or reconnected player to the tonight DB record
								tonight.save(); //save the night to the db, including new player properties
								myConfig.tonight = tonight;
								io.emit('status update',"We welcome " + tonight.players[i].playerUser.firstName + " to the game.");
								io.emit('render new player for all', tonight.players[i].playerUser); //send newly added player's user object to every client
								io.to(tonight.players[i].socketID).emit('private message',"Your player index is " + i.toString()); // notify user of player index for session storage
								console.log("Sent private message to socket ID" + tonight.players[i].socketID + " that their index is " +i.toString());
								//if the newly connected player is dealer, send a private emit to them to unlock the "game" menu, etc.
								if (tonight.players[i].isDealer){
									io.to(tonight.players[i].socketID).emit('private message',"You are dealer");
								}
							}
							if (tonight.players[i].socketID === "disconnected"){ // player is reconnecting after being disconnected for whatever reason
								tonight.players[i].socketID = myConnectObject.socketID; //add the socketID from newly connected or reconnected player to the tonight DB record
								tonight.save(); //save the night to the db, including new player properties
								myConfig.tonight = tonight;
								console.log(`Player ${i.toString()} (${tonight.players[i].playerUser.firstName}) has reconnected with socketID ${tonight.players[i].socketID}`);
							}
						break;
					    } else {
							if (i===tonight.players.length-1){
								console.log("Sorry, could not find " + myConnectObject.userID + " in the players array."); // have looped all the way thru the array
							}
						}
					}
				}
			});
    });


	// socket.on('chat message', (msg) => {
	// 	io.emit('chat message', msg);
    // });

	socket.on('disconnect', () => {
		console.log('a user disconnected');
		
		//load the tonight object from database, populating players
		Night.findById(myConfig.tonight._id, function (err, tonight) {
				if (err || !tonight){ //any random ID with proper number of characters can get a null return, not object but also not error, from MongoDB
					io.emit("status update","Could not save tonight's settings to the database. Please contact Bluemont for help.");
					res.redirect("/game/wait");
				} else { //success in database lookup of tonight ID
					//loop thru tonight's player array until you find the one with a socket ID that matches the disconnected socket ID
					for (let i=0; i<tonight.players.length; i++){
						if (tonight.players[i].socketID===socket.id){ //we have a match
						tonight.players[i].socketID = "disconnected"; //replace the socketID from newly disconnected player with the word "disconnected" in the tonight DB record
						tonight.save(); //save the night to the db, including new player properties
						myConfig.tonight = tonight;
						console.log("Socket for " + tonight.players[i].playerUser.firstName + " is disconnected.");
					    }
					}
				}
			});
    });

	socket.on('game submit', (submittedGame) => {
		//create a new Game object from the submittedGame and save it to the db
		myConfig.tonight.games.push(submittedGame); //add the new game to the array of tonight's games
		myConfig.tonight.save();
		myConfig.gameInProgress = true;
		//loop thru players to find dealer
		for (let i=0; i<tonight.players.length; i++){
			if (myConfig.tonight.players[i].isDealer===true){
				myConfig.currentDealerIndex = i;
				break;
			}
		}

		myConfig.currentDealerName = myConfig.tonight.players[myConfig.currentDealerIndex].playerUser.fullName;

		//add any pot carrover amt to current game, then reset to zero
		if (myConfig.amtPotCarryOver!==0){
			myConfig.tonight.games[myConfig.tonight.games.length-1].amtPot += myConfig.amtPotCarryOver;
			myConfig.amtPotCarryOver = 0;
		}

		// console.log(`At time of game submit, MyConfig.tonight:
		// ${JSON.stringify(myConfig.tonight)}`);

		var shuffledDeck = allCards.shuffle();
		console.log("The shuffled deck: " + shuffledDeck._stack);
		cardSecrets.shuffledDeck = shuffledDeck._stack;
		io.emit('shuffle visual');
		io.emit('status update',"Deck has been shuffled. Waiting for players to ante.");
		//send this data as an object to all players
		io.emit('game open', myConfig);
	});

	socket.on('I ante', (playerIndex) => {
		//add player to players-in-game array
		myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.push(myConfig.tonight.players[playerIndex]);
		//sort the array by the time they joined the night, a proxy for their playerIndex that is not stored in their player object
		myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.sort(function(a, b) {
			return a.joinedNightDate - b.joinedNightDate;
		});
		//add ante amount to pot
		myConfig.tonight.games[myConfig.tonight.games.length-1].amtPot += myConfig.tonight.amtAnte;
		//subtract ante amount from player's balance
		myConfig.tonight.players[playerIndex].balanceForNight -= myConfig.tonight.amtAnte;
		//emit ante broadcast
		let anteBroadcastObject = {
			playerIndex:playerIndex,
			myConfig:myConfig
		}
		myConfig.tonight.save();
		io.emit('ante broadcast',anteBroadcastObject);
		//now check to see if all of tonight's players are either in this game or sitting out
		if (isEverybodyIn(myConfig.tonight.games[myConfig.tonight.games.length-1], myConfig.tonight.players.length)===true){
			//if true, change playSequenceLocation for this game to 0, first element in the playSequence array
			myConfig.tonight.games[myConfig.tonight.games.length-1].playSequenceLocation = 0;
			//instruct dealer to do that game action
			instructDealer ();
		}
	});

	socket.on('I sit out', (playerIndex) => {
		//add player to players-out-of-game array
		myConfig.tonight.games[myConfig.tonight.games.length-1].playersOutOfGame.push(myConfig.tonight.players[playerIndex]);
		//sort the array by the time they joined the night, a proxy for their playerIndex that is not stored in their player object
		myConfig.tonight.games[myConfig.tonight.games.length-1].playersOutOfGame.sort(function(a, b) {
			return a.joinedNightDate - b.joinedNightDate;
		});
		//emit sit out broadcast
		let sitOutBroadcastObject = {
			playerIndex:playerIndex,
			myConfig:myConfig
		}
		myConfig.tonight.save();
		io.emit('sit out broadcast',sitOutBroadcastObject);
		//now check to see if all of tonight's players are either in this game or sitting out
		if (isEverybodyIn(myConfig.tonight.games[myConfig.tonight.games.length-1], myConfig.tonight.players.length)===true){
			//if true, change playSequenceLocation for this game to 0, first element in the playSequence array
			myConfig.tonight.games[myConfig.tonight.games.length-1].playSequenceLocation = 0;
			//instruct dealer to do that game action
			instructDealer ();
		}
	});

	socket.on('I deal', (dealerIndex) => {
		io.emit("status update","Dealing ...");
		//figure out what kind of deal it will be, based on playSequenceLocation
		let dealString = myConfig.tonight.games[myConfig.tonight.games.length-1].playSequence[myConfig.tonight.games[myConfig.tonight.games.length-1].playSequenceLocation];
		//get an array of dealable players, starting w/ next player after dealer
		getDealablePlayers(dealerIndex);
		// console.log("Dealt cards thus far: " + JSON.stringify(cardSecrets.dealtCards));
		// console.log(`tonight's players:
		//  ${JSON.stringify(myConfig.tonight.players)}`);
		// console.log(`players in game:
		// ${JSON.stringify(myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame)}`);
		// console.log(`players out of game:
		// ${JSON.stringify(myConfig.tonight.games[myConfig.tonight.games.length-1].playersOutOfGame)}`);
		// console.log(`dealable players:
		// ${JSON.stringify(myConfig.tonight.games[myConfig.tonight.games.length-1].dealablePlayers)}`);
		//build an array consisting of a batch of cards to be dealt, to send to client
		let dealBatchCommon = [];
		myConfig.tonight.games[myConfig.tonight.games.length-1].dealablePlayers.forEach(element => {
			let nextDealtCard = buildNextDealtCard(dealString); //get the top card from shuffledDeck and build a new card object
			let singleCardForBatch = {};
			singleCardForBatch.tonightPlayerIndex = getPlayerIndex(element.playerUser._id,myConfig.tonight.players);
			singleCardForBatch.dci = nextDealtCard.dealtCardsIndex;
			singleCardForBatch.peekable = nextDealtCard.peekable;
			switch (dealString){
				case "dealFaceUp":
					singleCardForBatch.imgPath = nextDealtCard.imgPath;
					break;
				case "dealFaceDown":
					singleCardForBatch.imgPath = "../public/images/cards/back.png";
					break;
				default:
					console.log("I got an unfamiliar value for dealString variable");
			}
			//add to dealBatchCommon
			dealBatchCommon.push(singleCardForBatch);
		});
		let overlayHTML = "";
		let dealBatchObject = {};
		// if face up, or if facedown non-peekable, 
		if (dealString==="dealFaceUp" || (dealString==="dealFaceDown" && myConfig.tonight.games[myConfig.tonight.games.length-1].peekAllowed===false)){
			// add empty overlay as 2nd key, build object and send it broadcast-style
			dealBatchObject = {
				dealBatchCommon: dealBatchCommon,
				overlayHTML: overlayHTML,
				numShuffledDeckRemaining: cardSecrets.shuffledDeck.length
			};
			// console.log(`same deal batch for all clients:
			// ${JSON.stringify(dealBatchObject)}`);
			io.emit("deal batch broadcast",dealBatchObject);
		} else { // it's facedown and peekable 
			//loop through tonight players;
			let batchSent = false;
			for (let i=0; i<myConfig.tonight.players.length; i++) {
			batchSent = false;
				for (let j = 0; j<dealBatchCommon.length; j++){ //loop through dealBatchCommon
					if (dealBatchCommon[j].tonightPlayerIndex===i){ //if tonightPlayer key = i,
						let overlayString = getStringFromDCI(dealBatchCommon[j].dci);
						let overlayHTML = getOverlayFromString(overlayString);
						//add that to broadcast object
						dealBatchObject = {
							dealBatchCommon: dealBatchCommon,
							overlayHTML: overlayHTML,
							numShuffledDeckRemaining: cardSecrets.shuffledDeck.length
						};
						// console.log(`deal batch for ${myConfig.tonight.players[i].playerUser.firstName}:
						// ${JSON.stringify(dealBatchObject)}`);
						// send i's socketID their own private version of the object.
						io.to(myConfig.tonight.players[i].socketID).emit("deal batch broadcast",dealBatchObject);
						batchSent = true;
						break;
					}
				}
				if (!batchSent){ //if we get here and batch not sent, they're spectators, having sat out or folded, and get the generic batch, no overlay
					dealBatchObject = {
						dealBatchCommon: dealBatchCommon,
						overlayHTML: overlayHTML,
						numShuffledDeckRemaining: cardSecrets.shuffledDeck.length
					};
					// console.log(`deal batch for ${myConfig.tonight.players[i].playerUser.firstName}:
					// ${JSON.stringify(dealBatchObject)}`);
					// send i's socketID their own private version of the object.
					io.to(myConfig.tonight.players[i].socketID).emit("deal batch broadcast",dealBatchObject);
				}			
			}
		}
		//loop thru dealBatchCommon to save each card to the appropriate player's "hand" array
		dealBatchObject.dealBatchCommon.forEach (element => {
			myConfig.tonight.players[element.tonightPlayerIndex].hand.push(element);
			// console.log(`Hand for ${myConfig.tonight.players[element.tonightPlayerIndex].playerUser.firstName} is:
			// ${JSON.stringify(myConfig.tonight.players[element.tonightPlayerIndex].hand)}`);
		})
		myConfig.tonight.save();
		//then we gotta move the game on to the next gameSequenceLocation, and call the instructDealer function, unless game is over
		isGameOver();
	});
	
	socket.on('I chose opener', (openerIndex) => {
		//create new betting round object and add to myConfig
		let bettingRound = {
			amtBetInRound: 0,
			checkedPlayers:[],
			numRaises: 0,
			whoseTurn: openerIndex
		};
		myConfig.bettingRound = bettingRound;
		myConfig.previousOpenerIndex = openerIndex;
		//emit status update saying it's somebody's bet
		io.emit('status update',`The bet is to ${myConfig.tonight.players[myConfig.bettingRound.whoseTurn].playerUser.fullName}`);
		//emit broadcast for next bettor turn
		io.emit('next bettor broadcast',myConfig);
	});

	socket.on('I fold', (folderIndex) => {
		let nextBettorIndex = getNextBettorIndex(folderIndex); // gotta do this now before we remove the person from players in game!
		//remove player from playersInGame array
		for (let i=0;i<myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length;i++){
			if (myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[i].playerUser._id===myConfig.tonight.players[folderIndex].playerUser._id){
				myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.splice(i,1);
			}
		}
		//add player to playersOutOfGame array
		myConfig.tonight.games[myConfig.tonight.games.length-1].playersOutOfGame.push(myConfig.tonight.players[folderIndex]);
		//get name of player who folded, and send this as a status update
		io.emit('status update',`${myConfig.tonight.players[folderIndex].playerUser.fullName} folds ...`);
		//create new bettor action broadcast object and emit it
		let bettorActionBroadcastObject = {
			myConfig:myConfig,
			playerIndex:folderIndex,
			action:"fold",
			amt:0
		}
		io.emit("bettor action",bettorActionBroadcastObject);
		//still have to check if we're down to one player in game, if not, if pot is good, and if not, advance WhoseTurn and emit Next bettor broadcast again
		if (myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length===1){ //if only one player left in game, we have a winner
			//get the ID and index of the remaining player
			let winnerId = myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[0].playerUser._id;
			let winnerIndex = getPlayerIndex (winnerId, myConfig.tonight.players);
			let winnerFullName = myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[0].playerUser.fullName;
			let winnerObject = {
					index:winnerIndex,
					id:winnerId,
					fullName:winnerFullName,
					amt:0
				};
			myConfig.tonight.games[myConfig.tonight.games.length-1].winners.push(winnerObject);
			allocateWinnings(myConfig);
			io.emit('status update',"Displaying winner.");
			io.emit('show winners broadcast',myConfig);
			//call the close game function, no need to save to db here
		} else {
			if (isPotGood() && myConfig.bettingRound.amtBetInRound!==0){ //not only must pot be good, but the bet can't still be zero!
				endBettingRound();
			} else { //move on to next bettor
				console.log("Next bettor's index will be: " + nextBettorIndex);
				//put that player's index in the myConfig.bettingRound.whoseTurn
				myConfig.bettingRound.whoseTurn = nextBettorIndex;
				//emit status update saying it's somebody's bet
				io.emit('status update',`The bet is to ${myConfig.tonight.players[myConfig.bettingRound.whoseTurn].playerUser.fullName}`);
				//emit broadcast for next bettor turn
				io.emit('next bettor broadcast',myConfig);
			}
		}
		myConfig.tonight.save();
	});

	socket.on('I check', (checkerIndex) => {
		//add player's index to the checked array of the bettingRound
		myConfig.bettingRound.checkedPlayers.push(checkerIndex);
		io.emit('status update',`${myConfig.tonight.players[checkerIndex].playerUser.fullName} checks ...`);
		//create new bettor action broadcast object and emit it
		let bettorActionBroadcastObject = {
			myConfig:myConfig,
			playerIndex:checkerIndex,
			action:"check",
			amt:0
		}
		io.emit("bettor action",bettorActionBroadcastObject);
		//make sure we don't have a checked array with as many people as players in the game; if so, end the betting round
		if (myConfig.bettingRound.checkedPlayers.length===myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length){
			endBettingRound();
		} else {
			let nextBettorIndex = getNextBettorIndex(checkerIndex);
			console.log("Next bettor's index will be: " + nextBettorIndex);
			//put that player's index in the myConfig.bettingRound.whoseTurn
			myConfig.bettingRound.whoseTurn = nextBettorIndex;
			//emit status update saying it's somebody's bet
			io.emit('status update',`The bet is to ${myConfig.tonight.players[myConfig.bettingRound.whoseTurn].playerUser.fullName}`);
			//emit broadcast for next bettor turn
			io.emit('next bettor broadcast',myConfig);
		}
	});

	socket.on('I bet', (iBetObject) => {
		io.emit('status update',`${myConfig.tonight.players[iBetObject.bettorIndex].playerUser.fullName} bets ${iBetObject.betAmt.toFixed(2)} ...`);
		//add bet amt to player object
		myConfig.tonight.players[iBetObject.bettorIndex].amtBetInRound += iBetObject.betAmt;
		//increase betting round amtBetInRound if needed
		if (myConfig.tonight.players[iBetObject.bettorIndex].amtBetInRound>myConfig.bettingRound.amtBetInRound){
			myConfig.bettingRound.amtBetInRound += iBetObject.betAmt;
		}
		//add bet amount to pot
		myConfig.tonight.games[myConfig.tonight.games.length-1].amtPot += iBetObject.betAmt;
		//subtract bet amount from player's balance
		myConfig.tonight.players[iBetObject.bettorIndex].balanceForNight -= iBetObject.betAmt;
		//create new bettor action broadcast object and emit it
		console.log("The pot is now: " + myConfig.tonight.games[myConfig.tonight.games.length-1].amtPot);
		let bettorActionBroadcastObject = {
			myConfig:myConfig,
			playerIndex:iBetObject.bettorIndex,
			action:"bet",
			amt:iBetObject.betAmt
		}
		myConfig.tonight.save();
		io.emit("bettor action",bettorActionBroadcastObject);
		//check to see if pot is good; if so, end the betting round; if not, move on to next bettor
		if (isPotGood()===true){
			endBettingRound();
		} else {
			let nextBettorIndex = getNextBettorIndex(iBetObject.bettorIndex);
			console.log("Next bettor's index will be: " + nextBettorIndex);
			//put that player's index in the myConfig.bettingRound.whoseTurn
			myConfig.bettingRound.whoseTurn = nextBettorIndex;
			//emit status update saying it's somebody's bet
			io.emit('status update',`The bet is to ${myConfig.tonight.players[myConfig.bettingRound.whoseTurn].playerUser.fullName}`);
			//emit broadcast for next bettor turn
			io.emit('next bettor broadcast',myConfig);
		}
	});

	socket.on('I raise', (iRaiseObject) => {
		io.emit('status update',`${myConfig.tonight.players[iRaiseObject.bettorIndex].playerUser.fullName} raises ${iRaiseObject.raiseAmt.toFixed(2)} ...`);
		//increment number of raises in this betting round
		myConfig.bettingRound.numRaises += 1;
		//add total bet amt to player object
		myConfig.tonight.players[iRaiseObject.bettorIndex].amtBetInRound += iRaiseObject.callAmt + iRaiseObject.raiseAmt;
		//increase betting round amtBetInRound by the raise amt
		myConfig.bettingRound.amtBetInRound += iRaiseObject.raiseAmt;
		//add call + raise amount to pot
		myConfig.tonight.games[myConfig.tonight.games.length-1].amtPot += iRaiseObject.callAmt + iRaiseObject.raiseAmt;
		//subtract call + raise amount from player's balance
		myConfig.tonight.players[iRaiseObject.bettorIndex].balanceForNight -= (iRaiseObject.callAmt + iRaiseObject.raiseAmt);
		//create new bettor action broadcast object and emit it
		let bettorActionBroadcastObject = {
			myConfig:myConfig,
			playerIndex:iRaiseObject.bettorIndex,
			action:"raise",
			callAmt:iRaiseObject.callAmt,
			raiseAmt:iRaiseObject.raiseAmt
		};
		myConfig.tonight.save();
		io.emit("bettor action",bettorActionBroadcastObject);
		//no need to see if pot is good; we know we'll need to move on to next bettor
		let nextBettorIndex = getNextBettorIndex(iRaiseObject.bettorIndex);
		//put that player's index in the myConfig.bettingRound.whoseTurn
		myConfig.bettingRound.whoseTurn = nextBettorIndex;
		console.log("The pot is now: " + myConfig.tonight.games[myConfig.tonight.games.length-1].amtPot);
		//emit status update saying it's somebody's bet
		io.emit('status update',`The bet is to ${myConfig.tonight.players[myConfig.bettingRound.whoseTurn].playerUser.fullName}`);
		//emit broadcast for next bettor turn
		io.emit('next bettor broadcast',myConfig);
	});

	socket.on('I split pot', () => {
		console.log("myConfig.bettingRound: " + JSON.stringify(myConfig.bettingRound));
		console.log("Number of players remaining in game: " + myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length);
		if (Object.getOwnPropertyNames(myConfig.bettingRound).length > 0 || myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length!==2){ //make sure we're between bertting rounds and only 2 players remain
			//send dealer a status update saying that you can't split the pot right now
			//loop thru players and find out which index is the dealer
			let players = myConfig.tonight.players;
			for (let i=0; i<players.length; i++){
				if (players[i].isDealer===true){
				io.to(players[i].socketID).emit('status update','You cannot split the pot unless there are 2 players left and no betting round is under way.');
				break;
				}
			}
			return; //this should exit the socket.on event
		}
		io.emit('status update',"Splitting the pot among remaining players.");
		let winnerId = '';
		let winnerIndex = -1;
		let winnerFullName = "";
		if (myConfig.tonight.games[myConfig.tonight.games.length-1].hilo==="High Only" || myConfig.tonight.games[myConfig.tonight.games.length-1].hilo==="Low Only"){
			//loop thru remaining players in game
			for (let j=0; j<myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length;j++){
				winnerId = myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[j].playerUser._id;
				winnerIndex = getPlayerIndex (winnerId, myConfig.tonight.players);
				winnerFullName = myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[j].playerUser.fullName;
				winnerObject = {
						index:winnerIndex,
						id:winnerId,
						fullName:winnerFullName,
						amt:0
					};
				myConfig.tonight.games[myConfig.tonight.games.length-1].winners.push(winnerObject);
			}
			//then allocate winnings and send the emit
			allocateWinnings(myConfig);
			io.emit('show winners broadcast',myConfig);
			//call the close game function, no need to save to db here
		} else { //we are high-low
			let splitter1Index = getPlayerIndex (myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[0].playerUser._id, myConfig.tonight.players);
			let splitter2Index = getPlayerIndex (myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[1].playerUser._id, myConfig.tonight.players);
			//if neither has declared, pre-assign declarations to help finish the game
			if (myConfig.tonight.players[splitter1Index].declaration==="" && myConfig.tonight.players[splitter2Index].declaration===""){
				myConfig.tonight.players[splitter1Index].declaration = "high";
				myConfig.tonight.players[splitter2Index].declaration = "low";
			}
			//emit a command that lets all players see all dealt cards
			io.emit('autoreveal all cards',cardSecrets.dealtCards);
			io.emit('status update','We assigned a high and low just to split the pot; dealer can now select or confirm winners');
			//loop thru players and find out which index is the dealer
			let players = myConfig.tonight.players;
			for (let i=0; i<players.length; i++){
				if (players[i].isDealer===true){
				io.to(players[i].socketID).emit('choose winners',myConfig); // instruct dealer to choose winners
				break;
				}
			}
		}
		myConfig.tonight.save();	
	});

	socket.on('I prompt to declare', () => {
		io.emit('status update',"Players in the game are now invited to declare: high, low, or both");
		//loop thru players in game, sending each one the declare instruction
		let jSocketID = "";
		for (let j=0;j<myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length;j++){
			jSocketID = getPlayerSocketID (j, myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame);
			io.to(jSocketID).emit('declare instruction');
		}
	});
	
	socket.on('I declare', (iDeclareObject) => {
		//update player object with declaration
		myConfig.tonight.players[iDeclareObject.index].declaration = iDeclareObject.declaration;
		myConfig.tonight.save();
		//loop thru players in game to see if all have declared
		let declaredPlayers = getDeclaredPlayers(myConfig);
		//after the loop, see if all have declared
		if (declaredPlayers.length===myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length){
			//send the emit with the array
			let declarationsBroadcastObject = {
				myConfig:myConfig,
				declaredPlayers:declaredPlayers
			};
			io.emit('status update',"Displaying what everyone has declared. Next step is dealer's.");
			io.emit('declarations broadcast',declarationsBroadcastObject);
			//then we gotta move the game on to the next gameSequenceLocation, and call the instructDealer function, unless game is over
			isGameOver();
		}
	});

	socket.on('I saved winners', (savedWinnersList) => {
		console.log("Saved winners array is: " + savedWinnersList);
		//loop through the savedWinners array and update winners arrays
		let winnerDeclarationString = ""
		let winnerIndex = -1;
		let winnerId = "";
		let winnerFullName = "";
		let winnerObject = {};
		for (let j=0; j<savedWinnersList.length; j++){
			winnerIndex = parseInt(savedWinnersList[j]);
			winnerDeclarationString = savedWinnersList[j].substr(1);
			winnerId = myConfig.tonight.players[winnerIndex].playerUser._id;
			winnerFullName = myConfig.tonight.players[winnerIndex].playerUser.fullName;
			winnerObject = {
				index:winnerIndex,
				id:winnerId,
				fullName:winnerFullName,
				amt:0
			};
			switch (winnerDeclarationString) {
				case "low":
					myConfig.tonight.games[myConfig.tonight.games.length-1].lowWinners.push(winnerObject);
					break;
				case "high":
					myConfig.tonight.games[myConfig.tonight.games.length-1].highWinners.push(winnerObject);
					break;
				case "both":
					myConfig.tonight.games[myConfig.tonight.games.length-1].lowWinners.push(winnerObject);
					myConfig.tonight.games[myConfig.tonight.games.length-1].highWinners.push(winnerObject);
					break;
				case "":
					myConfig.tonight.games[myConfig.tonight.games.length-1].winners.push(winnerObject);
					break;
			}
		}
		allocateWinnings(myConfig);
		io.emit('status update',"Displaying winners.");
		io.emit('show winners broadcast',myConfig);
		//call the close game function, no need to save to db here
	});

});
