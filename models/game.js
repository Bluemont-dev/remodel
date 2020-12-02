const   mongoose				    = require("mongoose"),
        Schema                      = mongoose.Schema;

const Game = new Schema({
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
  });

// possible future functions
// passCards()
// chooseWinners()
// close()

module.exports = mongoose.model('Game', Game);