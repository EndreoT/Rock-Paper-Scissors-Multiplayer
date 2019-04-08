function createMessage(message) {
    const messageElem = $('<li class="list-group-item">')
        .append('<p><strong>' + message.user + ': </strong>' + message.message + '</p>');
    const allMessagesElem = $('#messages');
    allMessagesElem.append(messageElem);
    allMessagesElem.scrollTop($('#messages').prop("scrollHeight"));
}

function updateWinLossDisplay(wins, losses) {
    $('#wins').text(wins);
    $('#losses').text(losses);
}

function initElements(userName) {
    $('#queue').show();
    $('#waiting').hide();
    $('#wait-for-opponent-choice').hide();
    $('#wait-for-player-choice').hide();
    // $('#opponent-choice').hide();
    // $('#opponent-choice-val').text('');
    $('#opponent-info').hide();
    $('#opponent').text('');
    $('#opponent-wins').text('');
    $("#resolve-game").hide();
    $("#play-again").hide();
    $('#player-name').text(userName);
    $('#rps-buttons').hide();
    $('#choice').hide();
    // $('#your-choice').text('');

    $('#your-choice').attr('src', '');
    $('#opponent-choice').attr('src', '');

    $('#messages-col').hide();
    $('#message-empty').hide();
    $('#disconnect-message').hide();
    $('#countdown').text('');
}

function displayGame(opponentName) {
    $('#waiting').hide();
    $('#opponent-info').show();
    $('#opponent').text(opponentName);

    $('#rps-buttons').show();
    $('#messages-col').show();
}

function hideWaitingForPlayerMessage() {
    $('#wait-for-opponent-choice').hide();
    $('#wait-for-player-choice').hide();
}

function displayGameOutcome(opponentChoice) {
    // $('#opponent-choice').show();
    $('#resolve-game').show();
    $("#play-again").show();
    // $('#opponent-choice-val').text(opponentChoice);

    $('#opponent-choice').attr('src', opponentChoice);
}

