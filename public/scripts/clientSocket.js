var socket = io();


//=============
// DOM stuff to manage via variables and objects
//===============
let chatMessages            = document.querySelector("#chatMessages");
let statusUpdates            = document.querySelector("#statusUpdates");


//=========
//GET DATA FROM SERVER JS without jquery
//==========

function getAPIData(url) {
  return new Promise((resolve, reject) => {
    var request = new XMLHttpRequest();
    var errorText = "Sorry, unable to get requested data from the server. Please notify Bluemont.";
    request.open('GET', url, true);
    request.onload = function () {
      if (this.status >= 200 && this.status < 400) {
        // Success!
        var returnedAPIData = JSON.parse(this.response);
        // return data;
        resolve(returnedAPIData);
      } else {
        // We reached our target server, but it returned an error
        reject(errorText);
      }
    };
    request.onerror = function () {
      // There was a connection error of some sort
      reject(errorText);
    };
    request.send();
  });
}



//==============
//DOM MANIPULATION FUNCTIONS
//==============


function htmlToElement(html) {
  var template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

function displayDealerPrompt (instruction){
  //loop thru and hide all of the elements in #dealingButtonsRow and #dealerAlert
  let allDealingButtons = document.querySelectorAll('#dealingButtonsRow button')
  for (let i=0; i<allDealingButtons.length; i++){
    allDealingButtons[i].style.display="none";
  }
  document.getElementById('dealerAlert').style.display="none";
  //now display only the item needed for next step of game sequence
  switch (instruction){
    case "dealFaceUp" || "dealFaceDown" || "dealPlayersChoice":
      document.getElementById('dealButton').style.display = "inline";
      break;
    case "dealIndicatorsDown":
      document.getElementById('dealIndicatorCardsButton').style.display = "inline";
      break;
    case "offerCards":
      document.getElementById('offerCardsButton').style.display = "inline";
      break;
    case "passCards":
      document.getElementById('passCardsPromptButton').style.display = "inline";
      break;
    case "declare":
      document.getElementById('declarePromptButton').style.display = "inline";
      break;
    case "": // if we send an empty string as an argument to this function, we're hiding the entire thing and not re-displaying anything!
      break;
    default: // for everything else, assume it's a prompt to the dealer
      document.getElementById('dealerAlert').style.display = "block";
  }
}


function updateNameTag (index, newStatus) {
  let allPlayerNameTags = document.getElementsByClassName('inGameStatus');
  let tagToUpdate = allPlayerNameTags.item(index);
  let str="";
  switch (newStatus){
    case "in":
      str = `<span class="bg-success text-white inGameStatus">In</span>`;
      break;
    case "out":
      str = `<span class="bg-danger text-white inGameStatus">Out</span>`;
      break;
    case "reset":
      str = `<span class="bg-success text-white inGameStatus">In</span>`;
      break;
  }

  if(tagToUpdate.outerHTML) { //if outerHTML is supported
    tagToUpdate.outerHTML=str; ///it's simple replacement of whole element with contents of str var
  } else { //if outerHTML is not supported, there is a weird but crossbrowsered trick
  var tmpObj=document.createElement("div");
  tmpObj.innerHTML='<!--THIS DATA SHOULD BE REPLACED-->';
  ObjParent=tagToUpdate.parentNode; //Okey, element should be parented
  ObjParent.replaceChild(tmpObj,tagToUpdate); //here we placing our temporary data instead of our target, so we can find it then and replace it into whatever we want to replace to
  ObjParent.innerHTML=ObjParent.innerHTML.replace('<div><!--THIS DATA SHOULD BE REPLACED--></div>',str);
  }

  if (newStatus === "reset"){
    allPlayerNameTags.item(index).style.display = "none";
  } else {
    allPlayerNameTags.item(index).style.display = "inline";
  }

}


//==============
//GAME PLAYING FUNCTIONS
//==============

function getMyIndex (){
  let currentPlayerIndexNumber = parseInt(sessionStorage.getItem('currentPlayerIndex'),10);
  return currentPlayerIndexNumber;
}

function getPlayerIndex (userID, playersArray){
  for (let i=0; i<playersArray.length;i++){
    if (playersArray[i].playerUser._id===userID){
      return i;
    }
  }
}

function ante(){
  let myIndex = getMyIndex();
  console.log ("Your currentPlayer index number is: " + myIndex);
  socket.emit("I ante", myIndex);
  console.log ("I just sent the I-ante emit");
  document.getElementById('anteButton').removeEventListener("click",ante);
  document.getElementById("anteButtonsRow").style.display = "none";
  document.getElementById("anteButtonsRow").classList.remove("d-flex");
}

function sitOut (){
  let myIndex = getMyIndex();
  console.log ("Your currentPlayer index number is: " + myIndex);
  socket.emit("I sit out", myIndex);
  console.log ("I just sent the sit out emit");
  document.getElementById('sitOutButton').removeEventListener("click",sitOut);
  document.getElementById("anteButtonsRow").style.display = "none";
  document.getElementById("anteButtonsRow").classList.remove("d-flex");
}

function deal(){
  let myIndex = getMyIndex();
  socket.emit("I deal", myIndex);
  console.log ("I just sent the I-deal emit");
  document.getElementById('dealButton').removeEventListener("click",deal);
  document.getElementById('dealButton').style.display = "none";
}

function updatePlayerBalance (tonightPlayerIndex, newAmt){
  let targetElement = [];
  let tonightPlayerNumber = tonightPlayerIndex+1;
  switch (tonightPlayerNumber){
    case 1:
      targetElement = document.querySelector("#player1Area .winningsDisplayAmt");
      break;
    case 2:
      targetElement = document.querySelector("#player2Area .winningsDisplayAmt");
      break;
    case 3:
      targetElement = document.querySelector("#player3Area .winningsDisplayAmt");
      break;
    case 4:
      targetElement = document.querySelector("#player4Area .winningsDisplayAmt");
      break;
    case 5:
      targetElement = document.querySelector("#player5Area .winningsDisplayAmt");
      break;
    case 6:
      targetElement = document.querySelector("#player6Area .winningsDisplayAmt");
      break;
    case 7:
      targetElement = document.querySelector("#player7Area .winningsDisplayAmt");
      break;
  }
    targetElement.textContent = newAmt.toString();
}

function hidePlayerArea(index){
index += 1; //to go from array index to displayed player number
document.getElementById(`player${index}Area`).style.display = "none";
}

//==============
//CHAT FORM SUBMIT LOGIC
//==============

// const chatForm = document.getElementById('chatForm');
// chatForm.onsubmit = submit;

// function submit(event) {
//   event.preventDefault();  // prevent window from refreshing on submit
//   socket.emit('chat message', chatForm.chatInput.value);
//   chatForm.chatInput.value="";  //clear the form for next input
// }






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
        localStorage.setItem('currentUserID', returnedAPIData.currentUser._id);
        localStorage.setItem('currentUserFullName', returnedAPIData.currentUser.firstName + " " + returnedAPIData.currentUser.lastInitial);
        socket.emit('iAmConnected', myConnectObject);
    })
});


