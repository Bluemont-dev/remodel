
var socket = io();


//=============
// DOM stuff to manage via variables and objects
//===============
// let requestDealButton       = document.querySelector("#requestDealButton");
// let myCardsDisplay          = document.querySelector("#myCardsDisplay");
// let remainingDeckDisplay    = document.querySelector("#remainingDeckDisplay");
let chatMessages            = document.querySelector("#chatMessages");
let statusUpdates            = document.querySelector("#statusUpdates");

//=========
//GET USER DATA FROM SERVER JS without jquery
//==========

const getAPIData = (url) => {
    return new Promise ((resolve,reject) => {
        var request = new XMLHttpRequest();
        var errorText = "Sorry, unable to get user data from the server. Please notify Bluemont.";
        request.open('GET', url, true);
        request.onload = function() {
          if (this.status >= 200 && this.status < 400) {
            // Success!
            var returnedAPIData = JSON.parse(this.response);
            console.log("Here in the API-calling function, user ID from returned API data is : " + returnedAPIData.currentUser._id);
            // return user_data;
            resolve(returnedAPIData);
          } else {
            // We reached our target server, but it returned an error
            reject(errorText);
          }
        };
        request.onerror = function() {
          // There was a connection error of some sort
          reject(errorText);
        };
        request.send();
    })  
}


//==============
//CHAT FORM SUBMIT LOGIC
//==============

const chatForm = document.getElementById('chatForm');
chatForm.onsubmit = submit;

function submit(event) {
  event.preventDefault();  // prevent window from refreshing on submit
  socket.emit('chat message', chatForm.chatInput.value);
  chatForm.chatInput.value="";  //clear the form for next input
}






//=============
// SOCKET EVENT HANDLERS
//===============

socket.on('connect', function connectUser () {  // Called whenever a user connects
//emit a message to the socket server and pass the currentUser._id and  socket.id as arguments
    console.log("Your socket ID is: " + socket.id);
    getAPIData('/api/user_data')
    .then ((returnedAPIData) => {
        console.log("Here in the socket handler function, User id is : " + returnedAPIData.currentUser._id);
        let tonightID = window.location.href;
        tonightID = tonightID.substring(tonightID.indexOf('/play/')+6,tonightID.length); //parse browser URL to get ID of tonight database object
        let myConnectObject = {
            userID: returnedAPIData.currentUser._id,
            socketID: socket.id,
            tonightID: tonightID
        };
        socket.emit('iAmConnected', myConnectObject);
    })
});


socket.on('chat message', function(msg){
  chatMessages.innerHTML += "<li>" + msg + "</li>";
});

socket.on('status update', function(msg){
  statusUpdates.innerHTML = msg;
});

socket.on('render new player for all', function (newPlayerUser){
  //load my user data via the API
  getAPIData('/api/user_data')
  .then ((returnedAPIData) => {
    let playerDivsCount = document.querySelectorAll('.playerArea').length; //get the count of existing player areas
    let playersRow1 = document.querySelector('#playersRow1');
    let playersRow2 = document.querySelector('#playersRow2');
    let targetPlayerRow = 0;
    targetPlayerRow = (playerDivsCount<3) ? 1 : 2; // ternary operator here, players 4-7 get added to second row
    //create a God-awful string of HTML
    let insertableHTML = `<div class="col col-12 col-md-3 playerArea" id="player${playerDivsCount+1}Area">
    <p>Player ${playerDivsCount+1}: ${newPlayerUser.firstName}</p>
    <div class="card-body rowOfCards">
      <div class="cardSingle rounded"><img src="../images/cards/10_of_clubs.png"></div>
      <div class="cardSingle rounded"><img src="../images/cards/10_of_clubs.png"></div>
      <div class="cardSingle rounded"><img src="../images/cards/10_of_clubs.png"></div>
      <div class="cardSingle rounded"><img src="../images/cards/10_of_clubs.png"></div>
      <div class="cardSingle rounded"><img src="../images/cards/10_of_clubs.png"></div>
      <div class="cardSingle rounded"><img src="../images/cards/10_of_clubs.png"></div>
      <div class="cardSingle rounded"><img src="../images/cards/10_of_clubs.png"></div>
      <div class="cardSingle rounded"><img src="../images/cards/10_of_clubs.png"></div>
      <div class="cardSingle rounded"><img src="../images/cards/10_of_clubs.png"></div>
      <div class="cardSingle rounded"><img src="../images/cards/10_of_clubs.png"></div>
    </div>
  </div>`
    //now append that HTML into the targeted row
    if (targetPlayerRow===1){
      playersRow1+=insertableHTML;
    } else {
      playersRow2.style.display="block";
      playersRow2+=insertableHTML;
    }
  });
});






