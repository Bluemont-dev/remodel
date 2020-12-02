const express	= require("express");
const router	= express.Router();

const passport	= require("passport");

const User 		= require ("../models/user"),
	  Player	= require("../models/player"),
	//   Game      = require("../models/game"),
	  Night		= require ("../models/night"),
	  middleware	= require ("../middleware");

var myConfig    = require ("../config"); // global variables available and changeable by all routes, I hope
var formatDistanceToNowStrict 		= require('date-fns/formatDistanceToNowStrict') // to check date "age" of most recent "night" record


router.get("/night/new", middleware.isLoggedIn, function(req,res){
	res.render("night");
});

router.post("/night", middleware.isLoggedIn, function(req,res){
	//previous line calls the middleware function isLoggedIn() to prevent post requests
	//because even though the form to submit a Night is password-protected, folks could still use a tool like Postman to submit malicious requests
	//get data from form and use it it create a new Night object
	let hostID = req.user._id;
	let tonightPlayers = [];
	let games = [];
    let amtAnte = req.body.amtAnte;
    let amtMaxOpen = req.body.amtMaxOpen;
    let amtMaxRaise = req.body.amtMaxRaise;
	let amtBetIncrements = req.body.amtBetIncrements;
	let newNight = {
		hostID:hostID,
		tonightPlayers:tonightPlayers,
		games:games,
		amtAnte:amtAnte,
		amtMaxOpen:amtMaxOpen,
		amtMaxRaise:amtMaxRaise,
		amtBetIncrements:amtBetIncrements
	};
	//create a new night and save to DB
	Night.create(newNight, function(err,newlyCreated){
		if (err){
			req.flash("error","Could not save tonight's settings to the database. Please contact Bluemont for help.");
			res.redirect("/game/wait");
		} else {
			myConfig.nightInProgress = true;
			//save night
			newlyCreated.save();
			//redirect to the game page
			res.redirect("/game");
		}
});


});


module.exports = router;