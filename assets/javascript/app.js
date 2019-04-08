// Lessons learned:
// - Posting of every message twice after RPS selection made - Issue was tracking of messages reference was
// reassigned inside tracking of gameRef .on event, so that any change in the game would reassign messagesRef and 
// trigger messagesRef.on listener. Yikes
// - Changing a node inside an event listener listening on that same node will produce an infinite loop

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

const RPS_ImagesURL = {
    rock: "http://images.clipartpanda.com/rock-clipart-clipart-harvestable-resources-rock.png",
    paper: "data:image/jpeg;base64,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",
    scissors: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARMAAAC3CAMAAAAGjUrGAAABAlBMVEX/////AACZmZmAgIDOAACUlJSRkZGzs7OWlpb/hYVkZGSamprRAAD/g4N+fn6Ojo7Dw8N2dnb2AADWAADnAADeAACwsLDzAAC9vb3tAADj4+PiAABtbW35+fngAADJycnX19dcXFzv7++mpqbd3d3Q0ND99PT33Nz/e3vutrb/bW3219f66Oj/Vlb88PDXMzP/c3PrqangcnLnlpb/MjL/T0/yxsb/PT3/YmL/Kyv/R0fYPT3bUVH/ICDkh4fVKSndYWHUGBj/GBjhenrwvr7poKDaSkrkiIjVLCzfa2vBg4PZRETtrq7dk5OuOjp1gYGkfHy/MzOseHioVFSwS0u2cXHAhmSXAAAQ7klEQVR4nOVdCVfquhYWTKHYCkKhTCJImUFRUUBFGZyO7/jum///X3lJOiWllIax9Hxr3XXPOlJP+rG/vXeyk+yjIwfUm3+/m3SnYDp9nrze9q+dPvsnoPMxAkBKJbPpdCKdTmfzKRGIk9vOvse1N3R6YyAl04FAYPY4eHp6GjxdXT0MXtJJCUx79X2Pbh/oj0AqC/l4vGqdRnScwj82ho+BbAo8N/c9wl3jfQzyCUjIUOPjtHED0cC0nEYaT4FAUhR/9j3KXaLdFZPQRAY3iI7G8OkxoONlcHUT0VjJiqC/75HuCoU7gBlBVnHz8BKwYvbQiEBW7qGtgFFt36PdCfqiBFUza0GZXM0TomKAWGnNAoHUH2EqXwB51qcIlsdiDJBfeYACAl/7HvHW8SlCIwm0IqcWRhIJlKDANCWh/80QmsrNSyAhTvY95u2iNpaQw2hErkg+0nkJACCKIv4PiDhGa6YCPyj93vewt4naNIUyEvT1m8hK4l2zXjA+1On3pjgsBV4aGimfexzzllHAlNxHSNkkxbFNGtL/jUNTAJECPy1Ndj7WXaGLKWkQRpIWp+/2n+2PxbRGCsxeRL862jvkS16GhJFcgNvFH+8hU0lAn3IK/+fTkPwOYEhJDAhKpK7jBLguQrt6gVltC4VkPyZvBTFrib5Lg2ytCy1rEMEuJTXaxSB3DKwcEuLb8ocQKUOoHpjRAv/NkzsgQVMifbt57FcK+1mkHnHbQ9w57lI0JSl3iVgNZir3UD1wQij1tjzEXePaYiZZ4HLdtQ0fhOppwLjt9pFDwYfFmwDX60U9MTCDhjLwn5vt0kEn+ez+0WkycIUNJQDa2xvg7mGVDksK1geBwCn2KHlfGUpfXNlMjo6esaG0UDbrJ4/Su6DjMFOu8a56FGhpkp9Wrb+TVAYLCssfIQBngzD0wGQ27yqnORD8plxscsL29F0e5SgtNI3eyuj2g2mako7DbNgOTQkns8jAtjO8vYAOO4Cx8NmBkecKRx7go0oyxQn7tw0ff4ycPsB5o48yFEo72V+sj4M0Es8QcuKjpaUxyUmSOfVCLnoYgU5W8hEnXYqTCevjiJNB5AZysmD19hAxIWNxkjnLwKEc24mPOLkjc7Yss3awO7oZsibA3gaV22e7rI/jsDW88hcnTXL5hDkWo/wkEHga+IuTNlgnZ3vHs+pZwF+c0Ekba27/aijPV5xQk0DWBGWaXZVNT6NHLtsn2Ip6hPBSH9sa4B5QpxwKW1niLeVPTgj7DzDWr2qEL7rwVY2HLmZIDN/3K/Hkha/2XNQAOeVJu/coVFE176LGfEB4pQzFff3qN5kCJ++2OcSdgzaUgNNuHBI9qgrCPqX2NnqUoaTdFfX69KpllqkwdACYUgWNpJsMvw7ommp6vP1h7hRt+jtPiktJqQOKRp8VMzB6lgrpsqrxu5WSQy1mlCvFjKIEeV5QMtUy/bMRveMiC16dftOXRTjYNR/Y+a9CrppRQiGO5/kgAs9zISVHfWRM71ZKiOOFnrY9FhNzlBxSxRgahxwMcRzkgzPAI4QUsjasbi6n9PNtW8aqT0B+nhH4+UPYZq4ZBwanyJliqVLJQVRK1WrxLBMWeI4U0BwpiRSYWN1K5+cZXNgxgsTj7VVqaBxhQWcjU83RmwUK2LEIUEMc+YNC17onNJEH4vdHv35dq11ft/sfd1MgWX2rCdcb4XaOculM4VU6hHCxQrnSQrlUDKOfcrpfKVLPTuiEFiGNzhVjiGIqOe9ZSVxM2TZq7ABQK7pxBOWzEsUGtgzOJEMDr9C/4tbeVQQSNj7VBinm0uoWAY1D1ozDIpVCDv5ImCMDExLiMznLL+p0xTlTYYDkiQS/kIOeI2YnlTJysbwtG5APGIuLZbtf+AFS7ozCnpTufuVjeg6LVJCHhULhbNnAhHByaeHYa3frsJKa7snREmGFkgr0KIuE4qgYCzrfILWygi52vhEFugeYc8QgQgopFexDQ4tNY5liLLh+BeLioOuMJNjdarVqHIgNUirIh4YFztE0DEIcFDOH5ifMRVbSUFp83v7UR01IkXGQCZijD51XTHCZYuZw/TMCIJVMsxOTB29bPPuFZyuqVAg2lvjQVRVjg/bHRASilM+yMZOV/rfiP+gI0ziCsu44HJINB0LCDIqxQ619+/YJ0KU5+WTWFTUJ6T//iPPVTYZllIFxiA1e0R1HuVJ14UPnFSMwK2YRavX3j9fJFFkN5MbRbBLSf/9xfByNx4XqBv5h048aUkFTFFc+dIOKccJ1+/3jbTQGDtxIf0FKEDAtq1uLKRU9HcV/E2QSCknIuopZBpUbaDfAyo30L40SjZbQGftXg/woj6WixVhGHzpHyAYVsxwaN8huLhA1CYoSTEs0HnM/IMM4oFRK6Kkysw+dN5CtKGY5Ov2frxFaUvjLQolGS1QuLfkNZj4qhJHjwOysbho6Idy2FbMMtfp1SY7G51lRnUtxwejwvF5NR6HjKOhC4ddhA606h4Sz3SnGGdXjqB0riJZYhrZiHFUQGxyKsWX2ZGOxgexLMYug2JoKQvw8rpSO9FxLZSNTreRwVs6tJxSTkNDeFWODjB0p0fj5CcR5PKbwaM2HgzG2WsXroRsiI+gxxdCQraRgPs6PY7wgoLKbnDkrFqGl4LLKZtgIqoqxlvM8hBDpU6KIkGgsCPkQlHA4nMmgeuQm2Qh6VTEkynGKkWhMEBQIWVE2TkbQ04ohoeiGEj85OYYWAgHdBiRG2Jjv0AnxtmII6IZyfhIVBHXo4VIOoypzmyPE84ohwUdVSkKYkSAn5ypnYRkiXMzllI3E3MNQDIFSHAsnqFFSzGXkcOYMIhOWz8qZdU3lcBRDAtpJ9ITXKKlWZBkzglmRw7m1SEGKqRyMYgjI0ePzY5USPpPTjEQjJRwuyyvKBxrIgSmGQCV+fK5SEhTKKCuBXGRQcoI5yeRWMZTDVAyB43hMM5Ozqhy2QK6EWQ3lYBVDIHyimQmXy1B8KPxxNHRWYjGUg1YMgVxcl07ONBNFiEURYuGyezs5dMUQ0F9aqaicyELsGBNyHFLCck5wxQfKgCv7fpONoRDS7F6GnMgKp/EREzBDrjiBKXAIzam5RWt0h4aq7jCUnKwKBk4FFcPJLtMOmiHFjvGay8nJ5eUqBQDvQdHfji/LcWggvEI6WudgDAnhYnGNkJPzeDR+cnkSlw9dROWQ/oJctagolmgsV4sL7URXjM6HseZweXm+Thlt/zDfmVdyc/lJuGzvTijFGHyYq3WXl5fHmYNVkWK+KFeqotw+g9MUmMjCaWDJzkxIxVj5IBYxLy8PVEWmdBByZzI535GrlTlvQihmAR/Ewt3l5Ql/eLEoQ9mBkKuS8+JSjrfwARUTdcGHTkscx6JDUxFtB3ywlDvT10+KuSpPE6IpxhUfBi3YXM6Vw1FR1aoNTq7kStVisVoplxSOIAQphpEPHSotB5PRzXtQnhPCqKoTDnIGH5piVuGDoAXyEt3hZopVcWabfPBEIUNXzBp8aNCcyzmuunoXuZAdJaQLCcIk5Hx9PgxasIouQ95VUdkpbee5UAya/PnCQvuK0FUU9qSKHKwEr5WVqxmZi8bjaBK0DVo8p6JCIbOAEks9Bu1EEo43zQx2LpCXmGe2n3SaIwD+aTeTWbS6jI7b8FFEzMaYiXpFRbX2z+uniHbpJ6V/W0lZuq+sUCnKoU2ajEbLyX5UdN1u9r6ftT3o2t5yylLc78QsV86U2MaYUadOUEW7W4zqtJto+zDeWp3MUid+kiInmIphFTb0wMKGxKQ7l/iWVQS56N19iupW6gWnEy6maC/BOgUq6GbkUHQDJqM7lxOhtFEaMK4xF8CRCwOpfwlsB4bsUS5llA1Epi2oqP6uOQykEXenVvLi3za2KwSdEl47Mum0xOW1VdT+uOtqzZ1dcaEiLf7a+LHAwtr+11TR6gdG+l+/AYAyYT7pldremcA1/W90HRXVfkaobeQqJwKzYLLltmfY/65sMiuqqD+hT0jOWIxE3NEFF2v436hGi3sV/UzFvEnI/VWrgdpdt4YPg+XcJMTPnfbGQybDrUKMqSIXS7r9qdkbD/W2Rj2/NaDW1wMnRqBu9nLv44omo9Ny7qyi2si4PuqpdYp7oJtt4lVeWovbGy+9nGqbWMlk4stV1ATabTkvQ0RC5LR19XT/MpvNXh4HD8MbTBKkZWjfBju//BKzrQNd48AWslXnslBFE+1CrZcWbgd/9Wh960fcKB7+rGXDSl70TCMRI8tzScvCWNSZarcHXSFGWveq08zmL1KSlErph4tnT5iWyNBKSdZr15GxzbINWshf0dZvybmJ6HaQTQHx+a338XP70fuG+azW5/rlCtlK456ixKsdahlMBtNC3h3U153rDXxfFF0SKTDuUV99+2sKtCj9AF0L6hRvQvLybalaYFqe/kZPCPG09bv5YLRpqYzc2WihbVzP9qC2/zbNxPM9e92kv/Gw+fmObiWtCH7TPHhbcONN/VNn7ypCWEp+spP3Wh/QZIRFJhONkzeRTfMGJU/oyoGxg780AvasFTEi0wHdbXhkP8mORuMKGYwnkkHJAF2r63y7dM243m7Q0DnxWtBxg3I1jGspKkJ0etIEhhqeUFBdev3yRL9cdTbT3cn2hr5llHOVSiVnTddqmocYRFDWkXZzc+M3feOs/+7U1do6z05Pb9A37sozTCw3zjK37vE26trVyy3c3lx0eXv/M3WPKHt7NG9jcqEr58l162+1+TfBiZ8ajpr9DBpIOQx9vKmbvfNezmLZ8aWK4CmCkg2Wxip3ZL8MxwusDw7ashpuB8nYV8Wsb6R81VdFayx0H4m8sPbfefVr/x3txVpo5sfQVQWh7tM+TUfaLboR3Oud0VOO/dnPS/uuBxE0c2EtzbyZfd8Oagq4BLdq8BjiaT9rZ2az46KveuFpTeIbkdkKEzmz8Zuv7ERt6jxD/XbZJ3LXJic+8icFNRm9x9Jhn9waqWzKR5xoLvYBL5ilp6yPG1e/+ykW99V1kOFpYCVOxn7kRIscrVZgJe380hMUP/mTWzWLvcFVCfYFRGPG46dY/KFy0hionLDWaAwfK3qzCLgStN7fDXWp2V0bPBNmLD7EZftF0O1kNQX09ZXqBPDsUSJ2/GizYvXVWDupGs2Ps8wRy8N4V+OOVuPMMnbQedbDjq9asLZV69e3TbBNAs3OtLva67gTXFNtrhnX2YxGpb5yJ0R2roqHKWszns37q5IxoZvKiAz5qNnPljWGexy3lhqn6DptuzaS2KTPCqMd2qEEpInbJ0fGqr1Hd7Ktjq6l6x97n+u8J9q9bRIW8QTS7r71dyMOJ3zmTY7QSpvltFLWzf6TvtmuV/JTvqbhy9pnNAuWTnuaJiVs4ftAUJjrHblsP9vRq2lbXt0qvCY+LPuw0L7HrkOSX+8STZ0lf20oMPBrvvVqHiyaItfeyE6tKd/FHA0dm/7mCUns2Uxirl+BRG7F8ddEh0QT2ByGzErgjvYVteaIbruZZC2mHhJe51wKtpW8CEZfzXa9U2/3b9/G1taSST+tOM7Dut/VoCV5IYm4zbU0d9A4729KECmsZ4lT3jnWtS28zXdDd0JC/O35wynr4xYw9Oe92M+h2Z2jToVZJ+TByPe60UGlYwuRBM++mwk7oN0V59M3CokL8OnLGY4DmlOntt8wj5v4PADb4r27oEd8+gJMP1xvx/cZ6q+imKdpSaCjxq9/khuZR/8NXT+XTScS6WwyLwHw2fuzCVHRuX0bjadg/Pv76+dP4uP/4wno+MpSARkAAAAASUVORK5CYII="
}

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
        updateWinLossDisplay(snapshot.val().wins, snapshot.val().losses)
    });
    playerRef.onDisconnect().remove();

}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});

