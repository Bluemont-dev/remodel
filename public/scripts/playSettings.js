    

const sixSixSix = {
	name: "6-6-6",
	formOptionValue: "sixSixSix",
	numCards: 6,
	peekAllowed: true,
	playSequence: [
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealIndicatorsDown",
		"turnIndicator",
		"bet",
		"turnIndicator",
		"bet",
		"turnIndicator",
		"bet",
		"turnIndicator",
		"bet",
		"turnIndicator",
		"bet",
		"turnIndicator",
		"bet"
	],
	hilo: "High Only",
	whatsWild: "Sixes",
	remodeling: false,
	numRemodels: 0,
	remodelCostFaceUp: 0,
	remodelCostFaceDown: 0,
	passing: false,
	numCardsToPass: 0,
	fwdCardsToPass: true,
	numIndicatorCards: 6,
	otherInstructions: `Play any combination of 5 cards from your hand and/or the shared cards.`
}

const seven27 = {
	name: "7-27",
	formOptionValue: "seven27",
	numCards: 2,
	peekAllowed: true,
	playSequence: [
		"dealFaceDown",
		"dealFaceUp",
		"bet",
		"offerCards",
		"bet",
		"repeat",
		"declare",
		"bet"
	],
	hilo: "High-Low",
	whatsWild: "Nothing",
	remodeling: false,
	numRemodels: 0,
	remodelCostFaceUp: 0,
	remodelCostFaceDown: 0,
	passing: false,
	numCardsToPass: 0,
	fwdCardsToPass: true,
	numIndicatorCards: 0,
	otherInstructions: `Aces count as 1 or 11. 
Face cards counts as 10 or 1/2. 
Three consecutive passes, you're frozen. 
Tiebreaker: fewer cards.`
}

const anaconda = {
name: "Anaconda",
formOptionValue: "anaconda",
numCards: 7,
peekAllowed: true,
playSequence: [
	"dealFaceDown",
	"dealFaceDown",
	"dealFaceDown",
	"dealFaceDown",
	"dealFaceDown",
	"dealFaceDown",
	"dealFaceDown",
	"passCards",
	"discard",
	"rollAll",
	"bet",
	"rollAll",
	"bet",
	"rollAll",
	"bet",
	"rollAll",
	"bet",
	"declare",
	"bet",
	"rollAll"
],
hilo: "High-Low",
whatsWild: "Nothing",
remodeling: false,
numRemodels: 0,
remodelCostFaceUp: 0,
remodelCostFaceDown: 0,
passing: true,
numCardsToPass: 3,
fwdCardsToPass: true,
numIndicatorCards: 0,
otherInstructions: "After passing, discard 2 cards and put the remaining 5 in the sequence you want to reveal them."
}
	
const fourteenthStreet = {
	name: "Fourteenth Street",
	formOptionValue: "fourteenthStreet",
    numCards: 7,
    peekAllowed: false,
    playSequence: [
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceDown",
        "rollOne",
        "bet",
        "repeat"
	],
    hilo: "High Only",
	whatsWild: "Up card that follows an up Queen.",
	remodeling: false,
    numRemodels: 0,
    remodelCostFaceUp: 0.0,
	remodelCostFaceDown: 0.0,
	passing: false,
    numCardsToPass: 0,
    fwdCardsToPass: true,
    numIndicatorCards: 0,
    otherInstructions: `Keep turning cards until you beat previous best hand. 
If you can't beat it, you can still stick around for a one-time payment of a quarter.`
}

