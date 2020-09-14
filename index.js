const express   = require("express");
const app       = express();
const http      = require('http').createServer(app);
const io        = require('socket.io')(http);
const bodyParser 					= require("body-parser");
const mongoose 					= require('mongoose');
const passport					= require("passport");
const LocalStrategy				= require("passport-local");
const passportLocalMongoose		= require("passport-local-mongoose");

if (process.env.NODE_ENV !== 'production') {
  const dotenv    = require("dotenv");
  dotenv.config();
}
// this should load the proper value for process.env.DATABASEURL);

// const	User						= require("./models/user");
// const	seedDB						= require("./seeds");
// const	methodOverride				= require("method-override");

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));



//==========
//ARRAYS, BABY
//============
var allCards = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14];



//==========
//ROUTES
//==========
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });


//==========
//SOCKET SERVER LOGIC
//===========

io.on('connection', (socket) => {

   //each of the following is a function that gets stored, kind of like an event listener, and called when the event happens 
//   socket.on('chat message', (msg) => {
//     io.emit('chat message', msg);
//   });

  socket.on('iAmConnected', (userId) => {
      io.emit('chat message',"We welcome User "+ userId);
      io.emit("allCards update", allCards);
  } );

    socket.on('iAmDisconnected', (userId) => {
        io.emit('chat message',"And goodbye to User "+ userId);
    });

    socket.on("request deal", (userId) => {
        //remove first 5 items from the array and send to the client that requested it
       let clientHand = allCards.slice(0,5);
        allCards = allCards.slice(5);
        io.sockets.to(userId).emit("cards sent",clientHand);
        io.emit("allCards update",allCards);
    });

});


function message (userId, event, data) { //not being used at the moment
    io.sockets.to(userId).emit(event, data);
  }

//===============
//SERVER LISTENING
//================

http.listen(3000, () => {
  console.log('listening on *:3000');
});