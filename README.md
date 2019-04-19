# Rock-Paper-Scissors-Multiplayer using Firebase

### Description
Play a multiplayer game of rock paper scissors. Chat with your opponents in real time to mock their rock paper scissors strategy.

### Motivation
This project provides an outlet for users who want to play a simple game of rock paper scissors against a real opponent anywhere in the world. 


### Results
After choosing a username, players can queue up for a game, and will wait until another player also queues up. If a game is available to join, the second player will join the first and the game begins. Players can chat with opponents, be notified of opponent disconnects, and maintain wins/losses. However, user information on the client will not persist on page refresh. Information about player connections, player details, messages between players, and game state is stored in Firebase

### Future Improvements
- [ ] Implement Firebase authentication through an email and password, or throught a federated provider (Google, Facebook, etc). 
- [ ] Force players to make an RPS choice after a certain ammount of time or force a surrender
- [ ] Implement a global top players scoreboard 

```bash
Firebase database structure

root 
    ├── chats
    |        ├── chat #1
    |        |           ├── message #1
    |        |           ├── message #2
    |        ├── chat #2
    |        ...
    |
    ├── connections
    |             ├── player 1 
    |              ...
    ├── players
    |         ├── player #1
    |          ...
    ├── queue
             ├── game #1   
             ...
```

### Firebase lessons learned
- Changing a node inside an event listener listening on that same node will produce an infinite loop
- Difficult to solve bug: Posting of every message twice only after RPS selection made - Issue was tracking of messages reference was
continually reassigned inside tracking of gameRef .on event, so that any change in the game would reassign messagesRef and 
trigger messagesRef.on listener

