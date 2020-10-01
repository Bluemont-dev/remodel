const express	= require("express");
const router	= express.Router();

const passport	= require("passport");

const User 		= require ("../models/user"),
	  Night		= require ("../models/night"),
	  seedNightDB = require ("../routes/seedNight");
	  middleware	= require ("../middleware");

var myConfig    = require ("../config"); // global variables available and changeable by all routes, I hope
var formatDistanceToNowStrict 		= require('date-fns/formatDistanceToNowStrict'); // to check date "age" of most recent "night" record

// GAME routes
router.get("/game", middleware.isLoggedIn, function(req,res){
	var nextRoute = "";
	nextRoute = (myConfig.nightInProgress === true) ? "/game/join" : "/game/hostPrompt"; // ternary operator! woohoo
	res.redirect(nextRoute);
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

router.get("/game/join", middleware.isLoggedIn, function(req,res){

Night.find({}).sort({dateCreated: -1}).exec(function(err,nightRecord){ //retrieve the records from the database sorted by the most recent date
	if (err || nightRecord.length===0){
			req.flash("error","Could not find tonight's settings in the database. Please check with tonight's host.");
			res.redirect("/game/wait");
	} else {
		console.log("your dumb program thinks it found a night record in the database.");
		nightRecord = nightRecord[0];
		console.log ("The date of the most recent record in the database is: " + nightRecord.dateCreated);
		// db.nights.find({}).sort({dateCreated: -1})[0] is what returned the most recent game object using mongo shell command
		// ISODate("2020-09-30T00:28:27.817Z") is the kind of string you get back
		let nightRecordAgeString = formatDistanceToNowStrict(nightRecord.dateCreated);
		console.log ("The age of the latest record, compared to now, is: " + nightRecordAgeString);
		if (nightRecordAgeString.includes("second") || nightRecordAgeString.includes("minute") || nightRecordAgeString.includes("hour")){
			//this means the latest record is less than a day old, so we are good to proceed
			res.render("game",{night:nightRecord});
		} else {
			req.flash("error","The most recent game in the database is more than a day old. Not good. Please check with tonight's host.");
			res.redirect("/game/wait");
		}
	}
});





});


//=======================
//homegrown middleware
//=======================

function isLoggedIn(req,res,next){
	if (req.isAuthenticated()){
		//continue on with the callback that follows this middleware call
		return next();
	}
	//the next code only runs if the condition is false, i.e., req came from user who is not authenticated
	res.redirect("/login");
}

module.exports = router;