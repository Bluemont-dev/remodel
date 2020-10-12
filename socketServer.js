const express	= require("express");
const	app 	= express();
const http      = require('http').createServer(app);
const io        = require('socket.io')(http);

const User 		= require ("./models/user"),
	  Night		= require ("./models/night"),
	  Player	= require("./models/player"),
	  middleware	= require ("./middleware");

var myConfig    = require ("./config"); // global variables available and changeable by all routes, I hope

const socketServer = {};

//==========
//SOCKET SERVER LOGIC
//===========

io.on('connection', (socket) => {

    //each of the following is a function that gets stored, kind of like an event listener, and called when the event happens 
 //   socket.on('chat message', (msg) => {
 //     io.emit('chat message', msg);
 //   });
 
   socket.on('iAmConnected', (userID,socketID) => {

//loop thru tonight's player array until you find the one with a user ID that matches passed userID


//fully expand or populate the player element with full details of the user object


//save tonight object to the database

//emit a drawPlayers function or something that will include the full array of the players joined thus far

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
//FINAL EXPORT
//==============

module.exports = socketServer;