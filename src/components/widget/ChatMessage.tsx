'use client'

import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface ChatMessageProps {
  message: Message
  theme: 'light' | 'dark'
}

export function ChatMessage({ message, theme }: ChatMessageProps) {
  const isUser = message.role === 'user'

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
        <span
          className={cn(
            'text-[10px] mt-1 block',
            isUser ? 'text-white/70' : theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          )}
        >
          {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

