// server/socket.js

const { Server } = require("socket.io");

// Helpers
function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

function flipCoin() {
  return Math.random() < 0.5 ? "heads" : "tails";
}

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", // adjust to your frontend URL in production
      methods: ["GET", "POST"],
    },
  });

  // In-memory storage for rooms/games
  const games = {};

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("joinGame", ({ room, username, gameType }) => {
      socket.join(room);
      console.log(`${username} (${socket.id}) joined room ${room} for game ${gameType}`);

      if (!games[room]) {
        games[room] = {
          gameType,
          players: {},
          history: [],
        };
      }

      games[room].players[socket.id] = {
        username,
        status: "waiting",
        lastMove: null,
        balance: 100,
      };

      io.to(room).emit("gameUpdate", games[room]);
    });

    socket.on("playerMove", ({ room, bet }) => {
      const game = games[room];
      if (!game) return;

      const player = game.players[socket.id];
      if (!player) return;

      player.lastMove = bet;
      player.status = "played";

      let result;
      if (game.gameType === "dice") {
        result = rollDice();
      } else if (game.gameType === "coinflip") {
        result = flipCoin();
      }

      let win = false;
      if (game.gameType === "dice" && Number(bet.number) === result) {
        win = true;
      }
      if (game.gameType === "coinflip" && bet.choice === result) {
        win = true;
      }

      const betAmount = Number(bet.amount) || 0;
      if (win) {
        player.balance += betAmount; // payout 1:1 for demo
      } else {
        player.balance -= betAmount;
      }

      game.history.push({
        player: player.username,
        bet,
        result,
        win,
        timestamp: new Date(),
      });

      player.status = "finished";

      io.to(room).emit("gameUpdate", game);
    });

    socket.on("leaveRoom", ({ room }) => {
      if (games[room] && games[room].players[socket.id]) {
        delete games[room].players[socket.id];
        socket.leave(room);
        io.to(room).emit("gameUpdate", games[room]);

        if (Object.keys(games[room].players).length === 0) {
          delete games[room];
          console.log(`Room ${room} deleted due to no players`);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);

      for (const room in games) {
        if (games[room].players[socket.id]) {
          delete games[room].players[socket.id];
          io.to(room).emit("gameUpdate", games[room]);

          if (Object.keys(games[room].players).length === 0) {
            delete games[room];
            console.log(`Room ${room} deleted due to no players`);
          }
        }
      }
    });
  });

  return io;
}

module.exports = initSocket;
