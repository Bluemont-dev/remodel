const 	express 					= require('express'),
		bodyParser 					= require("body-parser"),
		mongoose 					= require('mongoose'),
		passport					= require("passport"),
		LocalStrategy				= require("passport-local"),
		passportLocalMongoose		= require("passport-local-mongoose"),
		User						= require("./models/user"),
		Player						= require("./models/player"),
		Night						= require("./models/night"),
		middleware 	              	= require ("./middleware/index"),
		dealtCardObj				= require ("./models/dealtCard"),
		seedNightDB 				= require ("./routes/seedNight"),
	  	methodOverride				= require("method-override"),
		flash						= require("connect-flash");

		  
var myConfig                    	= require ("./config"); // global variables available and changeable by all routes, I hope
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




//=========================
//======SOCKET SERVER LOGIC
//=========================

io.on('connection', (socket) => {

	console.log('a user connected');

    socket.on('iAmConnected', (myConnectObject) => {
		//load the tonight object from database, populating players
		Night.findById(myConnectObject.tonightID).
			populate({
				path: 'tonightPlayers',
				// Now populate the 'user' data for each player
				populate: { path: 'playerUser' }
			}).
			exec(function (err, tonight) {
				if (err || !tonight){ //any random ID with proper number of characters can get a null return, not object but also not error, from MongoDB
					// req.flash("error","Could not find the data to load a game with that ID number for tonight. Please contact the host offline.");
					res.redirect("/game/wait");
				} else { //success in database lookup of tonight ID
					console.log("Length of players array is " + tonight.tonightPlayers.length);
					//loop thru tonight's player array until you find the one with a user ID that matches passed userID
					for (let i=0; i<tonight.tonightPlayers.length; i++){
						console.log("checking element " + i + " in players array. Player name is " + tonight.tonightPlayers[i].playerUser.firstName);

						if (tonight.tonightPlayers[i].playerUser.id===myConnectObject.userID){ //we have a match
							if (tonight.tonightPlayers[i].socketID === ""){ // new player connecting for the 1st time tonight, not reconnecting
								io.emit('status update',"We welcome " + tonight.tonightPlayers[i].playerUser.firstName + " to the game.");
								io.emit('render new player for all', tonight.tonightPlayers[i].playerUser); //send newly added player's user object to every client
								tonight.tonightPlayers[i].socketID = myConnectObject.socketID; //add the socketID from newly connected player to the tonight DB record
								tonight.tonightPlayers[i].save(); //save the player to the DB, not the night!!
								io.to(tonight.tonightPlayers[i].socketID).emit('private message',"Your player index is " + i.toString()); // notify user of player index for session storage
								console.log("Sent private message to socket ID" + tonight.tonightPlayers[i].socketID + " that their index is " +i.toString());
								//if the newly connected player is dealer, send a private emit to them to unlock the "game" menu, etc.
								if (tonight.tonightPlayers[i].isDealer){
									io.to(tonight.tonightPlayers[i].socketID).emit('private message',"You are dealer");
								}
							}
						break;
					    } else {
							if (i===tonight.tonightPlayers.length-1){
								console.log("Sorry, could not find " + myConnectObject.userID + " in the players array."); // have looped all the way thru the array
							}
						}
					}
				}
			});
    });


	socket.on('chat message', (msg) => {
		io.emit('chat message', msg);
    });

	socket.on('disconnect', () => {
		console.log('a user disconnected');
		
		//load the tonight object from database, populating players
		Night.findById(myConfig.tonight._id).
			populate({
				path: 'tonightPlayers',
				// Now populate the 'user' data for each player
				populate: { path: 'playerUser' }
			}).
			exec(function (err, tonight) {
				if (err || !tonight){ //any random ID with proper number of characters can get a null return, not object but also not error, from MongoDB
					io.emit("status update","Could not save tonight's settings to the database. Please contact Bluemont for help.");
					res.redirect("/game/wait");
				} else { //success in database lookup of tonight ID
					//loop thru tonight's player array until you find the one with a socket ID that matches the disconnected socket ID
					for (let i=0; i<tonight.tonightPlayers.length; i++){
						if (tonight.tonightPlayers[i].socketID===socket.id){ //we have a match
						tonight.tonightPlayers[i].socketID = "disconnected"; //replace the socketID from newly disconnected player with the word "disconnected" in the tonight DB record
						tonight.tonightPlayers[i].save(); //save the player to the DB, not the night!! Unless we go back and do players by embed instead of reference
						console.log("Socket for " + tonight.tonightPlayers[i].playerUser.firstName + " is disconnected.");
					    }
					}
				}
			});
    });

	socket.on('game submit', (submittedGame) => {
		
		//create a new Game object from the submittedGame and save it to the db
		myConfig.tonight.games.push(submittedGame); //add the new game to the array of tonight's games
		myConfig.tonight.save();
		myConfig.currentGame = submittedGame;
		myConfig.gameInProgress = true;
		//loop thru players to find dealer
		for (let i=0; i<tonight.tonightPlayers.length; i++){
			if (myConfig.tonight.tonightPlayers[i].isDealer===true){
				myConfig.currentDealerIndex = i;
				break;
			}
		}

		//load tonight object w/ populated players
		Night.
		findOne({ _id: myConfig.tonight._id}).
		populate({
			path: 'tonightPlayers',
			// Now populate the 'user' data for each player
			populate: { path: 'playerUser' }
		}).
		exec(function (err, tonight) {
		  if (err) {
			  console.log(err)
			} else {
			  myConfig.tonight = tonight; //this should store fully loaded player objects into myConfig for sharing w/client
			  myConfig.currentDealerName = tonight.tonightPlayers[myConfig.currentDealerIndex].playerUser.fullName;
			}
		  ;
		  var shuffledDeck = allCards.shuffle();
		//   console.log("The shuffled deck: " + JSON.stringify(shuffledDeck));
		//   console.log("The shuffled deck: " + shuffledDeck._stack);
		  myConfig.currentGame.shuffledDeck = shuffledDeck;
		  io.emit('shuffle visual');
		  io.emit('status update',"Deck has been shuffled. Waiting for players to ante.");
		  //send this data as an object to all players
		  io.emit('game open', myConfig);
		});
	});

	socket.on('I ante', (playerIndex) => {
		//add player to players-in-game array
		myConfig.currentGame.playersInGame.push(myConfig.tonight.tonightPlayers[playerIndex]);
		//sort the array by the time they joined the night, a proxy for their playerIndex that is not stored in their player object
		myConfig.currentGame.playersInGame.sort(function(a, b) {
			return a.joinedNightDate - b.joinedNightDate;
		});
		//add ante amount to pot
		myConfig.currentGame.amtPot += myConfig.tonight.amtAnte;
		//subtract ante amount from player's balance
		myConfig.tonight.tonightPlayers[playerIndex].balanceForNight -= myConfig.tonight.amtAnte;
		//emit ante broadcast
		let anteBroadcastObject = {
			playerIndex:playerIndex,
			myConfig:myConfig
		}
		io.emit('ante broadcast',anteBroadcastObject);
	});

	socket.on('I sit out', (playerIndex) => {
		//add player to players-out-of-game array
		myConfig.currentGame.playersOutOfGame.push(myConfig.tonight.tonightPlayers[playerIndex]);
		//sort the array by the time they joined the night, a proxy for their playerIndex that is not stored in their player object
		myConfig.currentGame.playersOutOfGame.sort(function(a, b) {
			return a.joinedNightDate - b.joinedNightDate;
		});
		//emit sit out broadcast
		let sitOutBroadcastObject = {
			playerIndex:playerIndex,
			myConfig:myConfig
		}
		console.log("the array of players sitting out: ");
		console.dir(myConfig.currentGame.playersOutOfGame);
		io.emit('sit out broadcast',sitOutBroadcastObject);
	});
	
});



