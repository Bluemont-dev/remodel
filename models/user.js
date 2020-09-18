const   mongoose				    = require("mongoose"),
        Schema                      = mongoose.Schema,
	    passportLocalMongoose	    = require("passport-local-mongoose");

const User = new Schema({
    username: String,
    firstName: String,
    lastInitial: String,
    profileImgPath: String,
    homeBackgroundImgPath: String,
    socketID: String
  });
User.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', User);