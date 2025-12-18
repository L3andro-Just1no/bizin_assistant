'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ChatHeader } from './ChatHeader'
import { UpgradeModal } from './UpgradeModal'
import { DocumentUpload } from './DocumentUpload'
import { TypingIndicator } from './TypingIndicator'
import { FREE_MESSAGE_LIMIT } from '@/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { MessageSquare, X, FileText } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface WidgetProps {
  apiUrl?: string
  language?: 'pt' | 'en'
  theme?: 'light' | 'dark'
}

const TRANSLATIONS = {
  pt: {
    welcome: 'Olá! 👋 Sou o assistente da Bizin Portugal. Como posso ajudá-lo hoje?',
    inputPlaceholder: 'Escreva a sua mensagem...',
    sendButton: 'Enviar',
    upgradeTitle: 'Limite de mensagens atingido',
    upgradeDescription: 'Atualize para uma sessão paga para continuar a conversa, fazer upload de documentos e receber um relatório PDF personalizado.',
    upgradeButton: 'Atualizar agora - €49',
    remainingMessages: 'mensagens restantes',
    uploadDocuments: 'Carregar documentos',
    generateReport: 'Gerar relatório PDF',
    paidSession: 'Sessão paga',
    freeSession: 'Sessão gratuita',
  },
  en: {
    welcome: 'Hello! 👋 I\'m the Bizin Portugal assistant. How can I help you today?',
    inputPlaceholder: 'Type your message...',
    sendButton: 'Send',
    upgradeTitle: 'Message limit reached',
    upgradeDescription: 'Upgrade to a paid session to continue the conversation, upload documents and receive a personalized PDF report.',
    upgradeButton: 'Upgrade now - €49',
    remainingMessages: 'messages remaining',
    uploadDocuments: 'Upload documents',
    generateReport: 'Generate PDF report',
    paidSession: 'Paid session',
    freeSession: 'Free session',
  }
}

export function ChatWidget({ apiUrl = '', language = 'pt', theme = 'light' }: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const t = TRANSLATIONS[language]

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      // Check for existing session in localStorage
      const storedSessionId = localStorage.getItem('bizin_session_id')
      const storedPaid = localStorage.getItem('bizin_session_paid') === 'true'
      
      if (storedSessionId) {
        setSessionId(storedSessionId)
        setIsPaid(storedPaid)
        // Load existing messages
        try {
          const res = await fetch(`${apiUrl}/api/sessions/${storedSessionId}`)
          if (res.ok) {
            const data = await res.json()
            setMessageCount(data.session.message_count || 0)
            if (data.messages) {
              setMessages(data.messages.map((m: { id: string; role: 'user' | 'assistant'; content: string; created_at: string }) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                createdAt: new Date(m.created_at)
              })))
            }
            return
          }
        } catch {
          // Session not found, create new one
        }
      }

      // Create new session
      try {
        const res = await fetch(`${apiUrl}/api/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language })
        })
        if (res.ok) {
          const data = await res.json()
          setSessionId(data.session.id)
          localStorage.setItem('bizin_session_id', data.session.id)
          localStorage.setItem('bizin_session_paid', 'false')
          
          // Add welcome message
          setMessages([{
            id: uuidv4(),
            role: 'assistant',
            content: t.welcome,
            createdAt: new Date()
          }])
        }
      } catch (error) {
        console.error('Failed to create session:', error)
      }
    }

    if (isOpen && !sessionId) {
      initSession()
    }
  }, [isOpen, sessionId, apiUrl, language, t.welcome])

  // Check for payment completion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentSuccess = urlParams.get('payment_success')
    const paidSessionId = urlParams.get('session_id')
    
    if (paymentSuccess === 'true' && paidSessionId) {
      setIsPaid(true)
      setSessionId(paidSessionId)
      localStorage.setItem('bizin_session_id', paidSessionId)
      localStorage.setItem('bizin_session_paid', 'true')
      setIsOpen(true)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId || isLoading) return

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      createdAt: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setMessageCount(prev => prev + 1)

    try {
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: content
        })
      })

      if (res.ok) {
        const data = await res.json()

        const assistantMessage: Message = {
          id: data.message.id,
          role: 'assistant',
          content: data.message.content,
          createdAt: new Date(data.message.created_at)
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // Handle error
        const errorMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: language === 'pt' 
            ? 'Desculpe, ocorreu um erro. Por favor, tente novamente.'
            : 'Sorry, an error occurred. Please try again.',
          createdAt: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, isLoading, isPaid, messageCount, apiUrl, language])

  const handleUpgrade = async () => {
    if (!sessionId) return

    try {
      const res = await fetch(`${apiUrl}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      })

      if (res.ok) {
        const data = await res.json()
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error)
    }
  }

  const handleGenerateReport = async () => {
    if (!sessionId || !isPaid) return

    try {
      const res = await fetch(`${apiUrl}/api/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      })

      if (res.ok) {
        const data = await res.json()
        window.open(data.report.url, '_blank')
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
    }
  }

  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 z-50"
          aria-label="Open chat"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat widget */}
      {isOpen && (
        <div 
          className={`fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border ${
            theme === 'dark' 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          <ChatHeader 
            isPaid={isPaid}
            language={language}
            theme={theme}
            onClose={() => setIsOpen(false)}
          />

          {/* Status bar */}
          <div className={`px-4 py-2 flex items-center justify-between text-xs ${
            theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'
          }`}>
            <span className={`flex items-center gap-1.5 ${isPaid ? 'text-emerald-600' : 'text-gray-500'}`}>
              <span className={`w-2 h-2 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              {isPaid ? t.paidSession : t.freeSession}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  theme={theme}
                  apiUrl={apiUrl}
                />
              ))}
              {isLoading && <TypingIndicator theme={theme} />}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Paid session actions */}
          {isPaid && (
            <div className={`px-4 py-3 border-t flex gap-2 ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDocumentUpload(true)}
                className="flex-1 text-xs"
              >
                <FileText className="w-3 h-3 mr-1" />
                {t.uploadDocuments}
              </Button>
              <Button
                size="sm"
                onClick={handleGenerateReport}
                className="flex-1 text-xs bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
              >
                {t.generateReport}
              </Button>
            </div>
          )}

          {/* Input */}
          <ChatInput 
            onSend={sendMessage}
            isLoading={isLoading}
            disabled={!isPaid && messageCount >= FREE_MESSAGE_LIMIT}
            placeholder={t.inputPlaceholder}
            theme={theme}
            apiUrl={apiUrl}
          />
        </div>
      )}


      {/* Document Upload Modal */}
      {showDocumentUpload && sessionId && (
        <DocumentUpload
          sessionId={sessionId}
          apiUrl={apiUrl}
          language={language}
          theme={theme}
          onClose={() => setShowDocumentUpload(false)}
        />
      )}
    </>
  )
}

