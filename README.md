# Rock-Paper-Scissors-Multiplayer using Firebase

Play a multiplayer game of rock paper scissors. After choosing a username, players can queue up for a game and wait until another player also queues up. If a game is available to join, the second player will join the first and the game begins. Players can chat with opponents, be notified of opponent disconnects, and maintain wins/losses. However, user information on the client will not persist on page refresh. Information about player connections, player details, messages between players, and game state is stored in Firebase

### Firebase lessons learned
- Changing a node inside an event listener listening on that same node will produce an infinite loop
- Difficult bug: Posting of every message twice only after RPS selection made - Issue was tracking of messages reference was
continually reassigned inside tracking of gameRef .on event, so that any change in the game would reassign messagesRef and 
trigger messagesRef.on listener

