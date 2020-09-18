const express                   = require("express");
const bodyParser 					      = require("body-parser");
const mongoose 					        = require('mongoose');
const passport					        = require("passport");
const LocalStrategy				      = require("passport-local");
const passportLocalMongoose		  = require("passport-local-mongoose");
const User						          = require("./models/user");
const flash						          = require("connect-flash");

const app       = express();
// const http      = require('http').createServer(app);
//const io        = require('socket.io')(http);
//const socket-server   = require("./socket-server") // this is a js file in the same directory as index.js


if (process.env.NODE_ENV !== 'production') {
  const dotenv    = require("dotenv");
  dotenv.config();
}
// this should load the proper value for process.env.DATABASEURL and process.env.SESSION_SECRET);

// const	seedDB						= require("./seeds"); //only needed if we want to seed the db for testing purposes
// const	methodOverride				= require("method-override"); //maybe needed for form submits when we update/edit a record in the db



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


//==========
//ARRAYS, BABY
//============
var allCards = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14];



//===================
//PASSPORT CONFIG
//===================
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



//==========
//ROUTES
//==========
app.get('/', (req, res) => {
    res.render("home");
  });

app.get('/register', (req,res) => {
  res.render("register");
});

app.post("/register", function(req,res){
	User.register(new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastInitial: req.body.lastInitial
  }), req.body.password, function(err,user){
		if (err){
          console.log(err.message);
      		return res.render("register", {"error": err.message});
			//note the "return" in the next line, which breaks out of this function, thus no need for "else"
		}
		// in next line, "local" refers to the strategy, so other values here could be Twitter, Facebook, Gmail, or other login strategies we offer the user
		passport.authenticate("local")(req,res,function(){
				//in this example we send user to the "campgrounds" page after successful authentication, but it could go anywhere
      //req.flash("success", "Welcome, Yelpcamp, " + req.body.firstName);
      res.send(req.body.firstName + ", you have successfully registered.")
			//res.redirect("/somewhere"); // pseudo code here, but where we redirect to depends on whether we have a host, a night, etc.
			});
		
	});
});


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