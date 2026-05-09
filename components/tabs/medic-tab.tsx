'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Heart, MessageCircle, Wind, AlertCircle, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatMessage } from '@/lib/types'

const quickPrompts = [
  { icon: Heart, label: 'Ansiedad', prompt: 'Estoy sintiendo mucha ansiedad y no puedo calmarme, ¿qué puedo hacer?' },
  { icon: Wind, label: 'Respiración', prompt: '¿Puedes guiarme en un ejercicio de respiración para calmarme?' },
  { icon: MessageCircle, label: 'Hablar', prompt: 'Necesito hablar con alguien, me siento muy solo/a' },
  { icon: Smile, label: 'Técnicas', prompt: '¿Cuáles son técnicas rápidas para manejar el estrés?' },
]

const offlineResponses: Record<string, string> = {
  ansiedad: `**Técnica 5-4-3-2-1 para ansiedad:**\nNombra en voz alta:\n• 5 cosas que puedes VER\n• 4 cosas que puedes TOCAR\n• 3 cosas que puedes OÍR\n• 2 cosas que puedes OLER\n• 1 cosa que puedes SABOREAR\n\nEsto ancla tu mente al presente. 💙`,
  respiracion: `**Respiración cuadrada (Box Breathing):**\n1. Inhala contando 4 segundos\n2. Retén el aire 4 segundos\n3. Exhala contando 4 segundos\n4. Pausa 4 segundos\n\nRepite 4-6 veces. Usado por fuerzas de élite para calmarse. 🌬️`,
  crisis: `**Si estás en crisis emocional:**\n\n🆘 Líneas de apoyo México:\n• SAPTEL: 55 5259-8121 (24h)\n• CONASAMA: 800 290-0024\n• Cruz Roja: 065\n\nNo estás solo/a. Hay personas que quieren ayudarte. 💙`,
  estres: `**Técnicas rápidas anti-estrés:**\n• Mueve los hombros en círculos\n• Agua fría en muñecas\n• Cuenta hacia atrás desde 10\n• Haz una lista de 3 cosas por las que estás agradecido/a\n• Estira el cuello suavemente`,
}

function getOfflineResponse(prompt: string): string | null {
  const lower = prompt.toLowerCase()
  if (lower.includes('ansied') || lower.includes('pánico') || lower.includes('angustia')) return offlineResponses.ansiedad
  if (lower.includes('respira') || lower.includes('calmar')) return offlineResponses.respiracion
  if (lower.includes('crisis') || lower.includes('solo') || lower.includes('llorar') || lower.includes('triste')) return offlineResponses.crisis
  if (lower.includes('estrés') || lower.includes('estres') || lower.includes('técnica')) return offlineResponses.estres
  return null
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'initial',
  role: 'assistant',
  content: `¡Hola! Soy tu Acompañante de Bienestar Psicológico 💙\n\nEstoy aquí para escucharte y apoyarte con:\n\n• **Manejo de ansiedad y estrés** — técnicas y respiración\n• **Apoyo emocional** — un espacio seguro para hablar\n• **Recursos de crisis** — si necesitas ayuda urgente\n• **Bienestar mental** — hábitos y técnicas de autocuidado\n\n⚠️ Si estás en una emergencia emocional o en riesgo, llama al **SAPTEL: 55 5259-8121** (24 horas).\n\n¿Cómo te sientes hoy?`,
  timestamp: new Date(),
}

export function MedicTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = (messageText: string) => {
    if (!messageText.trim() || isLoading) return
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    setTimeout(() => {
      const offline = getOfflineResponse(messageText)
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: offline || `💙 Recuerda que lo que sientes es válido.\n\nSi necesitas hablar con alguien:\n• **SAPTEL:** 55 5259-8121\n• **CONASAMA:** 800 290-0024`,
        timestamp: new Date(),
      }])
      setIsLoading(false)
    }, 600)
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input) }


  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] pb-24">
      <Card className="mb-4 border-primary/30 bg-primary/5">
        <CardContent className="p-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
          <p className="text-sm">
            <strong>¿Crisis emocional?</strong>{' '}
            <a href="tel:5552598121" className="text-primary underline font-bold">SAPTEL: 55 5259-8121</a>{' '}
            (24 horas, gratis)
          </p>
        </CardContent>
      </Card>

      <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.map((message) => (
            <div key={message.id} className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className={cn('max-w-[85%] rounded-2xl px-4 py-3', message.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card border border-border rounded-bl-md')}>
                <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                <p className={cn("text-xs mt-2 opacity-60", message.role === 'user' ? 'text-right' : '')}>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0"><Bot className="w-5 h-5 text-primary" /></div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary animate-pulse" /><span className="text-sm text-muted-foreground">Escribiendo...</span></div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
        {quickPrompts.map((prompt) => {
          const Icon = prompt.icon
          return (
            <Button key={prompt.label} variant="outline" size="sm" onClick={() => sendMessage(prompt.prompt)} disabled={isLoading} className="flex-shrink-0">
              <Icon className="w-4 h-4 mr-1.5" />{prompt.label}
            </Button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="¿Cómo te sientes? Estoy aquí para escucharte..." className="min-h-[44px] max-h-[120px] resize-none" rows={1}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) } }} />
        <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-[44px] w-[44px] flex-shrink-0"><Send className="w-5 h-5" /></Button>
      </form>
    </div>
  )
}
