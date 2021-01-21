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
  index += 1; //convert index number to displayed player number
  let thisSpan = document.querySelector(`#player${index}Area .inGameStatus`);
  thisSpan.textContent = newStatus;
  thisSpan.classList.add('bg-success');
}

function chooseOpener() {
  let clickedPlayerName = this.innerText;
  let clickedPlayerIndex = parseInt(clickedPlayerName.substr(7, 1), 10) - 1;
  //use this value to send an emit to the server for "I chose opener"
  socket.emit("I chose opener", clickedPlayerIndex);
  let dealerAlert = document.getElementById('dealerAlert');
  dealerAlert.style.display = "none";
  dealerAlert.textContent = "";
  //remove event listener for all player names in playerAreas
  let elements = document.querySelectorAll('.playerNameRow h6');
  for (let i = 0; i < elements.length; i++) {
    elements[i].removeEventListener('click', chooseOpener);
  }
};

function chooseRoller() {
  let clickedPlayerName = this.innerText;
  let clickedPlayerIndex = parseInt(clickedPlayerName.substr(7, 1), 10) - 1;
  //use this value to send an emit to the server for "I chose roller"
  socket.emit("I chose roller", clickedPlayerIndex);
  let dealerAlert = document.getElementById('dealerAlert');
  dealerAlert.style.display = "none";
  dealerAlert.textContent = "";
  //remove event listener for all player names in playerAreas
  let elements = document.querySelectorAll('.playerNameRow h6');
  for (let i = 0; i < elements.length; i++) {
    elements[i].removeEventListener('click', chooseRoller);
  }
};

function selectPlayerCard(){
  this.classList.toggle('selectedPlayerCard');
  let myIndex = getMyIndex();
  let myCardsRow = document.querySelector(`#player${myIndex+1}Area .rowOfCards`);
  if (myCardsRow.innerHTML.indexOf("selectedPlayerCard") != -1){ // if the classname 'selectedPlayerCard' is found anywhere in the row of cards, at least 1 card is selected
    document.getElementById(`player${myIndex+1}DiscardButton`).removeAttribute('disabled');
  } else {
    document.getElementById(`player${myIndex+1}DiscardButton`).setAttribute('disabled',true);
  }
};

function discard() {
  let myIndex = getMyIndex();
  //hide playerAlert and unload its instructionText
  document.getElementById(`player${myIndex+1}Alert`).textContent = "";
  document.getElementById(`player${myIndex+1}Alert`).style.display="none";
  //remove discardButton after removing its event listener
  document.getElementById(`player${myIndex+1}DiscardButton`).removeEventListener("click", discard);
  document.getElementById(`player${myIndex+1}DiscardButtonRow`).innerHTML = "";
  //remove event listeners for all of the player's cards
  let myCardsNodeList = document.querySelectorAll(`#player${myIndex+1}Area .cardSingle`);
  myCardsNodeList.forEach(element => {
    element.removeEventListener('click',selectPlayerCard);
  });
  //build index of the selected cards and send it as an emit
  let selectedDiscardsIndexArray = [];
  myCardsNodeList.forEach(element => {
    if (element.classList.contains('selectedPlayerCard')){
      selectedDiscardsIndexArray.push(parseInt(element.id.substr(3),10));
    }
  });
  let iDiscardedObject = {
    selectedDiscardsIndexArray:selectedDiscardsIndexArray,
    playerIndex:myIndex
  };
  console.log("The index of the selected discards: " + selectedDiscardsIndexArray);
  socket.emit("I discarded", iDiscardedObject);
}

function rollOneCard () {
  let myIndex = getMyIndex();
  let downCardsDCIs = [];
  let rolledCardDCI = -1;
  let myCardsNodeList = document.querySelectorAll(`#player${myIndex+1}Area .cardSingle`);
  //loop thru player's card row and get the DCI for the first card that is faceDown
  myCardsNodeList.forEach(element => {
    if (element.classList.contains('faceDown')){
      downCardsDCIs.push(parseInt(element.id.substr(3),10));
    }
  });
  let rolledCardObject = {
    rollerIndex: myIndex,
    DCI : downCardsDCIs[0]
  };
  //emit the DCI of the first down card
  socket.emit('I rolled one card',rolledCardObject);
}

