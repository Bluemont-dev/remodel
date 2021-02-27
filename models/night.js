const   mongoose				    = require("mongoose"),
        Schema              = mongoose.Schema;

const Night = new Schema({
	  dateCreated: {type:Date, default: Date.now},
    hostID: String,
    players:[
      {
        playerUser: {
          type:mongoose.Schema.Types.ObjectId, 
          ref:"User",
          autopopulate: true
          }, //this should incorporate by object reference
        socketID: String,
        joinedNightDate: {type:Date, default: Date.now},
        balanceForNight: Number,
        isDealer: Boolean,
        hand: [],
        amtBetInRound: Number,
        amtBetInGame: Number,
        declaration: String,
        wantsACard: String,
        timesDeclinedACard: Number,
        readyToPassCards: Boolean
        // possible future functions
          //   purchase()
          //   bet()
          //   ante()
          //   check()
          //   fold()
          //   declare()
          //   collect(amt)
          //   selectGame()
          //   offerCard()
          //   deal(destination,faceUp)
          //   passCards()
          //   chooseWinners()
      }
    ],
    games:[
      {
        name: String,
        numCards: String,
        peekAllowed: Boolean,
        playSequence: [],
        playSequenceLocation: Number,
        hilo: String,
        whatsWild: String, //e.g. "low hole card and any up cards that match it"
        currentWildCard: String, // e.g. "10"
        remodeling: Boolean,
        numRemodels: Number,
        remodelCostFaceUp: Number,
        remodelCostFaceDown: Number,
        passing: Boolean,
        numCardsToPass: Number,
        fwdCardsToPass: Boolean,
        numIndicatorCards: Number,
        indicatorCards: [],
        discards: [],
        otherInstructions: String,
        amtPot: Number,
        playersInGame: [],
        playersOutOfGame: [],
        dealablePlayers: [],
        winners: [],
        highWinners: [],
        lowWinners: [],
        endingBalances: []
        // possible future functions
        // passCards()
        // chooseWinners()
        // close()
      }
    ],
    amtAnte: Number,
    amtMaxOpen: Number,
    amtMaxRaise: Number,
    amtBetIncrements: Number
  });

Night.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Night', Night);