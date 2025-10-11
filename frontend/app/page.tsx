"use client"

import { useState, useEffect } from "react"
import LoaderScreen from "@/components/loader-screen"
import WalletConnectScreen from "@/components/wallet-connect-screen"
import WalletConnect from "@/components/wallet-connect-rainbow"
import LobbyScreen from "@/components/lobby-screen"
import RoleAssignmentScreen from "@/components/role-assignment-screen"
import GameplayScreen from "@/components/gameplay-screen"
import RoomCodeInput from "@/components/room-code-input"
import RoomCodeDisplay from "@/components/room-code-display"
import ChatComponent from "@/components/chat-component"
import GameResultsScreen from "@/components/game-results-screen"
import NightResolutionScreen from "@/components/night-resolution-screen"
import DiscussionPhaseScreen from "@/components/discussion-phase-screen"
import VotingScreen from "@/components/voting-screen"
import StakingScreen from "@/components/staking-screen"
import { useGame, Player } from "@/hooks/useGame"

export type GameState = "loader" | "wallet" | "room-code-input" | "staking" | "lobby" | "role-assignment" | "night" | "resolution" | "task" | "voting" | "ended"
export type Role = "ASUR" | "DEVA" | "RISHI" | "MANAV"

// Faucet contract configuration
const FAUCET_CONTRACT_ADDRESS = "0x87A63B1ae283278bAe7feDA6a07247070A5eD148" as const
const FAUCET_ABI = [
  {
    "inputs": [],
    "name": "claimTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getFaucetInfo",
    "outputs": [
      {"name": "canClaim", "type": "bool"},
      {"name": "timeUntilNextClaim", "type": "uint256"},
      {"name": "faucetBalance", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getFaucetStats",
    "outputs": [
      {"name": "faucetBalance", "type": "uint256"},
      {"name": "claimAmount", "type": "uint256"},
      {"name": "cooldownPeriod", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("loader")
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null)
  const [claimingU2U, setClaimingU2U] = useState(false)
  const [faucetInfo, setFaucetInfo] = useState(null)
  const [stakingMode, setStakingMode] = useState<'create' | 'join'>('create')
  const [faucetStats, setFaucetStats] = useState(null)
  
  // Use the new game hook for backend integration
  const {
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
    refreshGame,
    setCurrentGameId,
    setCurrentPlayerFromAddress
  } = useGame()

  // Auto-advance from loader after 3 seconds
  useEffect(() => {
    if (gameState === "loader") {
      const timer = setTimeout(() => {
        setGameState("wallet")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [gameState])

  // Track if player has seen their role
  const [hasSeenRole, setHasSeenRole] = useState(false)
  
  // Track disconnected warning with delay
  const [showDisconnectedWarning, setShowDisconnectedWarning] = useState(false)

  // Handle disconnected warning with 15-second delay
  useEffect(() => {
    if (!isConnected && gameState !== "loader") {
      const timer = setTimeout(() => {
        setShowDisconnectedWarning(true)
      }, 15000) // Show warning after 15 seconds of disconnection

      return () => clearTimeout(timer)
    } else {
      setShowDisconnectedWarning(false) // Hide warning when connected
    }
  }, [isConnected, gameState])

  // Sync game state with backend - PRIORITY: Phase changes
  useEffect(() => {
    console.log("🔄 PHASE SYNC CHECK:", {
      hasGame: !!game,
      hasCurrentPlayer: !!currentPlayer,
      backendPhase: game?.phase,
      frontendState: gameState,
      timeLeft: game?.timeLeft,
      gameId: game?.gameId
    })
    
    if (game && currentPlayer) {
      console.log("📊 DETAILED GAME STATE:", {
        backendPhase: game.phase,
        frontendState: gameState,
        players: game.players.length,
        currentPlayer: currentPlayer.id,
        currentPlayerRole: currentPlayer.role,
        hasSeenRole: hasSeenRole,
        gameId: game.gameId,
        timeLeft: game.timeLeft,
        shouldShowRoleAssignment: game.phase === 'night' && currentPlayer.role && !hasSeenRole
      })
      
      // CRITICAL: Phase sync logic - this is the main issue
      if (game.phase === 'lobby' && gameState !== 'lobby') {
        console.log("✅ SWITCHING TO LOBBY PHASE")
        setGameState('lobby')
        setHasSeenRole(false)
      } else if (game.phase === 'night' && currentPlayer.role && !hasSeenRole) {
        console.log("✅ SHOWING ROLE ASSIGNMENT")
        setGameState('role-assignment')
      } else if (game.phase === 'night' && gameState !== 'night' && gameState !== 'role-assignment' && hasSeenRole) {
        console.log("✅ SWITCHING TO NIGHT PHASE")
        setGameState('night')
      } else if (game.phase === 'resolution' && gameState !== 'resolution') {
        console.log("✅ SWITCHING TO RESOLUTION PHASE")
        setGameState('resolution')
      } else if (game.phase === 'task' && gameState !== 'task') {
        console.log("✅ SWITCHING TO TASK PHASE")
        setGameState('task')
      } else if (game.phase === 'voting' && gameState !== 'voting') {
        console.log("✅ SWITCHING TO VOTING PHASE")
        setGameState('voting')
      } else if (game.phase === 'ended' && gameState !== 'ended') {
        console.log("✅ SWITCHING TO ENDED PHASE")
        setGameState('ended')
      } else {
        console.log("⏸️ NO PHASE CHANGE NEEDED")
      }
      
      // Emergency refresh if timer is 0 and we're stuck (with delay to avoid spam)
      if (game.timeLeft === 0 && gameState === 'night') {
        console.log("🚨 EMERGENCY REFRESH - Timer expired")
        setTimeout(() => {
          refreshGame()
        }, 2000) // Add 2-second delay to prevent immediate refresh spam
      }
    } else {
      console.log("❌ MISSING GAME OR CURRENT PLAYER")
      console.log("❌ Game:", game)
      console.log("❌ Current Player:", currentPlayer)
      console.log("❌ Game State:", gameState)
    }
  }, [game?.phase, gameState, currentPlayer?.id, hasSeenRole, refreshGame])

  // BACKUP: Polling mechanism for game state updates
  useEffect(() => {
    if (!game?.gameId || !currentPlayer?.address) return
    
    console.log("🔄 Starting backup polling for game state updates")
    
    const pollInterval = setInterval(() => {
      console.log("🔄 Backup polling: refreshing game state")
      refreshGame()
    }, 10000) // Poll every 10 seconds as backup (socket provides real-time updates)
    
    return () => {
      console.log("🔄 Stopping backup polling")
      clearInterval(pollInterval)
    }
  }, [game?.gameId, currentPlayer?.address, refreshGame])

  // Fallback: If we're in night phase but currentPlayer has no role, try to refresh
  useEffect(() => {
    if (game?.phase === 'night' && currentPlayer && !currentPlayer.role && walletAddress) {
      console.log("Fallback: Player in night phase but no role assigned, refreshing game state")
      refreshGame()
    }
  }, [game?.phase, currentPlayer?.role, walletAddress, refreshGame])

  const handleWalletConnect = () => {
    setWalletConnected(true)
    setGameState("wallet")
  }

  const handleWalletAddressChange = (address: string | null) => {
    setWalletAddress(address)
    setWalletConnected(!!address)
    if (address) {
      console.log("Wallet address set:", address)
    }
  }

  const handleJoinGame = () => {
    // Set a flag to indicate we're in join mode
    setStakingMode('join')
    setGameState("staking")
    // We'll handle room code input in the staking screen
  }

  const handleJoinByRoomCode = async (roomCode: string) => {
    if (!walletAddress) {
      alert("Please connect your wallet first")
      return
    }
    
    try {
      console.log("Joining game with room code:", roomCode)
      console.log("Using wallet address:", walletAddress)
      
      await joinGameByRoomCode(roomCode, walletAddress)
      setCurrentRoomCode(roomCode)
      setHasSeenRole(false) // Reset role visibility when joining
      
      // Redirect to staking screen instead of lobby
      setGameState("staking")
      console.log("Successfully joined game, redirecting to staking")
    } catch (error) {
      console.error("Failed to join game:", error)
      // Show error to user
      alert(`Failed to join game: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCancelJoin = () => {
    setGameState("wallet")
  }

  const handleClaimU2U = async () => {
    if (!walletAddress) {
      alert("Please connect your wallet first")
      return
    }
    
    // Check if user can claim
    if (faucetInfo && !faucetInfo[0]) {
      const timeUntilNextClaim = Number(faucetInfo[1])
      const hours = Math.floor(timeUntilNextClaim / 3600)
      const minutes = Math.floor((timeUntilNextClaim % 3600) / 60)
      alert(`⏰ You can claim again in ${hours}h ${minutes}m`)
      return
    }
    
    // Check if faucet has tokens
    if (faucetStats && Number(faucetStats[0]) === 0) {
      alert("⚠️ Faucet is empty. Please try again later.")
      return
    }
    
    try {
      setClaimingU2U(true)
      console.log("Claiming 0.5 U2U from faucet for wallet:", walletAddress)
      
      // Call server-side API (server pays network fees)
      const response = await fetch('/api/faucet/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: walletAddress
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`🎉 Successfully claimed 0.5 U2U!\n\nClaim TX: ${result.data.claimTxHash}\nTransfer TX: ${result.data.transferTxHash}\n\nYou can claim again in 24 hours.`)
        // Refresh faucet info
        fetchFaucetInfo()
        fetchFaucetStats()
      } else {
        alert(`❌ Failed to claim: ${result.error}`)
      }
      
    } catch (error) {
      console.error("Failed to claim U2U:", error)
      alert(`Failed to claim U2U: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setClaimingU2U(false)
    }
  }
  
  // Fetch faucet info when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      fetchFaucetInfo()
      fetchFaucetStats()
    }
  }, [walletAddress])

  const fetchFaucetInfo = async () => {
    if (!walletAddress) return
    
    try {
      const response = await fetch(`/api/faucet/info/${walletAddress}`)
      const result = await response.json()
      
      if (result.success) {
        setFaucetInfo([result.data.canClaim, result.data.timeUntilNextClaim, result.data.faucetBalance])
      }
    } catch (error) {
      console.error("Failed to fetch faucet info:", error)
    }
  }

  const fetchFaucetStats = async () => {
    try {
      const response = await fetch('/api/faucet/stats')
      const result = await response.json()
      
      if (result.success) {
        setFaucetStats([result.data.faucetBalance, result.data.claimAmount, result.data.cooldownPeriod])
      }
    } catch (error) {
      console.error("Failed to fetch faucet stats:", error)
    }
  }

  const handleCreateLobby = async () => {
    if (!walletAddress) {
      alert("Please connect your wallet first")
      return
    }
    
    try {
      console.log("Starting staking process for room creation...")
      console.log("Using wallet address:", walletAddress)
      
      // Go directly to staking screen for room creation
      setStakingMode('create')
      setGameState("staking")
      console.log("Redirecting to staking screen for room creation")
    } catch (error) {
      console.error("Failed to start staking process:", error)
      // Show error to user
      alert(`Failed to start staking process: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleStartGame = () => {
    // Game will start automatically when minimum players join
    // The backend handles role assignment and game progression
    console.log("Game starting...")
  }

  const handleRoleAcknowledged = () => {
    console.log("Role acknowledged, moving to night phase")
    setHasSeenRole(true)
    setGameState("night")
  }

  const handleResolutionComplete = () => {
    console.log("Resolution acknowledged, backend will handle phase transition")
    // Don't manually set game state - let backend control the flow
    // The useEffect will automatically sync when backend changes phase
  }

  const handleNightComplete = async (killedPlayer?: Player) => {
    console.log("Night phase complete, backend will handle phase transition")
    // Don't manually set game state - let backend control the flow
    // The useEffect will automatically sync when backend changes phase
  }

  const handleTaskComplete = () => {
    console.log("Task phase complete, backend will handle phase transition")
    // Don't manually set game state - let backend control the flow
    // The useEffect will automatically sync when backend changes phase
  }

  const handleVotingComplete = async () => {
    console.log("Voting phase complete, backend will handle phase transition")
    // Don't manually set game state - let backend control the flow
    // The useEffect will automatically sync when backend changes phase
  }

  // Function to get public player data (hiding roles and avatars from other players)
  const getPublicPlayerData = (players: Player[], currentPlayerId: string, showEliminatedAvatars: boolean = false) => {
    return players.map(player => ({
      ...player,
      // Only show role and avatar to the current player, or if showing eliminated avatars
      role: player.id === currentPlayerId ? player.role : undefined,
      avatar: (player.id === currentPlayerId || (showEliminatedAvatars && !player.isAlive)) ? player.avatar : undefined,
      isCurrentPlayer: player.id === currentPlayerId
    }))
  }

  return (
    <main className="min-h-screen gaming-bg relative overflow-hidden w-full">
      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-900/90 text-red-100 p-4 rounded border border-red-500">
          <div className="font-press-start text-sm">ERROR:</div>
          <div className="text-sm">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Connection Status */}
      {showDisconnectedWarning && (
        <div className="fixed top-4 left-4 z-50 bg-yellow-900/90 text-yellow-100 p-3 rounded border border-yellow-500">
          <div className="font-press-start text-sm">DISCONNECTED</div>
          <div className="text-xs">Reconnecting...</div>
        </div>
      )}

      {/* Loading Overlay - Very Muted */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-40">
          <div className="bg-[#111111]/40 p-3 rounded border border-[#2a2a2a]/30 text-center opacity-30">
            <div className="font-press-start text-white/50 mb-1 text-xs">LOADING...</div>
            <div className="text-xs text-gray-600">Connecting to game server</div>
          </div>
        </div>
      )}

      {gameState === "loader" && <LoaderScreen />}
      {gameState === "wallet" && (
        <>
          <WalletConnect 
            onAddressChange={handleWalletAddressChange}
            onJoinGame={handleJoinGame}
            onCreateLobby={handleCreateLobby}
          />
          
          {/* Claim FLOW Button */}
          {walletAddress && (
            <div className="fixed top-4 left-4 z-50">
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleClaimU2U}
                  disabled={claimingU2U || (faucetInfo && !faucetInfo[0])}
                  className={`font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 border-2 ${
                    claimingU2U
                      ? "bg-gray-600 text-gray-300 border-gray-500 cursor-not-allowed"
                      : faucetInfo && !faucetInfo[0]
                      ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-500/50"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-green-500/50"
                  }`}
                >
                  {claimingU2U ? (
                    <>⏳ Claiming...</>
                  ) : faucetInfo && !faucetInfo[0] ? (
                    <>⏰ On Cooldown</>
                  ) : (
                    <>💎 Claim 0.5 U2U</>
                  )}
                </button>
                
                {/* Faucet Info */}
                {faucetStats && (
                  <div className="text-xs text-gray-400 bg-black/50 p-2 rounded">
                    <div>Faucet: {Number(faucetStats[0]) / 1e18} U2U</div>
                    <div>Claim: {Number(faucetStats[1]) / 1e18} U2U</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
      {gameState === "staking" && walletAddress && (
        <StakingScreen
          gameId={game?.gameId} // Pass gameId if we have a game (join mode)
          playerAddress={walletAddress}
          mode={stakingMode} // Use the staking mode state
          onStakeSuccess={async (gameId, roomCode) => {
            if (stakingMode === 'join') {
              // Join mode - we already have a game, but need to join it in the backend
              console.log('✅ Staking successful, joining game:', gameId)
              try {
                // First join the game in the backend
                await joinGameByRoomCode(roomCode, walletAddress)
                console.log('✅ Joined game in backend')
                // Then set the game state
                setGameState("lobby")
              } catch (error) {
                console.error('❌ Failed to join game:', error)
                alert(`Failed to join game: ${error instanceof Error ? error.message : 'Unknown error'}`)
              }
            } else {
              // Create mode - room already created by backend, refresh game data
              console.log('✅ Contract staking successful, refreshing game data...')
              if (roomCode) {
                setCurrentRoomCode(roomCode)
                console.log('✅ Room code set:', roomCode)
              }
              if (gameId) {
                console.log('✅ GameId available:', gameId)
                try {
                  // Set the current player first
                  setCurrentPlayerFromAddress(walletAddress)
                  console.log('✅ CurrentPlayer set:', walletAddress)
                  // Set the current game ID so refreshGame can work
                  setCurrentGameId(gameId)
                  console.log('✅ CurrentGameId set:', gameId)
                  // Join the game in backend (creator is already in game, but this refreshes data)
                  await joinGameByRoomCode(roomCode, walletAddress)
                  console.log('✅ Joined own game in backend')
                  setGameState("lobby")
                } catch (error) {
                  console.error('❌ Failed to join own game:', error)
                  // Try refreshGame as fallback
                  try {
                    await refreshGame()
                    console.log('✅ Fallback refreshGame successful')
                    setGameState("lobby")
                  } catch (refreshError) {
                    console.error('❌ Fallback refreshGame failed:', refreshError)
                    alert(`Failed to load game data: ${error instanceof Error ? error.message : 'Unknown error'}`)
                  }
                }
              } else {
                console.log('❌ No gameId available for refresh')
              }
            }
          }}
          onCancel={() => {
            if (game) {
              setGameState("room-code-input")
            } else {
              setGameState("wallet")
            }
          }}
        />
      )}
      {gameState === "lobby" && currentPlayer && (
        <>
          <LobbyScreen 
            players={getPublicPlayerData(players, currentPlayer.id)} 
            game={game}
            isConnected={isConnected}
            onStartGame={handleStartGame} 
          />
          {currentRoomCode && (
            <div className="fixed top-4 right-4 z-50">
              <RoomCodeDisplay roomCode={currentRoomCode} />
            </div>
          )}
        </>
      )}
      {gameState === "role-assignment" && currentPlayer?.role && currentPlayer?.avatar && (
        <>
          {console.log('🎮 Main page - currentPlayer:', currentPlayer)}
          {console.log('🎮 Main page - currentPlayer.avatar:', currentPlayer.avatar)}
          {console.log('🎮 Main page - avatar starts with http:', currentPlayer.avatar?.startsWith('http'))}
          <RoleAssignmentScreen 
            role={currentPlayer.role as Role} 
            avatar={currentPlayer.avatar}
            onAcknowledge={handleRoleAcknowledged} 
          />
        </>
      )}
      {gameState === "night" && currentPlayer && (
        <GameplayScreen 
          currentPlayer={currentPlayer} 
          players={getPublicPlayerData(players, currentPlayer.id)} 
          game={game}
          submitNightAction={submitNightAction}
          isConnected={isConnected}
          refreshGame={refreshGame}
          onComplete={handleNightComplete} 
        />
      )}
      {gameState === "resolution" && game?.nightResolution && (
        <NightResolutionScreen 
          resolution={game.nightResolution}
          onContinue={handleResolutionComplete}
          game={game}
          currentPlayer={currentPlayer}
        />
      )}
      {gameState === "task" && (
        <DiscussionPhaseScreen 
          onComplete={handleTaskComplete}
          game={game}
          gameId={game?.gameId}
          currentPlayerAddress={currentPlayer?.address}
          submitTaskAnswer={submitTaskAnswer}
        />
      )}
      {gameState === "voting" && currentPlayer && (
        <VotingScreen 
          players={getPublicPlayerData(players, currentPlayer.id, true)} 
          game={game}
          currentPlayer={currentPlayer}
          submitVote={submitVote}
          isConnected={isConnected}
          onComplete={handleVotingComplete} 
        />
      )}
      
      {/* Game Results Screen - Show when game is ended */}
      {game?.phase === 'ended' && (
        <>
          <GameResultsScreen 
            game={game}
            players={players}
            currentPlayer={currentPlayer}
            onNewGame={() => {
              setGameState('wallet')
              setHasSeenRole(false)
            }}
          />
        </>
      )}

      {/* Chat Component - Show in lobby and night phases */}
      {currentPlayer?.address && game?.gameId && (gameState === "lobby" || gameState === "night" || gameState === "task" || gameState === "voting") && (
        <ChatComponent 
          gameId={game.gameId} 
          currentPlayerAddress={currentPlayer.address}
          players={players}
        />
      )}

      {/* Task Component is now handled within DiscussionPhaseScreen as a tab */}
    </main>
  )
}
