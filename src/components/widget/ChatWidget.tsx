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
  language?: 'pt' | 'en' | 'fr' | 'es'
  theme?: 'light' | 'dark'
}

const TRANSLATIONS = {
  pt: {
    welcome: 'Olá! Como posso ajudá-lo hoje? Está interessado em informações sobre fundos europeus, incentivos fiscais, programas de apoio ou outras questões relacionadas com empreendedorismo em Portugal?',
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
    restartTitle: 'Reiniciar conversa',
  },
  en: {
    welcome: 'Hello! How can I help you today? Are you interested in information about European funds, tax incentives, support programs or other issues related to entrepreneurship in Portugal?',
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
    restartTitle: 'Restart conversation',
  },
  fr: {
    welcome: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ? Êtes-vous intéressé par des informations sur les fonds européens, les incitations fiscales, les programmes de soutien ou d\'autres questions liées à l\'entrepreneuriat au Portugal ?',
    inputPlaceholder: 'Tapez votre message...',
    sendButton: 'Envoyer',
    upgradeTitle: 'Limite de messages atteinte',
    upgradeDescription: 'Passez à une session payante pour continuer la conversation, télécharger des documents et recevoir un rapport PDF personnalisé.',
    upgradeButton: 'Mettre à niveau maintenant - €49',
    remainingMessages: 'messages restants',
    uploadDocuments: 'Télécharger des documents',
    generateReport: 'Générer un rapport PDF',
    paidSession: 'Session payante',
    freeSession: 'Session gratuite',
    restartTitle: 'Redémarrer la conversation',
  },
  es: {
    welcome: '¡Hola! ¿Cómo puedo ayudarte hoy? ¿Estás interesado en información sobre fondos europeos, incentivos fiscales, programas de apoyo u otras cuestiones relacionadas con el emprendimiento en Portugal?',
    inputPlaceholder: 'Escribe tu mensaje...',
    sendButton: 'Enviar',
    upgradeTitle: 'Límite de mensajes alcanzado',
    upgradeDescription: 'Actualiza a una sesión de pago para continuar la conversación, subir documentos y recibir un informe PDF personalizado.',
    upgradeButton: 'Actualizar ahora - €49',
    remainingMessages: 'mensajes restantes',
    uploadDocuments: 'Subir documentos',
    generateReport: 'Generar informe PDF',
    paidSession: 'Sesión de pago',
    freeSession: 'Sesión gratuita',
    restartTitle: 'Reiniciar conversación',
  }
}