// socket.on('chat message', function(msg){
//   chatMessages.innerHTML += "<li>" + msg + "</li>";
// });

socket.on('status update', function(msg){
  statusUpdates.innerHTML = msg;
});

socket.on('render new player for all', function (newPlayerUser){
  //load my user data via the API
  getAPIData('/api/user_data')
  .then ((returnedAPIData) => {
    if (returnedAPIData.currentUser._id!==newPlayerUser._id){ //the new player is not me!
      let playerDivsCount = document.querySelectorAll('.playerArea').length; //get the count of existing player areas
      let playersRow1 = document.querySelector('#playersRow1');
      let playersRow2 = document.querySelector('#playersRow2');
      let newPlayerFullName = `${newPlayerUser.firstName} ${newPlayerUser.lastInitial}`;
      let targetPlayerRow = 0;
      targetPlayerRow = (playerDivsCount<3) ? 1 : 2; // ternary operator here, players 4-7 get added to second row
      console.log("Player divs so far: " + playerDivsCount);
      console.log("Target player row: " + targetPlayerRow);
      //create a God-awful string of HTML
      let insertableHTML = `<div class="col col-12 col-md-3 playerArea" id="player${playerDivsCount+1}Area">
      <ul class="list-group">
        <li class="list-group-item d-flex justify-content-between lh-condensed playerNameRow">
          <div>
            <h6 class="my-0">Player ${playerDivsCount+1}: ${newPlayerFullName}</h6>
          </div>
          <span class="bg-success text-white inGameStatus">In</span>
        </li>
      </ul>
      <div class="card-body rowOfCards d-flex align-items-start">
        <!-- cards to be added via javascript later -->
      </div>
      <ul class="list-group">
      <li class="list-group-item d-flex lh-condensed playerWinningsRow">
          <div>
            <h6 class="my-0">Winnings: $<span class="winningsDisplayAmt">0.00</span></h6>
          </div> 
      </li>
    </ul>
    </div>`;
      //now append that HTML into the targeted row
      if (targetPlayerRow===1){
        playersRow1.innerHTML += insertableHTML;
      } else {
        // playersRow2.style.display="flex";  //maybe no need to ever make this thing IN-visible, right?
        playersRow2.innerHTML += insertableHTML;
      }
    }
  });
});