function doneRolling () {
  let myIndex = getMyIndex ();
  let bossHand = false;
  let rollButton = document.getElementById('rollButton');
  let rollDoneButton = document.getElementById('rollDoneButton');
  let rollDoneNextStep = document.getElementById('rollDoneNextStep');
  let nextStepString = "";
  //if roll button is still present, or if selectedNextStep value is "highHand", set boss to true, and remove that button
  //else, set boss to false and get value of nextStep (fold or stay)
  if (rollButton!=null){
    bossHand = true;
    rollButton.removeEventListener('click', rollOneCard);
    rollButton.parentNode.removeChild(rollButton);
  }
  if (rollDoneNextStep!=null){
    nextStepString = rollDoneNextStep.value;
    if (nextStepString==="highHand"){
      bossHand = true;
    }
    rollDoneNextStep.parentNode.removeChild(rollDoneNextStep.parentNode.firstElementChild); //remove the "what's next" label for that picklist
    rollDoneNextStep.removeEventListener('change',rollDoneNextStepChange);
    rollDoneNextStep.parentNode.removeChild(rollDoneNextStep);
  }
  if (rollDoneButton!=null){
    rollDoneButton.removeEventListener('click', doneRolling);
    rollDoneButton.parentNode.removeChild(rollDoneButton);
  }
  //hide playerAlert and unload its instructionText
  document.getElementById(`player${myIndex+1}Alert`).textContent = "";
  document.getElementById(`player${myIndex+1}Alert`).style.display="none";
  //build object that includes boss boolean, nextstep string, and myIndex / emit that object as "I finished rolling"
  let finishedRollingObject = {
    playerIndex: myIndex,
    bossHandBoolean: bossHand,
    nextStepString: nextStepString
  };
  //do a peers emit to remove highlight on playerArea; needs an object with myIndex and "add" boolean false
  // emitHighlightPlayerArea (myIndex, false); //this should unhighlight the roller's playerArea for all OTHER players
  if (nextStepString==="fold"){
    socket.emit("I fold after roll", myIndex);
    console.log("I just sent the I-fold-after-roll emit");
  } else {
      //emit to server the results of done rolling
      socket.emit('I finished rolling',finishedRollingObject);
  }
}

function rollDoneNextStepChange () {
  let selectedNextStep = document.getElementById("rollDoneNextStep").value;
  if (selectedNextStep.includes("Choose")===false){ //enable the done button only if the dealer has selected a next step
      document.getElementById('rollDoneButton').removeAttribute("disabled");
  } else {
      document.getElementById('rollDoneButton').setAttribute("disabled",true);
  }
}

function turnIndicatorCard () {
  let dealerAlert = document.getElementById('dealerAlert');
  //get info to determine if the indicator card is already face down; if so, prompt dealer and return, else proceed
  if (this.classList.contains('faceDown')){
    dealerAlert.style.display = "none";
    dealerAlert.textContent = "";
    //remove event listener for all indicator cards
    let elements = document.querySelectorAll("#indicatorCardsRow .cardSingle");
    for (let i = 0; i < elements.length; i++) {
      elements[i].removeEventListener('click', turnIndicatorCard);
    }
  } else {
    dealerAlert.textContent = "Please click a face-down indicator card.";
  }
  let clickedIndicatorIndex = parseInt(this.id.substr(3),10);
  console.log("You clicked the card with id: " + clickedIndicatorIndex);
  socket.emit("I turned indicator card", clickedIndicatorIndex);
}

