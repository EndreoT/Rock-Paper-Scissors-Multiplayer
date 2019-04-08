// Problem solved - Posting of every message twice after RPS selection made - Issue was tracking of messages reference was
// reassigned inside tracking of gameRef .on event, so that any change in the game would reassign messagesRef and 
// trigger messagesRef.on listener. Yikes

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

const connectedUsersRef = database.ref('.info/connected');
const gamesRef = database.ref('/game');
const queueRef = database.ref('/queue');
const playersRef = database.ref('/players');
const connectionsRef = database.ref('/connections');
const allChatsRef = database.ref('/chats');

// References to DB nodes that will be assigned to
let gameRef; // Ref for user's game
let playerRef; // Ref to player
let opponentRefCon; // Ref to opponent connection only
let opponentRef; // Ref to opponent
let messagesRef; // For messages of the particular game chat

let opponentDC = false; // Monitor if opponent disconnects from game

// const name = prompt("Enter your name"); // Use modal instead
// const connection = connectionsRef.push(name);

// Enum for rock paper scissors allowed moves
const RPS_Moves = {
    ROCK: 'ROCK',
    PAPER: 'PAPER',
    SCISSORS: 'SCISSORS'
}

// Enum for types of players
const playerTypes = {
    CREATER: 'CREATER',
    JOINER: 'JOINER'
}

// Player info
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
    playersRef.child(user.id).set({
        name: user.name,
        id: user.id,
        wins: 0,
        losses: 0
    });
    playerRef = playersRef.child(user.id);

    // Establishes connection on player change
    playerRef.on('value', function (snapshot) {
        $('#wins').text(snapshot.val().wins);
        $('#losses').text(snapshot.val().losses);
    });
    playerRef.onDisconnect().remove();

}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});

// Watches changes in chat exchange between the two players
function trackChat() {
    messagesRef.on('child_added', function (snapshot) {
        const message = snapshot.val();

        const messageElem = $('<li class="list-group-item">')
            .append('<p><strong>' + message.user + ': </strong>' + message.message + '</p>');
        const allMessagesElem = $('#messages');
        allMessagesElem.append(messageElem);
        allMessagesElem.scrollTop($('#messages').prop("scrollHeight"));
    });
}

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

