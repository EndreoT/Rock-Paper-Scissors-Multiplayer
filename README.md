# Rock-Paper-Scissors-Multiplayer
Multiplayer rock paper scissors

Lessons learned:
- Posting of every message twice after RPS selection made - Issue was tracking of messages reference was
reassigned inside tracking of gameRef .on event, so that any change in the game would reassign messagesRef and 
trigger messagesRef.on listener. Yikes
- Changing a node inside an event listener listening on that same node will produce an infinite loop
