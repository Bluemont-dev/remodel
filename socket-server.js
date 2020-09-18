
//==========
//SOCKET SERVER LOGIC
//===========

io.on('connection', (socket) => {

    //each of the following is a function that gets stored, kind of like an event listener, and called when the event happens 
 //   socket.on('chat message', (msg) => {
 //     io.emit('chat message', msg);
 //   });
 
   socket.on('iAmConnected', (userId) => {
       io.emit('chat message',"We welcome User "+ userId);
       io.emit("allCards update", allCards);
   } );
 
     socket.on('iAmDisconnected', (userId) => {
         io.emit('chat message',"And goodbye to User "+ userId);
     });
 
     socket.on("request deal", (userId) => {
         //remove first 5 items from the array and send to the client that requested it
        let clientHand = allCards.slice(0,5);
         allCards = allCards.slice(5);
         io.sockets.to(userId).emit("cards sent",clientHand);
         io.emit("allCards update",allCards);
     });
 
 });
 
 
 function message (userId, event, data) { //not being used at the moment
     io.sockets.to(userId).emit(event, data);
   }
 
//===============
//FINAL EXPORT
//==============

module.exports = socket-server; 