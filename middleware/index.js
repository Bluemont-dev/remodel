//const User						          = require("./models/user");

const myConfig = require("../config");


const middlewareObj	= {};

// middleware functions go here; these are methods of the object middlewareObj

middlewareObj.isLoggedIn = function (req,res,next){
	if (req.isAuthenticated()){
		//continue on with the callback that follows this middleware call
		return next();
	}
	//the next code only runs if the condition is false, i.e., req came from user who is not authenticated
	req.flash("error","You need to be logged in to do that.");
	res.redirect("/login");
};

middlewareObj.isNightInProgress = function (req,res,next){
	if (myConfig.nightInProgress===true){
		//continue on with the callback that follows this middleware call
		return next();
	}
	//the next code only runs if the condition is false, i.e., nobody has set up tonight's game yet
	req.flash("error","Tonight's game is not set up yet.");
	res.redirect("/game/hostPrompt");
};

middlewareObj.isNightFull = function (req,res,next){
	if (myConfig.tonight.players.length<7){
		//continue on with the callback that follows this middleware call
		return next();
	}
	//the next code only runs if the condition is false, i.e., nobody has set up tonight's game yet
	req.flash("error","Tonight's game is full. Please contact the host offline.");
	res.redirect("/game/wait");
};

//===============
//FINAL EXPORT
//==============

module.exports = middlewareObj;