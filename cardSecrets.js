var cardSecrets	= {}; // used to store info about the cards during a game, in an object NOT passed to the client

cardSecrets.shuffledDeck = [];
cardSecrets.dealtCards = [];
cardSecrets.indicatorCards = [];
cardSecrets.discards = [];

module.exports = cardSecrets;