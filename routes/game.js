const express	= require("express");
const router	= express.Router();

const passport	= require("passport");

const User 		= require ("../models/user");

// GAME route
router.get("/game", function(req,res){
	res.render("game");
});

module.exports = router;