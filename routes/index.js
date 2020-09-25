const express	= require("express");
const router	= express.Router();

const passport	= require("passport");

const User 		= require ("../models/user");


//===========
// ROOT ROUTE
//===========

router.get("/", function(req,res){
	res.render("home");
});

//===========
// TEST ROUTE
//===========

router.get("/testHeaders", function(req,res){
	res.render("testHeaders");
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
		homeBackgroundImgPath: "",
		socketID: "",
		isHost: false
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