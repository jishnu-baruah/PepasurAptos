"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface ChatModalProps {
  onComplete: () => void
}

export default function ChatModal({ onComplete }: ChatModalProps) {
  const [timeLeft, setTimeLeft] = useState(30)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<string[]>([
    "Player1: Anyone suspicious?",
    "Player2: I think Player3 is acting weird...",
    "Player3: I was just observing!",
  ])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      onComplete()
    }
  }, [timeLeft, onComplete])

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, `You: ${message}`])
      setMessage("")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-96 bg-card border-2 border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="text-xl font-mono text-foreground">💬 DISCUSSION PHASE</h3>
          <div className="text-lg font-mono text-[color:var(--color-neon-cyan)]">{timeLeft}s</div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2">
          {messages.map((msg, i) => (
            <div key={i} className="font-mono text-sm text-foreground bg-muted/20 p-2 rounded">
              {msg}
            </div>
          ))}
        </div>

        {/* Task Panel */}
        <div className="p-4 border-t border-border bg-muted/10">
          <div className="text-sm font-mono text-muted-foreground mb-2">📋 MINI-TASK: Decode the space signal</div>
          <div className="font-mono text-xs text-foreground bg-background p-2 rounded border">
            01001000 01100101 01101100 01110000
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 font-mono bg-background border-border"
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button
            onClick={handleSendMessage}
            className="pixel-btn bg-primary hover:bg-primary/80 text-primary-foreground font-mono"
          >
            SEND
          </Button>
        </div>
      </Card>
    </div>
  )
}
