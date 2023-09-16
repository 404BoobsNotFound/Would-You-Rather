const socket = io();

const urlParams = new URLSearchParams(window.location.search);
let playerName = urlParams.get('playerName');
let lobbyCode = urlParams.get('lobbyCode');

function vote(option) {
    console.log(`Emitting vote for option: ${option}`);
    socket.emit('vote', { playerName, lobbyCode, option });
    document.getElementById('leftChoiceButton').disabled = true;
    document.getElementById('rightChoiceButton').disabled = true;
}

function playAgain() {
    socket.emit('playAgain', lobbyCode);
}

socket.on('updateVotes', (data) => {
    console.log('Received updateVotes event:', data);
    document.getElementById('leftChoiceButton').textContent = `Fly like a bird (${data.leftVotes} votes)`;
    document.getElementById('rightChoiceButton').textContent = `Swim like a fish (${data.rightVotes} votes)`;
});

socket.on('returnToLobby', () => {
    window.location.href = `/index.html?playerName=${playerName}`;
});

socket.on('playerJoined', (data) => {
    document.getElementById('gameLobbyCode').textContent = `Lobby Code: ${data.lobbyCode}`;
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = 'Players:<br>';
    data.players.forEach(player => {
        playerList.innerHTML += `${player}<br>`;
    });
});

document.getElementById('leftChoiceButton').addEventListener('click', function() {
    vote('left');
});

document.getElementById('rightChoiceButton').addEventListener('click', function() {
    vote('right');
});

socket.on('gameEnded', (results) => {
    console.log("Received gameEnded event:", results);
    const leftPercentage = (results.leftVotes / results.totalVotes) * 100;
    const rightPercentage = (results.rightVotes / results.totalVotes) * 100;

    let resultString = `Game ended!\nResults:\nFly like a bird - ${results.leftVotes} votes (${leftPercentage.toFixed(2)}%)\nSwim like a fish - ${results.rightVotes} votes (${rightPercentage.toFixed(2)}%)`;
    
    for (let player in results.votes) {
        resultString += `\n${player} voted to ${results.votes[player] === 'left' ? 'Fly like a bird' : 'Swim like a fish'}`;
    }

    document.getElementById('resultText').textContent = resultString;
    document.getElementById('resultModal').style.display = 'block';

    if (playerName === results.host) {
        document.getElementById('playAgainModalBtn').style.display = 'block';
    }
});

document.getElementById('playAgainModalBtn').addEventListener('click', function() {
    playAgain();
    document.getElementById('resultModal').style.display = 'none';
});

document.getElementById('closeModalBtn').addEventListener('click', function() {
    document.getElementById('resultModal').style.display = 'none';
});

socket.on('connect_error', (error) => {
    console.error("Connection error:", error);
});

socket.on('disconnect', (reason) => {
    console.warn("Disconnected due to:", reason);
});
