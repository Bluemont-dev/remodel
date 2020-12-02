const express	= require("express");
const router	= express.Router();

const passport	= require("passport");

const User 		= require ("../models/user"),
	  Night		= require ("../models/night"),
	  Player	= require("../models/player"),
	  middleware	= require ("../middleware");

var myConfig    = require ("../config"); // global variables available and changeable by all routes, I hope



//===========
// ROOT ROUTE
//===========

router.get("/", function(req,res){
	if (req.isAuthenticated()){
	res.render("game");
	} else {
	res.render("home");
	}
});

//===========
// API ROUTES, using JSON to deliver data when requested by client-side JS
//===========

router.get('/api/user_data', function(req, res) {
	if (req.user === undefined) {
		// The user is not logged in
		res.json({});
	} else {
		res.json({
			currentUser: req.user
		});
	}
});


//==============
// AUTH ROUTES
//==============

//show register form
router.get("/register",function(req,res){
	res.render("register");
});

//create a new user based on register form submission
router.post("/register", function(req,res){
	User.register(new User({
		username: req.body.username,
		firstName: req.body.firstName,
		lastInitial: req.body.lastInitial,
		homeBackgroundImgPath: ""
	}), req.body.password, function(err,user){
		if (err){
      		return res.render("register", {"error": err.message});
			//note the "return" in the next line, which breaks out of this function, thus no need for "else"
		}
		// in next line, "local" refers to the strategy, so other values here could be Twitter, Facebook, Gmail, or other login strategies we offer the user
		passport.authenticate("local")(req,res,function(){
				//in this example we send user to the "game" page after successful authentication, but it could go anywhere
			req.flash("success", "Welcome to the club, " + req.body.username);
			res.redirect("/game");
			});
		
	});
});

//show login form
router.get("/login", function(req,res){
	res.render("login");
});

//log a user in, based on login form submission
// the following lines are basically "app.post(URL, middleware, callback)
router.post("/login", passport.authenticate("local",
	{
	successRedirect: "/game",
	failureRedirect: "/login",
	failureFlash: true
	}), function(req,res){
	//nothing happening in the callback for now
});

//log a user out
router.get("/logout",function(req,res){
	req.logout();
	req.flash("success","You have successfully logged out.");
	res.redirect("/");
});

module.exports = router;