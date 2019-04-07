
// Problems



// Posting of every message twice after RPS selection made - Issue was tracking of messages reference was
// reassigned inside tracking of gameRef .on event, so that any change in the game would reassign messagesRef and 
// triggers messagesRef.on listener





// Notify player if opponent DC


// Initialize Firebase
var config = {
    apiKey: "AIzaSyB6CoZeUG93nUg_Ae3lRQrvmtTXzeJsCT8",
    authDomain: "rock-paper-scissors-6811f.firebaseapp.com",
    databaseURL: "https://rock-paper-scissors-6811f.firebaseio.com",
    projectId: "rock-paper-scissors-6811f",
    storageBucket: "rock-paper-scissors-6811f.appspot.com",
    messagingSenderId: "778547774230"
};
firebase.initializeApp(config);

const database = firebase.database();

const gamesRef = database.ref('/game');
const queueRef = database.ref('/queue');
const playersRef = database.ref('/players');
const connectionsRef = database.ref('/connections');
const connectedUsersRef = database.ref('.info/connected');
let gameRef; // Ref for user's game
let playerRef; // Ref to player
let opponentRef;

const allChatsRef = database.ref('/chats');
let messagesRef; // For messages of the particular game chat


// const name = prompt("Enter your name"); // Use modal instead
// const connection = connectionsRef.push(name);

const RPS_Moves = {
    ROCK: 'ROCK',
    PAPER: 'PAPER',
    SCISSORS: 'SCISSORS'
}

const playerTypes = {
    CREATER: 'CREATER',
    JOINER: 'JOINER'
}

const user = {
    name: Math.floor(Math.random() * 100),
    id: '',
    gameId: '',
    playerType: '' // value is one of the playerTypes properties ("CREATER" or "JOINER")'
}

// Retrieves opposite player type.
// Ex. getOppositePlayerType(playerTypes.CREATER) ->  playerTypes.JOINER
function getOppositePlayerType(playerType) {
    if (playerType === playerTypes.CREATER) {
        return playerTypes.JOINER;
    }
    return playerTypes.CREATER;
}

// Detect changes in user connections
connectedUsersRef.on('value', function (snapshot) {
    if (snapshot.val()) {
        // Pushes new user node into connections folder
        const connection = connectionsRef.push(user.name);
        connection.onDisconnect().remove();
    }
}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});

// Detects changes in connections directory
// Event listener must be .once instead of .on otherwise both clients push the same player into /connections
connectionsRef.once('child_added', function (connectionSnap) {
    user.id = connectionSnap.key;
    // Adds player to playersRef
    player = playersRef.push({
        name: user.name,
        id: user.id,
        wins: 0
    });
    playerRef = player;

    // Establishes connection on player change
    playerRef.on('value', function (snapshot) {
        $('#wins').text(snapshot.val().wins)
    });
    player.onDisconnect().remove();
}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});

function determineWinner(createrChoice, joinerChoice) {
    let outcome = playerTypes.JOINER;
    if (createrChoice === joinerChoice) {
        outcome = 'tie';
    } else if (
        (createrChoice === RPS_Moves.ROCK && joinerChoice === RPS_Moves.SCISSORS) ||
        (createrChoice === RPS_Moves.SCISSORS && joinerChoice === RPS_Moves.PAPER) ||
        (createrChoice === RPS_Moves.PAPER && joinerChoice === RPS_Moves.ROCK)) {
        outcome = playerTypes.CREATER;
    }
    return outcome;
}

