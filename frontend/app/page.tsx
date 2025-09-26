"use client"

import { useState, useEffect } from "react"
import LoaderScreen from "@/components/loader-screen"
import WalletConnectScreen from "@/components/wallet-connect-screen"
import LobbyScreen from "@/components/lobby-screen"
import RoleAssignmentScreen from "@/components/role-assignment-screen"
import GameplayScreen from "@/components/gameplay-screen"
import DiscussionPhaseScreen from "@/components/discussion-phase-screen"
import VotingScreen from "@/components/voting-screen"

export type GameState = "loader" | "wallet" | "lobby" | "role-assignment" | "gameplay" | "discussion" | "voting"
export type Role = "ASUR" | "DEVA" | "RISHI" | "MANAV"
export type Player = {
  id: string
  name: string
  avatar: string
  role?: Role
  isAlive: boolean
  isCurrentPlayer?: boolean // To identify the current player
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("loader")
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [walletConnected, setWalletConnected] = useState(false)

  // Auto-advance from loader after 3 seconds
  useEffect(() => {
    if (gameState === "loader") {
      const timer = setTimeout(() => {
        setGameState("wallet")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [gameState])

  const handleWalletConnect = () => {
    setWalletConnected(true)
    // Simulate wallet connection
    console.log("[v0] Wallet connected")
  }

  const handleJoinGame = () => {
    setGameState("lobby")
    // Add current player to lobby with 5 other players (6 total)
    const newPlayer: Player = {
      id: "player-1",
      name: "Player 1",
      avatar: "🚀",
      isAlive: true,
    }
    setCurrentPlayer(newPlayer)
    
    // Create 6 players total
    const allPlayers: Player[] = [
      newPlayer,
      { id: "player-2", name: "Player 2", avatar: "👾", isAlive: true },
      { id: "player-3", name: "Player 3", avatar: "🤖", isAlive: true },
      { id: "player-4", name: "Player 4", avatar: "👽", isAlive: true },
      { id: "player-5", name: "Player 5", avatar: "🛸", isAlive: true },
      { id: "player-6", name: "Player 6", avatar: "⭐", isAlive: true },
    ]
    setPlayers(allPlayers)
  }

  const handleCreateLobby = () => {
    setGameState("lobby")
    const newPlayer: Player = {
      id: "host",
      name: "Host",
      avatar: "👑",
      isAlive: true,
    }
    setCurrentPlayer(newPlayer)
    
    // Create 6 players total for host
    const allPlayers: Player[] = [
      newPlayer,
      { id: "player-2", name: "Player 2", avatar: "👾", isAlive: true },
      { id: "player-3", name: "Player 3", avatar: "🤖", isAlive: true },
      { id: "player-4", name: "Player 4", avatar: "👽", isAlive: true },
      { id: "player-5", name: "Player 5", avatar: "🛸", isAlive: true },
      { id: "player-6", name: "Player 6", avatar: "⭐", isAlive: true },
    ]
    setPlayers(allPlayers)
  }

  const handleStartGame = () => {
    // Assign roles for 6 players: 1 ASUR, 1 DEVA, 1 RISHI, 3 MANAV
    const roles: Role[] = ["ASUR", "DEVA", "RISHI", "MANAV", "MANAV", "MANAV"]
    
    // Shuffle roles randomly
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5)
    
    // Define avatar mapping for each role
    const getAvatarForRole = (role: Role): string => {
      switch (role) {
        case "ASUR":
          return "https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/asur.png?updatedAt=1758922659571"
        case "DEVA":
          return "https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/dev.png?updatedAt=1758923141278"
        case "RISHI":
          return "https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/sage.png?updatedAt=1758922659655"
        case "MANAV":
          // Randomly assign one of the villager avatars
          const villagerAvatars = [
            "https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/blueShirt.png?updatedAt=1758922659560",
            "https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/richKid.png?updatedAt=1758922659555",
            "https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/spacePepe.png?updatedAt=1758922659529",
            "https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/headphone.png?updatedAt=1758922659505",
            "https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/hoodie.png?updatedAt=1758922659494"
          ]
          return villagerAvatars[Math.floor(Math.random() * villagerAvatars.length)]
        default:
          return "🚀"
      }
    }
    
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      role: shuffledRoles[index],
      avatar: getAvatarForRole(shuffledRoles[index]),
    }))
    setPlayers(updatedPlayers)

    if (currentPlayer) {
      const updatedCurrentPlayer = updatedPlayers.find((p) => p.id === currentPlayer.id)
      setCurrentPlayer(updatedCurrentPlayer || currentPlayer)
    }

    setGameState("role-assignment")
  }

  const handleRoleAcknowledged = () => {
    setGameState("gameplay")
  }

  const handleGameplayComplete = (killedPlayer?: Player) => {
    // Mark the killed player as not alive
    if (killedPlayer) {
      setPlayers(prevPlayers => 
        prevPlayers.map(player => 
          player.id === killedPlayer.id 
            ? { ...player, isAlive: false }
            : player
        )
      )
    }
    setGameState("discussion")
  }

  const handleDiscussionComplete = () => {
    setGameState("voting")
  }

  const handleVotingComplete = () => {
    setGameState("gameplay") // Loop back to gameplay
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
      {gameState === "loader" && <LoaderScreen />}
      {gameState === "wallet" && (
        <WalletConnectScreen
          onConnect={handleWalletConnect}
          onJoinGame={handleJoinGame}
          onCreateLobby={handleCreateLobby}
          walletConnected={walletConnected}
        />
      )}
      {gameState === "lobby" && currentPlayer && (
        <LobbyScreen 
          players={getPublicPlayerData(players, currentPlayer.id)} 
          onStartGame={handleStartGame} 
        />
      )}
      {gameState === "role-assignment" && currentPlayer?.role && (
        <RoleAssignmentScreen 
          role={currentPlayer.role} 
          avatar={currentPlayer.avatar}
          onAcknowledge={handleRoleAcknowledged} 
        />
      )}
      {gameState === "gameplay" && currentPlayer && (
        <GameplayScreen 
          currentPlayer={currentPlayer} 
          players={getPublicPlayerData(players, currentPlayer.id)} 
          onComplete={handleGameplayComplete} 
        />
      )}
      {gameState === "discussion" && (
        <DiscussionPhaseScreen onComplete={handleDiscussionComplete} />
      )}
      {gameState === "voting" && currentPlayer && (
        <VotingScreen 
          players={getPublicPlayerData(players, currentPlayer.id, true)} 
          onComplete={handleVotingComplete} 
        />
      )}
    </main>
  )
}
