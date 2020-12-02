const   mongoose				    = require("mongoose"),
        Schema              = mongoose.Schema;

const Night = new Schema({
	  dateCreated: {type:Date, default: Date.now},
    hostID: String,
    tonightPlayers: [{ type:mongoose.Schema.Types.ObjectId, ref: 'Player' }],
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
        otherInstructions: String,
        amtPot: Number,
        playersInGame: [],
        playersOutOfGame: [],
        indicatorCards: [],
        discards: [],
        shuffledDeck: [],
        dealtCards: []
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

module.exports = mongoose.model('Night', Night);