socket.on('private message', function(msg){
  switch(msg){
    case "You are dealer":
      document.getElementById("navGameDropdown").style.display="inline";
        break;
    case "Your player index is 0":
      sessionStorage.setItem('currentPlayerIndex', "0");
        break;
    case "Your player index is 1":
      sessionStorage.setItem('currentPlayerIndex', "1");
        break;
    case "Your player index is 2":
      sessionStorage.setItem('currentPlayerIndex', "2");
        break;
    case "Your player index is 3":
      sessionStorage.setItem('currentPlayerIndex', "3");
        break;
    case "Your player index is 4":
      sessionStorage.setItem('currentPlayerIndex', "4");
        break;
    case "Your player index is 5":
      sessionStorage.setItem('currentPlayerIndex', "5");
        break;
    case "Your player index is 6":
      sessionStorage.setItem('currentPlayerIndex', "6");
        break;
    default:
      alert ("You got an unknown private message from the server. Lucky you!");
    }
});

socket.on('dealer instruction', function(myConfig){
    switch(myConfig.currentGame.playSequence[myConfig.currentGame.playSequenceLocation]){
    case "dealFaceDown":
      //unhide or display the "deal" button and add event listener to it
      const el = document.getElementById('dealButton');
      el.style.display = "inline-block";
      el.addEventListener("click", deal);
      break;
    default:
      alert("You got an unknown dealer instruction from the server. Lucky you!");
  }
});

socket.on('game open', function(myConfig){
  //show game details
  document.getElementById("gameNameDisplay").innerText = myConfig.currentGame.name;
  document.getElementById("currentDealerNameDisplay").innerText = "Dealer:" + myConfig.currentDealerName;
  document.getElementById("numCardsDisplay").innerText = myConfig.currentGame.numCards + " cards";
  document.getElementById("whatsWildDisplay").innerText = "Wild cards: " + myConfig.currentGame.whatsWild;
  document.getElementById("hiloDisplay").innerText = myConfig.currentGame.hilo;
  //unhide the betting column, but re-hide the betting buttons row
  document.getElementById("bettingColumn").style.display = "block";
  document.getElementById("bettingButtonsRow").style.display = "none";
  //listen for click on ante button
  const el = document.getElementById('anteButton');
  el.addEventListener("click", ante);
  const el2 = document.getElementById('sitOutButton');
  el2.addEventListener("click", sitOut);
  // display ante/sit-out buttons
  document.getElementById("anteButtonsRow").style.display = "block";
  document.getElementById("anteButtonsRow").classList.add("d-flex");
});

