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


const allChatsRef = database.ref('/chats');
let messagesRef; // For messages of the particular game chat


// const name = prompt("Enter your name");
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
        const connection = connectionsRef.push(user.name);
        connection.onDisconnect().remove();
    }
}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});

// Detects changes in connections directory
connectionsRef.once('child_added', function (connectionSnap) {
    user.id = connectionSnap.key;
    player = playersRef.push({ // Adds player to playersRef
        name: user.name,
        id: user.id,
        wins: 0
    });
    playerRef = player;

    // trackPlayer();

    playerRef.on('value', function (snapshot) { // Establishes connection on player change
        $('#wins').text(snapshot.val().wins)
    })
    player.onDisconnect().remove();
}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});

// Establishes connection on player change
// function trackPlayer() {
//     playerRef.on('value', function (snapshot) {
//         $('#wins').text(snapshot.val().wins);
//     });
// }

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

function trackGame() { // Main function monitoring connection on game change
    gameRef.on('value', function (snap) {

        const gameState = snap.val();

        if (!gameState.gameOver && gameState.CREATER.choice && gameState.JOINER.choice) { // Both players submitted RPS moves
            // Game is now over
            gameRef.update({
                gameOver: true,
            });
            const oppostitePlayerType = getOppositePlayerType(user.playerType)
            showOutcome(gameState[oppostitePlayerType].choice);
            const winner = determineWinner(gameState.CREATER.choice, gameState.JOINER.choice) // Get winner
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
        } else if (!gameState.gameOver && !gameState.isAvailable) { // Second player joined game. Game is currently in progress

            const oppositePlayerType = getOppositePlayerType(user.playerType)
            displayGame(gameState[oppositePlayerType].name);

            if (gameState[oppositePlayerType].choice && !gameState[user.playerType].choice) { // Opponent has chosen but player has not
                $('#wait-for-player-choice').show();
            } else if (!gameState[oppositePlayerType].choice && gameState[user.playerType].choice) {
                $('#wait-for-opponent-choice').show();
            }
        } else if (gameState.gameOver) {
            gameRef.off(); // Remove listener from game reference
        }
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code)
    });
}

$('#queue').click(function () {
    $('#queue').hide();
    $('#waiting').show();
    queueRef.orderByChild('isAvailable').equalTo(true).once('value', function (snapshot) {
        const availableGame = snapshot.val();
        if (!availableGame) { // No games in queue. Waiting for other player
            const newGame = queueRef.push( // Create a new game in lobby
                {
                    CREATER: { name: user.name, id: user.id, choice: '' },
                    isAvailable: true,
                    gameOver: false,
                }
            );
            gameRef = newGame;
            user.gameId = gameRef.key
            user.playerType = playerTypes.CREATER;

        } else { // Game found. 
            const gameKey = Object.entries(availableGame)[0][0]
            queueRef.child(gameKey + '/JOINER').update({
                name: user.name,
                id: user.id,
                choice: '',
            });
            queueRef.child(gameKey).update({
                isAvailable: false
            });
            gameRef = database.ref('/queue/' + gameKey);
            user.gameId = gameKey;
            user.playerType = playerTypes.JOINER;
        }
        trackGame();
    }, function (error) {
        console.log(error)
    })
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
    initElements();
});

$('#send-message').click(function () {
    const messageText = $('#message-input').val();
    $('#message-input').val('');
    const message =
    {
        user: user.name,
        message: messageText,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
    }
    if (!allChatsRef.child(gameRef.key)) {
        allChatsRef.child(gameRef.key).setValue(message);
        messagesRef = database.ref('/chats/' + gameRef.key);
        console.log(messagesRef)
        watchChat();
    } else {
        allChatsRef.child(gameRef.key).push(message);
    }
});

// function watchChat() { // Needs to be called first!!
//     messagesRef.on('child_added', function(snapshot) {
//         const message = snapshot.val()
//         console.log('message', message)
//         const messageElem = $('<div>')
//             .append('<p>From: ' + message.user + '</p>')
//             .append('<p>' + message.message + '</p>');
//         $('#messages').append(messageElem);
//     }) 
    
// }


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
}

function displayGame(opponentName) {
    $('#waiting').hide();
    $('#opponent').text(opponentName);
    $('#opponent-name').show();
    $('#rps-buttons').show();
}

function showOutcome(opponentChoice) {
    $('#wait-for-opponent-choice').hide();
    $('#wait-for-player-choice').hide();
    $('#resolve-game').show();
    $('#opponent-choice').text(opponentChoice)
}

initElements();








// dataRef.child("alanisawesome").set({
//     date_of_birth: "June 23, 1912",
//     full_name: "Alan Turing"
// });
// dataRef.child("gracehop").set({
//     date_of_birth: "December 9, 1906",
//     full_name: "Grace Hopper"
// });

// dataRef.push({
//     x: {
//         date_of_birth: "December 9, 1906",
//         full_name: "Grace Hopper"
//       }
//   });

// var hopperRef = dataRef.child("gracehop");
// hopperRef.update({
//   "nickname": "Amazing Grace"
// });
// dataRef.update({
//     "alanisawesome/nickname": "Alan The Machine",
//     "gracehop/nickname": "Amazing Grace"
//   });

// database.ref('/new').child('lambeosaurus').push({
//     "height" : 2.1,
//     "length" : 12.5,
//     "weight": 5000
//   });

// const newRef = database.ref('/new')

// newRef.once('value', function (snap) {
//     newRef.child('lambeosaurus').set({
//         "height": 2.1,
//         "length": 12.5,
//         "weight": 5000
//     });
//     newRef.child('stego').set({
//         "height": 4,
//         "length": 9,
//         "weight": 2500
//     });
// })

// newRef.orderByChild("length").on("child_added", function(snapshot) {
//     console.log(snapshot.key + " was " + snapshot.val().height + " meters tall");
//   });