const express                   = require("express");
const bodyParser 					      = require("body-parser");
const mongoose 					        = require('mongoose');
const passport					        = require("passport");
const LocalStrategy				      = require("passport-local");
const passportLocalMongoose		  = require("passport-local-mongoose");
const User						          = require("./models/user");
const middleware 	              = require ("./middleware/index");
// var myConfig                    = require ("./config"); // global variables available and changeable by all routes, I hope
// var cardSecrets                    	= require ("./cardSecrets"); // global objects available and changeable by all routes, I hope
const flash						          = require("connect-flash");

const indexRoutes					      = require("./routes/index");
const gameRoutes					      = require("./routes/game");

const app       = express();
const http      = require('http').createServer(app);
const io        = require('socket.io')(http);
const socketServer   = require("./socketServer"); // this is a js file in the same directory as index.js




if (process.env.NODE_ENV !== 'production') {
  const dotenv    = require("dotenv");
  dotenv.config();
}
// this should load the proper value for process.env.DATABASEURL and process.env.SESSION_SECRET);

// const	seedDB						= require("./seeds"); //only needed if we want to seed the db for testing purposes
// const	methodOverride				= require("method-override"); //maybe needed for form submits when we update/edit a record in the db


//============
//BRING IN LOCAL VARIABLES
//=============
// app.locals.myVars = myConfig;
// console.log ("All cards array:" + app.locals.myVars.allCards);
// app.locals.myVars.allCards = [0,1,2];


//============
//APP.USE STATEMENTS
//============
app.set("view engine","ejs");
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(flash());
app.use(require("express-session")({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false
}));

//===================
//PASSPORT CONFIG
//===================
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//==========
//ROUTES
//==========
app.use(function(req,res,next){
	//this adds a middleware function to EVERY route
	//also note: this block of code has to be ABOVE the code where we app.use the various external route js files, if any
	res.locals.currentUser = req.user;
  //the line above creates an object called currentUser, taken from the user object if logged in, and sends it to the rendered destination view
  res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
	//need the next statement, or else the route handling process is halted here in the middleware
	});

app.use("/game", gameRoutes);
app.use(indexRoutes);



//===============
// MONGOOSE CONNECT
//================

mongoose.connect(process.env.DATABASEURL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
	useCreateIndex: true	
	})
	.then(() => console.log('Connected to DB!'))
	.catch(error => console.log(error.message));


//===============
//SERVER LISTENING
//================

const PORT = process.env.PORT || 3000;
// with ||: 1st expression is always outputted. The 2nd expression only gets outputted if the 1st expression is falsy.
// with &&: 1st expression is outputted if it's FALSY. The 2nd expression only get outputted if the 1st expression is truthy.
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});