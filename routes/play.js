const express	= require("express");
const router	= express.Router();

const passport	= require("passport");

const User 		= require ("../models/user"),
	  Night		= require ("../models/night"),
	  middleware	= require ("../middleware");

const path = require('path');
const myConfig = require("../config");

const	server 						= require('http').createServer(router);   //passed to http server
const 	io 							= require('socket.io')(server);        //http server passed to socket.io

  //==========
  //SOCKET TEST ROUTE
  //===========

  router.get("/testSocket", function(req,res){
	res.sendFile(path.join(__dirname, '../', 'testSocket.html'));
});

//================
// PLAY THE GAME
//================
router.get("/play/:id", middleware.isLoggedIn, middleware.isNightInProgress, function(req,res){
	// find the night in the DB with the ID provided in the URL parameter, and populate the players and user data
	Night.findById(req.params.id, function (err, tonight) {
		if (err || !tonight){ //any random ID with proper number of characters can get a null return, not object but also not error, from MongoDB
			req.flash("error","Could not find the data to load a game with that ID number for tonight. Please contact the host offline.");
			res.redirect("/game/wait");
		} else {
		//pass the details of found database record to the game play view
		res.render("play",{tonight:tonight});
		//reminder: inside the curly brackets, the first param is the name we will give the data in its new home, and the second is the data we're sending
		}
	});
});

module.exports = router;