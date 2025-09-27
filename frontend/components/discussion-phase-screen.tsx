"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PixelInput } from "@/components/ui/pixel-input"
import { useSocket } from "@/contexts/SocketContext"

interface DiscussionPhaseScreenProps {
  onComplete: () => void
  game?: any // Add game prop to get timer from backend
  gameId?: string // Add gameId for chat
  currentPlayerAddress?: string // Add current player address
}

interface Task {
  id: string
  title: string
  description: string
  type: 'decode' | 'puzzle' | 'quiz'
  completed: boolean
  reward: string
}

export default function DiscussionPhaseScreen({ onComplete, game, gameId, currentPlayerAddress }: DiscussionPhaseScreenProps) {
  const [timeLeft, setTimeLeft] = useState(60) // 60 seconds for discussion
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks'>('chat')
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
        if (data.gameId === gameId) {
          setMessages(prev => [...prev, {
            id: `${data.playerAddress}-${data.timestamp}`,
            playerAddress: data.playerAddress,
            message: data.message,
            timestamp: data.timestamp
          }])
        }
      }

      socket.on('chatMessage', handleChatMessage)
      
      return () => {
        socket.off('chatMessage', handleChatMessage)
      }
    }
  }, [socket, gameId])

  useEffect(() => {
    // Use backend timer if available, otherwise use local timer
    if (game?.timeLeft !== undefined) {
      setTimeLeft(game.timeLeft)
      
      if (game.timeLeft === 0) {
        onComplete()
      }
    } else {
      // Fallback to local timer
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
        return () => clearTimeout(timer)
      } else {
        onComplete()
      }
    }
  }, [timeLeft, onComplete, game?.timeLeft])

  const handleSendMessage = () => {
    if (message.trim() && gameId && currentPlayerAddress && sendChatMessage) {
      try {
        sendChatMessage(gameId, currentPlayerAddress, message.trim())
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
    <div className="min-h-screen gaming-bg p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-4 md:p-6 border-b-2 border-[#4A8C4A] bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] relative">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-xl sm:text-2xl md:text-3xl">💬</div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-press-start pixel-text-3d-white pixel-text-3d-float">DISCUSSION PHASE</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-base sm:text-lg md:text-xl font-press-start pixel-text-3d-green timer-pulse">
                ⏰ {timeLeft}s
              </div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#4A8C4A] animate-pulse rounded-none"></div>
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
                  messages.map((msg) => (
                    <div key={msg.id} className="font-press-start text-xs sm:text-sm md:text-base pixel-text-3d-white bg-[#1A1A1A]/80 p-2 sm:p-3 md:p-4 border border-[#2A2A2A] chat-message-glow chat-message-enter">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#4A8C4A]">
                          {msg.playerAddress === currentPlayerAddress ? '🎮 You' : '👤 Player'}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-1">{msg.message}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Task Panel */}
              <div className="w-full lg:w-80 xl:w-96 p-3 sm:p-4 md:p-6 border-t-2 lg:border-t-0 lg:border-l-2 border-[#4A8C4A] bg-[#0F0F0F]/80 flex-shrink-0">
                <h3 className="text-base sm:text-lg md:text-xl font-press-start pixel-text-3d-green mb-3 sm:mb-4">🎯 QUICK TASKS</h3>
                <div className="space-y-2 sm:space-y-3">
                  {tasks.slice(0, 3).map((task) => (
                    <div key={task.id} className={`p-2 sm:p-3 border-2 task-card-glow ${task.completed ? 'border-[#4A8C4A] bg-[#4A8C4A]/20 task-complete' : 'border-[#2A2A2A] bg-[#1A1A1A]/50'}`}>
                      <div className="font-press-start text-xs sm:text-sm pixel-text-3d-white mb-1">{task.title}</div>
                      <div className="font-press-start text-xs text-[#4A8C4A] mb-2">{task.reward}</div>
                      {!task.completed && (
                        <Button
                          onClick={() => handleTaskComplete(task.id)}
                          variant="pixel"
                          size="sm"
                          className="w-full text-xs"
                        >
                          ✅ COMPLETE
                        </Button>
                      )}
                      {task.completed && (
                        <div className="font-press-start text-xs pixel-text-3d-green">✅ COMPLETED</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Tasks Tab */
            <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {tasks.map((task) => (
                  <Card key={task.id} className={`p-3 sm:p-4 md:p-6 border-2 task-card-glow ${task.completed ? 'border-[#4A8C4A] bg-[#4A8C4A]/10 task-complete' : 'border-[#2A2A2A] bg-[#1A1A1A]/50'}`}>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="text-2xl sm:text-3xl">
                        {task.type === 'decode' ? '🔐' : task.type === 'puzzle' ? '🧩' : '❓'}
                      </div>
                      <div className="font-press-start text-xs sm:text-sm pixel-text-3d-green">{task.reward}</div>
                    </div>
                    <h4 className="font-press-start text-sm sm:text-base md:text-lg pixel-text-3d-white mb-2 sm:mb-3">{task.title}</h4>
                    <p className="font-press-start text-xs sm:text-sm text-[#CCCCCC] mb-3 sm:mb-4">{task.description}</p>
                    {task.type === 'decode' && (
                      <div className="font-press-start text-xs sm:text-sm pixel-text-3d-white bg-[#000000] p-2 sm:p-3 border border-[#4A8C4A] mb-3 sm:mb-4">
                        01001000 01100101 01101100 01110000
                      </div>
                    )}
                    {!task.completed ? (
                      <Button
                        onClick={() => handleTaskComplete(task.id)}
                        variant="pixel"
                        size="sm"
                        className="w-full text-xs sm:text-sm"
                      >
                        ✅ COMPLETE TASK
                      </Button>
                    ) : (
                      <div className="font-press-start text-xs sm:text-sm pixel-text-3d-green text-center">✅ TASK COMPLETED</div>
                    )}
                  </Card>
                ))}
              </div>
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
