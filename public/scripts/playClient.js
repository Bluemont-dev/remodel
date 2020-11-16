
const sevenCardStud = {
	name: "Seven Card Stud",
    numCards: 7,
    peekAllowed: true,
    playSequence: [
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceDown",
		"bet"
	],
    hilo: "High Only",
	whatsWild: "Nothing", //e.g. "low hole card and any up cards that match it"
	remodeling: false,
    numRemodels: 0,
    remodelCostFaceUp: 0,
	remodelCostFaceDown: 0,
	passing: false,
    numCardsToPass: 0,
    fwdCardsToPass: false,
    numIndicatorCards: 0,
    otherInstructions: ""
}

const goodBadUgly = {
	name: "The Good, the Bad, and the Ugly",
    numCards: 7,
    peekAllowed: true,
    playSequence: [
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceUp",
		"bet",
        "dealFaceUp",
        "turnIndicator",
		"bet",
		"dealFaceUp",
        "turnIndicator",
		"bet",
		"dealFaceUp",
        "turnIndicator",
		"bet",
		"dealFaceDown",
		"bet"
	],
    hilo: "High Only",
	whatsWild: "The first of the 3 indicator cards", //e.g. "low hole card and any up cards that match it"
	remodeling: false,
    numRemodels: 0,
    remodelCostFaceUp: 0,
	remodelCostFaceDown: 0,
	passing: false,
    numCardsToPass: 0,
    fwdCardsToPass: false,
    numIndicatorCards: 3,
    otherInstructions: `First indicator is wild.
Second shows what you must discard throughout the game.
Third is a poison card; if you have it, you fold.
None of these cards are part of anyone's hand.`
}

const lowHoleCard = {
	name: "Low Hole Card",
    numCards: 7,
    peekAllowed: true,
    playSequence: [
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealPlayersChoice",
		"bet"
	],
    hilo: "High Only",
	whatsWild: "Your low hole card and any of your up cards that match it",
	remodeling: false,
    numRemodels: 0,
    remodelCostFaceUp: 0,
	remodelCostFaceDown: 0,
	passing: false,
    numCardsToPass: 0,
    fwdCardsToPass: false,
    numIndicatorCards: 0,
    otherInstructions: `Aces in the hole are high unless you have nothing but aces.
Last card can be up or down, your choice.`
}


const lowChicago = {
	name: "Low Chicago",
    numCards: 7,
    peekAllowed: true,
    playSequence: [
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceDown",
        "bet"
	],
    hilo: "High-Low",
	whatsWild: "Nothing", //e.g. "low hole card and any up cards that match it"
	remodeling: false,
    numRemodels: 0,
    remodelCostFaceUp: 0,
	remodelCostFaceDown: 0,
	passing: false,
    numCardsToPass: 0,
    fwdCardsToPass: false,
    numIndicatorCards: 0,
    otherInstructions: `High hand gets half the pot. 
Lowest spade in the hole gets the other half.`
}

const highLow = {
	name: "High-Low",
    numCards: 6,
    peekAllowed: true,
    playSequence: [
		"dealFaceDown",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceDown",
        "bet",
        "remodel",
        "bet",
        "declare",
        "bet"
	],
    hilo: "High-Low",
	whatsWild: "Nothing", //e.g. "low hole card and any up cards that match it"
	remodeling: true,
    numRemodels: 1,
    remodelCostFaceUp: 0.10,
	remodelCostFaceDown: 0.25,
	passing: false,
    numCardsToPass: 0,
    fwdCardsToPass: false,
    numIndicatorCards: 0,
    otherInstructions: ""
}

const anaconda = {
	name: "Anaconda",
    numCards: 7,
    peekAllowed: true,
    playSequence: [
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
        "passcards",
        "discard",
        "rollAll",
		"bet",
        "rollAll",
		"bet",
        "rollAll",
		"bet",
        "rollAll",
		"bet",
        "declare",
        "bet",
        "rollAll"
	],
    hilo: "High-Low",
	whatsWild: "Nothing", //e.g. "low hole card and any up cards that match it"
	remodeling: false,
    numRemodels: 0,
    remodelCostFaceUp: 0,
	remodelCostFaceDown: 0,
	passing: true,
    numCardsToPass: 3,
    fwdCardsToPass: true,
    numIndicatorCards: 0,
    otherInstructions: "After passing, discard 2 cards and put the remaining 5 in the sequence you want to reveal them."
}

const fourteenthStreet = {
	name: "Fourteenth Street",
    numCards: 7,
    peekAllowed: false,
    playSequence: [
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
        "rollOne",
        "bet",
        "repeat"
	],
    hilo: "High Only",
	whatsWild: "Up card that follows an up Queen; Up Sevens if you buy them for a quarter.", //e.g. "low hole card and any up cards that match it"
	remodeling: false,
    numRemodels: 0,
    remodelCostFaceUp: 0,
	remodelCostFaceDown: 0,
	passing: false,
    numCardsToPass: 0,
    fwdCardsToPass: true,
    numIndicatorCards: 0,
    otherInstructions: `Keep turning cards until you beat previous best hand. 
If you can't beat it, you can still stick around for a one-time payment of a quarter.`
}

