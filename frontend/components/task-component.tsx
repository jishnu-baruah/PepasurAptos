"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Game } from "@/services/api"

interface TaskComponentProps {
  gameId: string
  currentPlayerAddress: string
  game: Game | null
  submitTaskAnswer: (answer: any) => Promise<void>
}

export default function TaskComponent({ gameId, currentPlayerAddress, game, submitTaskAnswer }: TaskComponentProps) {
  const [answer, setAnswer] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null)
  
  // Get timeLeft from game prop
  const timeLeft = game?.timeLeft || 0

  // Check if player already submitted
  useEffect(() => {
    if (game?.task?.submissions?.[currentPlayerAddress]) {
      setSubmitted(true)
      setAnswer(game.task.submissions[currentPlayerAddress])
    }
  }, [game?.task?.submissions, currentPlayerAddress])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim() || submitted) return

    try {
      await submitTaskAnswer(answer.trim())
      setSubmitted(true)
      console.log('Task answer submitted:', answer)
    } catch (error) {
      console.error('Failed to submit task answer:', error)
    }
  }

  const renderTaskContent = () => {
    if (!game?.task) return null

    switch (game.task.type) {
      case 'sequence':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-press-start text-white mb-2">SEQUENCE TASK</h3>
              <p className="text-gray-300 text-sm">Arrange the numbers in the correct order:</p>
            </div>
            <div className="flex justify-center gap-2">
              {game.task.data.shuffled.map((num: number, index: number) => (
                <div key={index} className="w-12 h-12 bg-[#333] border border-[#666] flex items-center justify-center text-white font-press-start">
                  {num}
                </div>
              ))}
            </div>
            <div className="text-center text-gray-400 text-xs">
              Enter your answer as comma-separated numbers (e.g., 1,2,3,4)
            </div>
          </div>
        )

      case 'memory':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-press-start text-white mb-2">MEMORY TASK</h3>
              <p className="text-gray-300 text-sm">Remember the order of these items:</p>
            </div>
            <div className="flex justify-center gap-2">
              {game.task.data.shuffled.map((item: string, index: number) => (
                <div key={index} className="px-3 py-2 bg-[#333] border border-[#666] text-white font-press-start text-sm">
                  {item}
                </div>
              ))}
            </div>
            <div className="text-center text-gray-400 text-xs">
              Enter your answer as comma-separated items (e.g., apple,banana,cherry)
            </div>
          </div>
        )

      case 'hash':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-press-start text-white mb-2">HASH TASK</h3>
              <p className="text-gray-300 text-sm">Complete this hash fragment:</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono text-white bg-[#333] p-4 border border-[#666]">
                {game.task.data.fragment}...
              </div>
            </div>
            <div className="text-center text-gray-400 text-xs">
              Enter the complete hash
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center text-gray-400">
            Unknown task type: {game.task.type}
          </div>
        )
    }
  }

  if (!game?.task) {
    return (
      <Card className="p-6 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a] text-center">
        <div className="font-press-start text-white">WAITING FOR TASK...</div>
      </Card>
    )
  }

  return (
    <div className="min-h-screen p-4 gaming-bg">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-press-start text-white pixel-text-3d-glow">TASK PHASE</h1>
          <div className="text-sm text-gray-400 mt-2">
            Complete the task to continue
          </div>
        </div>

        {/* Timer */}
        <Card className="p-4 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a] text-center">
          <div className="text-lg font-press-start text-white mb-2">TIME REMAINING</div>
          <div className="text-4xl font-bold font-press-start text-red-500 pixel-text-3d-float">
            {timeLeft || 0}s
          </div>
        </Card>

        {/* Task Content */}
        <Card className="p-6 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a]">
          {renderTaskContent()}
        </Card>

        {/* Answer Form */}
        <Card className="p-6 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-press-start text-white mb-2">
                Your Answer:
              </label>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter your answer..."
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] text-white rounded-none focus:outline-none focus:border-blue-500"
                disabled={submitted}
              />
            </div>
            
            <div className="flex justify-center">
              <Button
                type="submit"
                variant="pixel"
                size="pixelLarge"
                disabled={!answer.trim() || submitted}
              >
                {submitted ? 'SUBMITTED' : 'SUBMIT ANSWER'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Status */}
        {submitted && (
          <Card className="p-4 bg-green-900/20 border border-green-500 text-center">
            <div className="font-press-start text-green-300">
              ✓ ANSWER SUBMITTED
            </div>
            <div className="text-sm text-green-200 mt-1">
              Waiting for other players...
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}


