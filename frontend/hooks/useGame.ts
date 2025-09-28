"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import { apiService, Game, GameAction, TaskSubmission, VoteSubmission } from '@/services/api'

export interface Player {
  id: string
  name: string
  avatar: string | undefined
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

  // Generate random username in format: name.pepasur.eth
  const generateUsername = useCallback((address: string): string => {
    // Use address as seed for consistent username generation
    const seed = address.slice(2, 8) // Use first 6 chars of address as seed
    const seedNum = parseInt(seed, 16)
    
    // List of cool names for the username
    const names = [
      'mouli', 'alex', 'crypto', 'block', 'chain', 'defi', 'nft', 'web3', 'dao', 'meta',
      'alpha', 'beta', 'gamma', 'delta', 'omega', 'zeta', 'theta', 'lambda', 'sigma', 'phi',
      'nova', 'stellar', 'cosmic', 'quantum', 'neon', 'cyber', 'digital', 'virtual', 'matrix', 'nexus',
      'phoenix', 'dragon', 'tiger', 'wolf', 'eagle', 'falcon', 'hawk', 'raven', 'crow', 'owl',
      'shadow', 'storm', 'thunder', 'lightning', 'fire', 'ice', 'wind', 'earth', 'water', 'spirit',
      'mystic', 'arcane', 'magic', 'wizard', 'mage', 'sorcerer', 'warlock', 'druid', 'shaman', 'priest',
      'knight', 'warrior', 'rogue', 'archer', 'hunter', 'ranger', 'paladin', 'monk', 'bard', 'cleric',
      'ninja', 'samurai', 'viking', 'pirate', 'cowboy', 'sheriff', 'outlaw', 'gunslinger', 'marshal', 'deputy'
    ]
    
    // Generate consistent username based on address
    const nameIndex = seedNum % names.length
    const selectedName = names[nameIndex]
    
    return `${selectedName}.pepasur.eth`
  }, [])

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
      
      // Assign role-specific avatars
      let avatar = '👤' // Default avatar
      if (frontendRole === 'DEVA') {
        avatar = 'https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/dev.png?updatedAt=1758923141278'
        console.log(`🎭 DEVA avatar assigned: ${avatar}`)
      } else if (frontendRole === 'ASUR') {
        avatar = 'https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/asur.png?updatedAt=1758922659571'
        console.log(`🎭 ASUR avatar assigned: ${avatar}`)
      } else if (frontendRole === 'RISHI') {
        avatar = 'https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/sage.png?updatedAt=1758922659655'
        console.log(`🎭 RISHI avatar assigned: ${avatar}`)
      } else if (frontendRole === 'MANAV') {
        avatar = 'https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/blueShirt.png?updatedAt=1758922659560'
        console.log(`🎭 MANAV avatar assigned: ${avatar}`)
      }
      
      // Generate username for this player
      const username = generateUsername(address)
      
      return {
        id: address,
        name: username,
        avatar: avatar,
        role: frontendRole,
        isAlive: !game.eliminated.includes(address),
        isCurrentPlayer: address === currentPlayerAddress,
        address
      }
    })
  }, [generateUsername])

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
            avatar: currentPlayerFromConverted.avatar
          } : {
            id: currentPlayerFromConverted.id,
            name: generateUsername(currentPlayerFromConverted.address),
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

    socket.on('game_state', handleGameState)
    socket.on('game_update', handleGameUpdate)
    socket.on('task_update', handleTaskUpdate)
    socket.on('chat_message', handleChatMessage)
    socket.on('error', handleError)

    return () => {
      socket.off('game_state', handleGameState)
      socket.off('game_update', handleGameUpdate)
      socket.off('task_update', handleTaskUpdate)
      socket.off('chat_message', handleChatMessage)
      socket.off('error', handleError)
    }
  }, [socket, currentGameId, convertPlayers, currentPlayer])

  // Auto-join game when gameId changes
  useEffect(() => {
    if (currentGameId && currentPlayer?.address && isConnected) {
      socketJoinGame(currentGameId, currentPlayer.address)
    }
  }, [currentGameId, currentPlayer?.address, isConnected, socketJoinGame])

  const createGame = useCallback(async (creatorAddress: string, stakeAmount = 10000000000000000, minPlayers = 4): Promise<{ gameId: string; roomCode: string }> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await apiService.createGame({
        creatorAddress,
        stakeAmount,
        minPlayers
      })
      
      if (response.success) {
        // Set the game ID for tracking
        setCurrentGameId(response.gameId)
        
        // Set current player as creator
        setCurrentPlayer({
          id: creatorAddress,
          name: generateUsername(creatorAddress),
          avatar: '👑',
          isAlive: true,
          isCurrentPlayer: true,
          address: creatorAddress
        })
        
        return { gameId: response.gameId, roomCode: response.roomCode }
      } else {
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
      const response = await apiService.joinGameByRoomCode({ roomCode, playerAddress })
      
      if (response.success) {
        setGame(response.game)
        
        // Set the game ID for tracking
        setCurrentGameId(response.game.gameId)
        
        // Convert players first
        const convertedPlayers = convertPlayers(response.game, playerAddress)
        setPlayers(convertedPlayers)
        
        // Set current player with role from converted players
        const currentPlayerFromConverted = convertedPlayers.find(p => p.address === playerAddress)
        console.log('🔍 joinGameByRoomCode - currentPlayerFromConverted:', currentPlayerFromConverted)
        console.log('🔍 joinGameByRoomCode - game roles:', response.game.roles)
        
        setCurrentPlayer({
          id: playerAddress,
          name: generateUsername(playerAddress),
          avatar: '👤',
          isAlive: true,
          isCurrentPlayer: true,
          address: playerAddress,
          role: currentPlayerFromConverted?.role
        })
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
        
        // Set current player with role from converted players
        const currentPlayerFromConverted = convertedPlayers.find(p => p.address === playerAddress)
        setCurrentPlayer({
          id: playerAddress,
          name: generateUsername(playerAddress),
          avatar: '👤',
          isAlive: true,
          isCurrentPlayer: true,
          address: playerAddress,
          role: currentPlayerFromConverted?.role
        })
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

  const refreshGame = useCallback(async (): Promise<void> => {
    if (!currentGameId) return
    
    console.log('🔄 refreshGame called for gameId:', currentGameId)
    setIsLoading(true)
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
            console.log(`[refreshGame] Updating current player role: ${currentPlayerFromConverted.role}`)
            setCurrentPlayer(prev => prev ? {
              ...prev,
              role: currentPlayerFromConverted.role
            } : null)
          } else {
            console.log('🔄 refreshGame - No role found for current player:', currentPlayerFromConverted)
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh game'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [currentGameId, currentPlayer?.address, convertPlayers])

  return {
    game,
    currentPlayer,
    players,
    isLoading,
    error,
    isConnected,
    createGame,
    joinGame,
    joinGameByRoomCode,
    submitNightAction,
    submitTaskAnswer,
    submitVote,
    eliminatePlayer,
    refreshGame
  }
}
