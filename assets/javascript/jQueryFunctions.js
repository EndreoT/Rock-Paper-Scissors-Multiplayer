// Only functions using jQuery to update DOM

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

function initElements() {
    $('#waiting').hide();
    $('#wait-for-opponent-choice').hide();
    $('#wait-for-player-choice').hide();
    $('#opponent-info').hide();
    $('#opponent').text('');
    $('#opponent-wins').text('');
    $("#play-again").hide();
    $('#rps-buttons').hide();
    $('#choice').hide();

    $('#your-choice').attr('src', '');
    $('#opponent-choice').attr('src', '');

    $('#messages-row').hide();
    $('#message-empty').hide();
    $('#disconnect-message').hide();
    $('#countdown').text('');
    $('#game-outcome').text('');
}

function displayGame(opponentName) {
    $('#waiting').hide();
    $('#opponent-info').show();
    $('#opponent').text(opponentName);

    $('#rps-buttons').show();
    $('#messages-row').show();
}

function hideWaitingForPlayerMessage() {
    $('#wait-for-opponent-choice').hide();
    $('#wait-for-player-choice').hide();
}

function displayGameOutcome(opponentChoice) {
    $('#game-outcome').show();
    $("#play-again").show();
    $('#opponent-choice').attr('src', opponentChoice);
}
