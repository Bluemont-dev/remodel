

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

// io.on('connection', (socket) => {
//     console.log('a user connected');
    
//     socket.on('chat message', (msg) => {
//         console.log('message: ' + msg);
//     });
    
//     socket.on('disconnect', () => {
//         console.log('a user disconnected');
//     });
    
// });

// io.on('connection', (socket) => {
//     console.log('a user connected');
  
//     socket.on('chat message', (msg) => {
//       console.log('message: ' + msg);
//     });
  
//     socket.on('disconnect', () => {
//       console.log('a user disconnected');
//     });
    
//   });




// io.on('connection', (socket) => {
//     console.log("A user connected!");
//     //each of the following is a function that gets stored, kind of like an event listener, and called when the event happens 
//     socket.on('iAmConnected', (myTwoIDs) => {
//         console.log("myTwoIDs: " + myTwoIDs)
//         console.log("user ID passed via emit was: " + myTwoIDs.userID);
//         console.log("tonight's players array is: " + tonight.tonightPlayers);
//         //loop thru tonight's player array until you find the one with a user ID that matches passed userID
//         for (let i=0; i<tonight.tonightPlayers.length; i++){
//             console.log("checking element " + i + "in players array.");
//             if (tonight.tonightPlayers[i].playerUser._id===userID){
//                 //we have a match
//                 console.log("The player who just joined has the ID of player " + i);
//                 io.emit('chat message',"We welcome Player "+ tonight.tonightPlayers[i].playerUser.firstName);
//                 //fully expand or populate the player element with full details of the user object
//                 //save tonight object to the database
//                 //emit a drawPlayers function or something that will include the full array of the players joined thus far
//                 break;
//             }
//         }
//     });
//     //another function under the io.on connection
//     socket.on('iAmDisconnected', (userId) => {
//         io.emit('chat message',"And goodbye to User "+ userId);
//     });
//  });

//  function message (userId, event, data) { //not being used at the moment
//      io.sockets.to(userId).emit(event, data);
// }
 
//===============
//FINAL EXPORT
//==============

module.exports = socketServer;