// Language detection utility (client-side only)
function detectLanguage(): 'pt' | 'en' | 'fr' | 'es' {
  // Check if we're in the browser
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 'pt' // Default for SSR
  }

  // Map common language codes to our supported languages
  const langMap: Record<string, 'pt' | 'en' | 'fr' | 'es'> = {
    'pt': 'pt',
    'pt-pt': 'pt',
    'pt-br': 'pt',
    'português': 'pt',
    'portuguese': 'pt',
    'en': 'en',
    'en-us': 'en',
    'en-gb': 'en',
    'english': 'en',
    'inglês': 'en',
    'fr': 'fr',
    'fr-fr': 'fr',
    'french': 'fr',
    'français': 'fr',
    'francês': 'fr',
    'es': 'es',
    'es-es': 'es',
    'es-mx': 'es',
    'spanish': 'es',
    'español': 'es',
    'espanhol': 'es',
  }

  let detected: 'pt' | 'en' | 'fr' | 'es' = 'pt'
  let detectionMethod = 'default'

  // Method 1: Check localStorage (common in Next.js i18n)
  try {
    const storedLang = localStorage.getItem('language') || 
                      localStorage.getItem('locale') || 
                      localStorage.getItem('i18nextLng') ||
                      localStorage.getItem('preferred-language')
    if (storedLang) {
      const mapped = langMap[storedLang.toLowerCase()]
      if (mapped) {
        detected = mapped
        detectionMethod = 'localStorage'
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }

  // Method 2: Check URL path (e.g., /en/, /pt/, /en-us/, etc.)
  if (detectionMethod === 'default') {
    const pathname = window.location.pathname
    // Match /pt, /en, /fr, /es at start of path (with or without trailing content)
    const pathMatch = pathname.match(/^\/(pt|en|fr|es)(?:[-_][a-z]+)?(\/|$)/i)
    if (pathMatch) {
      detected = pathMatch[1].toLowerCase() as 'pt' | 'en' | 'fr' | 'es'
      detectionMethod = 'URL path'
    }
  }

  // Method 3: Check document lang attribute
  if (detectionMethod === 'default') {
    const docLang = document.documentElement.lang
    if (docLang) {
      const baseLang = docLang.toLowerCase().split('-')[0]
      const mapped = langMap[docLang.toLowerCase()] || langMap[baseLang]
      if (mapped) {
        detected = mapped
        detectionMethod = 'document.lang'
      }
    }
  }

  // Method 4: Look for language selector text
  if (detectionMethod === 'default') {
    const langElements = document.querySelectorAll('[class*="language"], [class*="locale"], [data-language], [lang]')
    for (const el of Array.from(langElements)) {
      const text = el.textContent?.toLowerCase() || ''
      const dataLang = el.getAttribute('data-language')?.toLowerCase()
      const lang = el.getAttribute('lang')?.toLowerCase()
      
      const searchText = `${text} ${dataLang} ${lang}`
      for (const [key, value] of Object.entries(langMap)) {
        if (searchText.includes(key)) {
          detected = value
          detectionMethod = 'DOM search'
          break
        }
      }
      if (detectionMethod === 'DOM search') break
    }
  }

  // Method 5: Check for Next.js i18n cookie
  if (detectionMethod === 'default') {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'NEXT_LOCALE' || name === 'locale' || name === 'language') {
        const mapped = langMap[value.toLowerCase()]
        if (mapped) {
          detected = mapped
          detectionMethod = 'cookie'
          break
        }
      }
    }
  }

  // Method 6: Fallback to navigator language
  if (detectionMethod === 'default') {
    const navLang = navigator.language
    const baseLang = navLang.toLowerCase().split('-')[0]
    const mapped = langMap[navLang.toLowerCase()] || langMap[baseLang]
    if (mapped) {
      detected = mapped
      detectionMethod = 'navigator.language'
    }
  }
  
  // Only log on initial detection, not continuously
  if (detectionMethod !== 'default') {
    console.log('🌍 Language Detection:', {
      'method': detectionMethod,
      'detected': detected
    })
  }

  return detected
}

