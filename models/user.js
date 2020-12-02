const   mongoose				    = require("mongoose"),
        Schema                      = mongoose.Schema,
	    passportLocalMongoose	    = require("passport-local-mongoose");

const User = new Schema({
    username: String,
    firstName: String,
    lastInitial: String,
    profileImgPath: String,
    homeBackgroundImgPath: String
  });

  User.virtual('fullName') // lets us derive the full name string as a property of the object, but it doesn't get stored in the DB, thus can't be queried
.get(function() {
    return `${this.firstName} ${this.lastInitial}`
})

  User.methods.sayHello = function() {
    console.log("Hello, my name is " + this.firstName);
    // return this.name + 'TROLOLO';
};


User.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', User);