socket.on('ante broadcast', function(anteBroadcastObject){
   //show "in" label
   updateNameTag (anteBroadcastObject.playerIndex,"in");
   //update the winnings balance display of the player who ante'd
   //first, get the balance for night of that player
   let x = anteBroadcastObject.myConfig.tonight.players;
   x = x[anteBroadcastObject.playerIndex];
   x = x.balanceForNight.toFixed(2);
   updatePlayerBalance (anteBroadcastObject.playerIndex, x);
  // empty out the betting list
  document.getElementById("bettingDisplayList").innerHTML = "";
  //display the newly updated "players in game" array in the betting list
  for (let i=0;i<anteBroadcastObject.myConfig.currentGame.playersInGame.length;i++){
    let antePlayerName = anteBroadcastObject.myConfig.currentGame.playersInGame[i].playerUser.firstName;
    antePlayerName += " " + anteBroadcastObject.myConfig.currentGame.playersInGame[i].playerUser.lastInitial;
    let insertableHTML = 
    `<li class="list-group-item d-flex justify-content-between lh-condensed playerLineBetLi">
      <div>
        <h6 class="my-0">${antePlayerName}</h6>
      </div>
    <span class="text-muted playerLineBetAmt">$0.00</span>
    </li>`;
    let newPlayerLineBetLi = htmlToElement(insertableHTML); // use function to convert HTML string into DOM element
    document.getElementById("bettingDisplayList").appendChild(newPlayerLineBetLi); // add this as a new line in the betting list
  }
  // now recreate the "Pot amount"line at the bottom of that list
  let newPotAmt = anteBroadcastObject.myConfig.currentGame.amtPot.toFixed(2);
  let insertableHTML =
   `<li class="list-group-item d-flex justify-content-between" id="potLineBetAmt">
      <span><strong>Pot</strong></span>
      <strong>$${newPotAmt}</strong>
    </li>`;
    let newPotAmtLi = htmlToElement(insertableHTML); // use function to convert HTML string into DOM element
    document.getElementById("bettingDisplayList").appendChild(newPotAmtLi); // add this as the final line at bottom of the betting list
});

socket.on('sit out broadcast', function(sitOutBroadcastObject){
  //show "out" label
  updateNameTag (sitOutBroadcastObject.playerIndex,"out");
  //hide the player's area
  hidePlayerArea(sitOutBroadcastObject.playerIndex);
});


socket.on('shuffle visual', function(){
  let insertableHTML = `<div class="cardSingle rounded faceDown"></div>`;
  let dealPile = document.querySelector('#dealPile');
  for (let i=1;i<14;i++){
    dealPile.innerHTML += insertableHTML;
  }
});

socket.on('deal batch broadcast', function (dealBatchObject){
  // console.log("Deal batch object is: ");
  // console.log(JSON.stringify(dealBatchForClient));
  ///loop thru the object, building insertable HTML and adding it to the correct playerArea, playing a sound, maybe animating
  dealBatchObject.dealBatchCommon.forEach(element => {
    let insertableHTML = "";
    let insertableClass = "";
    let insertableBackground = "";
    if (element.imgPath.includes("back")){
      insertableClass = " faceDown";
    } else {
      insertableClass = " faceUp";
      insertableBackground = ` style="background-image: url(${element.imgPath});"`;
    }
   if (element.tonightPlayerIndex===getMyIndex()){ // if I' populating my own playerArea div
    insertableHTML = `<div class="cardSingle rounded${insertableClass}" id="DCI${element.dci}"${insertableBackground}>${dealBatchObject.overlayHTML}</div>`;
    sessionStorage.setItem('myHand', sessionStorage.getItem('myHand') + "," + element.dci);
   } else {
    insertableHTML = `<div class="cardSingle rounded${insertableClass}" id="DCI${element.dci}"${insertableBackground}></div>`;
   }
  let newCardDiv = htmlToElement(insertableHTML); // use function to convert HTML string into DOM element
  document.querySelector(`#player${element.tonightPlayerIndex+1}Area .rowOfCards`).append(newCardDiv);
  });
});