const goodBadUgly = {
	name: "The Good, the Bad, and the Ugly",
	formOptionValue: "goodBadUgly",
    numCards: 7,
    peekAllowed: true,
    playSequence: [
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceUp",
		"dealIndicatorsDown",
		"bet",
        "dealFaceUp",
        "turnIndicator",
		"bet",
		"dealFaceUp",
		"turnIndicator",
		"discardSpecificRank",
		"bet",
		"dealFaceUp",
		"discardSpecificRank",
        "turnIndicator",
		"bet",
		"dealFaceDown",
		"discardSpecificRank",
		"bet"
	],
    hilo: "High Only",
	whatsWild: "The first of the 3 indicator cards",
	remodeling: false,
    numRemodels: 0,
    remodelCostFaceUp: 0,
	remodelCostFaceDown: 0,
	passing: false,
    numCardsToPass: 0,
    fwdCardsToPass: false,
    numIndicatorCards: 3,
    otherInstructions: `First indicator is wild.
Second shows what you must discard throughout the game.
Third is a poison card; if you have it, you fold.
None of these cards are part of anyone's hand.`
}

const highLow = {
	name: "High-Low",
	formOptionValue: "highLow",
    numCards: 6,
    peekAllowed: true,
    playSequence: [
		"dealFaceDown",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceDown",
        "bet",
        // "remodel",
        // "bet",
        "declare",
        "bet"
	],
    hilo: "High-Low",
	whatsWild: "Nothing",
	remodeling: true,
    numRemodels: 1,
    remodelCostFaceUp: 0.10,
	remodelCostFaceDown: 0.25,
	passing: false,
    numCardsToPass: 0,
    fwdCardsToPass: false,
    numIndicatorCards: 0,
    otherInstructions: ""
}

const lowChicago = {
	name: "Low Chicago",
	formOptionValue: "lowChicago",
    numCards: 7,
    peekAllowed: true,
    playSequence: [
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceDown",
        "bet"
	],
    hilo: "High Only",
	whatsWild: "Nothing",
	remodeling: false,
    numRemodels: 0,
    remodelCostFaceUp: 0,
	remodelCostFaceDown: 0,
	passing: false,
    numCardsToPass: 0,
    fwdCardsToPass: false,
    numIndicatorCards: 0,
    otherInstructions: `High hand gets half the pot. 
Lowest spade in the hole gets the other half.`
}

const lowHoleCard = {
	name: "Low Hole Card",
	formOptionValue: "lowHoleCard",
    numCards: 7,
    peekAllowed: true,
    playSequence: [
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		// "dealPlayersChoice", functionality to be added later
		"dealFaceDown",
		"bet"
	],
    hilo: "High Only",
	whatsWild: "Your low hole card and any of your up cards that match it",
	remodeling: false,
    numRemodels: 0,
    remodelCostFaceUp: 0,
	remodelCostFaceDown: 0,
	passing: false,
    numCardsToPass: 0,
    fwdCardsToPass: false,
    numIndicatorCards: 0,
    otherInstructions: `Aces in the hole are high unless you have nothing but aces.
Last card can be up or down, your choice.`
}

const sevenCardStud = {
	name: "Seven-Card Stud",
	formOptionValue: "sevenCardStud",
    numCards: 7,
    peekAllowed: true,
    playSequence: [
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceDown",
		"bet"
	],
    hilo: "High Only",
	whatsWild: "Nothing",
	remodeling: false,
    numRemodels: 0,
    remodelCostFaceUp: 0,
	remodelCostFaceDown: 0,
	passing: false,
    numCardsToPass: 0,
    fwdCardsToPass: false,
    numIndicatorCards: 0,
    otherInstructions: ""
}

const dealersSpecial = {
	name: "Dealer's Special",
	formOptionValue: "dealersSpecial",
    numCards: 7,
    peekAllowed: true,
    playSequence: [
		"dealFaceDown",
		"dealFaceDown",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceUp",
		"bet",
		"dealFaceDown",
		"bet"
	],
    hilo: "High Only",
	whatsWild: "Nothing",
	remodeling: false,
    numRemodels: 0,
    remodelCostFaceUp: 0,
	remodelCostFaceDown: 0,
	passing: false,
    numCardsToPass: 0,
    fwdCardsToPass: false,
    numIndicatorCards: 0,
    otherInstructions: ""
}

const allGameSettings = [sixSixSix,seven27,anaconda,fourteenthStreet,goodBadUgly,highLow,lowChicago,lowHoleCard,sevenCardStud,dealersSpecial]

