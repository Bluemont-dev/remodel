

const express	= require("express");
const	app 	= express();
const http      = require('http').createServer(app);
const io        = require('socket.io')(http);

const User 		= require ("./models/user"),
	  Night		= require ("./models/night"),
	  middleware	= require ("./middleware");

var myConfig    = require ("./config"); // global variables available and changeable by all routes, I hope

const socketServer = {};


 
//===============
//FINAL EXPORT
//==============

module.exports = socketServer;