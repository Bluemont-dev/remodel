const   mongoose				    = require("mongoose"),
        Schema                      = mongoose.Schema;

const Player = new Schema({
    playerUser: {type:mongoose.Schema.Types.ObjectId, ref:"User"}, //this should incorporate by object reference
    socketID: String,
    joinedNightDate: {type:Date, default: Date.now},
    balanceForNight: Number,
    isDealer: Boolean,
    hand: [],
    amtBetInRound: Number,
    declaration: String,
    wantsACard: String,
    timesDeclinedACard: Number,
    readyToPassCards: Boolean 
  });

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

module.exports = mongoose.model('Player',Player);