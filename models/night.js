const   mongoose				    = require("mongoose"),
        Schema                      = mongoose.Schema;

const Night = new Schema({
	  dateCreated: {type:Date, default: Date.now},
    hostID: String,
    players: [],
    games: [],
    amtAnte: Number,
    amtMaxOpen: Number,
    amtMaxRaise: Number,
    amtBetIncrements: Number
  });

module.exports = mongoose.model('Night', Night);