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

const allCards = new cardDeck(myConfig.allCards);


//==========================
// HANDY FUNCTIONS FOR SOCKET EVENT HANDLING
//===========================

function getPlayerIndex (userID, playersArray){
	for (let i=0; i<playersArray.length;i++){
	  if (playersArray[i].playerUser._id===userID){
		return i;
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

function instructDealer (players, currentGame){
	//loop thru players and find out which index is the dealer
	for (let i=0; i<players.length; i++){
		if (players[i].isDealer===true){
		io.emit('status update',"Ready for dealer to take the next step.");
		//emit to dealer with 'dealer instruction' so they can take the next step in the game's playSequence
		console.log(`At time of sending dealer instruction, MyConfig.tonight:
		${JSON.stringify(myConfig.tonight)}`);
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
		//load tonight object w/ populated players
		// Night.findById(myConfig.tonight._id, function (err, tonight) {
		//   if (err) {
		// 	  console.log(err)
		// 	} else {
		// 	  myConfig.tonight = tonight; //this should store fully loaded player objects into myConfig for sharing w/client
		// 	  myConfig.currentDealerName = tonight.players[myConfig.currentDealerIndex].playerUser.fullName;
		// 	}
		//   ;
		//   var shuffledDeck = allCards.shuffle();
		//   console.log("The shuffled deck: " + shuffledDeck._stack);
		//   cardSecrets.shuffledDeck = shuffledDeck._stack;
		//   io.emit('shuffle visual');
		//   io.emit('status update',"Deck has been shuffled. Waiting for players to ante.");
		//   //send this data as an object to all players
		//   io.emit('game open', myConfig);
		// });
		myConfig.currentDealerName = myConfig.tonight.players[myConfig.currentDealerIndex].playerUser.fullName;

		console.log(`At time of game submit, MyConfig.tonight:
		${JSON.stringify(myConfig.tonight)}`);

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
		io.emit('ante broadcast',anteBroadcastObject);
		//now check to see if all of tonight's players are either in this game or sitting out
		if (isEverybodyIn(myConfig.tonight.games[myConfig.tonight.games.length-1], myConfig.tonight.players.length)===true){
			//if true, change playSequenceLocation for this game to 0, first element in the playSequence array
			myConfig.tonight.games[myConfig.tonight.games.length-1].playSequenceLocation = 0;
			//instruct dealer to do that game action
			instructDealer (myConfig.tonight.players, myConfig.tonight.games[myConfig.tonight.games.length-1]);
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
		io.emit('sit out broadcast',sitOutBroadcastObject);
		//now check to see if all of tonight's players are either in this game or sitting out
		if (isEverybodyIn(myConfig.tonight.games[myConfig.tonight.games.length-1], myConfig.tonight.players.length)===true){
			//if true, change playSequenceLocation for this game to 0, first element in the playSequence array
			myConfig.tonight.games[myConfig.tonight.games.length-1].playSequenceLocation = 0;
			//instruct dealer to do that game action
			instructDealer (myConfig.tonight.players, myConfig.tonight.games[myConfig.tonight.games.length-1]);
		}
	});

	socket.on('I deal', (dealerIndex) => {
		io.emit("status update","Dealing ...");
		//figure out what kind of deal it will be, based on playSequenceLocation
		let dealString = myConfig.tonight.games[myConfig.tonight.games.length-1].playSequence[myConfig.tonight.games[myConfig.tonight.games.length-1].playSequenceLocation];
		//get an array of dealable players, starting w/ next player after dealer
		getDealablePlayers(dealerIndex);
		console.log("Dealt cards thus far: " + JSON.stringify(cardSecrets.dealtCards));
		console.log(`tonight's players:
		 ${JSON.stringify(myConfig.tonight.players)}`);
		console.log(`players in game:
		${JSON.stringify(myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame)}`);
		console.log(`players out of game:
		${JSON.stringify(myConfig.tonight.games[myConfig.tonight.games.length-1].playersOutOfGame)}`);
		console.log(`dealable players:
		${JSON.stringify(myConfig.tonight.games[myConfig.tonight.games.length-1].dealablePlayers)}`);
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
			console.log(`same deal batch for all clients:
			${JSON.stringify(dealBatchObject)}`);
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
						console.log(`deal batch for ${myConfig.tonight.players[i].playerUser.firstName}:
						${JSON.stringify(dealBatchObject)}`);
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
					console.log(`deal batch for ${myConfig.tonight.players[i].playerUser.firstName}:
					${JSON.stringify(dealBatchObject)}`);
					// send i's socketID their own private version of the object.
					io.to(myConfig.tonight.players[i].socketID).emit("deal batch broadcast",dealBatchObject);
				}			
			}
		}
		//loop thru dealBatchCommon to save each card to the appropriate player's "hand" array
		dealBatchObject.dealBatchCommon.forEach (element => {
			myConfig.tonight.players[element.tonightPlayerIndex].hand.push(element);
			console.log(`Hand for ${myConfig.tonight.players[element.tonightPlayerIndex].playerUser.firstName} is:
			${JSON.stringify(myConfig.tonight.players[element.tonightPlayerIndex].hand)}`);
		})
		//then we gotta move the game on to the next gameSequenceLocation, and call the instructDealer function
		if (myConfig.tonight.games[myConfig.tonight.games.length-1].playSequenceLocation<myConfig.tonight.games[myConfig.tonight.games.length-1].playSequence.length-1){
			myConfig.tonight.games[myConfig.tonight.games.length-1].playSequenceLocation += 1;
			instructDealer (myConfig.tonight.players, myConfig.tonight.games[myConfig.tonight.games.length-1]);
		} else { // or if we're at the end, prompt the dealer to choose a winner via "choose winner" socket emit
			io.to(myConfig.tonight.players[myConfig.currentDealerIndex].socketID).emit("choose winner",myConfig);
		}
		
    });
	
});