function showEndGame(createrChoice, joinerChoice, opponentChoice) {
    

    displayGameOutcome(opponentChoice);

    // Get string indicating if tie or win/loss
    const winner = determineWinner(createrChoice, joinerChoice)
    if (winner === 'tie') {
        $('#game-outcome').text("You and your opponent tied!");
    } else { // Determine who won
        playerRef.once('value', function (snapshot) {
            const playerInfo = snapshot.val();
            if (user.playerType === winner) {
                // Update wins
                const currentWins = parseInt(playerInfo.wins);
                playerRef.update({
                    wins: currentWins + 1
                });
                $('#game-outcome').text("You win!");
            } else {
                // Update losses
                const currentLosses = parseInt(playerInfo.losses);
                playerRef.update({
                    losses: currentLosses + 1
                });
                $('#game-outcome').text("You lose!");
            }
        });
    }
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
            const opponentChoice = gameState[oppostitePlayerType].choice

            // Rock...Paper...Scissors...!
            setTimeout(function() {
                $('#countdown').show();
                $('#countdown').text('ROCK!');
            }, 0)
            setTimeout(function() {
                $('#countdown').text('PAPER!');
            }, 1000)
            setTimeout(function() {
                $('#countdown').text('SCISSORS!');
            }, 2000)
            setTimeout(function () {
                $('#countdown').text('');
                showEndGame(gameState.CREATER.choice, gameState.JOINER.choice, opponentChoice)
            }, 3000)

            // Check if second player has joined game
        } else if (!gameState.gameOver && !gameState.isAvailable) {

            const oppositePlayerType = getOppositePlayerType(user.playerType);

            // Check if opponent has chosen RPS move but player has not
            if (gameState[oppositePlayerType].choice && !gameState[user.playerType].choice) {
                $('#wait-for-player-choice').show();
                // Check if player has chosen RPS move but opponent has not
            } else if (!gameState[oppositePlayerType].choice && gameState[user.playerType].choice) {
                $('#wait-for-opponent-choice').show();
            }
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
    user.gameId = gameRef.key;
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

// Monitors if opponent disconnects
function trackOpponentConnection() {
    opponentRefCon.on('value', () => {
        // Boolean check needed because .on fires at start of game
        if (opponentDC) {
            opponentRef.off();
            // If DC, allow player to find new game
            $('#rps-buttons').hide();
            $('#disconnect-message').show();
            $('#play-again').show();
        }
        opponentDC = true
    })
}

// Tracks changes in /players/<opponent id> node 
function trackOpponentChange() {
    opponentRef.on('value', function (snap) {
        // Updates opponent's wins after change in opponent node
        $('#opponent-wins').text(snap.val().wins);
        $('#opponent-losses').text(snap.val().losses);
    });
}

// Initializes references and listeners for only when second player joins game
function listenForSecondPlayerToJoinGame() {

    tempGameRef = gameRef.on('value', function (snap) {
        const gameState = snap.val();
        if (!(gameState.JOINER.name === '')) {
            // Only need to listen until other player joins game. Only removes tempGame Ref listener
            gameRef.off('value', tempGameRef);

            // Create first message greeting
            if (user.playerType === playerTypes.CREATER) {
                const message = {
                    user: 'ChatBot',
                    message: 'This is the beginning of the chat between you and your opponent.',
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                }
                allChatsRef.child(gameRef.key).push(message);
            }
            // Assign reference to only the chat for this specific game
            messagesRef = allChatsRef.child(gameRef.key);

            // Track messages for only this game
            trackChat();

            const opponentType = getOppositePlayerType(user.playerType);
            const opponent = gameState[opponentType]

            opponentRef = playersRef.child('/' + opponent.id);

            // Track changes in opponent's connection to Firebase
            opponentRefCon = connectionsRef.child('/' + opponent.id)
            trackOpponentConnection();

            // Set up tracking for on opponent value change
            trackOpponentChange();

            // Show game in client
            displayGame(opponent.name);
        }
    });
}

// Handle queue up for a game
$('#queue').click(function () {
    $('#queue').hide();
    $('#waiting').show();

    // Find all available games in queue if any exist
    queueRef.orderByChild('isAvailable').equalTo(true).once('value', function (snapshot) {
        const availableGame = snapshot.val();
        if (!availableGame) { // No games available in queue. Create game and wait for another player to join
            createGame(
                {
                    CREATER: { name: user.name, id: user.id, choice: '' },
                    JOINER: { name: '', id: '', choice: '' },
                    isAvailable: true,
                    gameOver: false,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                }
            );
        } else { // Available game exists. Join game
            const gameKey = Object.entries(availableGame)[0][0];
            joinGame(gameKey, {
                name: user.name,
                id: user.id,
                choice: '',
            });
        }

        // Track changes in game
        trackGame();

        // Wait for JOINER
        listenForSecondPlayerToJoinGame()

    }, function (error) {
        console.log(error)
    });
});

// Handle button click choosing either rock, paper, or scissors 
$('.rps-button').click(function () {
    const choice = $(this).attr('data-move').toUpperCase();
    $('#choice').show();
    $('#your-choice').text(choice);

    // Update player RPS move
    gameRef.child('/' + user.playerType).update({
        choice: RPS_Moves[choice],
    });
    $('#rps-buttons').hide();
});

$('#play-again').click(function () {

    // Remove listener references for the game just finished
    gameRef.off();
    messagesRef.off();
    opponentRefCon.off();
    opponentRef.off();
    opponentDC = false;

    user.gameId = '';
    user.playerType = '';

    // reset display
    $('#messages').empty();
    initElements();
});

$('#send-message').click(function (event) {
    const messageText = $('#message-input').val().trim();
    if (!messageText.length) { // Handle empty message
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
    // Add message 
    messagesRef.push(message);
});

function initElements() {
    $('#queue').show();
    $('#waiting').hide();
    $('#wait-for-opponent-choice').hide();
    $('#wait-for-player-choice').hide();
    $('#game-info').hide();
    $('#opponent').text('');
    $('#opponent-wins').text('');
    $("#resolve-game").hide();
    $("#play-again").hide();
    $('#player-name').text(user.name);
    $('#rps-buttons').hide();
    $('#choice').hide();
    $('#your-choice').text('');
    $('#messages-col').hide();
    $('#message-empty').hide();
    $('#disconnect-message').hide();
    $('#countdown').text('');
}

function displayGame(opponentName) {
    $('#waiting').hide();
    $('#game-info').show();
    $('#opponent').text(opponentName);

    $('#rps-buttons').show();
    $('#messages-col').show();
}

function displayGameOutcome(opponentChoice) {
    $('#wait-for-opponent-choice').hide();
    $('#wait-for-player-choice').hide();
    $('#resolve-game').show();
    $("#play-again").show();
    $('#opponent-choice').text(opponentChoice);
}

initElements();
