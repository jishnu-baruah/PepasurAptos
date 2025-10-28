"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import { apiService, Game, GameAction, TaskSubmission, VoteSubmission } from '@/services/api'
import { soundService } from '@/services/SoundService'

export interface Player {
  id: string
  name: string
  avatar: string  // Always defined - colored shirt or role avatar
  role?: string
  isAlive: boolean
  isCurrentPlayer?: boolean
  address?: string
}

export interface GameState {
  game: Game | null
  currentPlayer: Player | null
  players: Player[]
  isLoading: boolean
  error: string | null
  isConnected: boolean
}

export interface GameActions {
  createGame: (creatorAddress: string, stakeAmount?: number, minPlayers?: number) => Promise<{ gameId: string; roomCode: string }>
  joinGame: (gameId: string, playerAddress: string) => Promise<void>
  joinGameByRoomCode: (roomCode: string, playerAddress: string) => Promise<void>
  submitNightAction: (action: any, commit?: string) => Promise<void>
  submitTaskAnswer: (answer: any) => Promise<void>
  submitVote: (vote: string) => Promise<void>
  eliminatePlayer: (playerAddress: string) => Promise<void>
  refreshGame: () => Promise<void>
}

export function useGame(gameId?: string): GameState & GameActions {
  const { socket, isConnected, joinGame: socketJoinGame, submitAction, submitTask, submitVote: socketSubmitVote } = useSocket()
  
  const [game, setGame] = useState<Game | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentGameId, setCurrentGameId] = useState<string | undefined>(gameId)

  // Color alias and avatar mapping (must stay in sync)
  const colorAliases = [
    { name: '0xRed', avatar: 'https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/redShirt.png?updatedAt=1761611647221' },
    { name: '0xBlue', avatar: 'https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/blueShirt.png?updatedAt=1758922659560' },
    { name: '0xPurple', avatar: 'https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/purpleShirt.png?updatedAt=1761611647804' },
    { name: '0xYellow', avatar: 'https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/yellowShirt.png?updatedAt=1761611647228' }
  ];

  // Generate username based on player index in game (ensures uniqueness)
  const generateUsername = useCallback((playerIndex: number): string => {
    // Use player's position in game to ensure unique aliases
    const colorAlias = colorAliases[playerIndex % colorAliases.length];
    console.log(`👤 Assigned alias ${colorAlias.name} to player at index ${playerIndex}`);
    return colorAlias.name;
  }, []);

  // Generate avatar based on player index (matches username)
  const generateAvatar = useCallback((playerIndex: number): string => {
    const colorAlias = colorAliases[playerIndex % colorAliases.length];
    console.log(`🎨 Assigned avatar ${colorAlias.avatar.split('/').pop()?.split('?')[0]} to player at index ${playerIndex}`);
    return colorAlias.avatar;
  }, []);

  // Convert backend players to frontend format
  const convertPlayers = useCallback((game: Game, currentPlayerAddress?: string): Player[] => {
    console.log('🔍 convertPlayers called with game:', {
      gameId: game.gameId,
      phase: game.phase,
      players: game.players,
      roles: game.roles,
      currentPlayerAddress
    })

    // Role mapping from backend to frontend
    const roleMapping: Record<string, string> = {
      'Mafia': 'ASUR',
      'Doctor': 'DEVA',
      'Detective': 'RISHI',
      'Villager': 'MANAV'
    }

    return game.players.map((address, index) => {
      const backendRole = game.roles?.[address] || ''
      const frontendRole = roleMapping[backendRole] || backendRole

      console.log(`Player ${index + 1} (${address}): ${backendRole} -> ${frontendRole}`)

      // Generate username and public avatar based on player index (ensures uniqueness)
      const username = generateUsername(index)
      const publicAvatar = generateAvatar(index) // This is the colored shirt matching the username

      // Determine which avatar to show
      let avatar = publicAvatar // Default: always show colored shirt

      const isCurrentPlayer = address === currentPlayerAddress
      const isEliminated = game.eliminated.includes(address)

      // Show role avatar ONLY in these cases:
      // 1. Current player sees their own role avatar (except in lobby)
      // 2. Eliminated players show their role avatar (revealed)
      if (frontendRole && ((isCurrentPlayer && game.phase !== 'lobby') || isEliminated)) {
        if (frontendRole === 'DEVA') {
          avatar = 'https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/dev.png?updatedAt=1758923141278'
        } else if (frontendRole === 'ASUR') {
          avatar = 'https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/asur.png?updatedAt=1758922659571'
        } else if (frontendRole === 'RISHI') {
          avatar = 'https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/sage.png?updatedAt=1758922659655'
        }
        // MANAV keeps the colored shirt even when revealed

        console.log(`🎭 ${frontendRole} role avatar shown for ${username}: ${avatar}`)
      } else {
        console.log(`👕 Public colored shirt shown for ${username}: ${avatar}`)
      }

      const player = {
        id: address,
        name: username,
        avatar: avatar,
        role: frontendRole,
        isAlive: !game.eliminated.includes(address),
        isCurrentPlayer: address === currentPlayerAddress,
        address
      }

      console.log(`👤 Created player: ${username}, avatar: ${avatar ? 'assigned' : 'MISSING'}`)
      return player
    })
  }, [generateUsername, generateAvatar])

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    const handleGameState = (data: { gameId: string; game: Game }) => {
      console.log('🎮 SOCKET EVENT: Received game state:', data)
      console.log('🎮 Current player before update:', currentPlayer)
      console.log('🎮 Game phase in received data:', data.game?.phase)
      console.log('🎮 TimeLeft in received data:', data.game?.timeLeft)
      setGame(data.game)
      
      if (data.game) {
        // Try to get current player address from multiple sources
        const currentPlayerAddress = currentPlayer?.address || 
                                   (currentPlayer?.id && currentPlayer.id !== 'You' ? currentPlayer.id : null)
        
        console.log('Converting players with currentPlayer address:', currentPlayerAddress)
        const convertedPlayers = convertPlayers(data.game, currentPlayerAddress)
        setPlayers(convertedPlayers)
        
        // Update current player from converted players
        const currentPlayerFromConverted = convertedPlayers.find(p => 
          p.address === currentPlayerAddress || 
          (currentPlayerAddress && p.address === currentPlayerAddress)
        )
        
        if (currentPlayerFromConverted && currentPlayerFromConverted.role) {
          console.log(`[handleGameState] Updating current player role: ${currentPlayerFromConverted.role}`)
          setCurrentPlayer(prev => prev ? {
            ...prev,
            role: currentPlayerFromConverted.role,
            avatar: currentPlayerFromConverted.avatar,
            name: currentPlayerFromConverted.name // Update name too
          } : {
            id: currentPlayerFromConverted.id,
            name: currentPlayerFromConverted.name, // Use name from convertedPlayers
            avatar: currentPlayerFromConverted.avatar,
            isAlive: true,
            isCurrentPlayer: true,
            address: currentPlayerFromConverted.address,
            role: currentPlayerFromConverted.role
          })
        } else {
          console.log('No role found for current player:', currentPlayerFromConverted)
        }
      } else {
        console.log('No game data available')
      }
    }

    const handleGameUpdate = (data: any) => {
      console.log('🎮 Game update:', data)
      
      // Refresh game state when updates occur
      if (currentGameId) {
        refreshGame()
      }
    }

    const handleTaskUpdate = (data: any) => {
      console.log('🎮 Task update:', data)
    }

    const handleChatMessage = (data: any) => {
      console.log('💬 Chat message:', data)
    }

    const handleError = (data: { message: string }) => {
      console.error('❌ Socket error:', data.message)
      setError(data.message)
    }

    const handleGameCancelled = (data: { gameId: string; reason: string }) => {
      console.log('🚫 Game cancelled:', data)
      setError(`Game cancelled: ${data.reason}`)
      // Clear game state
      setGame(null)
      setPlayers([])
      setCurrentGameId(null)
    }

    socket.on('game_state', handleGameState)
    socket.on('game_update', handleGameUpdate)
    socket.on('task_update', handleTaskUpdate)
    socket.on('chat_message', handleChatMessage)
    socket.on('error', handleError)
    socket.on('game_cancelled', handleGameCancelled)

    return () => {
      socket.off('game_state', handleGameState)
      socket.off('game_update', handleGameUpdate)
      socket.off('task_update', handleTaskUpdate)
      socket.off('chat_message', handleChatMessage)
      socket.off('error', handleError)
      socket.off('game_cancelled', handleGameCancelled)
    }
  }, [socket, currentGameId, convertPlayers, currentPlayer])

  // Clear game state when currentGameId is set to null (player left game)
  useEffect(() => {
    if (currentGameId === null) {
      console.log('🧹 Clearing game state after leaving game')
      setGame(null)
      setCurrentPlayer(null)
      setPlayers([])
    }
  }, [currentGameId])

  // Auto-join game when gameId changes (with duplicate prevention)
  useEffect(() => {
    if (currentGameId && currentPlayer?.address && isConnected) {
      console.log('🔌 Auto-joining socket game:', { currentGameId, playerAddress: currentPlayer.address })
      socketJoinGame(currentGameId, currentPlayer.address)
    }
  }, [currentGameId, currentPlayer?.address, isConnected, socketJoinGame])

  const createGame = useCallback(async (creatorAddress: string, stakeAmount = 10000000000000000, minPlayers = 4): Promise<{ gameId: string; roomCode: string }> => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔍 createGame - Starting API call:', { creatorAddress, stakeAmount, minPlayers })
      const response = await apiService.createGame({
        creatorAddress,
        stakeAmount,
        minPlayers
      })
      console.log('🔍 createGame - API response:', response)
      
      if (response.success) {
        console.log('🔍 createGame - Setting gameId:', response.gameId)
        console.log('🔍 createGame - Setting roomCode:', response.roomCode)
        // Set the game ID for tracking
        setCurrentGameId(response.gameId)
        
        // Set current player as creator (index 0 since creator is first player)
        // Will be updated with correct name/avatar when game state arrives via socket
        setCurrentPlayer({
          id: creatorAddress,
          name: generateUsername(0), // Creator is first player (index 0)
          avatar: generateAvatar(0), // Creator gets first color alias
          isAlive: true,
          isCurrentPlayer: true,
          address: creatorAddress
        })
        
        return { gameId: response.gameId, roomCode: response.roomCode }
      } else {
        console.log('🔍 createGame - API call failed:', response)
        throw new Error('Failed to create game')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create game'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const joinGameByRoomCode = useCallback(async (roomCode: string, playerAddress: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔍 joinGameByRoomCode - Starting API call:', { roomCode, playerAddress })
      const response = await apiService.joinGameByRoomCode({ roomCode, playerAddress })
      console.log('🔍 joinGameByRoomCode - API response:', response)
      
      if (response.success) {
        console.log('🔍 joinGameByRoomCode - Setting game:', response.game)
        setGame(response.game)
        
        // Set the game ID for tracking
        setCurrentGameId(response.game.gameId)
        console.log('🔍 joinGameByRoomCode - Set currentGameId:', response.game.gameId)
        
        // Convert players first
        const convertedPlayers = convertPlayers(response.game, playerAddress)
        setPlayers(convertedPlayers)
        
        // Set current player with name/avatar/role from converted players
        const currentPlayerFromConverted = convertedPlayers.find(p => p.address === playerAddress)
        console.log('🔍 joinGameByRoomCode - currentPlayerFromConverted:', currentPlayerFromConverted)
        console.log('🔍 joinGameByRoomCode - game roles:', response.game.roles)

        if (currentPlayerFromConverted) {
          setCurrentPlayer({
            id: playerAddress,
            name: currentPlayerFromConverted.name, // Use name from convertedPlayers (based on index)
            avatar: currentPlayerFromConverted.avatar, // Use avatar from convertedPlayers
            isAlive: true,
            isCurrentPlayer: true,
            address: playerAddress,
            role: currentPlayerFromConverted.role
          })

          console.log('🔍 joinGameByRoomCode - Final state:', {
            game: response.game,
            currentPlayer: {
              id: playerAddress,
              name: currentPlayerFromConverted.name,
              address: playerAddress,
              role: currentPlayerFromConverted.role
            },
            players: convertedPlayers
          })
        } else {
          console.error('❌ Could not find current player in converted players')
        }
      } else {
        throw new Error('Failed to join game')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join game'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [convertPlayers])

  const joinGame = useCallback(async (gameId: string, playerAddress: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await apiService.joinGame(gameId, { playerAddress })
      
      if (response.success) {
        setGame(response.game)
        
        // Convert players first
        const convertedPlayers = convertPlayers(response.game, playerAddress)
        setPlayers(convertedPlayers)

        // Set current player with name/avatar/role from converted players
        const currentPlayerFromConverted = convertedPlayers.find(p => p.address === playerAddress)
        if (currentPlayerFromConverted) {
          setCurrentPlayer({
            id: playerAddress,
            name: currentPlayerFromConverted.name, // Use name from convertedPlayers (based on index)
            avatar: currentPlayerFromConverted.avatar, // Use avatar from convertedPlayers
            isAlive: true,
            isCurrentPlayer: true,
            address: playerAddress,
            role: currentPlayerFromConverted.role
          })
        } else {
          console.error('❌ Could not find current player in converted players')
        }
      } else {
        throw new Error('Failed to join game')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join game'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [convertPlayers])

  const submitNightAction = useCallback(async (action: any, commit?: string): Promise<void> => {
    if (!game || !currentPlayer?.address) {
      throw new Error('No active game or player')
    }
    
    try {
      const actionData: GameAction = {
        playerAddress: currentPlayer.address,
        action,
        commit
      }
      
      console.log('🚀 Submitting night action:', actionData)
      console.log('📡 Sending via Socket.IO...')
      
      // Send via Socket.IO for real-time updates
      submitAction({
        gameId: game.gameId,
        ...actionData
      })
      
      console.log('📡 Socket.IO action sent, now sending via REST API...')
      
      // Also send via REST API as backup
      await apiService.submitNightAction(game.gameId, actionData)
      
      console.log('✅ Night action submitted successfully via both Socket.IO and REST API')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit action'
      console.error('❌ Failed to submit night action:', errorMessage)
      setError(errorMessage)
      throw err
    }
  }, [game, currentPlayer?.address, submitAction])

  const submitTaskAnswer = useCallback(async (answer: any): Promise<void> => {
    if (!game || !currentPlayer?.address) {
      throw new Error('No active game or player')
    }
    
    try {
      const taskData: TaskSubmission = {
        playerAddress: currentPlayer.address,
        answer
      }
      
      // Send via Socket.IO for real-time updates
      submitTask({
        gameId: game.gameId,
        ...taskData
      })
      
      // Also send via REST API as backup
      await apiService.submitTaskAnswer(game.gameId, taskData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit task answer'
      setError(errorMessage)
      throw err
    }
  }, [game, currentPlayer?.address, submitTask])

  const submitVote = useCallback(async (vote: string): Promise<void> => {
    if (!game || !currentPlayer?.address) {
      throw new Error('No active game or player')
    }
    
    try {
      const voteData: VoteSubmission = {
        playerAddress: currentPlayer.address,
        vote
      }
      
      // Send via Socket.IO for real-time updates
      socketSubmitVote({
        gameId: game.gameId,
        ...voteData
      })
      
      // Also send via REST API as backup
      await apiService.submitVote(game.gameId, voteData)

      soundService.playVote();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote'
      setError(errorMessage)
      throw err
    }
  }, [game, currentPlayer?.address, socketSubmitVote])

  const eliminatePlayer = useCallback(async (playerAddress: string): Promise<void> => {
    if (!game) {
      throw new Error('No active game')
    }
    
    try {
      await apiService.eliminatePlayer(game.gameId, playerAddress)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to eliminate player'
      setError(errorMessage)
      throw err
    }
  }, [game])

  const setCurrentPlayerFromAddress = useCallback((address: string) => {
    // Use temporary placeholder values - will be updated when game state arrives
    // This is only called on initial wallet connection before joining a game
    const player: Player = {
      id: address,
      name: 'Loading...', // Placeholder - will be updated from game state
      avatar: generateAvatar(0), // Temporary avatar - will be updated from game state
      isAlive: true,
      isCurrentPlayer: true,
      address: address
    }
    setCurrentPlayer(player)
    console.log('🔧 setCurrentPlayerFromAddress (temp):', player)
  }, [])

  const refreshGame = useCallback(async (): Promise<void> => {
    if (!currentGameId) return
    
    console.log('🔄 refreshGame called for gameId:', currentGameId)
    // Don't set loading state for background refreshes
    setError(null)
    
    try {
      const response = await apiService.getGame(currentGameId, currentPlayer?.address)
      console.log('🔄 refreshGame API response:', response)
      
      if (response.success) {
        setGame(response.game)
        
        if (response.game && currentPlayer?.address) {
          console.log('🔄 refreshGame - converting players for address:', currentPlayer.address)
          const convertedPlayers = convertPlayers(response.game, currentPlayer.address)
          setPlayers(convertedPlayers)
          
          // Update current player from converted players
          const currentPlayerFromConverted = convertedPlayers.find(p => p.address === currentPlayer.address)
          console.log('🔄 refreshGame - currentPlayerFromConverted:', currentPlayerFromConverted)
          
          if (currentPlayerFromConverted && currentPlayerFromConverted.role) {
            console.log(`[refreshGame] Updating current player: ${currentPlayerFromConverted.name} (${currentPlayerFromConverted.role})`)
            setCurrentPlayer(prev => prev ? {
              ...prev,
              role: currentPlayerFromConverted.role,
              name: currentPlayerFromConverted.name, // Update name from game state
              avatar: currentPlayerFromConverted.avatar // Update avatar from game state
            } : null)
          } else {
            console.log('🔄 refreshGame - No role found for current player:', currentPlayerFromConverted)
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh game'
      setError(errorMessage)
    }
    // Don't set loading state for background refreshes
  }, [currentGameId, currentPlayer?.address, convertPlayers])

  return {
    game,
    currentPlayer,
    players,
    isLoading,
    error,
    isConnected,
    currentGameId,
    createGame,
    joinGame,
    joinGameByRoomCode,
    submitNightAction,
    submitTaskAnswer,
    submitVote,
    eliminatePlayer,
    refreshGame,
    setCurrentGameId,
    setCurrentPlayerFromAddress
  }
}
