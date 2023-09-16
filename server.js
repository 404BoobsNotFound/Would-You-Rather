const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.static('public'));

let lobbies = {};

io.on('connection', (socket) => {
    console.log('a user connected');

socket.on('startGame', (lobbyCode) => {
    console.log(`Start game received for lobby ${lobbyCode}`);
    io.to(lobbyCode).emit('startCountdown');
    setTimeout(() => {
        io.to(lobbyCode).emit('redirectToGame');
    }, 4000); // 3 seconds for countdown + 1 second for transition
});


    socket.on('createLobby', (playerName) => {
        const lobbyCode = generateLobbyCode();
        const newLobby = {
            host: playerName,
            players: [playerName],
            readyPlayers: [],
            votes: {}
        };
        lobbies[lobbyCode] = newLobby;
        socket.join(lobbyCode);
        socket.emit('lobbyCreated', lobbyCode);
        io.to(lobbyCode).emit('playerJoined', { players: newLobby.players, lobbyCode: lobbyCode });
    });

    socket.on('joinLobby', (lobbyCode, playerName) => {
        const lobby = lobbies[lobbyCode];
        if (lobby) {
            lobby.players.push(playerName);
            socket.join(lobbyCode);
            io.to(lobbyCode).emit('playerJoined', { players: lobby.players, lobbyCode: lobbyCode });
        } else {
            socket.emit('lobbyError', 'Lobby not found.');
        }
    });

socket.on('toggleReady', (lobbyCode, playerName) => {
    const lobby = lobbies[lobbyCode];
    if (lobby) {
        if (lobby.readyPlayers.includes(playerName)) {
            const index = lobby.readyPlayers.indexOf(playerName);
            lobby.readyPlayers.splice(index, 1);
        } else {
            lobby.readyPlayers.push(playerName);
        }
        io.to(lobbyCode).emit('updateReadyPlayers', lobby.readyPlayers);
    }
});


socket.on('vote', ({ playerName, lobbyCode, option }) => {
    console.log(`Vote received from ${playerName} for ${option} in lobby ${lobbyCode}`);
        const lobby = lobbies[lobbyCode];
        if (lobby) {
            lobby.votes[playerName] = option;
if (Object.keys(lobby.votes).length === lobby.players.length) {
    console.log("All players have voted. Ending the game...");
                const leftVotes = Object.values(lobby.votes).filter(vote => vote === 'left').length;
                const rightVotes = Object.values(lobby.votes).filter(vote => vote === 'right').length;
                io.to(lobbyCode).emit('gameEnded', {
                    leftVotes: leftVotes,
                    rightVotes: rightVotes,
                    totalVotes: lobby.players.length,
                    votes: lobby.votes
                });
            }
        }
    });

    socket.on('playAgain', (lobbyCode) => {
        const lobby = lobbies[lobbyCode];
        if (lobby) {
            lobby.votes = {};
            io.to(lobbyCode).emit('returnToLobby');
        }
    });
});

function generateLobbyCode() {
    return Math.random().toString(36).substr(2, 5).toUpperCase();
}

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