function chooseWinner() {
  let clickedPlayerName = this.innerText;
  let clickedPlayerIndex = parseInt(clickedPlayerName.substr(7, 1), 10) - 1;
  //use this value to send an emit to the server for "I updated winner"
  socket.emit("I updated winner", clickedPlayerIndex);
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

function sendUpdateWhatsWild () {
  let string = document.getElementById('whatsWildDisplay').textContent;
  socket.emit("I updated whats wild", string);
}

function expandOtherInstructions() {
  if (document.getElementById('otherInstructionsExpander').textContent==="Show more"){
    document.getElementById('otherInstructionsAlert').style.display = "block";
    document.getElementById('otherInstructionsExpander').textContent = "Show less";
  } else {
    document.getElementById('otherInstructionsAlert').style.display = "none";
    document.getElementById('otherInstructionsExpander').textContent = "Show more";
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
  let betAmt = parseFloat(betAmtText)*100;
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
    let callButtonAmt = parseFloat(callButtonAmtText)*100;
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
  let callButtonAmt = parseFloat(callButtonAmtText)*100;
  //get the value of the "raiseAmt" input
  let raiseAmtText = document.getElementById('raiseAmt').value;
  let raiseAmt = parseFloat(raiseAmtText)*100;
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

function dealIndicatorCards() {
  let myIndex = getMyIndex();
  socket.emit("I deal indicator cards", myIndex);
  console.log("I just sent the I-deal-indicator-cards emit");
  document.getElementById('dealIndicatorCardsButton').removeEventListener("click", dealIndicatorCards);
  document.getElementById('dealIndicatorCardsButton').style.display = "none";
}

function splitPot() {
  socket.emit("I split pot");
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
  let myBalanceAmt = (amt/100).toFixed(2);
  myBalanceElement.textContent = myBalanceAmt;
}

function updatePlayerAmtBetDisplay(index, amt){
  index += 1; //to go from array index to displayed player number
  let myAmtBet = document.getElementById(`player${index}amtBet`);
  myAmtBet.textContent = `$${(amt/100).toFixed(2)}`;
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

function emitHighlightPlayerArea (index, highlightBoolean) {
  let HighlightPlayerBroadcastObject = {
    index: index,
    highlightBoolean: highlightBoolean
  };
  socket.broadcast.emit("highlight player area", HighlightPlayerBroadcastObject); //this is a peer-to-peer emit, no server involvement
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

function buildWinnerDivNode (winnerObject){
  let newHTML="";
  if (winnerObject.choosing===true){ //if we're choosing, add checkbox to the HTML we will add
    newHTML=`<li class="list-group-item d-flex justify-content-between lh-condensed">
    <div class="form-check mx-1">
      <input class="form-check-input" type="checkbox" onchange='handleWinnerCheckboxChange(this);' value="" id="${winnerObject.index}indexWinnerCheckbox" name="${winnerObject.index}indexWinnerCheckbox">
      <label class="form-check-label" for="${winnerObject.index}indexWinnerCheckbox">
      ${winnerObject.fullName}
      </label>
    </div>`; //note this is not the complete ,;\li>, just the early part
  } else {
    newHTML = `<li class="list-group-item d-flex justify-content-between lh-condensed">
                <div>
                  <h6 class="my-0">${winnerObject.fullName}</h6>
                </div>`;
  }
  //now add the rest of the <li> that is the same whether I am dealer or not
  newHTML += `<div>
  <span class="winnerDeclaration"><em>${winnerObject.declaration}</em></span>
</div>
<span class="text-muted winnerAmt">$0.00</span>
</li>`;
  if ("amt" in winnerObject){ //if we've passed an amount as part of the object, insert it here
    newHTML = newHTML.replace ('0.00',(winnerObject.amt/100).toFixed(2));
  }
  newNode = htmlToElement(newHTML);
  return newNode;
}

function handleWinnerCheckboxChange(checkbox) {
  let winnerCheckboxes = document.querySelectorAll('#bettingDisplayList input[type="checkbox"]');
  //if at least one checkbox is checked enable the SaveWinners button
  for (let i=0; i<winnerCheckboxes.length; i++){
    if (winnerCheckboxes[i].checked){
      document.getElementById('saveWinnersButton').removeAttribute('disabled');
      document.getElementById('saveWinnersButton').addEventListener("click", saveWinners);
      break;
    } else {
        if (i===winnerCheckboxes.length-1){ //we've reach the last checkbox and it's not checked
        document.getElementById('saveWinnersButton').setAttribute('disabled','');
        document.getElementById('saveWinnersButton').removeEventListener("click", saveWinners);
        }
    }
  }
//now handle the results of individual boxes being checked or not
  if (checkbox.checked && checkbox.parentNode.parentNode.outerHTML.includes('both')){ //you clicked a winner whose declaration is "both"
    //loop thru checkboxes again and this time uncheck all except the one that was just checked
    for (let i=0; i<winnerCheckboxes.length; i++){
      if (winnerCheckboxes[i].checked && winnerCheckboxes[i]!==checkbox){
        winnerCheckboxes[i].checked = false;
      } 
    }
  }
  if (checkbox.checked && !checkbox.parentNode.parentNode.outerHTML.includes('both')){ //you clicked a winner whose declaration is NOT "both"
    //loop thru checkboxes again and this time uncheck any whose declaration was "both"
    for (let i=0; i<winnerCheckboxes.length; i++){
      if (winnerCheckboxes[i].checked && winnerCheckboxes[i].parentNode.parentNode.outerHTML.includes('both')){
        winnerCheckboxes[i].checked = false;
      } 
    }
  }
}

function saveWinners () {
  //remove dealer alert
  document.getElementById('dealerAlert').textContent = '';
  document.getElementById('dealerAlert').style.display = "none";
  //remove event listener and remove "saveWinners" button
  document.getElementById('saveWinnersButton').removeEventListener("click", saveWinners);
  document.getElementById('saveWinnersButtonRow').innerHTML = "";
  //loop thru checkboxes and create an object based on the selected ones
  let savedWinnersList = [];
  let savedWinnersItem = "";
  let winnerCheckboxes = document.querySelectorAll('#bettingDisplayList input[type="checkbox"]');
  for (let i=0; i<winnerCheckboxes.length; i++){
    if (winnerCheckboxes[i].checked){
      //get the first character, which is the winner's player index
      savedWinnersItem = winnerCheckboxes[i].id.substr(0,1);
      //now add the declaration text
      if (winnerCheckboxes[i].parentNode.parentNode.outerHTML.includes('high')){
        savedWinnersItem += "high";
      }
      if (winnerCheckboxes[i].parentNode.parentNode.outerHTML.includes('low')){
        savedWinnersItem += "low";
      }
      if (winnerCheckboxes[i].parentNode.parentNode.outerHTML.includes('both')){
        savedWinnersItem += "both";
      }
      savedWinnersList.push(savedWinnersItem);
    } 
  }
  console.log("Saved winners include: " + savedWinnersList);
  socket.emit("I saved winners", savedWinnersList);
}

function acknowledgeGameEnd () {
  document.getElementById('gameEndAcknowledgeButton').removeEventListener("click", acknowledgeGameEnd);
  document.getElementById('gameEndAcknowledgeButtonRow').innerHTML = "" ;
  socket.emit("I acknowledge game end");
}

//==============
//CHAT FORM SUBMIT LOGIC
//==============

// const chatForm = document.getElementById('chatForm');
// chatForm.onsubmit = submit;

// function submit(event) {
//   event.preventDefault();  // prevent window from refreshing on 
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
  let newSpacerHeight = document.getElementById('statusUpdates').offsetHeight + 5; //this code ensures the spacer at bottom of content area grows or shrinks to match the content of the status updates
  let newSpacerHeightText = "height:" + newSpacerHeight + "px";
  document.getElementById('contentBottomSpacer').setAttribute("style",newSpacerHeightText);
});

socket.on('broadcast pot and winnings update', function (myConfig) {
  let amtPotString = (myConfig.tonight.games[myConfig.tonight.games.length - 1].amtPot/100).toFixed(2);
  if (document.getElementById('amtPotDisplay')!=null){
    document.getElementById('amtPotDisplay').textContent = `$${amtPotString}`;
  }
  //loop thru playerAreas and update each one's winnings display
  let allPlayerAreasNodeList = document.querySelectorAll('.playerArea');
  let playerIndex = -1;
  let playerBalanceAmt = 0;
  let playerBalanceString = "";
  let playerWinningsNode = "";
  allPlayerAreasNodeList.forEach(element => {
    //get the digit from the id, subtract 1 to get player index
    playerIndex = parseInt(element.id.substr(6,1),10);
    playerIndex -= 1;
    //retrieve that player's balanceForNight, convert to string for display without dollar sign
    playerBalanceAmt = myConfig.tonight.players[playerIndex].balanceForNight;
    playerBalanceString = (playerBalanceAmt/100).toFixed(2);
    //get the subnode that has class winningsDisplayAmt
    playerWinningsNode = element.querySelector('.winningsDisplayAmt');
    //update that text content
    playerWinningsNode.textContent = playerBalanceString;
  });

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
        let insertableHTML = `<div class="col col-12 col-lg-3 playerArea" id="player${playerDivsCount + 1}Area">
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
      <div class="alert alert-primary playerAlert" role="alert" id="player${playerDivsCount + 1}Alert">
        <!-- alerts to be added via javascript -->
      </div>
      <div class="row d-flex justify-content-around mx-2 my-3" id="player${playerDivsCount + 1}DiscardButtonRow">
        <!-- button to be added via javascript -->
      </div>
      <div class="row d-flex justify-content-center mx-2 my-3" id="player${playerDivsCount + 1}RollButtonRow">
        <!-- buttons to be added via javascript -->
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

socket.on('whats wild broadcast', function (string) {
  document.getElementById('whatsWildDisplay').textContent = string;
});

socket.on('dealer instruction', function (myConfig) {
  let dealString = myConfig.tonight.games[myConfig.tonight.games.length - 1].playSequence[myConfig.tonight.games[myConfig.tonight.games.length - 1].playSequenceLocation];
  let dealButton = document.getElementById('dealButton');
  let dealIndicatorCardsButton = document.getElementById('dealIndicatorCardsButton');
  let promptToDeclareButton = document.getElementById('promptToDeclareButton');
  let dealerAlert = document.getElementById('dealerAlert');
  let dealerPromptText = "";
  let elements = "";
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
    case ("dealIndicatorsDown"):
      //unhide or display the "deal indicator cards" button and add event listener to it
      dealIndicatorCardsButton.style.display = "inline-block";
      dealIndicatorCardsButton.addEventListener("click", dealIndicatorCards);
      break;
    case ("turnIndicator"):
      //unhide or display a prompt for dealer to click the card to turn
      dealerAlert.style.display = "block";
      dealerPromptText = "Click an indicator card to reveal it.";
      dealerAlert.textContent = dealerPromptText;
        //add event listener for all indicator cards
      elements = document.querySelectorAll("#indicatorCardsRow .cardSingle");
      for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', turnIndicatorCard);
      }
      break;
    case ("rollOne"):
      //we need to make all of the following conditional on having remaining cards to roll
      //unhide or display a prompt for dealer to click the roller's name (#dealerAlert)
      dealerAlert.style.display = "block";
      dealerPromptText = "Click a player's name to start rolling cards.";
      if (myConfig.previousRollerIndex>-1){ // if there WAS a previous roller in this game
        dealerPromptText += `Previous player who rolled was Player ${myConfig.previousRollerIndex+1}`;
      }
      dealerAlert.textContent = dealerPromptText;
      //add event listener for all player names in playerAreas
      elements = document.querySelectorAll('.playerNameRow h6');
      for (let j = 0; j < elements.length; j++) {
        elements[j].addEventListener('click', chooseRoller, false);
      }
      break;
    case ("bet"):
      //unhide or display a prompt for dealer to click the opener's name (#dealerAlert)
      dealerAlert.style.display = "block";
      dealerPromptText = "Click a player's name to open the betting. ";
      if (myConfig.previousOpenerIndex>-1){ // if there WAS a previous opener in this game
        dealerPromptText += `Previous opener was Player ${myConfig.previousOpenerIndex+1}`;
      }
      dealerAlert.textContent = dealerPromptText;
      //add event listener for all player names in playerAreas
      elements = document.querySelectorAll('.playerNameRow h6');
      for (let j = 0; j < elements.length; j++) {
        elements[j].addEventListener('click', chooseOpener, false);
      }
      break;
    case ("discardSpecificRank"):
      //unhide or display a prompt telling the dealer what's going on
      dealerAlert.style.display = "block";
      dealerPromptText = "Players who must discard are being notified.";
      dealerAlert.textContent = dealerPromptText;
      socket.emit('Ready to discard specific rank');
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
  let newHTML = "";
  //if I am dealer, populate a variable to add to whatsWildDisplay so contenteditable="true"
  let myIndex = getMyIndex();
  let whatsWildHTML = "";
  if (myConfig.tonight.players[myIndex].isDealer===true){
    whatsWildEditable = `
    <li>&#9998; <span  contenteditable="true" id="whatsWildDisplay">Wild cards: ${myConfig.tonight.games[myConfig.tonight.games.length - 1].whatsWild}</span></li>
    `;
  } else {
    whatsWildEditable = `
    <li><span id="whatsWildDisplay">Wild cards: ${myConfig.tonight.games[myConfig.tonight.games.length - 1].whatsWild}</span></li>
    `;
  }
  //show game details
  newHTML = `
  <h3 class="display-5" id="gameNameDisplay">${myConfig.tonight.games[myConfig.tonight.games.length - 1].name}</h3>
  <ul class="lead">
    <li id="currentDealerNameDisplay">Dealer: ${myConfig.currentDealerName}</li>
    <li id="numCardsDisplay">${myConfig.tonight.games[myConfig.tonight.games.length - 1].numCards} cards</li>
    ${whatsWildEditable}
    <li id="hiloDisplay">${myConfig.tonight.games[myConfig.tonight.games.length - 1].hilo}</li>
  </ul>
  `;
  //add other instructions expander if applicable
  if (myConfig.tonight.games[myConfig.tonight.games.length - 1].otherInstructions!==""){
    newHTML += `
    <span><a href="#" id="otherInstructionsExpander" onclick="expandOtherInstructions();return false">Show more</a></span>
    <div class="alert alert-primary" role="alert" id="otherInstructionsAlert">${myConfig.tonight.games[myConfig.tonight.games.length - 1].otherInstructions}</div>
    `;
  }
  document.getElementById('gameDetails').innerHTML = newHTML;
  //if I am dealer, listen for changes to whatsWildDisplay
  if (myConfig.tonight.players[myIndex].isDealer===true){
    document.getElementById('whatsWildDisplay').addEventListener("input",sendUpdateWhatsWild,false);
  }
  
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
  let newPotAmt = (anteBroadcastObject.myConfig.tonight.games[anteBroadcastObject.myConfig.tonight.games.length-1].amtPot/100).toFixed(2);
  let insertableHTML =
    `<li class="list-group-item d-flex justify-content-between" id="potLineBetAmt">
      <span><strong>Pot</strong></span>
      <span id="amtPotDisplay"><strong>$${newPotAmt}</strong></span>
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



socket.on('deal indicators batch broadcast', function (dealIndicatorsBatchObject) {
  console.log("Deal indicators batch object is: ");
  console.log(JSON.stringify(dealIndicatorsBatchObject));
  let numShuffledDeckRemaining = dealIndicatorsBatchObject.numShuffledDeckRemaining;
  ///loop thru the object, building insertable HTML and adding it to the indicator cards row, playing a sound, maybe animating
  dealIndicatorsBatchObject.dealBatchCommon.forEach(element => {
    let insertableHTML = "";
    let insertableClass = "";
    let insertableBackground = "";
    if (element.imgPath.includes("back")) {
      insertableClass = " faceDown";
    } else {
      insertableClass = " faceUp";
      insertableBackground = ` style="background-image: url(${element.imgPath});"`;
    }
    insertableHTML = `<div class="cardSingle rounded${insertableClass}" id="DCI${element.dci}"${insertableBackground}></div>`;
    let newCardDiv = htmlToElement(insertableHTML); // use function to convert HTML string into DOM element
    document.getElementById(`indicatorCardsRow`).style.display = 'block';
    document.getElementById(`indicatorCardsRow`).append(newCardDiv);  //this is where the new card appears onscreen
    //check dealPile count and remove a card as needed
    numShuffledDeckRemaining -= 1;
    updateDealPile(numShuffledDeckRemaining);
  }); //end of forEach loop
});

socket.on('turned indicator broadcast', function (turnedIndicatorBroadcastObject) {
  let turnedIndicatorCard = document.getElementById(`DCI${turnedIndicatorBroadcastObject.turnedIndicatorIndex}`);
  turnedIndicatorCard.classList.add('faceUp');
  turnedIndicatorCard.classList.remove('faceDown');
  turnedIndicatorCard.style.backgroundImage = `url(${turnedIndicatorBroadcastObject.turnedIndicatorImgPath})`;
});

socket.on('discard instruction', function (instructionText){
  let myIndex = getMyIndex();
  //display playerAlert and load it with instructionText
  document.getElementById(`player${myIndex+1}Alert`).style.display="block";
  document.getElementById(`player${myIndex+1}Alert`).textContent = instructionText;
  //display disabled discardButton
  document.getElementById(`player${myIndex+1}DiscardButtonRow`).innerHTML = `<button type="button" class="btn btn-primary" id="player${myIndex+1}DiscardButton" disabled="true">Discard</button>`;
  //add event listeners for all of the player's cards and the button
  document.getElementById(`player${myIndex+1}DiscardButton`).addEventListener("click", discard);
  let myCardsNodeList = document.querySelectorAll(`#player${myIndex+1}Area .cardSingle`);
  myCardsNodeList.forEach(element => {
    element.addEventListener('click',selectPlayerCard);
  });
});

socket.on('discard broadcast', function (iDiscardedObject){
  let myDivId = "";
  //loop thru the array of discard indexes and if they exist in the DOM, remove them
  for (let i=0;i<iDiscardedObject.selectedDiscardsIndexArray.length;i++){
    myDivId = "DCI" + iDiscardedObject.selectedDiscardsIndexArray[i];
    if (document.getElementById(myDivId)!=null){
      document.getElementById(myDivId).parentNode.removeChild(document.getElementById(myDivId));
    }
  }
});

socket.on('you roll', function (){
  let myIndex = getMyIndex();
  // emitHighlightPlayerArea (myIndex, true); //this should highlight the roller's playerArea for all OTHER players to see
  //display playerAlert and load it with instructionText
  document.getElementById(`player${myIndex+1}Alert`).style.display="block";
  document.getElementById(`player${myIndex+1}Alert`).textContent = "Roll cards until you beat previous best hand.";
  let newHTML = `<button type="button" class="btn btn-primary mx-1" id="rollButton">Roll a card</button>
  <button type="button" class="btn btn-secondary mx-1" id="rollDoneButton" disabled="true">Done</button>`;
  document.getElementById(`player${myIndex+1}RollButtonRow`).innerHTML = newHTML;
  document.getElementById(`rollButton`).addEventListener("click", rollOneCard);
  document.getElementById(`rollDoneButton`).addEventListener("click", doneRolling);
});

socket.on('rolled card broadcast', function (rolledCardBroadcastObject) {
  let myIndex = getMyIndex();
  let rolledCard = document.getElementById(`DCI${rolledCardBroadcastObject.DCI}`);
  rolledCard.classList.add('faceUp');
  rolledCard.classList.remove('faceDown');
  rolledCard.style.backgroundImage = `url(${rolledCardBroadcastObject.imgPath})`;
  if (rolledCardBroadcastObject.rollerIndex===getMyIndex()){ //if I am the roller
    let downCardsDCIs = [];
    let myRollButton = document.getElementById(`rollButton`);
    let myCardsNodeList = document.querySelectorAll(`#player${myIndex+1}Area .cardSingle`);
    //loop thru player's card row and get the DCI for all cards that are faceDown
    myCardsNodeList.forEach(element => {
      if (element.classList.contains('faceDown')){
        downCardsDCIs.push(parseInt(element.id.substr(3),10));
      }
    });
    if (downCardsDCIs.length>0){ // if I have more down cards I can turn
      //enable the "done" button
      document.getElementById(`rollDoneButton`).removeAttribute('disabled');
    } else {
      // update player alert text, remove roll button and its listener, and display picklist
      document.getElementById(`player${myIndex+1}Alert`).textContent = "You've rolled all your cards. Choose next step, then click 'Done'";
      myRollButton.removeEventListener("click", rollOneCard);
      //now to remove it from the DOM
      myRollButton.parentNode.removeChild(myRollButton);
      //disable done button
      document.getElementById(`rollDoneButton`).setAttribute('disabled',true);
      //display picklist
      let amtStayText = (rolledCardBroadcastObject.amtStay/100).toFixed(2);
      let newHTML = `
        <div class="form-group">
        <label class="mr-2" for="rollDoneNextStep">What next?</label>
        <select name="rollDoneNextStep" id="rollDoneNextStep">
            <option value="--Choose--">--Choose--</option>
            <option value="highHand">I have the high hand / bet now</option>
            <option value="fold">No high hand / fold</option>
            <option value="stay">No high hand / stick around for $${amtStayText}</option>
        </select>
        </div>
        `;
      let newNode = htmlToElement(newHTML);
      document.getElementById(`player${myIndex+1}RollButtonRow`).insertBefore(newNode, document.getElementById(`rollDoneButton`));
      document.getElementById('rollDoneNextStep').addEventListener('change',rollDoneNextStepChange);
    }
  }
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
        iString = (i/100).toFixed(2);
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
      <button type="button" class="btn btn-primary" id="callButton">Call $${(callAmt/100).toFixed(2)}</button>
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
          jString = (j/100).toFixed(2);
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
    <button type="button" class="btn btn-danger" id="foldButton">Fold</button>                  
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
      potDisplayText = (bettorActionBroadcastObject.myConfig.tonight.games[bettorActionBroadcastObject.myConfig.tonight.games.length-1].amtPot/100).toFixed(2);
      potDisplay.textContent = `$${potDisplayText}`;
      //update player's winnings aka balance for night display
      updatePlayerBalance(bettorActionBroadcastObject.playerIndex, bettorActionBroadcastObject.myConfig.tonight.players[bettorActionBroadcastObject.playerIndex].balanceForNight);
      //update that number at far right of playerlinebetli display
      updatePlayerAmtBetDisplay(bettorActionBroadcastObject.playerIndex, bettorActionBroadcastObject.myConfig.tonight.players[bettorActionBroadcastObject.playerIndex].amtBetInRound);
      //add the verb to playerlinebetli span
      playerLastBetSpan.innerHTML = `<em>bet $${(bettorActionBroadcastObject.amt/100).toFixed(2)}</em>`;
      //remove the highlight from playerarea and playerlinebetli
      highlightPlayerArea(bettorActionBroadcastObject.playerIndex, false);
      highlightPlayerLineBetLi(bettorActionBroadcastObject.playerIndex, false);
      break;
    case "raise":
      //update pot amount display
      potDisplayText = (bettorActionBroadcastObject.myConfig.tonight.games[bettorActionBroadcastObject.myConfig.tonight.games.length-1].amtPot/100).toFixed(2);
      potDisplay.textContent = `$${potDisplayText}`;
      //update player's winnings aka balance for night display
      updatePlayerBalance(bettorActionBroadcastObject.playerIndex, bettorActionBroadcastObject.myConfig.tonight.players[bettorActionBroadcastObject.playerIndex].balanceForNight);
      //update that number at far right of playerlinebetli display
      updatePlayerAmtBetDisplay(bettorActionBroadcastObject.playerIndex, bettorActionBroadcastObject.myConfig.tonight.players[bettorActionBroadcastObject.playerIndex].amtBetInRound);
      //add the verb to playerlinebetli span
      playerLastBetSpan.innerHTML = `<em>raised $${(bettorActionBroadcastObject.raiseAmt/100).toFixed(2)}</em>`;
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

socket.on('highlight player area', function (highlightPlayerBroadcastObject) { //this might come via a peer-to-peer emit, no server involvement
  highlightPlayerArea(highlightPlayerBroadcastObject.index, highlightPlayerBroadcastObject.highlightBoolean)
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
<button type="button" class="btn btn-primary mx-4 my-2" id="declareButton" name="declareButton" disabled="true">Declare</button>
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

socket.on('choose winners', function (myConfig) {
  // reset text for the "raises remaining" and hide it
  let raisesRemainingElement = document.getElementById('raisesRemainingText');
  raisesRemainingElement.textContent = "Raises remaining: 3";
  raisesRemainingElement.style.display="none";
  //zero out content of betting list (innerHTML="")
  document.getElementById('bettingDisplayList').innerHTML = "";
  //change title of betting list to "Winners"
  document.querySelector('#bettingTitle span').textContent = "Winner(s)";
  //loop through players in game
  let winnerObject = {};
  for (let i=0;i<myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length;i++){
    winnerObject = {
      index: getPlayerIndex(myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[i].playerUser._id, myConfig.tonight.players),
      declaration: myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[i].declaration,
      fullName: myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[i].playerUser.firstName + " " + myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[i].playerUser.lastInitial,
      choosing: true
    };
  newNode = buildWinnerDivNode (winnerObject);
  document.getElementById('bettingDisplayList').appendChild(newNode);
  } //end of loop
  //display "saveWinners" button, disabled
  document.getElementById('saveWinnersButtonRow').innerHTML = `<button type="button" class="btn btn-primary" id="saveWinnersButton" disabled="true">Save Winners</button>`;
  //unhide or display a prompt for dealer to choose winners (#dealerAlert)
  let dealerAlert = document.getElementById('dealerAlert');
  dealerAlert.style.display = "block";
  dealerAlert.textContent = "Use checkboxes to choose winners, then click 'Save' button.";
});

socket.on('show winners broadcast', function (myConfig) {
  // reset text for the "raises remaining" and hide it
  let raisesRemainingElement = document.getElementById('raisesRemainingText');
  raisesRemainingElement.textContent = "Raises remaining: 3";
  raisesRemainingElement.style.display="none";
  //zero out content of betting list (innerHTML="")
  document.getElementById('bettingDisplayList').innerHTML = "";
  //change title of betting list to "Winners"
  document.querySelector('#bettingTitle span').textContent = "Winner(s)";
  let winnerObject = {};
  //loop through winners arrays based on hilo value of the game
  if (myConfig.tonight.games[myConfig.tonight.games.length-1].hilo==="High Only" || myConfig.tonight.games[myConfig.tonight.games.length-1].hilo==="Low Only"){
    //loop through winners array
    for (let i=0;i<myConfig.tonight.games[myConfig.tonight.games.length-1].winners.length;i++){
      winnerObject = {
        index: myConfig.tonight.games[myConfig.tonight.games.length-1].winners[i].index,
        declaration: "",
        fullName: myConfig.tonight.games[myConfig.tonight.games.length-1].winners[i].fullName,
        amt: myConfig.tonight.games[myConfig.tonight.games.length-1].winners[i].amt,
        choosing: false
      };
      newNode = buildWinnerDivNode (winnerObject);
      document.getElementById('bettingDisplayList').appendChild(newNode);
    } //end of loop
  } else { //game was high-low
    //loop through lowWinners array
    for (let i=0;i<myConfig.tonight.games[myConfig.tonight.games.length-1].lowWinners.length;i++){
      winnerObject = {
        index: myConfig.tonight.games[myConfig.tonight.games.length-1].lowWinners[i].index,
        declaration: "low",
        fullName: myConfig.tonight.games[myConfig.tonight.games.length-1].lowWinners[i].fullName,
        amt: myConfig.tonight.games[myConfig.tonight.games.length-1].lowWinners[i].amt,
        choosing: false
      };
      newNode = buildWinnerDivNode (winnerObject);
      document.getElementById('bettingDisplayList').appendChild(newNode);
    } //end of loop
    //loop through highWinners array
    for (let i=0;i<myConfig.tonight.games[myConfig.tonight.games.length-1].highWinners.length;i++){
      winnerObject = {
        index: myConfig.tonight.games[myConfig.tonight.games.length-1].highWinners[i].index,
        declaration: "high",
        fullName: myConfig.tonight.games[myConfig.tonight.games.length-1].highWinners[i].fullName,
        amt: myConfig.tonight.games[myConfig.tonight.games.length-1].highWinners[i].amt,
        choosing: false
      };
      newNode = buildWinnerDivNode (winnerObject);
      document.getElementById('bettingDisplayList').appendChild(newNode);
    } //end of loop
  }
  //the following code will execute no matter whether the game was high-low
  //show the pot amount
  let amtPotString = (myConfig.tonight.games[myConfig.tonight.games.length-1].amtPot/100).toFixed(2);
  let newHTML = `<li class="list-group-item d-flex justify-content-between">
  <span><strong>Pot</strong></span>
  <span id="amtPotDisplay"><strong>$${amtPotString}</strong></span>
  </li>`;
  newNode = htmlToElement(newHTML);
  document.getElementById('bettingDisplayList').appendChild(newNode);
  //add a note about pot carryover if applicable
  if (myConfig.amtPotCarryOver!==0){
    let amtCarryoverString = (myConfig.amtPotCarryOver/100).toFixed(2);
    let newHTML = `<li class="list-group-item d-flex justify-content-left">
    <span><em>$${amtCarryoverString} will be carried over to next pot.</em></span>
    </li>`;
    newNode = htmlToElement(newHTML);
    document.getElementById('bettingDisplayList').appendChild(newNode);
  }
  //display the button to acknowledge results and move on
  newHTML = `<button type="button" class="btn btn-primary" id="gameEndAcknowledgeButton">Got It / Move On</button>`;
  newNode = htmlToElement(newHTML);
  document.getElementById('gameEndAcknowledgeButtonRow').appendChild(newNode);
  document.getElementById('gameEndAcknowledgeButton').addEventListener("click", acknowledgeGameEnd);
  //we also should display updated balances for the night here
  let playerIndex = -1;
  for (let i=0; i<myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame.length;i++){
    playerIndex = getPlayerIndex(myConfig.tonight.games[myConfig.tonight.games.length-1].playersInGame[i].playerUser._id, myConfig.tonight.players);
    updatePlayerBalance(playerIndex, myConfig.tonight.players[playerIndex].balanceForNight);
  }
});

socket.on('game close broadcast', function (myConfig) {
  //loop thru all player areas
  let playerNumber = -1;
  let playerWinningsNumber = 0;
  let playerWinningsText = ""
  for (let i=0;i<myConfig.tonight.players.length;i++){
    playerNumber = i+1;
    document.getElementById(`player${playerNumber}Area`).style.display = "block"; //show player area
    updatePlayerStatusSpan(i, "");
    document.querySelector(`#player${playerNumber}Area .inGameStatus`).classList.remove('bg-success');
    document.querySelector(`#player${playerNumber}Area .rowOfCards`).innerHTML = ""; //get rid of all displayed cards for that player
    highlightPlayerArea(i, false); //remove any highlight from player's area
    playerWinningsNumber = myConfig.tonight.players[i].balanceForNight/100;
    playerWinningsText = playerWinningsNumber.toFixed(2);
    document.querySelector(`#player${playerNumber}Area .winningsDisplayAmt`).textContent = playerWinningsText; //show current balance for that player
  }
  // reset text for the "raises remaining" and hide it
  let raisesRemainingElement = document.getElementById('raisesRemainingText');
  raisesRemainingElement.textContent = "Raises remaining: 3";
  raisesRemainingElement.style.display="none";
  //if I am dealer, remove listener for changes to whatsWildDisplay
  if (myConfig.tonight.players[myIndex].isDealer===true){
    document.getElementById('whatsWildDisplay').removeEventListener("input",sendUpdateWhatsWild,false);
  }
  //hide game details, betting display, deal pile, indicator cards, etc.
  document.querySelector('#bettingTitle span').textContent = "Betting";
  document.getElementById('bettingDisplayList').innerHTML = "";
  document.getElementById("gameDetails").innerHTML = "";
  document.getElementById("bettingColumn").style.display = "none";
  document.getElementById('dealPile').innerHTML = "";
  document.getElementById('indicatorCardsRow').innerHTML = "";
  //hide game menu if I am not dealer
  let myIndex = getMyIndex();
  if (myConfig.tonight.players[myIndex].isDealer!==true){
    document.getElementById("navGameDropdown").style.display = "none";
  }
  
});
