'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Heart, Droplets, Flame, Pill, AlertCircle, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatMessage } from '@/lib/types'

const quickPrompts = [
  { icon: Heart, label: 'RCP', prompt: '¿Cómo realizo RCP a un adulto?' },
  { icon: Droplets, label: 'Sangrado', prompt: '¿Cómo detengo una hemorragia severa?' },
  { icon: Flame, label: 'Quemaduras', prompt: '¿Cómo trato una quemadura?' },
  { icon: Pill, label: 'Atragantamiento', prompt: '¿Qué hago si alguien se está atragantando?' },
  { icon: Activity, label: 'Inconsciente', prompt: '¿Qué hago si alguien está inconsciente?' },
]

const offlineResponses: Record<string, string> = {
  rcp: `**RCP en Adulto:**\n1. Verifica seguridad del entorno\n2. Sacude y grita "¿Estás bien?"\n3. Llama al 911\n4. Coloca talón en centro del pecho\n5. 30 compresiones (5 cm, 100-120/min)\n6. 2 respiraciones de rescate\n7. Repite 30:2 hasta que llegue ayuda`,
  sangrado: `**Control de Hemorragia:**\n1. Usa guantes si disponibles\n2. Aplica presión directa con tela limpia\n3. Mantén 10-15 min SIN levantar\n4. Si empapa, agrega más tela\n5. Para extremidades: torniquete 5 cm sobre herida\n6. Llama al 911`,
  quemadura: `**Quemaduras:**\n1. Aleja de la fuente\n2. Agua fresca 15-20 min (NO hielo)\n3. Retira ropa/joyería si no están pegadas\n4. Cubre con gasa estéril húmeda\n5. NO: mantequilla, pasta dental\n6. Busca atención médica si es grande`,
  atragantamiento: `**Maniobra de Heimlich:**\n1. "¿Te estás atragantando?"\n2. Párate detrás, inclina hacia adelante\n3. 5 golpes fuertes en espalda\n4. 5 compresiones: manos bajo esternón, jalón hacia adentro/arriba\n5. Alterna hasta expulsar\n6. Si pierde conciencia: RCP`,
}

function getOfflineResponse(prompt: string): string | null {
  const lower = prompt.toLowerCase()
  if (lower.includes('rcp') || lower.includes('inconsciente') || lower.includes('no respira')) return offlineResponses.rcp
  if (lower.includes('sangr') || lower.includes('hemorr')) return offlineResponses.sangrado
  if (lower.includes('quemad')) return offlineResponses.quemadura
  if (lower.includes('atragant') || lower.includes('chok')) return offlineResponses.atragantamiento
  return null
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'initial',
  role: 'assistant',
  content: `¡Hola! Soy tu Asistente Paramédico IA. Puedo ayudarte con:\n\n• **Primeros Auxilios** — RCP, sangrado, quemaduras\n• **Emergencias** — Pasos claros para actuar rápido\n• **Orientación** — Qué hacer mientras llega la ayuda\n\n⚠️ **En emergencia que amenace la vida, llama al 911 primero.**`,
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

  const sendMessage = async (messageText: string) => {
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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })) }),
      })
      if (!response.ok) throw new Error('API error')
      const data = await response.json()
      setMessages((prev) => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: data.message, timestamp: new Date() }])
    } catch {
      const offline = getOfflineResponse(messageText)
      setMessages((prev) => [...prev, {
        id: (Date.now()+1).toString(),
        role: 'assistant',
        content: offline || '⚠️ Sin conexión. Usa los botones de acceso rápido para instrucciones básicas. Llama al **911** en emergencias.',
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input) }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] pb-24">
      <Card className="mb-4 border-destructive bg-destructive/10">
        <CardContent className="p-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm"><strong>¿Emergencia?</strong> Llama al <a href="tel:911" className="text-primary underline font-bold">911</a> de inmediato.</p>
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
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary animate-pulse" /><span className="text-sm text-muted-foreground">Analizando...</span></div>
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
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe la emergencia..." className="min-h-[44px] max-h-[120px] resize-none" rows={1}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) } }} />
        <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-[44px] w-[44px] flex-shrink-0"><Send className="w-5 h-5" /></Button>
      </form>
    </div>
  )
}
