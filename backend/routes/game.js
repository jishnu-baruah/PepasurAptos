const express = require('express');

module.exports = (gameManager, flowService) => {
  const router = express.Router();

  // Create a new game
  router.post('/create', async (req, res) => {
    try {
      const { creatorAddress, stakeAmount, minPlayers } = req.body;
      
      if (!creatorAddress) {
        return res.status(400).json({ error: 'Creator address is required' });
      }

      const { gameId, roomCode } = gameManager.createGame(creatorAddress, stakeAmount, minPlayers);
      
      res.json({
        success: true,
        gameId,
        roomCode,
        message: 'Game created successfully'
      });
    } catch (error) {
      console.error('Error creating game:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get game state
  router.get('/:gameId', (req, res) => {
    try {
      const { gameId } = req.params;
      const { playerAddress } = req.query; // Get player address from query params
      
      let game;
      if (playerAddress) {
        // Include player's role if address provided
        game = gameManager.getGameStateWithPlayerRole(gameId, playerAddress);
      } else {
        // Public game state without roles
        game = gameManager.getPublicGameState(gameId);
      }
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      res.json({
        success: true,
        game
      });
    } catch (error) {
      console.error('Error getting game:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update game state (admin/server only)
  router.patch('/:gameId', (req, res) => {
    try {
      const { gameId } = req.params;
      const updates = req.body;
      
      const game = gameManager.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      // Apply updates
      Object.assign(game, updates);
      
      res.json({
        success: true,
        message: 'Game updated successfully'
      });
    } catch (error) {
      console.error('Error updating game:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Join game by room code
  router.post('/join-by-code', async (req, res) => {
    try {
      const { roomCode, playerAddress } = req.body;
      
      if (!roomCode || !playerAddress) {
        return res.status(400).json({ error: 'Room code and player address are required' });
      }

      const game = gameManager.joinGameByRoomCode(roomCode, playerAddress);
      
      res.json({
        success: true,
        game: gameManager.getPublicGameState(game.gameId),
        message: 'Player joined successfully'
      });
    } catch (error) {
      console.error('Error joining game by room code:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Get game by room code
  router.get('/room/:roomCode', (req, res) => {
    try {
      const { roomCode } = req.params;
      const game = gameManager.getGameByRoomCode(roomCode);
      
      if (!game) {
        return res.status(404).json({ error: 'Room code not found' });
      }

      res.json({
        success: true,
        game: gameManager.getPublicGameState(game.gameId)
      });
    } catch (error) {
      console.error('Error getting game by room code:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Eliminate player
  router.post('/:gameId/player/eliminate', (req, res) => {
    try {
      const { gameId } = req.params;
      const { playerAddress } = req.body;
      
      const game = gameManager.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      if (!game.players.includes(playerAddress)) {
        return res.status(400).json({ error: 'Player not in game' });
      }

      if (game.eliminated.includes(playerAddress)) {
        return res.status(400).json({ error: 'Player already eliminated' });
      }

      game.eliminated.push(playerAddress);
      
      // Check win conditions
      if (gameManager.checkWinConditions(game)) {
        gameManager.endGame(gameId);
      }
      
      res.json({
        success: true,
        message: 'Player eliminated successfully'
      });
    } catch (error) {
      console.error('Error eliminating player:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Signal that frontend is ready for timer
  router.post('/:gameId/ready', (req, res) => {
    try {
      const { gameId } = req.params;
      
      if (!gameId) {
        return res.status(400).json({ error: 'Game ID is required' });
      }

      gameManager.startTimerWhenReady(gameId);
      
      res.json({
        success: true,
        message: 'Timer started - frontend is ready'
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Submit night action
  router.post('/:gameId/action/night', (req, res) => {
    try {
      const { gameId } = req.params;
      const { playerAddress, action, commit } = req.body;
      
      gameManager.submitNightAction(gameId, { playerAddress, action, commit });
      
      res.json({
        success: true,
        message: 'Night action submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting night action:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Submit task answer
  router.post('/:gameId/task/submit', (req, res) => {
    try {
      const { gameId } = req.params;
      const { playerAddress, answer } = req.body;
      
      const result = gameManager.submitTaskAnswer(gameId, { playerAddress, answer });
      
      res.json({
        success: true,
        correct: result.correct,
        message: 'Task answer submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting task answer:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Submit vote
  router.post('/:gameId/vote/submit', (req, res) => {
    try {
      const { gameId } = req.params;
      const { playerAddress, vote } = req.body;
      
      gameManager.submitVote(gameId, { playerAddress, vote });
      
      res.json({
        success: true,
        message: 'Vote submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting vote:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Get game history
  router.get('/:gameId/history', (req, res) => {
    try {
      const { gameId } = req.params;
      const game = gameManager.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const history = {
        gameId,
        creator: game.creator,
        players: game.players,
        eliminated: game.eliminated,
        winners: game.winners,
        day: game.day,
        phase: game.phase,
        startedAt: game.startedAt,
        status: game.status
      };
      
      res.json({
        success: true,
        history
      });
    } catch (error) {
      console.error('Error getting game history:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get active games
  router.get('/', (req, res) => {
    try {
      const games = [];
      
      for (const [gameId, game] of gameManager.games.entries()) {
        if (game.status === 'active') {
          games.push({
            gameId,
            creator: game.creator,
            players: game.players.length,
            maxPlayers: game.maxPlayers,
            stakeAmount: game.stakeAmount,
            phase: game.phase,
            day: game.day,
            startedAt: game.startedAt
          });
        }
      }
      
      res.json({
        success: true,
        games
      });
    } catch (error) {
      console.error('Error getting active games:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
