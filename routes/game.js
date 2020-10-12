const express	= require("express");
const router	= express.Router();

const passport	= require("passport");

const User 		= require ("../models/user"),
	  Night		= require ("../models/night"),
	  Player	= require("../models/player"),
	  seedNightDB = require ("../routes/seedNight");
	  middleware	= require ("../middleware");

var myConfig    = require ("../config"); // global variables available and changeable by all routes, I hope
var formatDistanceToNowStrict 		= require('date-fns/formatDistanceToNowStrict'); // to check date "age" of most recent "night" record


//============
// GAME ROUTES
//============

router.get("/game", middleware.isLoggedIn, middleware.isNightInProgress, function(req,res){
	res.redirect("/game/join");
});

router.get("/game/hostPrompt", middleware.isLoggedIn, function(req,res){
	res.render("hostPrompt");
});

router.post("/game/hostPrompt", middleware.isLoggedIn, function(req,res){
	if (req.body.isHostButton==="Yes"){
		res.redirect("/night/new");
	} else {
		res.redirect("/game/wait");
	}

});

router.get("/game/wait", middleware.isLoggedIn, function(req,res){
	//stuff will go here but for now:
	res.render("wait");
});

//================
// JOIN THE GAME
//================

router.get("/game/join", middleware.isLoggedIn, function(req,res){
	Night.find({}).sort({dateCreated: -1}).exec(function(err,nightRecords){ //retrieve the records from the database sorted by the most recent date
		if (err || nightRecords.length===0){ //even the nights collection is empty, mongoose doesn't throw an error after this sort command
				req.flash("error","Could not find tonight's settings in the database. Please check with tonight's host.");
				res.redirect("/game/wait");
		} else {
			tonight = nightRecords[0];
			// console.log ("The date of the most recent record in the database is: " + tonight.dateCreated);
			let tonightAgeString = formatDistanceToNowStrict(tonight.dateCreated);
			// console.log ("The age of the latest record, compared to now, is: " + tonightAgeString);
			if (tonightAgeString.includes("second") || tonightAgeString.includes("minute") || tonightAgeString.includes("hour")){
				//this means the latest record is less than a day old, so we are good to proceed

					//create new Player from currentUser
				let newPlayer = {
					playerUser: req.user._id,
					socketID: "",
					balanceForNight: 0,
					inGame: false,
					isDealer: false,
					hand: [],
					amtBetInRound: 0,
					declaration: "",
					wantsACard: "",
					timesDeclinedACard: 0,
					readyToPassCards: false 
					};

				Player.create(newPlayer, function(err,newlyCreatedPlayer){
					if (err){
						req.flash("error","Could not create a new player. Please contact Bluemont for help.");
						res.redirect("/game/wait");
					} else {
						if (tonight.tonightPlayers.length<7){
								// push new player to the players array of tonight's record
								tonight.tonightPlayers.push(newlyCreatedPlayer);
								//save the updated night record to the DB
								tonight.save();
						} else {
							req.flash("error","We already have 7 players for tonight. Please check with tonight's host.");
							res.redirect("/game/wait");
						}
					}
				});

				res.redirect("/play/"+ tonight._id);
			} else {
				req.flash("error","The most recent game in the database is more than a day old. Not good. Please check with tonight's host.");
				res.redirect("/game/wait");
			}
		}
	});
});

//================
// PLAY THE GAME
//================
// router.get("/game/:id", middleware.isLoggedIn, middleware.isNightInProgress, function(req,res){
// 	// find the night in the DB with the ID provided in the URL parameter, and populate the players and user data
// 	Night.findById(req.params.id).
// 	populate({
// 		path: 'tonightPlayers',
// 		// Now populate the 'user' data for each player
// 		populate: { path: 'playerUser' }
// 	}).
// 	exec(function (err, tonight) {
// 		if (err || !tonight){ //any random ID with proper number of characters can get a null return, not object but also not error, from MongoDB
// 			req.flash("error","Could not find the data to load a game with that ID number for tonight. Please contact the host offline.");
// 			res.redirect("/game/wait");
// 		} else {
// 		//pass the details of found database record to the game play view
// 		res.render("play",{tonight:tonight});
// 		//reminder: inside the curly brackets, the first param is the name we will give the data in its new home, and the second is the data we're sending
// 		}
// 	});
// });

module.exports = router;