function trackGame() { // Main function monitoring on game change
    gameRef.on('value', function (snap) {

        const gameState = snap.val();

        // Check if both players submitted RPS moves
        if (!gameState.gameOver && gameState.CREATER.choice && gameState.JOINER.choice) {
            // Game is now over
            gameRef.update({
                gameOver: true,
            });
            const oppostitePlayerType = getOppositePlayerType(user.playerType)
            showOutcome(gameState[oppostitePlayerType].choice);
            // Get string indicating tie or winner
            const winner = determineWinner(gameState.CREATER.choice, gameState.JOINER.choice)
            if (winner === 'tie') {
                $('#game-outcome').text("You and your opponent tied!");
            } else { // Determine who won
                if (user.playerType === winner) {
                    // Update wins
                    playerRef.once('value', function (snapshot) {
                        const currentWins = parseInt(snapshot.val().wins);
                        playerRef.update({
                            wins: currentWins + 1
                        })
                    })
                    $('#game-outcome').text("You win");
                } else {
                    $('#game-outcome').text("You lose!");
                }
            }
            // Check if second player has joined game
        } else if (!gameState.gameOver && !gameState.isAvailable) {

            // Show game in client
            const oppositePlayerType = getOppositePlayerType(user.playerType)
            displayGame(gameState[oppositePlayerType].name);

            // Check if opponent has chosen RPS move but player has not
            if (gameState[oppositePlayerType].choice && !gameState[user.playerType].choice) {
                $('#wait-for-player-choice').show();
                // Check if player has chosen RPS move but opponent has not
            } else if (!gameState[oppositePlayerType].choice && gameState[user.playerType].choice) {
                $('#wait-for-opponent-choice').show();
            }
        } else if (gameState.gameOver) {
            // Remove listener from game reference
            gameRef.off();
            messagesRef.off();
            opponentRef.off();
        }
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

// Create a new game in lobby with only player being the CREATER 
function createGame(gameInfo) {
    // Create new game
    const newGame = queueRef.push(
        gameInfo
    );
    gameRef = newGame;
    user.gameId = gameRef.key
    user.playerType = playerTypes.CREATER;
}

// Join game. Player joining referred to as JOINER
function joinGame(gameKey, joinerInfo) {
    // Add joiner info
    queueRef.child(gameKey + '/JOINER').update(joinerInfo);
    // Game is in progress and is no longer available to be joined
    queueRef.child(gameKey).update({
        isAvailable: false
    });
    gameRef = database.ref('/queue/' + gameKey);
    user.gameId = gameKey;
    user.playerType = playerTypes.JOINER;
}

function trackOpponentConnection() {
    opponentRef.on('value', function (snapshot) {
        console.log('opponent DC')
    })
}

$('#queue').click(function () {
    $('#queue').hide();
    $('#waiting').show();
    queueRef.orderByChild('isAvailable').equalTo(true).once('value', function (snapshot) {
        const availableGame = snapshot.val();
        if (!availableGame) { // No games in queue. Waiting for other player
            createGame(
                {
                    CREATER: { name: user.name, id: user.id, choice: '' },
                    isAvailable: true,
                    gameOver: false,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                }
            );
        } else { // Game found. 
            const gameKey = Object.entries(availableGame)[0][0];
            joinGame(gameKey, {
                name: user.name,
                id: user.id,
                choice: '',
            });
        }
        const opponentType = getOppositePlayerType(user.playerType);
        gameRef.once('value', function (snapshot) {
            const opponentId = snapshot.val()[opponentType].id;
            // Track opponent connection
            opponentRef = connectionsRef.child('/' + opponentId)
            trackOpponentConnection();
        });
        // Create first message greeting
        if (user.playerType === playerTypes.CREATER) {
            const message = {
                user: 'ChatBot',
                message: 'The is the beginning of the chat between you and your opponenet',
                timestamp: firebase.database.ServerValue.TIMESTAMP,
            }
            allChatsRef.child(gameRef.key).push(message);
        }
        // Assign reference to only the chat for this specific game
        messagesRef = allChatsRef.child(gameRef.key);

        // Track messages for only one game
        trackChat();

        // Track changes in game
        trackGame();
    }, function (error) {
        console.log(error)
    });
});

$('.rps-button').click(function () {
    const choice = $(this).attr('data-move').toUpperCase();
    $('#choice').show();
    $('#your-choice').text(choice);

    gameRef.child('/' + user.playerType).update({
        choice: RPS_Moves[choice],
    });
    $('#rps-buttons').hide();
});

$('#play-again').click(function () {
    $('#messages').empty();
    initElements();
});

$('#send-message').click(function (event) {
    console.log('sent message once')
    const messageText = $('#message-input').val().trim();
    if (!messageText.length) {
        $('#message-empty').show();
        event.stopPropagation();
        return;
    }
    $('#message-empty').hide();
    $('#message-input').val('');
    const message = {
        user: user.name,
        message: messageText,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
    }
    // if (!allChatsRef.child(gameRef.key)) {
    // allChatsRef.child(gameRef.key).once('value', function (snapshot) {
    //     if (!snapshot.val()) {
    //         allChatsRef.child(gameRef.key).push(message);
    //     } else {
    // Messages for game exits, push message
    // messagesRef.push(message);
    // allChatsRef.child(gameRef.key).push(message);
    // }
    // })
    // If no chat messages for game exists, create message child with game key as id and add new message
    //     allChatsRef.child(gameRef.key).setValue(message);

    //     // Assign reference to only the chat for this specific game
    //     messagesRef = allChatsRef.child(gameRef.key);
    //     trackChat();

    // } else {
    //     // Messages for game exits, push message

    messagesRef.push(message);

    //     // allChatsRef.child(gameRef.key).push(message);
    // }
});

function trackChat() {
    messagesRef.on('child_added', function (snapshot) {
        const message = snapshot.val()
        console.log(message)

        const messageElem = $('<li class="list-group-item">')
            .append('<p><strong>' + message.user + ': </strong>' + message.message + '</p>')
        const allMessagesElem = $('#messages');
        allMessagesElem.append(messageElem);
        allMessagesElem.scrollTop($('#messages').prop("scrollHeight"));
    });
}

function initElements() {
    $('#queue').show();
    $('#waiting').hide();
    $('#wait-for-opponent-choice').hide();
    $('#wait-for-player-choice').hide();
    $('#opponent-name').hide();
    $('#opponent').text('');
    $("#resolve-game").hide();
    $('#player-name').text(user.name);
    $('#rps-buttons').hide();
    $('#choice').hide();
    $('#your-choice').text('');
    $('#messages-col').hide();
    $('#message-empty').hide();
}

function displayGame(opponentName) {
    $('#waiting').hide();
    $('#opponent').text(opponentName);
    $('#opponent-name').show();
    $('#rps-buttons').show();
    $('#messages-col').show();
}

function showOutcome(opponentChoice) {
    $('#wait-for-opponent-choice').hide();
    $('#wait-for-player-choice').hide();
    $('#resolve-game').show();
    $('#opponent-choice').text(opponentChoice)
}

initElements();
