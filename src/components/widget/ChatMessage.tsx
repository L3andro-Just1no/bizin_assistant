'use client'

import { cn } from '@/lib/utils'
import { VoicePlayer } from './VoicePlayer'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface ChatMessageProps {
  message: Message
  theme: 'light' | 'dark'
  apiUrl: string
}

export function ChatMessage({ message, theme, apiUrl }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
          isUser
            ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-br-md'
            : theme === 'dark'
            ? 'bg-gray-800 text-gray-100 rounded-bl-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <div className={cn(
          'flex items-center justify-between gap-2 mt-1',
          isUser ? 'text-white/70' : theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
        )}>
          <span className="text-[10px]">
            {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isAssistant && (
            <VoicePlayer 
              text={message.content} 
              apiUrl={apiUrl}
              theme={theme}
            />
          )}
        </div>
      </div>
    </div>
  )
}

