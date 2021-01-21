var myConfig	= {};

//==========
//Global variables
//============
myConfig.nightInProgress = false;
myConfig.gameInProgress = false;
myConfig.currentDealerIndex = 0;
myConfig.currentDealerName = "";
myConfig.bettingRound = {};
myConfig.previousOpenerIndex = -1;
myConfig.previousRollerIndex = -1;
myConfig.previousRolledRank = "";
myConfig.previousRolledSuit = "";
myConfig.currentRolledRank = "";
myConfig.currentRolledSuit = "";
myConfig.amtPotCarryOver=0;
myConfig.gameEndAcknowledgements = 0;
myConfig.discardSpecificRank = "";
myConfig.discardNotificationArray = [];
myConfig.discardResponsesArray = [];

module.exports = myConfig;



