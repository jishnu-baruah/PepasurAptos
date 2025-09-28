const crypto = require('crypto');

class SocketManager {
  constructor(io, gameManager) {
    this.io = io;
    this.gameManager = gameManager;
    this.playerSockets = new Map(); // address -> socket
    this.socketGames = new Map(); // socketId -> gameId
  }

  handleJoinGame(socket, data) {
    const { gameId, playerAddress } = data;
    
    if (!gameId || !playerAddress) {
      socket.emit('error', { message: 'Missing gameId or playerAddress' });
      return;
    }

    const game = this.gameManager.getGame(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Check if player is in the game
    if (!game.players.includes(playerAddress)) {
      socket.emit('error', { message: 'Player not in game' });
      return;
    }

    // Join game room
    socket.join(`game-${gameId}`);
    this.playerSockets.set(playerAddress, socket);
    this.socketGames.set(socket.id, gameId);

    // Send current game state
    socket.emit('game_state', {
      gameId,
      game: this.gameManager.getPublicGameState(gameId)
    });

    // Notify other players
    socket.to(`game-${gameId}`).emit('game_update', {
      type: 'player_joined',
      playerAddress,
      timestamp: Date.now()
    });

    console.log(`Player ${playerAddress} joined game ${gameId}`);
  }

  handleDisconnect(socket) {
    const gameId = this.socketGames.get(socket.id);
    if (gameId) {
      // Find player address
      let playerAddress = null;
      for (const [address, sock] of this.playerSockets.entries()) {
        if (sock.id === socket.id) {
          playerAddress = address;
          break;
        }
      }

      if (playerAddress) {
        this.playerSockets.delete(playerAddress);
        socket.to(`game-${gameId}`).emit('game_update', {
          type: 'player_disconnected',
          playerAddress,
          timestamp: Date.now()
        });
      }
    }
    this.socketGames.delete(socket.id);
  }

  handleSubmitAction(socket, data) {
    const { gameId, action, commit } = data;
    const game = this.gameManager.getGame(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Validate action based on game phase
    if (game.phase === 'night') {
      this.gameManager.submitNightAction(gameId, data);
    } else if (game.phase === 'voting') {
      this.gameManager.submitVote(gameId, data);
    }

    // Broadcast action submission
    this.io.to(`game-${gameId}`).emit('game_update', {
      type: 'action_submitted',
      playerAddress: data.playerAddress,
      phase: game.phase,
      timestamp: Date.now()
    });
  }

  handleSubmitTask(socket, data) {
    const { gameId, answer } = data;
    const game = this.gameManager.getGame(gameId);
    
    if (!game || game.phase !== 'task') {
      socket.emit('error', { message: 'Invalid game phase for task submission' });
      return;
    }

    const result = this.gameManager.submitTaskAnswer(gameId, data);
    
    this.io.to(`game-${gameId}`).emit('task_update', {
      playerAddress: data.playerAddress,
      answer: result.correct ? 'correct' : 'incorrect',
      timestamp: Date.now()
    });

    if (result.gameComplete) {
      this.io.to(`game-${gameId}`).emit('task_result', {
        completed: true,
        winners: result.winners,
        timestamp: Date.now()
      });
    }
  }

  handleSubmitVote(socket, data) {
    const { gameId, vote } = data;
    const game = this.gameManager.getGame(gameId);
    
    if (!game || game.phase !== 'voting') {
      socket.emit('error', { message: 'Invalid game phase for voting' });
      return;
    }

    this.gameManager.submitVote(gameId, data);
    
    this.io.to(`game-${gameId}`).emit('game_update', {
      type: 'vote_submitted',
      playerAddress: data.playerAddress,
      timestamp: Date.now()
    });
  }

  handleChatMessage(socket, data) {
    const { gameId, message } = data;
    const game = this.gameManager.getGame(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    this.io.to(`game-${gameId}`).emit('chat_message', {
      gameId,
      playerAddress: data.playerAddress,
      message,
      timestamp: Date.now()
    });
  }

  // Broadcast game state updates
  broadcastGameUpdate(gameId, update) {
    this.io.to(`game-${gameId}`).emit('game_update', {
      ...update,
      timestamp: Date.now()
    });
  }

  // Send message to specific player
  sendToPlayer(playerAddress, event, data) {
    const socket = this.playerSockets.get(playerAddress);
    if (socket) {
      socket.emit(event, data);
    }
  }

  // Emit game state update to all players in a game
  emitGameStateUpdate(gameId) {
    try {
      const game = this.gameManager.getGame(gameId);
      if (!game) {
        console.log(`⚠️ Game not found for emitGameStateUpdate: ${gameId}`);
        return;
      }
      
      if (!this.io) {
        console.log(`⚠️ Socket.IO instance not available for emitGameStateUpdate: ${gameId}`);
        return;
      }
      
      console.log(`📡 Emitting game state update for game ${gameId}, phase: ${game.phase}`);
      
      // Emit to all players in the game
      this.io.to(`game-${gameId}`).emit('game_state', {
        gameId: gameId,
        game: game
      });
      
      // Also emit a general game update
      this.io.to(`game-${gameId}`).emit('game_update', {
        gameId: gameId,
        phase: game.phase,
        timeLeft: game.timeLeft
      });
      
      console.log(`✅ Successfully emitted game state update for game ${gameId}`);
    } catch (error) {
      console.error(`❌ Error emitting game state update for game ${gameId}:`, error);
    }
  }
}

module.exports = SocketManager;
