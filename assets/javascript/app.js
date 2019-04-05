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
const connectionsRef = database.ref('/connections');
const connectedUsersRef = database.ref('.info/connected');
let gameRef; // Ref for user's game

// const name = prompt("Enter your name");
// const connection = connectionsRef.push(name);

const user = {
    name: Math.floor(Math.random() * 100),
    id: '',
    gameId: '',
    currentlyPlaying: false,
    creater: false,
    joiner: false
}

const RPS_Moves = {
    ROCK: 'ROCK',
    PAPER: 'PAPER',
    SCISSORS: 'SCISSORS'
}

function initElements() {
    $('#waiting').hide();
}

initElements();


// Detect changes in user connections
connectedUsersRef.on('value', function (snapshot) {
    if (snapshot.val()) {
        const connection = connectionsRef.push(user.name);
        connection.onDisconnect().remove();
    }
}, function (errorObject) {
    console.log("The read failed: " + errorObject.code)
});

connectionsRef.once('child_added', function (connectionSnap) {
    user.id = connectionSnap.key;
});

function determineWinner(createrChoice, joinerChoice) {
    let outcome = 'joiner';

    if (createrChoice === joinerChoice) {
        outcome = 'tie';
    } else if (
        (createrChoice === RPS_Moves.ROCK && joinerChoice === RPS_Moves.SCISSORS) ||
        (createrChoice === RPS_Moves.SCISSORS && joinerChoice === RPS_Moves.PAPER) ||
        (createrChoice === RPS_Moves.PAPER && joinerChoice === RPS_Moves.ROCK)) {
        outcome = 'creater'
    }
    return outcome;
}


function trackGame() { // Set up tracking for game
    gameRef.on('value', function (snap) {
        const gameState = snap.val();
        if (!gameState.isAvailable) { // Game has begun
            user.currentlyPlaying = true;
            $('#waiting').hide();
            if (user.creater) {
                $('#opponent').text(gameState.joiner.name)
            } else if (user.joiner) {
                $('#opponent').text(gameState.creater.name)
            }
        }
        if (gameState.creater.choice && gameState.joiner.choice) { // Check for winner
            const winner = determineWinner(gameState.creater.choice, gameState.joiner.choice)
            if (winner === 'tie') {
                console.log("You and your opponent tied!");
            } else if (user.creater && (winner === 'creater')) {
                console.log("You win!")
                const createrWins = gameState.creater.wins;
                gameRef.child('/creater').update({
                    wins: createrWins + 1,
                });
            } else {
                console.log("You lose!")
                const joinerWins = gameState.joiner.wins;
                gameRef.child('/joiner').update({
                    wins: joinerWins + 1,
                });
            }
            gameRef.update({
                gameOver: true,
            });
        }
    })
}


$('#queue').click(function () {
    // queueRef.orderByKey().limitToFirst(1).once('value', function (snapshot) {
    queueRef.orderByChild('isAvailable').equalTo(true).once('value', function (snapshot) {
        const availableGame = snapshot.val();
        if (!availableGame) { // No games in queue. Waiting for other player
            const newGame = queueRef.push( // Create a new game in lobby
                {
                    creater: { name: user.name, id: user.id, choice: '', wins: '' },
                    isAvailable: true,
                    gameOver: false,
                }
            );
            gameRef = newGame;
            user.gameId = gameRef.key
            user.creater = true;

            $('#waiting').show();

        } else { // Game found. 
            // queueRef.child(Object.entries(availableGame)[0][0]).remove()// Remove from queues
            console.log(availableGame)
            const gameKey = Object.entries(availableGame)[0][0]
            queueRef.child(gameKey + '/joiner').update({
                name: user.name,
                id: user.id,
                choice: '',
                wins: ''
            });
            queueRef.child(gameKey).update({
                isAvailable: false
            });
            gameRef = database.ref('/queue/' + gameKey);
            user.gameId = gameKey;
            user.joiner = true;
        }
        trackGame();
    }, function (error) {
        console.log(error)
    })
});

$('#rock').click(function () {
    $('#your-choice').text('Rock');
    if (user.creater) {
        gameRef.child('/creater').update({
            choice: RPS_Moves.ROCK,
        });
    } else if (user.joiner) {
        gameRef.child('/joiner').update({
            choice: RPS_Moves.ROCK,
        });
    }
});

$('#paper').click(function () {
    $('#your-choice').text('Paper')
    if (user.creater) {
        gameRef.child('/creater').update({
            choice: RPS_Moves.PAPER,
        });
    } else if (user.joiner) {
        gameRef.child('/joiner').update({
            choice: RPS_Moves.PAPER,
        });
    }
})

$('#scissors').click(function () {
    $('#your-choice').text('Scissors')
    if (user.creater) {
        gameRef.child('/creater').update({
            choice: RPS_Moves.SCISSORS,
        });
    } else if (user.joiner) {
        gameRef.child('/joiner').update({
            choice: RPS_Moves.SCISSORS,
        });
    }
})








// connectionsRef.on('value', function (connectionSnap) {

//     const numUsers = connectionSnap.numChildren();
//     if (numUsers === 1) {
//         console.log('Need more players. Waiting...')
//     } else if (numUsers > 2) {
//         console.log('Too many players');
//     } else {
//         console.log('playing Game')
//         let currentGame;
//         gameRef.on('value', function (gameSnap) {
//             currentGame = gameSnap.val();
//         })
        // if (!currentGame.player1.name) {
        //     console.log('updated player1')
        //     gameRef.update({
        //         'player1/name': user.name,
        //     });
        // } else if (!currentGame.player2.name) {
        //     console.log('updated player2')
        //     gameRef.update({
        //         'player2/name': user.name,
        //     })
        // }
//         console.log(currentGame)
//     }
// });









// queueRef.orderByKey().limitToFirst(2).on('value', function (snapshot) {
//     const data = snapshot.val();
//     console.log(data)
//     if (!data) {
//         return;
//     } else if (Object.values(data).length == 1) {
//         return
//     } else { // Remove from queue and start game


//         const players = Object.values(data)
//         console.log(players)
//         let foundGame = false;
//         for (let i = 0; i < players.length; i++) {
//             console.log(players[i], user.id)
//             if (players[i] === user.id) {
//                 foundGame = true;
//             }
//         }
//         if (foundGame) {
//             const game = gamesRef.push({
//                 player1: {
//                     name: players[0],
//                     choice: '',
//                     wins: '',
//                 },
//                 player2: {
//                     name: players[1],
//                     choice: '',
//                     wins: ''
//                 }
//             });
//             user.gameId = game.key;
//         }
//     }
// })













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