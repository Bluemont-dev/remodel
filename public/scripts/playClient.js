
if (window.location.href.includes('/play/')){
    gamesNamesLoad();
}

  $('a[href$="#myModal"]').on( "click", function() {
    $('#myModal').modal('show');
 });

checkSequenceButton = document.getElementById("checkSequenceButton");
checkSequenceButton.addEventListener("click", function (event){
    $("#playSequenceEditor").toggleClass("collapsed");
    $("#mainGameSettingsColumn").toggleClass("col-md-12 col-md-6");
    if (checkSequenceButton.innerText==="Customize"){
        checkSequenceButton.innerText="Hide";
    } else {
        checkSequenceButton.innerText="Customize";
    }
});

function gamesNamesLoad () { //take the game names from preset constant and load them into the picklist
   allGameSettings.forEach(element => {
        let newPickListLine = `<option value="${element.formOptionValue}">${element.name}</option>`;
        $( "#gameName" ).append( newPickListLine );
    });
}

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
        case "sixSixSix":
          fillGameSettings(sixSixSix);
          break;
        case "highLow":
          fillGameSettings(highLow);
          break;
        case "dealersSpecial":
          fillGameSettings(dealersSpecial);
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
playSequenceArray.value = JSON.stringify(selection.playSequence);
selection.playSequence.forEach(element => {
    let newPlaySequenceLine = `<li><span class="leftIcon"><i class="fas fa-trash"></i></span>${element}<span class="downIcon"><i class="fas fa-chevron-circle-down"></i></span><span class="upIcon"><i class="fas fa-chevron-circle-up"></i></span></li>`;
    $( "#playSequenceList" ).append( newPlaySequenceLine );
});
}

function submitGame() {
    let hilo = "High Only";
    if (document.getElementById('HighOnlyRadio').checked === true){
        hilo = "High Only";
    } else if (document.getElementById('LowOnlyRadio').checked === true){
        hilo = "Low Only";
    } else if (document.getElementById('HighLowRadio').checked === true){
        hilo = "High-Low";
    }
    let name = ""; //follow this line with the loop thru gameSettings to retrieve the proper game name string based on gameName.value
    let selectedGameName = document.getElementById("gameName").value;
    allGameSettings.forEach(element => {
        if (element.formOptionValue === selectedGameName){
            name = element.name;
        }
    });

    const submittedGame = {
        name: name,
        numCards: parseInt(numCards.value,10),
        peekAllowed: !peekAllowedFalse.checked,
        playSequence: JSON.parse(playSequenceArray.value),
        playSequenceLocation: -1,
        hilo: hilo,
        whatsWild: whatsWild.value, 
        currentWildCard: "",
        remodeling: remodelTrue.checked,
        numRemodels: parseInt(numRemodels.value,10),
        remodelCostFaceUp: parseFloat(remodelCostFaceUp.value),
        remodelCostFaceDown: parseFloat(remodelCostFaceDown.value),
        passing: passCardsTrue.checked,
        numCardsToPass: parseInt(numCardsToPass.value,10),
        fwdCardsToPass: fwdCardsToPassTrue.checked,
        numIndicatorCards: parseInt(numIndicatorCards.value,10),
        otherInstructions: otherInstructions.value,
        amtPot: 0,
        playersInGame: [],
        playersOutOfGame: [],
        dealablePlayers: []
    }
        socket.emit('game submit', submittedGame);
    $('#myModal').modal('hide');
    return false; // prevent further bubbling of event
  }

//   $(function playSound(sound){
//     var howler_deal1 = new Howl({
//         src: ['/sounds/deal1.m4a']
//     });
//     var howler_deal2 = new Howl({
//         src: ['/sounds/deal2.m4a']
//     });
//     var howler_deal3 = new Howl({
//         src: ['/sounds/deal3.m4a']
//     });
//     var howler_chipSingle = new Howl({
//         src: ['/sounds/chip-single.m4a']
//     });
//     var howler_chipMultiple = new Howl({
//         src: ['/sounds/chip-multiple.m4a']
//     });
//     var howler_fold = new Howl({
//         src: ['/sounds/fold.m4a']
//     });
//     switch (sound){
//         case "deal1":
//             howler_deal1.play();
//             break;
//         case "deal2":
//             howler_deal2.play();
//             break;
//         case "deal3":
//             howler_deal3.play();
//             break;
//         case "chipSingle":
//             howler_chipSingle.play();
//             break;
//         case "chipMultiple":
//             howler_chipMultiple.play();
//             break;
//         case "fold":
//             howler_fold.play();
//             break;
//     }
// });

