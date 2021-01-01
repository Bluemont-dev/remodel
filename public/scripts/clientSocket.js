var socket = io();


//=============
// DOM stuff to manage via variables and objects
//===============
let chatMessages = document.querySelector("#chatMessages");
let statusUpdates = document.querySelector("#statusUpdates");


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

function displayDealerPrompt(instruction) {
  //loop thru and hide all of the elements in #dealingButtonsRow and #dealerAlert
  let allDealingButtons = document.querySelectorAll('#dealingButtonsRow button')
  for (let i = 0; i < allDealingButtons.length; i++) {
    allDealingButtons[i].style.display = "none";
  }
  document.getElementById('dealerAlert').style.display = "none";
  //now display only the item needed for next step of game sequence
  switch (instruction) {
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
      document.getElementById('promptToDeclareButton').style.display = "inline";
      break;
    case "": // if we send an empty string as an argument to this function, we're hiding the entire thing and not re-displaying anything!
      break;
    default: // for everything else, assume it's a prompt to the dealer
      document.getElementById('dealerAlert').style.display = "block";
  }
}

function getOverlayFromString (string){
	let suitHTMLEntity = "";
	let colorClass = "";
	let char1 = string.substr(0, 1);
    char1 = char1.toUpperCase();
	if (char1==="T"){
		char1 = "10";
	}
    let char2 = string.substr(1, 1);
	switch(char2){
	case "s":
		suitHTMLEntity = "&spades;";
		colorClass = "black";
		break;
	case "c":
		suitHTMLEntity = "&clubs;";
		colorClass = "black";
		break;
	case "d":
		suitHTMLEntity = "&diams;";
		colorClass = "red";
		break;
	case "h":
		suitHTMLEntity = "&hearts;";
		colorClass = "red";
		break;
	}
    overlayHTML = `<span class="cardOverlay ${colorClass}">${char1}&nbsp;<br>${suitHTMLEntity}</span>`;
	return overlayHTML;
}

function updateDealPile(numShuffledDeckRemaining) {
  let dealPileCounter = document.getElementById('dealPile').childElementCount;
  let dealPileElement = document.getElementById('dealPile');
  while (dealPileElement.childElementCount > ((numShuffledDeckRemaining / 4) + .75)) {
    dealPileElement.removeChild(dealPileElement.lastChild);
  }
}


function updatePlayerStatusSpan(index, newStatus) {
  // let allPlayerNameTags = document.getElementsByClassName('inGameStatus');
  // let tagToUpdate = allPlayerNameTags.item(index);
  index += 1; //convert index number to displayed player number
  let thisSpan = document.querySelector(`#player${index}Area .inGameStatus`);
  thisSpan.textContent = newStatus;
  thisSpan.classList.add('bg-success');
  // if (tagToUpdate.outerHTML) { //if outerHTML is supported
  //   tagToUpdate.outerHTML = str; ///it's simple replacement of whole element with contents of str var
  // } else { //if outerHTML is not supported, there is a weird but crossbrowsered trick
  //   var tmpObj = document.createElement("div");
  //   tmpObj.innerHTML = '<!--THIS DATA SHOULD BE REPLACED-->';
  //   ObjParent = tagToUpdate.parentNode; //Okey, element should be parented
  //   ObjParent.replaceChild(tmpObj, tagToUpdate); //here we placing our temporary data instead of our target, so we can find it then and replace it into whatever we want to replace to
  //   ObjParent.innerHTML = ObjParent.innerHTML.replace('<div><!--THIS DATA SHOULD BE REPLACED--></div>', str);
  // }

  // if (newStatus === "reset") {
  //   allPlayerNameTags.item(index).style.display = "none";
  // } else {
  //   allPlayerNameTags.item(index).style.display = "inline";
  // }
}

function chooseOpener() {
  let clickedPlayerName = this.innerText;
  let clickedPlayerIndex = parseInt(clickedPlayerName.substr(7, 1), 10) - 1;
  //use this value to send an emit to the server for "I chose opener"
  socket.emit("I chose opener", clickedPlayerIndex);
  dealerAlert.style.display = "none";
  dealerAlert.textContent = "";
  //remove event listener for all player names in playerAreas
  let elements = document.querySelectorAll('.playerNameRow h6');
  for (let i = 0; i < elements.length; i++) {
    elements[i].removeEventListener('click', chooseOpener);
  }
};

function chooseWinner() {
  let clickedPlayerName = this.innerText;
  let clickedPlayerIndex = parseInt(clickedPlayerName.substr(7, 1), 10) - 1;
  //use this value to send an emit to the server for "I chose winner"
  socket.emit("I chose winner", clickedPlayerIndex);
  dealerAlert.style.display = "none";
  dealerAlert.textContent = "";
  //remove event listener for all player names in playerAreas
  let elements = document.querySelectorAll('.playerNameRow h6');
  for (let i = 0; i < elements.length; i++) {
    elements[i].removeEventListener('click', chooseWinner);
  }
};