const seven27 = {
	name: "7-27",
    numCards: 2,
    peekAllowed: true,
    playSequence: [
		"dealFaceDown",
		"dealFaceUp",
        "bet",
        "offerCards",
        "bet",
        "repeat",
        "declare",
        "bet"
	],
    hilo: "High-Low",
	whatsWild: "Nothing", //e.g. "low hole card and any up cards that match it"
	remodeling: false,
    numRemodels: 0,
    remodelCostFaceUp: 0,
	remodelCostFaceDown: 0,
	passing: false,
    numCardsToPass: 0,
    fwdCardsToPass: true,
    numIndicatorCards: 0,
    otherInstructions: `Aces count as 1 or 11. 
Face cards counts as 10 or 1/2. 
Three consecutive passes, you're frozen. 
Tiebreaker: fewer cards.`
}



shuffleButton = document.getElementById("shuffleButton");

shuffleButton.addEventListener('click', function (event) {
    socket.emit('shuffle request');
    shuffleButton.style.display="none";
  });

  $('a[href$="#myModal"]').on( "click", function() {
    $('#myModal').modal('show');
 });

checkSequenceButton = document.getElementById("checkSequenceButton");
checkSequenceButton.addEventListener("click", function (event){
    $("#playSequenceEditor").toggleClass("collapsed");
    $("#mainGameSettingsColumn").toggleClass("col-md-12 col-md-6");
    if (checkSequenceButton.innerText==="Check sequence"){
        checkSequenceButton.innerText="Hide sequence";
    } else {
        checkSequenceButton.innerText="Check sequence";
    }
});

$("#gameName").change(function() {
    let selectedGameName = document.getElementById("gameName").value;
    document.getElementById("playSequenceList").innerHTML = "";
    switch (selectedGameName) {
        case "anaconda":
          fillGameSettings(anaconda);
          break;
        case "fourteenthStreet":
          fillGameSettings(fourteenthStreet);
          break;
        case "goodBadUgly":
          fillGameSettings(goodBadUgly);
          break;
        case "lowChicago":
          fillGameSettings(lowChicago);
          break;
        case "lowHoleCard":
          fillGameSettings(lowHoleCard);
          break;
        case "sevenCardStud":
          fillGameSettings(sevenCardStud);
          break;
        case "seven27":
          fillGameSettings(seven27);
          break;
        case "sixCardOneRemodel":
          fillGameSettings(sixCardOneRemodel);
          break;
        case "dealersSpecial":
            break;
        default:
          alert("Hey, I dunno.");
      }
});


$(".passCardsExpander").change(function() {
    if ($( "#passCardsTrue:checked" ).length===1){
        numCardsToPass.value=3;
        $("#passCardsOptions").show(300);
    } else {
        numCardsToPass.value=0;
        $("#passCardsOptions").hide(200);
    }
});

$(".remodelExpander").change(function() {
   if ($( "#remodelTrue:checked" ).length===1){
       $("#remodelOptions").show(300);
   } else {
       $("#remodelOptions").hide(200);
   }
});

function fillGameSettings(selection){
numCards.value = selection.numCards;
switch(selection.hilo){
    case "High Only":
        document.getElementById('HighOnlyRadio').checked = true;
        break;
    case "Low Only":
        document.getElementById('LowOnlyRadio').checked = true;
        break;
    case "High-Low":
        document.getElementById('HighLowRadio').checked = true;
        break;
    default:
        document.getElementById('HighOnlyRadio').checked = true;
    }
whatsWild.value = selection.whatsWild;
passCardsTrue.checked = selection.passing;
if ($( "#passCardsTrue:checked" ).length===1){
    numCardsToPass.value=3;
    $("#passCardsOptions").show(300);
} else {
    numCardsToPass.value=0;
    $("#passCardsOptions").hide(200);
}
numCardsToPass.value = selection.numCardsToPass;
if(selection.fwdCardsToPass){
    fwdCardsToPassTrue.checked = true;
    } else {
    fwdCardsToPassFalse.checked = true;
    }
remodelTrue.checked = selection.remodeling;
if ($( "#remodelTrue:checked" ).length===1){
    $("#remodelOptions").show(300);
} else {
    $("#remodelOptions").hide(200);
}
numRemodels.value = selection.numRemodels;
remodelCostFaceUp.value = selection.remodelCostFaceUp;
remodelCostFaceDown.value = selection.remodelCostFaceDown;
peekAllowedFalse.checked = !selection.peekAllowed;
numIndicatorCards.value = selection.numIndicatorCards;
otherInstructions.value = selection.otherInstructions;
selection.playSequence.forEach(element => {
    let newPlaySequenceLine = `<li><span class="leftIcon"><i class="fas fa-trash"></i></span>${element}<span class="downIcon"><i class="fas fa-chevron-circle-down"></i></span><span class="upIcon"><i class="fas fa-chevron-circle-up"></i></span></li>`;
    $( "#playSequenceList" ).append( newPlaySequenceLine );
});
}



