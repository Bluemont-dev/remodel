$( ".passwordVisibilityToggle" ).change(function() {
    if ($( "#showPassword:checked" ).length===1){
        $('#password').get(0).type = 'text';
    } else {
        $('#password').get(0).type = 'password';
    }
});

function displayNewPlayerArea(){
let newPlayerDiv = `<div class="col col-12 col-md-3 playerArea" id="player${players.length}Area">Player ${players.length}: ${firstName}</div>`;
  //that previous line used a template string, aka a string literal, check me out!
  if (players.length<5){
     $("#playersRow1").append(newPlayerDiv);
  } else if (players.length===5){
     $("#playersRow2").append($("#player4Area")[0]); 
     $("#playersRow2").append(newPlayerDiv);
     $("#playersRow2").css("display","flex");
  } else if (players.length===6 || players.length===7){ 
     $("#playersRow2").append(newPlayerDiv);
  }
}
