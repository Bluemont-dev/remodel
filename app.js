const 	express 					= require('express'),
		bodyParser 					= require("body-parser"),
		mongoose 					= require('mongoose'),
		passport					= require("passport"),
		LocalStrategy				= require("passport-local"),
		passportLocalMongoose		= require("passport-local-mongoose"),
		User						= require("./models/user"),
		Night						= require("./models/night"),
		Player						= require("./models/player"),
		middleware 	              	= require ("./middleware/index"),
		seedNightDB = 				require ("./routes/seedNight"),
	  	methodOverride				= require("method-override"),
		flash						= require("connect-flash");
		  
var myConfig                    	= require ("./config"); // global variables available and changeable by all routes, I hope
var formatDistanceToNowStrict 		= require('date-fns/formatDistanceToNowStrict') // to check the age of most recent "night" record

const  	indexRoutes					= require("./routes/index"),
		gameRoutes                  = require("./routes/game"),
		nightRoutes					= require("./routes/night"),
		playRoutes					= require("./routes/play");

const	app 						= express();
const	server 						= require('http').createServer(app);   //passed to http server
const 	io 							= require('socket.io')(server);        //http server passed to socket.io

io.on('connection', (socket) => {
	socket.on('chat message', (msg) => {
	  io.emit('chat message', msg);
	});
  });

if (process.env.NODE_ENV !== 'production') {
    const dotenv    = require("dotenv");
    dotenv.config();
  }

//============
//BRING IN LOCAL VARIABLES
//=============
app.locals.myConfig = myConfig;
// console.log ("All cards array:" + app.locals.myConfig.allCards);
// app.locals.myConfig.allCards = [0,1,2];

app.use(require("express-session")({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false
}));

app.set("view engine","ejs");
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
//method override is needed so we can send PUT or DELETE requests from HTML forms that otherwise wouldn't support them
app.use(methodOverride("_method"));
app.use(flash());


//===================
//PASSPORT CONFIG
//===================
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//===========
//ROUTES SETUP
//============
app.use(function(req,res,next){
	//this adds a middleware function to EVERY route
	//also note: this block of code has to be ABOVE the code where we app.use the various external route js files
	res.locals.currentUser = req.user;
	//the line above creates an object called currentUser, taken from the user object if logged in, and sends it to the rendered destination view
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
	//need the next statement, or else the route handling process is halted here in the middleware
	});

//the first argument in the lines below sends that string to route so it's assumed to be part of the routes in those files
// app.use("/campgrounds", campgroundRoutes);
// app.use("/campgrounds/:id/comments", commentRoutes);
app.use(indexRoutes);
app.use(gameRoutes);
app.use(nightRoutes);
app.use(playRoutes);



mongoose.connect(process.env.DATABASEURL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
	useCreateIndex: true	
	})
	.then(() => console.log('Connected to DB!'))
	.catch(error => console.log(error.message));

//seedNightDB(); // remove all records and replace with the test records in the seedNight file

const PORT = process.env.PORT || 3000;
// with ||: 1st expression is always outputted. The 2nd expression only gets outputted if the 1st expression is falsy.
// with &&: 1st expression is outputted if it's FALSY. The 2nd expression only get outputted if the 1st expression is truthy.
server.listen(PORT, () => { // previously was app.listen, in case this change breaks something
    console.log(`Our app is running on port ${ PORT }`);
});