//==============
//GAME PLAYING FUNCTIONS
//==============


function getMyIndex() {
  let currentPlayerIndexNumber = parseInt(sessionStorage.getItem('currentPlayerIndex'), 10);
  return currentPlayerIndexNumber;
}

function getPlayerIndex(userID, playersArray) {
  for (let m = 0; m < playersArray.length; m++) {
    if (playersArray[m].playerUser._id === userID) {
      return m;
    }
  }
}

function ante() {
  let myIndex = getMyIndex();
  console.log("Your currentPlayer index number is: " + myIndex);
  socket.emit("I ante", myIndex);
  console.log("I just sent the I-ante emit");
  document.getElementById('anteButton').removeEventListener("click", ante);
  document.getElementById("anteButtonsRow").style.display = "none";
  document.getElementById("anteButtonsRow").classList.remove("d-flex");
}

function sitOut() {
  let myIndex = getMyIndex();
  console.log("Your currentPlayer index number is: " + myIndex);
  socket.emit("I sit out", myIndex);
  console.log("I just sent the sit out emit");
  document.getElementById('sitOutButton').removeEventListener("click", sitOut);
  document.getElementById("anteButtonsRow").style.display = "none";
  document.getElementById("anteButtonsRow").classList.remove("d-flex");
}

function resetBettingButtons (){
  let openButton=document.getElementById('openButton');
  if (openButton!==null){
    openButton.removeEventListener('click',open);
  }
  let checkButton = document.getElementById('checkButton');
  if (checkButton!==null){
    checkButton.removeEventListener('click',check);
  }
  let callButton = document.getElementById('callButton');
  if (callButton!==null){
    callButton.removeEventListener('click',call);
  }
  let raiseButton = document.getElementById('raiseButton');
  if (raiseButton!==null){
    raiseButton.removeEventListener('click',raise);
  }
  let foldButton = document.getElementById('foldButton');
  if (foldButton!==null){
    foldButton.removeEventListener('click',fold);
  }
  document.getElementById('bettingButtonsRow').innerHTML = ""; //get rid of all the buttons, etc.
}

function open() {
  //get the value of the "openAmt" input
  let betAmtText = document.getElementById('openAmt').value;
  let betAmt = Number.parseFloat(betAmtText);
  //remove all betting buttons and their event listeners
  let myIndex = getMyIndex();
  let iBetObject = {
    bettorIndex:myIndex,
    betAmt:betAmt
  }
  socket.emit("I bet", iBetObject);
  console.log("I opened, so I just sent the I-bet emit");
  resetBettingButtons();
}

function check() {
  //remove all betting buttons and their event listeners
  resetBettingButtons();
  let myIndex = getMyIndex();
  socket.emit("I check", myIndex);
  console.log("I just sent the I-check emit");
}

function call() {
    //get the value of the Call amount
    let callButtonFullLabel = document.getElementById('callButton').textContent;
    let callButtonAmtText = callButtonFullLabel.substring(6);
    let callButtonAmt = Number.parseFloat(callButtonAmtText);
    let myIndex = getMyIndex();
    let iBetObject = {
      bettorIndex:myIndex,
      betAmt:callButtonAmt
    }
    socket.emit("I bet", iBetObject);
    console.log("I called, so I just sent the I-bet emit");
    //remove all betting buttons and their event listeners
    resetBettingButtons();
}

function raise() {
  //get the value of the Call amount
  let callButtonFullLabel = document.getElementById('callButton').textContent;
  let callButtonAmtText = callButtonFullLabel.substring(6);
  let callButtonAmt = Number.parseFloat(callButtonAmtText);
  //get the value of the "raiseAmt" input
  let raiseAmtText = document.getElementById('raiseAmt').value;
  let raiseAmt = Number.parseFloat(raiseAmtText);
  let myIndex = getMyIndex();
  let iRaiseObject = {
    bettorIndex:myIndex,
    callAmt:callButtonAmt,
    raiseAmt:raiseAmt
  }
  socket.emit("I raise", iRaiseObject);
  console.log("I just sent the I-raise emit");
  //remove all betting buttons and their event listeners
  resetBettingButtons();
}

function fold() {
  //remove all betting buttons and their event listeners
  resetBettingButtons();
  let myIndex = getMyIndex();
  socket.emit("I fold", myIndex);
  console.log("I just sent the I-fold emit");
}

function deal() {
  let myIndex = getMyIndex();
  socket.emit("I deal", myIndex);
  console.log("I just sent the I-deal emit");
  document.getElementById('dealButton').removeEventListener("click", deal);
  document.getElementById('dealButton').style.display = "none";
}

