"use client"

import { useState, useEffect } from "react"
import LoaderScreen from "@/components/loader-screen"
import WalletConnectScreen from "@/components/wallet-connect-screen"
import LobbyScreen from "@/components/lobby-screen"
import RoleAssignmentScreen from "@/components/role-assignment-screen"
import GameplayScreen from "@/components/gameplay-screen"
import VotingScreen from "@/components/voting-screen"

export type GameState = "loader" | "wallet" | "lobby" | "role-assignment" | "gameplay" | "voting"
export type Role = "ASUR" | "DEVA" | "MANAV"
export type Player = {
  id: string
  name: string
  avatar: string
  role?: Role
  isAlive: boolean
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
    // Add current player to lobby
    const newPlayer: Player = {
      id: "player-1",
      name: "Player 1",
      avatar: "🚀",
      isAlive: true,
    }
    setCurrentPlayer(newPlayer)
    setPlayers([newPlayer])
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
    setPlayers([newPlayer])
  }

  const handleStartGame = () => {
    // Assign random roles
    const roles: Role[] = ["ASUR", "DEVA", "MANAV"]
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      role: roles[index % roles.length],
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

  const handleGameplayComplete = () => {
    setGameState("voting")
  }

  const handleVotingComplete = () => {
    setGameState("gameplay") // Loop back to gameplay
  }

  return (
    <main className="min-h-screen gaming-bg relative overflow-hidden">
      {gameState === "loader" && <LoaderScreen />}
      {gameState === "wallet" && (
        <WalletConnectScreen
          onConnect={handleWalletConnect}
          onJoinGame={handleJoinGame}
          onCreateLobby={handleCreateLobby}
          walletConnected={walletConnected}
        />
      )}
      {gameState === "lobby" && <LobbyScreen players={players} onStartGame={handleStartGame} />}
      {gameState === "role-assignment" && currentPlayer?.role && (
        <RoleAssignmentScreen role={currentPlayer.role} onAcknowledge={handleRoleAcknowledged} />
      )}
      {gameState === "gameplay" && currentPlayer && (
        <GameplayScreen currentPlayer={currentPlayer} players={players} onComplete={handleGameplayComplete} />
      )}
      {gameState === "voting" && <VotingScreen players={players} onComplete={handleVotingComplete} />}
    </main>
  )
}
