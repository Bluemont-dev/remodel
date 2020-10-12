const   mongoose				    = require("mongoose"),
        Schema                      = mongoose.Schema;

const Night = new Schema({
	  dateCreated: {type:Date, default: Date.now},
    hostID: String,
    tonightPlayers: [{ type:mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    games: [],
    amtAnte: Number,
    amtMaxOpen: Number,
    amtMaxRaise: Number,
    amtBetIncrements: Number
  });

module.exports = mongoose.model('Night', Night);