function createOrJoinGame() {
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
        opponentDC = true;
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

// Watches changes in chat exchange between the two players. Chat node is /chats/<game id>
function trackChat() {
    messagesRef.on('child_added', function (snapshot) {
        createMessage(snapshot.val());
    });
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

            hideWaitingForPlayerMessage();

            // Rock...Paper...Scissors...!
            setTimeout(function () {
                $('#countdown').show();
                $('#countdown').text('ROCK!');
            }, 0)
            setTimeout(function () {
                $('#countdown').text('PAPER!');
            }, 1000)
            setTimeout(function () {
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

function updatePlayerMove(choice) {
    // Update player RPS move
    gameRef.child('/' + user.playerType).update({
        choice: RPS_Moves[choice],
    });
}

function showEndGame(createrChoice, joinerChoice, opponentChoice) {

    displayGameOutcome(RPS_ImagesURL[opponentChoice.toLowerCase()]);

    // Get string indicating if tie or win/loss
    const winner = determineWinner(createrChoice, joinerChoice)
    let outcomeText;
    if (winner === 'tie') {
        outcomeText = "You and your opponent tied!"
    } else { // Determine who won
        playerRef.once('value', function (snapshot) { // Get player information to update wins/losses
            const playerInfo = snapshot.val();
            if (user.playerType === winner) {
                // Update wins
                const currentWins = parseInt(playerInfo.wins);
                playerRef.update({
                    wins: currentWins + 1
                });
                outcomeText = "You win!";
            } else {
                // Update losses
                const currentLosses = parseInt(playerInfo.losses);
                playerRef.update({
                    losses: currentLosses + 1
                });
                outcomeText = "You lose!";
            }
            $('#game-outcome').text(outcomeText)
        });
    }
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

// Handle queue up for a game
$('#queue').click(function () {
    $('#queue').hide();
    $('#waiting').show();

    createOrJoinGame()
});

// Handle button click choosing either rock, paper, or scissors 
$('.rps-button').click(function () {
    const choice = $(this).attr('data-move');

    
    showChoice('#your-choice', choice);

    // $('#choice').show();
    // $('#your-choice').text(choice);

    $('#rps-buttons').hide();

    updatePlayerMove(choice.toUpperCase())
});

function showChoice(ElementId, imageSrc) {
    $(ElementId).attr('src', RPS_ImagesURL[imageSrc])
}

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
    event.preventDefault();

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

initElements(user.name);