function promptToDeclare() {
  let myIndex = getMyIndex();
  socket.emit("I prompt to declare"); // passing no arguments!
  console.log("I just sent the I-prompt-to-declare emit");
  document.getElementById('promptToDeclareButton').removeEventListener("click", promptToDeclare);
  document.getElementById('promptToDeclareButton').style.display = "none";
}

function handleDeclareCheckboxChange(checkbox){
  if(checkbox.checked == true){
    document.getElementById('declareButton').removeAttribute("disabled");
  } else {
    if (document.getElementById('declareLowCheckbox').checked === false && document.getElementById('declareHighCheckbox').checked === false){ // if both are unchecked
      document.getElementById("declareButton").setAttribute("disabled", "disabled");
    }
  }
}

function declare() {
  let myIndex = getMyIndex();
  //get declaration value based on checkboxes
  let declareLowCheckbox = document.getElementById('declareLowCheckbox');
  let declareHighCheckbox = document.getElementById('declareHighCheckbox');
  let declaration = "";
  if (declareLowCheckbox.checked && declareHighCheckbox.checked){ //if going both low and high
    declaration = "both";
  } else if (declareLowCheckbox.checked) {
    declaration = "low";
  } else {
    declaration = "high"
  }
  //disable the declare button and update the instructions shown to player
  document.getElementById('declareButton').disabled = true;
  let declareInstruxList = document.querySelector('#declareButtonRow ul');
  declareInstruxList.innerHTML = `                <li>Your choice won't be revealed to others until all have declared.</li>
  <li><em>You have declared; now waiting for the other players.</em></li>`;
  // send the emit
  let iDeclareObject = {
    index:myIndex,
    declaration:declaration
  };
  socket.emit("I declare", iDeclareObject);
  console.log("I just sent the I-declare emit");
}

function updatePlayerBalance(index, amt) {
  index += 1; //to go from array index to displayed player number
  let myBalanceElement = document.querySelector(`#player${index}Area .winningsDisplayAmt`);
  let myBalanceAmt = amt.toFixed(2);
  myBalanceElement.textContent = myBalanceAmt;
  // let targetElement = [];
  // let tonightPlayerNumber = tonightPlayerIndex + 1;
  // switch (tonightPlayerNumber) {
  //   case 1:
  //     targetElement = document.querySelector("#player1Area .winningsDisplayAmt");
  //     break;
  //   case 2:
  //     targetElement = document.querySelector("#player2Area .winningsDisplayAmt");
  //     break;
  //   case 3:
  //     targetElement = document.querySelector("#player3Area .winningsDisplayAmt");
  //     break;
  //   case 4:
  //     targetElement = document.querySelector("#player4Area .winningsDisplayAmt");
  //     break;
  //   case 5:
  //     targetElement = document.querySelector("#player5Area .winningsDisplayAmt");
  //     break;
  //   case 6:
  //     targetElement = document.querySelector("#player6Area .winningsDisplayAmt");
  //     break;
  //   case 7:
  //     targetElement = document.querySelector("#player7Area .winningsDisplayAmt");
  //     break;
  // }
  // targetElement.textContent = newAmt.toString();
}

function updatePlayerAmtBetDisplay(index, amt){
  index += 1; //to go from array index to displayed player number
  let myAmtBet = document.getElementById(`player${index}amtBet`);
  myAmtBet.textContent = `$${amt.toFixed(2)}`;
}

function hidePlayerArea(index) {
  index += 1; //to go from array index to displayed player number
  document.getElementById(`player${index}Area`).style.display = "none";
}

function removePlayerBettingLine (index) {
  index += 1; //to go from array index to displayed player number
  let myBettingLine = document.getElementById(`player${index}LineBetLi`);
  // let myBettingList = document.getElementById('bettingDisplayList');
  // myBettingList.splice(myBettingList.indexOf(myBettingLine),1);
  myBettingLine.remove();
}

function highlightPlayerArea(index, highlightBoolean) {
  index += 1; //to go from array index to displayed player number
  if (highlightBoolean) {
    document.getElementById(`player${index}Area`).style.backgroundColor = "rgba(175,215,255,0.5)";
  } else {
    document.getElementById(`player${index}Area`).style.backgroundColor = "transparent";
  }
}

