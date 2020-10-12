
var socket = io();





//=============
// DOM stuff to manage via variables and objects
//===============
let requestDealButton       = document.querySelector("#requestDealButton");
let myCardsDisplay          = document.querySelector("#myCardsDisplay");
let remainingDeckDisplay    = document.querySelector("#remainingDeckDisplay");
let chatMessages            = document.querySelector("#chatMessages");

myCardsDisplay.textContent = "Not much, buddy";


//=============
// EVENT HANDLERS
//===============

socket.on('connect', function connectUser () {  // Called whenever a user connects
//emit a message to the socket server and pass the currentUser._id and  socket.id as arguments

    let socketID = socket.id;
    if (!socketID) return;
    alert("Your userId is " + currentUser._id + "and your socketID is " + socketID);
    socket.emit('iAmConnected', currentUser._id, socketID);
});



requestDealButton.addEventListener("click", function(){
    let userId = socket.id;
    socket.emit("request deal",userId);
});

socket.on('chat message', function(msg){
  chatMessages.innerHTML += "<li>" + msg + "</li>";
});

socket.on("allCards update", function (allcards){
    // alert("Dealer trying to pass updated allCards value.");
    remainingDeckDisplay.textContent = allcards;
});

socket.on('cards sent', function (myCards){
    myCardsDisplay.textContent=myCards;
});