export function ChatWidget({ apiUrl = '', language: initialLanguage = 'pt', theme = 'light' }: WidgetProps) {
  // Start with default, detect on client mount
  const [currentLanguage, setCurrentLanguage] = useState<'pt' | 'en' | 'fr' | 'es'>('pt')
  const [isOpen, setIsOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const t = TRANSLATIONS[currentLanguage]

  // Detect language once on mount (trust what the site passes)
  useEffect(() => {
    const detectedLanguage = detectLanguage()
    if (detectedLanguage !== currentLanguage) {
      console.log('🌍 Initial language detection:', detectedLanguage)
      setCurrentLanguage(detectedLanguage)
    }
  }, [])

  // Watch for language changes from the site (via MutationObserver for HTML lang attribute)
  useEffect(() => {
    const handleLanguageChange = () => {
      const detectedLanguage = detectLanguage()
      
      // If language changed from outside (site language selector)
      if (detectedLanguage !== currentLanguage) {
        console.log('🔄 Language change detected - Auto resetting:', {
          from: currentLanguage,
          to: detectedLanguage
        })
        
        // Clear session and reset to new language
        localStorage.removeItem('bizin_session_id')
        localStorage.removeItem('bizin_session_paid')
        setCurrentLanguage(detectedLanguage)
        setSessionId(null)
        setMessages([])
        setIsPaid(false)
        setMessageCount(0)
        setShowDocumentUpload(false)
      }
    }

    // Watch for HTML lang attribute changes (efficient - only triggers on actual changes)
    const observer = new MutationObserver(handleLanguageChange)
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'], // Only watch the lang attribute
      subtree: false
    })

    // Also listen for URL changes (for path-based routing like /en/, /pt/)
    const handleRouteChange = () => {
      setTimeout(handleLanguageChange, 100) // Small delay to let DOM update
    }
    
    window.addEventListener('popstate', handleRouteChange)

    return () => {
      observer.disconnect()
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [currentLanguage]) // Re-setup observer when language changes

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
            if (data.messages && data.messages.length > 0) {
              setMessages(data.messages.map((m: { id: string; role: 'user' | 'assistant'; content: string; created_at: string }) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                createdAt: new Date(m.created_at)
              })))
            } else {
              // Session exists but has no messages, add welcome message
              setMessages([{
                id: uuidv4(),
                role: 'assistant',
                content: t.welcome,
                createdAt: new Date()
              }])
            }
            return
          }
        } catch {
          // Session not found, create new one
        }
      }

      // Create new session
      try {
        console.log('🆕 Creating new session with language:', currentLanguage)
        const res = await fetch(`${apiUrl}/api/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: currentLanguage })
        })
        if (res.ok) {
          const data = await res.json()
          setSessionId(data.session.id)
          localStorage.setItem('bizin_session_id', data.session.id)
          localStorage.setItem('bizin_session_paid', 'false')
          
          console.log('👋 Adding welcome message in language:', currentLanguage)
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
  }, [isOpen, sessionId, apiUrl, currentLanguage, t.welcome])

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
        const errorMessages = {
          pt: 'Desculpe, ocorreu um erro. Por favor, tente novamente.',
          en: 'Sorry, an error occurred. Please try again.',
          fr: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
          es: 'Lo siento, ocurrió un error. Por favor, inténtelo de nuevo.'
        }
        const errorMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: errorMessages[currentLanguage],
          createdAt: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, isLoading, isPaid, messageCount, apiUrl, currentLanguage])

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

  const handleRestart = async () => {
    // Detect current language from document
    const detectedLanguage = detectLanguage()
    console.log('🔄 Restart clicked - Will use language:', detectedLanguage)
    console.log('📊 Current state:', { sessionId, isPaid, messageCount, messagesLength: messages.length })
    
    // End the current session before restarting
    if (sessionId) {
      try {
        const endUrl = `${apiUrl}/api/sessions/${sessionId}/end`
        console.log('🔚 Ending session:', sessionId, 'URL:', endUrl)
        const response = await fetch(endUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ Session ended successfully:', result)
        } else {
          const errorText = await response.text()
          console.error('❌ Session end failed:', response.status, errorText)
        }
      } catch (error) {
        console.error('❌ Failed to end session:', error)
      }
    } else {
      console.warn('⚠️ No session ID to end - sessionId is:', sessionId)
      console.log('📦 localStorage check:', {
        storedSessionId: localStorage.getItem('bizin_session_id'),
        storedPaid: localStorage.getItem('bizin_session_paid')
      })
    }
    
    // Clear localStorage
    localStorage.removeItem('bizin_session_id')
    localStorage.removeItem('bizin_session_paid')

    // Reset state with new language
    setCurrentLanguage(detectedLanguage)
    setSessionId(null)
    setMessages([])
    setIsPaid(false)
    setMessageCount(0)
    setShowDocumentUpload(false)

    // Trigger new session creation by clearing sessionId
    // The useEffect will detect this and create a new session with the new language
  }

  // Handle closing the widget - just close, don't end session
  const handleClose = () => {
    setIsOpen(false)
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
            language={currentLanguage}
            theme={theme}
            onClose={handleClose}
            onRestart={handleRestart}
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
          language={currentLanguage}
          theme={theme}
          onClose={() => setShowDocumentUpload(false)}
        />
      )}
    </>
  )
}