function highlightPlayerLineBetLi(index, highlightBoolean) {
  index += 1; //to go from array index to displayed player number
  if (highlightBoolean) {
    document.getElementById(`player${index}LineBetLi`).style.backgroundColor = "rgba(175,215,255,0.5)";
  } else {
    document.getElementById(`player${index}LineBetLi`).style.backgroundColor = "transparent";
  }
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

socket.on('connect', function connectUser() {  // Called whenever a user connects
  //emit a message to the socket server and pass the currentUser._id and  socket.id as arguments
  console.log("Your socket ID is: " + socket.id);
  getAPIData('/api/user_data')
    .then((returnedAPIData) => {
      console.log("Here in the socket handler function, User id is : " + returnedAPIData.currentUser._id);
      let tonightID = window.location.href;
      tonightID = tonightID.substring(tonightID.indexOf('/play/') + 6, tonightID.length); //parse browser URL to get ID of tonight database object
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

socket.on('status update', function (msg) {
  statusUpdates.innerHTML = msg;
});

socket.on('render new player for all', function (newPlayerUser) {
  //load my user data via the API
  getAPIData('/api/user_data')
    .then((returnedAPIData) => {
      if (returnedAPIData.currentUser._id !== newPlayerUser._id) { //the new player is not me!
        let playerDivsCount = document.querySelectorAll('.playerArea').length; //get the count of existing player areas
        let playersRow1 = document.querySelector('#playersRow1');
        let playersRow2 = document.querySelector('#playersRow2');
        let newPlayerFullName = `${newPlayerUser.firstName} ${newPlayerUser.lastInitial}`;
        let targetPlayerRow = 0;
        targetPlayerRow = (playerDivsCount < 3) ? 1 : 2; // ternary operator here, players 4-7 get added to second row
        console.log("Player divs so far: " + playerDivsCount);
        console.log("Target player row: " + targetPlayerRow);
        //create a God-awful string of HTML
        let insertableHTML = `<div class="col col-12 col-md-3 playerArea" id="player${playerDivsCount + 1}Area">
      <ul class="list-group">
        <li class="list-group-item d-flex justify-content-between lh-condensed playerNameRow">
          <div>
            <h6 class="my-0">Player ${playerDivsCount + 1}: ${newPlayerFullName}</h6>
          </div>
          <span class="text-white inGameStatus"></span>
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
        if (targetPlayerRow === 1) {
          playersRow1.innerHTML += insertableHTML;
        } else {
          // playersRow2.style.display="flex";  //maybe no need to ever make this thing IN-visible, right?
          playersRow2.innerHTML += insertableHTML;
        }
      }
    });
});

socket.on('private message', function (msg) {
  switch (msg) {
    case "You are dealer":
      document.getElementById("navGameDropdown").style.display = "inline";
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
      alert("You got an unknown private message from the server. Lucky you!");
  }
});

socket.on('dealer instruction', function (myConfig) {
  let dealString = myConfig.tonight.games[myConfig.tonight.games.length - 1].playSequence[myConfig.tonight.games[myConfig.tonight.games.length - 1].playSequenceLocation];
  let dealButton = document.getElementById('dealButton');
  let promptToDeclareButton = document.getElementById('promptToDeclareButton');
  let dealerAlert = document.getElementById('dealerAlert');
  switch (dealString) {
    case ("dealFaceDown"):
      //unhide or display the "deal" button and add event listener to it
      dealButton.style.display = "inline-block";
      dealButton.addEventListener("click", deal);
      break;
    case ("dealFaceUp"):
      //unhide or display the "deal" button and add event listener to it
      dealButton.style.display = "inline-block";
      dealButton.addEventListener("click", deal);
      break;
    case ("bet"):
      //unhide or display a prompt for dealer to click the opener's name (#dealerAlert)
      dealerAlert.style.display = "block";
      let dealerPromptText = "Click a player's name to open the betting. ";
      if (myConfig.previousOpenerIndex>-1){ // if there WAS a previous opener in this game
        dealerPromptText += `Previous opener was Player ${myConfig.previousOpenerIndex+1}`;
      }
      dealerAlert.textContent = dealerPromptText;
      //add event listener for all player names in playerAreas
      let elements = document.querySelectorAll('.playerNameRow h6');
      for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', chooseOpener, false);
      }
      break;
    case ("declare"):
      //unhide or display the "promptToDeclare" button and add event listener to it
      promptToDeclareButton.style.display = "inline-block";
      promptToDeclareButton.addEventListener("click", promptToDeclare);
      break;
    default:
      alert("You got an unknown dealer instruction from the server. Lucky you!");
  }
});

socket.on('game open', function (myConfig) {
  //show game details
  document.getElementById("gameNameDisplay").innerText = myConfig.tonight.games[myConfig.tonight.games.length - 1].name;
  document.getElementById("currentDealerNameDisplay").innerText = "Dealer:" + myConfig.currentDealerName;
  document.getElementById("numCardsDisplay").innerText = myConfig.tonight.games[myConfig.tonight.games.length - 1].numCards + " cards";
  document.getElementById("whatsWildDisplay").innerText = "Wild cards: " + myConfig.tonight.games[myConfig.tonight.games.length - 1].whatsWild;
  document.getElementById("hiloDisplay").innerText = myConfig.tonight.games[myConfig.tonight.games.length - 1].hilo;
  //unhide the betting column, but re-hide the betting buttons row
  document.getElementById("bettingColumn").style.display = "block";
  //listen for click on ante button
  const el = document.getElementById('anteButton');
  el.addEventListener("click", ante);
  const el2 = document.getElementById('sitOutButton');
  el2.addEventListener("click", sitOut);
  // display ante/sit-out buttons
  document.getElementById("anteButtonsRow").style.display = "block";
  document.getElementById("anteButtonsRow").classList.add("d-flex");
});

socket.on('ante broadcast', function (anteBroadcastObject) {
  //show "in" label
  updatePlayerStatusSpan(anteBroadcastObject.playerIndex, "in");
  //update the winnings balance display of the player who ante'd
  //first, get the balance for night of that player
  let x = anteBroadcastObject.myConfig.tonight.players;
  let y = x[anteBroadcastObject.playerIndex];
  let z = y.balanceForNight;
  updatePlayerBalance(anteBroadcastObject.playerIndex, z);
  // empty out the betting list
  document.getElementById("bettingDisplayList").innerHTML = "";
  //display the newly updated "players in game" array in the betting list
  for (let i = 0; i < anteBroadcastObject.myConfig.tonight.games[anteBroadcastObject.myConfig.tonight.games.length - 1].playersInGame.length; i++) {
    let antePlayerName = anteBroadcastObject.myConfig.tonight.games[anteBroadcastObject.myConfig.tonight.games.length - 1].playersInGame[i].playerUser.firstName;
    antePlayerName += " " + anteBroadcastObject.myConfig.tonight.games[anteBroadcastObject.myConfig.tonight.games.length - 1].playersInGame[i].playerUser.lastInitial;
    //use the id of this player to get their tonight player index
    let antePlayerIndex = getPlayerIndex(anteBroadcastObject.myConfig.tonight.games[anteBroadcastObject.myConfig.tonight.games.length - 1].playersInGame[i].playerUser._id, anteBroadcastObject.myConfig.tonight.players);
    let insertableHTML =
      `<li class="list-group-item d-flex justify-content-between lh-condensed playerLineBetLi" id="player${antePlayerIndex + 1}LineBetLi">
      <div>
        <h6 class="my-0">${antePlayerName}</h6>
      </div>
      <div>
        <span id="player${antePlayerIndex + 1}LastBet"><em></em></span>
      </div>
    <span class="text-muted playerLineBetAmt" id="player${antePlayerIndex + 1}amtBet">$0.00</span>
    </li>`;
    let newPlayerLineBetLi = htmlToElement(insertableHTML); // use function to convert HTML string into DOM element
    document.getElementById("bettingDisplayList").appendChild(newPlayerLineBetLi); // add this as a new line in the betting list
  }
  // now recreate the "Pot amount"line at the bottom of that list
  let newPotAmt = anteBroadcastObject.myConfig.tonight.games[anteBroadcastObject.myConfig.tonight.games.length-1].amtPot.toFixed(2);
  let insertableHTML =
    `<li class="list-group-item d-flex justify-content-between" id="potLineBetAmt">
      <span><strong>Pot</strong></span>
      <strong>$${newPotAmt}</strong>
    </li>`;
  let newPotAmtLi = htmlToElement(insertableHTML); // use function to convert HTML string into DOM element
  document.getElementById("bettingDisplayList").appendChild(newPotAmtLi); // add this as the final line at bottom of the betting list
});

socket.on('sit out broadcast', function (sitOutBroadcastObject) {
  //hide the player's area
  hidePlayerArea(sitOutBroadcastObject.playerIndex);
});


socket.on('shuffle visual', function () {
  let insertableHTML = `<div class="cardSingle rounded faceDown"></div>`;
  let dealPile = document.querySelector('#dealPile');
  for (let i = 1; i < 14; i++) {
    dealPile.innerHTML += insertableHTML;
  }
});

socket.on('deal batch broadcast', function (dealBatchObject) {
  // console.log("Deal batch object is: ");
  // console.log(JSON.stringify(dealBatchForClient));
  let numShuffledDeckRemaining = dealBatchObject.numShuffledDeckRemaining;
  ///loop thru the object, building insertable HTML and adding it to the correct playerArea, playing a sound, maybe animating
  dealBatchObject.dealBatchCommon.forEach(element => {
    let insertableHTML = "";
    let insertableClass = "";
    let insertableBackground = "";
    if (element.imgPath.includes("back")) {
      insertableClass = " faceDown";
    } else {
      insertableClass = " faceUp";
      insertableBackground = ` style="background-image: url(${element.imgPath});"`;
    }
    if (element.tonightPlayerIndex === getMyIndex()) { // if I' populating my own playerArea div
      insertableHTML = `<div class="cardSingle rounded${insertableClass}" id="DCI${element.dci}"${insertableBackground}>${dealBatchObject.overlayHTML}</div>`;
      sessionStorage.setItem('myHand', sessionStorage.getItem('myHand') + "," + element.dci);
    } else {
      insertableHTML = `<div class="cardSingle rounded${insertableClass}" id="DCI${element.dci}"${insertableBackground}></div>`;
    }
    let newCardDiv = htmlToElement(insertableHTML); // use function to convert HTML string into DOM element
    document.querySelector(`#player${element.tonightPlayerIndex + 1}Area .rowOfCards`).append(newCardDiv);  //this is where the new card appears onscreen
    //check dealPile count and remove a card as needed
    numShuffledDeckRemaining -= 1;
    updateDealPile(numShuffledDeckRemaining);
  }); //end of forEach loop
});

socket.on('next bettor broadcast', function (myConfig) {
  //highlight player area
  highlightPlayerArea(myConfig.bettingRound.whoseTurn, true)
  //highlight playerLineBetLi
  highlightPlayerLineBetLi(myConfig.bettingRound.whoseTurn, true)
  let insertableHTML="";
  if (myConfig.bettingRound.whoseTurn === getMyIndex()) { // if I am the player chosen to bet next
    // display appropriate betting buttons, add event listener(s)
    if (myConfig.bettingRound.amtBetInRound === 0) { // if nothing bet in the round thus far
      // populate and display Open div
      let openInnerHTML = ""; //this will be the options for the selector
      let iString = "";
      let newOpenDiv = "";
      let newCheckButtonDiv = "";
      for (let i = myConfig.tonight.amtBetIncrements; i <= myConfig.tonight.amtMaxOpen; i += myConfig.tonight.amtBetIncrements) { //a loop to populate the increments available in the openAmt pick list
        //loop code goes here
        iString = i.toFixed(2);
        openInnerHTML += `<option>${iString}</option>`;
      }
      insertableHTML = `
      <div class="d-flex flex-row form-group col-md-6" id="openDiv">
      <button type="button" class="btn btn-success" id="openButton">Open</button> 
      <select id="openAmt" class="form-control">
        ${openInnerHTML}
      </select>                  
      </div>
      `;
      newOpenDiv = htmlToElement(insertableHTML); // use function to convert HTML string into DOM element
      document.getElementById("bettingButtonsRow").appendChild(newOpenDiv); // add these two elements to the betting buttons row
      document.getElementById('openButton').addEventListener("click", open);
      // display Check button
      insertableHTML = `
      <div class="form-group col-md-3" id="checkButtonDiv">
      <button type="button" class="btn btn-secondary" id="checkButton">Check</button>                  
      </div>
      `;
      newCheckButtonDiv = htmlToElement(insertableHTML); // use function to convert HTML string into DOM element
      document.getElementById("bettingButtonsRow").appendChild(newCheckButtonDiv); // add check button div to the betting buttons row
      document.getElementById('checkButton').addEventListener("click", check);
    } else { // some amount has already been bet in this round, so I am not a potential opener
      //display Call with amount due in its label
      let newCallButtonDiv = "";
      let callAmt = myConfig.bettingRound.amtBetInRound - myConfig.tonight.players[myConfig.bettingRound.whoseTurn].amtBetInRound;
      insertableHTML = `
      <div class="form-group col-md-3" id="callButtonDiv">
      <button type="button" class="btn btn-primary" id="callButton">Call $${callAmt.toFixed(2)}</button>
      </div>
      `;
      newCallButtonDiv = htmlToElement(insertableHTML); // use function to convert HTML string into DOM element
      document.getElementById("bettingButtonsRow").appendChild(newCallButtonDiv); // add new Call button to the betting buttons row
      let callButton = document.getElementById('callButton');
      callButton.addEventListener("click", call);
      //if I haven't checked AND numRaises<3, display Raise button
      let iAmChecked = false;
      for (let j = 0; j < myConfig.bettingRound.checkedPlayers.length; j++) {
        if (myConfig.bettingRound.checkedPlayers[j] === myConfig.bettingRound.whoseTurn) { //I already am in the checkedPlayers array
          iAmChecked = true;
        }
      }
      if (!iAmChecked && myConfig.bettingRound.numRaises < 3) { // it's okay to raise, so display that button
        // populate and display Raise div
        let raiseInnerHTML = ""; //this will be the options for the selector
        let jString = "";
        let newRaiseDiv = "";
        for (let j = myConfig.tonight.amtBetIncrements; j <= myConfig.tonight.amtMaxRaise; j += myConfig.tonight.amtBetIncrements) { //a loop to populate the increments available in the raiseAmt pick list
          //loop code goes here
          jString = j.toFixed(2);
          raiseInnerHTML += `<option>${jString}</option>`;
        }
        insertableHTML = `
        <div class="d-flex flex-row form-group col-md-6" id="raiseDiv">
        <button type="button" class="btn btn-success" id="raiseButton">Raise</button> 
        <select id="raiseAmt" class="form-control">
          ${raiseInnerHTML}
        </select>                  
        </div>
        `;
        newRaiseDiv = htmlToElement(insertableHTML); // use function to convert HTML string into DOM element
        document.getElementById("bettingButtonsRow").appendChild(newRaiseDiv); // add these two elements to the betting buttons row
        document.getElementById('raiseButton').addEventListener("click", raise);
      }
    }
    //display fold button no matter what, and add event listener
    let newFoldButtonDiv = "";
    insertableHTML = `
    <div class="form-group col-md-3" id="foldButtonDiv">
    <button type="button" class="btn btn-secondary" id="foldButton">Fold</button>                  
    </div>
    `;
    newFoldButtonDiv = htmlToElement(insertableHTML); // use function to convert HTML string into DOM element
    document.getElementById("bettingButtonsRow").appendChild(newFoldButtonDiv); // add fold button div to the betting buttons row
    document.getElementById('foldButton').addEventListener("click", fold);
  }
});

socket.on('bettor action', function (bettorActionBroadcastObject) {
  let bettorAction = bettorActionBroadcastObject.action;
  let playerLastBetSpan = document.getElementById(`player${bettorActionBroadcastObject.playerIndex+1}LastBet`);
  let potDisplay = document.getElementById('potLineBetAmt').lastElementChild;
  switch (bettorAction) {
    case "fold":
      //remove player's line from betting display
      removePlayerBettingLine(bettorActionBroadcastObject.playerIndex);
      //hide player area from player areas
      hidePlayerArea(bettorActionBroadcastObject.playerIndex);
      break;
    case "check":
      //add the word "checked" in the action span thingie
      playerLastBetSpan.innerHTML = "<em>checked</em>";
      //remove the highlight from playerarea and playerlinebetli
      highlightPlayerArea(bettorActionBroadcastObject.playerIndex, false);
      highlightPlayerLineBetLi(bettorActionBroadcastObject.playerIndex, false);
      break;
    case "bet": // this could be refactored with the "raise" case below it; mostly identical except for the verb we display
      //update pot amount display
      potDisplayText = bettorActionBroadcastObject.myConfig.tonight.games[bettorActionBroadcastObject.myConfig.tonight.games.length-1].amtPot.toFixed(2);
      potDisplay.textContent = `$${potDisplayText}`;
      //update player's winnings aka balance for night display
      updatePlayerBalance(bettorActionBroadcastObject.playerIndex, bettorActionBroadcastObject.myConfig.tonight.players[bettorActionBroadcastObject.playerIndex].balanceForNight);
      //update that number at far right of playerlinebetli display
      updatePlayerAmtBetDisplay(bettorActionBroadcastObject.playerIndex, bettorActionBroadcastObject.myConfig.tonight.players[bettorActionBroadcastObject.playerIndex].amtBetInRound);
      //add the verb to playerlinebetli span
      playerLastBetSpan.innerHTML = `<em>bet $${bettorActionBroadcastObject.amt.toFixed(2)}</em>`;
      //remove the highlight from playerarea and playerlinebetli
      highlightPlayerArea(bettorActionBroadcastObject.playerIndex, false);
      highlightPlayerLineBetLi(bettorActionBroadcastObject.playerIndex, false);
      break;
    case "raise":
      //update pot amount display
      potDisplayText = bettorActionBroadcastObject.myConfig.tonight.games[bettorActionBroadcastObject.myConfig.tonight.games.length-1].amtPot.toFixed(2);
      potDisplay.textContent = `$${potDisplayText}`;
      //update player's winnings aka balance for night display
      updatePlayerBalance(bettorActionBroadcastObject.playerIndex, bettorActionBroadcastObject.myConfig.tonight.players[bettorActionBroadcastObject.playerIndex].balanceForNight);
      //update that number at far right of playerlinebetli display
      updatePlayerAmtBetDisplay(bettorActionBroadcastObject.playerIndex, bettorActionBroadcastObject.myConfig.tonight.players[bettorActionBroadcastObject.playerIndex].amtBetInRound);
      //add the verb to playerlinebetli span
      playerLastBetSpan.innerHTML = `<em>raised $${bettorActionBroadcastObject.raiseAmt.toFixed(2)}</em>`;
      //display "raises remaining" and update the number displayed
      let raisesRemainingElement = document.getElementById('raisesRemainingText');
      raisesRemainingElement.style.display="block";
      raisesRemainingElement.textContent = `Raises remaining: ${3-bettorActionBroadcastObject.myConfig.bettingRound.numRaises}`;
      //remove the highlight from playerarea and playerlinebetli
      highlightPlayerArea(bettorActionBroadcastObject.playerIndex, false);
      highlightPlayerLineBetLi(bettorActionBroadcastObject.playerIndex, false);
      break;
    default:
      console.log(`
      I got an unfamiliar action sent from the bettor action broadcast.
      Here is the object:
      ${JSON.stringify(bettorActionBroadcastObject)}
      `);
  }
});

socket.on('betting round ended', function (myConfig) {
  // reset text for the "raises remaining" and hide it
  let raisesRemainingElement = document.getElementById('raisesRemainingText');
  raisesRemainingElement.textContent = "Raises remaining: 3";
  raisesRemainingElement.style.display="none";
  let jIndex = -1;
  let playerLastBetSpan = "";
  //update each player's linebetli by removing verb, and displaying amtBetinRound from myConfig
  for (let j=0;j<myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length;j++){
    //get the player's id
    //from that, get their tonight index number
    jIndex = getPlayerIndex(myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[j].playerUser._id, myConfig.tonight.players);
    //update that number at far right of playerlinebetli display
    updatePlayerAmtBetDisplay(jIndex, myConfig.tonight.players[jIndex].amtBetInRound);
    //add the verb to playerlinebetli span
    playerLastBetSpan = document.getElementById(`player${jIndex+1}LastBet`);
    playerLastBetSpan.innerHTML = "";
  }
});

socket.on('declare instruction', function () {
  //dislay the row of checkboxes and button for declare
  let innerHTML = `              <div class="form-check mx-4">
  <input class="form-check-input" type="checkbox" onchange='handleDeclareCheckboxChange(this);' value="" id="declareLowCheckbox" name="declareLowCheckbox">
  <label class="form-check-label" for="declareLowCheckbox">
    Low
  </label>
</div>
<div class="form-check mx-4">
  <input class="form-check-input" type="checkbox" onchange='handleDeclareCheckboxChange(this);' value="" id="declareHighCheckbox" name="declareHighCheckbox">
  <label class="form-check-label" for="declareHighCheckbox">
    High
  </label>
</div>
<button type="button" class="btn btn-secondary mx-4 my-2" id="declareButton" name="declareButton" disabled="true">Declare</button>
<ul>
  <li>Your choice won't be revealed to others until all have declared.</li>
  <li>If you declare both high and low, you must win (not share) both high and low.</li>
</ul>`;
  document.getElementById('declareButtonRow').innerHTML = innerHTML;
  document.getElementById('declareButton').addEventListener("click", declare);
});

socket.on('autoreveal all cards', function (dealtCards) {
  //get all card objects into a node list
  let allCardsNodeList = document.querySelectorAll('.playerRow .cardSingle');
  let DCItext = "";
  let DCInum = -1;
  let overlayHTML = "";
  for (let i = 0; i < allCardsNodeList.length; i++) {
    let item = allCardsNodeList[i];
    if (item.classList.contains('faceDown') && (item.innerHTML.includes('cardOverlay')===false)){ // if it's my opponent's down card or my no-peek card
      //get the element's dealtCard array index
      DCItext = item.id.substring(3);
      DCInum = parseInt(DCItext, 10);
      overlayHTML = getOverlayFromString (dealtCards[DCInum].string);
      item.innerHTML = overlayHTML;
    }
  }
});

socket.on('declarations broadcast', function (declarationsBroadcastObject) {
  console.log("I received this array for declarations broadcast: " + declarationsBroadcastObject.declaredPlayers);
  //remove event listener and hide the row
  document.getElementById('declareButton').removeEventListener("click", declare);
  document.getElementById('declareButtonRow').innerHTML = "";
  //loop through the declarations array and display each player's declaration in playerStatusSpan
  let targetIndex = -1;
  let targetString = "";
  declarationsBroadcastObject.declaredPlayers.forEach(element => {
    targetIndex = parseInt(element.substr(0,1),10);
    targetString = element.substr(1);
    switch (targetString){
      case "high":
        targetString = "High";
        break;
      case "low":
        targetString = "Low";
        break;
      case "both":
        targetString = "High + Low";
        break;
      default:
        console.log("I got an unfamiliar string passed in the players declarations batch object.");
    }
    updatePlayerStatusSpan(targetIndex, targetString);
  });
});

socket.on('choose winner instruction', function (myConfig) {
    //unhide or display a prompt for dealer to click the winner's name (#dealerAlert)
    dealerAlert.style.display = "block";
    dealerAlert.textContent = "Click the winner's name.";
    //add event listener for all player names in playerAreas
    let elements = document.querySelectorAll('.playerNameRow h6');
    for (let i = 0; i < elements.length; i++) {
      elements[i].addEventListener('click', chooseWinner, false);
    }
});
