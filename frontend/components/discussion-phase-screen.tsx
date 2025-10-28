"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PixelInput } from "@/components/ui/pixel-input"
import { useSocket } from "@/contexts/SocketContext"
import { Player } from "@/hooks/useGame" // Add this line
import TaskComponent from "./task-component"

interface DiscussionPhaseScreenProps {
  onComplete: () => void
  game?: any // Add game prop to get timer from backend
  gameId?: string // Add gameId for chat
  currentPlayerAddress?: string // Add current player address
  submitTaskAnswer?: (answer: any) => Promise<void> // Add task submission function
  players?: Player[] // Add players prop
}

interface Task {
  id: string
  title: string
  description: string
  type: 'decode' | 'puzzle' | 'quiz'
  completed: boolean
  reward: string
}

export default function DiscussionPhaseScreen({ onComplete, game, gameId, currentPlayerAddress, submitTaskAnswer, players }: DiscussionPhaseScreenProps) {
  const [timeLeft, setTimeLeft] = useState(30) // 30 seconds for discussion
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks'>('chat')
  const [hasTransitioned, setHasTransitioned] = useState(false)
  const { socket, sendChatMessage } = useSocket()
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Decode Space Signal',
      description: 'Decode the binary message from the space station',
      type: 'decode',
      completed: false,
      reward: '+50 XP'
    },
    {
      id: '2', 
      title: 'Identify Suspicious Behavior',
      description: 'Find clues about who might be the ASUR',
      type: 'puzzle',
      completed: false,
      reward: '+75 XP'
    },
    {
      id: '3',
      title: 'Vote Analysis',
      description: 'Analyze voting patterns to find the mafia',
      type: 'quiz',
      completed: false,
      reward: '+100 XP'
    },
    {
      id: '4',
      title: 'Evidence Collection',
      description: 'Gather evidence from the night phase',
      type: 'puzzle',
      completed: false,
      reward: '+60 XP'
    }
  ])
  const [messages, setMessages] = useState<Array<{
    id: string
    playerAddress: string
    message: string
    timestamp: number
  }>>([])

  // Listen for chat messages
  useEffect(() => {
    if (socket && gameId) {
      const handleChatMessage = (data: any) => {
        console.log('📨 Received chat message:', data)
        if (data.gameId === gameId) {
          console.log('📨 Adding message to UI:', data.message)
          setMessages(prev => [...prev, {
            id: `${data.playerAddress}-${data.timestamp}`,
            playerAddress: data.playerAddress,
            message: data.message,
            timestamp: data.timestamp
          }])
        } else {
          console.log('📨 Message gameId mismatch:', data.gameId, 'vs', gameId)
        }
      }

      socket.on('chat_message', handleChatMessage)
      
      return () => {
        socket.off('chat_message', handleChatMessage)
      }
    }
  }, [socket, gameId])

  // Real-time timer sync with backend
  useEffect(() => {
    if (game?.timeLeft !== undefined) {
      setTimeLeft(game.timeLeft)
      
      // Start local countdown to match backend
      if (game.timeLeft > 0) {
        const timer = setTimeout(() => {
          setTimeLeft(prev => Math.max(0, prev - 1))
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [game?.timeLeft])

  const handleSendMessage = () => {
    if (message.trim() && gameId && currentPlayerAddress && sendChatMessage) {
      try {
        sendChatMessage({
          gameId,
          playerAddress: currentPlayerAddress,
          message: message.trim(),
          timestamp: Date.now()
        })
      setMessage("")
        console.log('Chat message sent:', message.trim())
      } catch (error) {
        console.error('Failed to send chat message:', error)
      }
    }
  }

  const handleTaskComplete = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: true } : task
    ))
  }

  const completedTasks = tasks.filter(task => task.completed).length
  const totalTasks = tasks.length

  return (
    <div className="min-h-screen gaming-bg p-2 sm:p-4">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="p-2 sm:p-3 lg:p-4 border-b-2 border-[#4A8C4A] bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] relative">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-1 sm:space-y-0">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="text-lg sm:text-xl lg:text-2xl">💬</div>
              <h1 className="text-sm sm:text-base lg:text-lg font-press-start pixel-text-3d-white pixel-text-3d-float">DISCUSSION PHASE</h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="text-sm sm:text-base lg:text-lg font-press-start pixel-text-3d-green timer-pulse">
                ⏰ {timeLeft}s
              </div>
              <div className="w-2 h-2 bg-[#4A8C4A] animate-pulse rounded-none"></div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mt-3 sm:mt-4">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 sm:px-4 py-2 font-press-start text-xs sm:text-sm border-2 transition-all ${
                activeTab === 'chat'
                  ? 'bg-[#4A8C4A] border-[#4A8C4A] pixel-text-3d-white tab-active'
                  : 'bg-[#A259FF]/20 border-[#A259FF] pixel-text-3d-white hover:bg-[#A259FF]/30'
              }`}
            >
              💬 CHAT
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 sm:px-4 py-2 font-press-start text-xs sm:text-sm border-2 transition-all ${
                activeTab === 'tasks'
                  ? 'bg-[#4A8C4A] border-[#4A8C4A] pixel-text-3d-white tab-active'
                  : 'bg-[#A259FF]/20 border-[#A259FF] pixel-text-3d-white hover:bg-[#A259FF]/30'
              }`}
            >
              🎯 TASKS ({completedTasks}/{totalTasks})
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {activeTab === 'chat' ? (
            <>
              {/* Chat Messages */}
              <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto space-y-2 sm:space-y-3 bg-[#111111]/50 min-h-0">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 font-press-start text-sm">
                    No messages yet. Start the discussion!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const messagePlayer = players?.find(p => p.address === msg.playerAddress)
                    const isCurrentPlayer = msg.playerAddress === currentPlayerAddress
                    return (
                      <div key={msg.id} className="font-press-start text-xs sm:text-sm md:text-base pixel-text-3d-white bg-[#1A1A1A]/80 p-2 sm:p-3 md:p-4 border border-[#2A2A2A] chat-message-glow chat-message-enter">
                        <div className="flex items-center space-x-2">
                          {/* Player avatar - should always be available */}
                          {messagePlayer?.avatar && messagePlayer.avatar.startsWith('http') ? (
                            <img
                              src={messagePlayer.avatar}
                              alt={messagePlayer.name}
                              className="w-6 h-6 sm:w-8 sm:h-8 rounded-none object-cover"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          ) : (
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-700 flex items-center justify-center text-xs">?</div>
                          )}
                          <span className="text-[#4A8C4A]">
                            {isCurrentPlayer ? 'You' : messagePlayer?.name || 'Player'}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="mt-1">{msg.message}</div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          ) : (
            /* Tasks Tab - Real Task Component */
            <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto min-h-0">
              {gameId && currentPlayerAddress && submitTaskAnswer ? (
                <TaskComponent 
                  gameId={gameId}
                  currentPlayerAddress={currentPlayerAddress}
                  game={game}
                  submitTaskAnswer={submitTaskAnswer}
                  showHeader={false}
                />
              ) : (
                <div className="text-center text-gray-500 font-press-start text-sm">
                  Task system not available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 md:p-6 border-t-2 border-[#4A8C4A] bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] flex-shrink-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-4">
            <div className="flex-1 relative">
              <PixelInput
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full bg-[#1A1A1A] border-2 border-[#4A8C4A] text-white placeholder-[#666666] pixel-input-focus text-xs sm:text-sm md:text-base"
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-[#4A8C4A] text-xs font-press-start">
                {message.length}/100
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              variant="pixel"
              size="pixelLarge"
              className="px-4 sm:px-6 md:px-8 text-xs sm:text-sm md:text-base"
            >
              🚀 SEND
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
