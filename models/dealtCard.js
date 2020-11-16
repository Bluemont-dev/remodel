//const User						          = require("./models/user");

// const myConfig = require("../config");

const ranksSpelledOut = { //using these next two objects instead of switch statements to assign suit and rank string values from shortString passed to constructor
    ace:"a",
    two:"2",
    three:"3",
    four:"4",
    five:"5",
    six:"6",
    seven:"7",
    eight:"8",
    nine:"9",
    ten:"t",
    jack:"j",
    queen:"q",
    king:"k"
}

const suitsSpelledOut = {
    spades:"s",
    clubs:"c",
    diamonds:"d",
    hearts:"h"
}

// following are properties and methods of the object DealtCard

class DealtCard {
    constructor(shortString, faceUp, peekable, dealtCardsIndex) {

        for (const property in ranksSpelledOut) {
            if (shortString.substr(0, 1) === ranksSpelledOut[property]) {
                this.rank = `${property}`;
                break;
            }
        }

        for (const property in suitsSpelledOut) {
            if (shortString.substr(1, 1) === suitsSpelledOut[property]) {
                this.suit = `${property}`;
                break;
            }
        }

        this.rankvalue = 0; // not using rank value yet, since my game is a "dumb" game, but might need it in future upgrades
        this.imgPath = "images/cards/" + shortString + ".png";
        this.faceUp = faceUp;
        this.peekable = peekable;
        this.dealtCardsIndex = dealtCardsIndex;

        this.bark = function () {
            console.log(this.imgPath + " just barked");
        };
    }
}

//===============
//FINAL EXPORT
//==============

module.exports = DealtCard;