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

// Simple markdown parser for basic formatting
function parseMarkdown(text: string): string {
  let html = text
    // Bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700;">$1</strong>')
    .replace(/__(.*?)__/g, '<strong style="font-weight: 700;">$1</strong>')
    // Italic: *text* or _text_ (but not if part of bold)
    .replace(/(?<!\*)\*(?!\*)([^\*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_(?!_)([^_]+)_(?!_)/g, '<em>$1</em>')
  
  // Handle lists (bullet points with - or * at start of line)
  const lines = html.split('\n')
  let inList = false
  const processedLines: string[] = []
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    const isBullet = /^[-*]\s+/.test(trimmedLine)
    
    if (isBullet) {
      if (!inList) {
        processedLines.push('<ul class="list-disc ml-4 my-1">')
        inList = true
      }
      const content = trimmedLine.replace(/^[-*]\s+/, '')
      processedLines.push(`<li>${content}</li>`)
    } else {
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      processedLines.push(line)
    }
    
    // Close list at the end if still open
    if (index === lines.length - 1 && inList) {
      processedLines.push('</ul>')
    }
  })
  
  return processedLines.join('\n').replace(/\n/g, '<br />')
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
        {isAssistant ? (
          <div 
            className="leading-relaxed markdown-content"
            style={{
              ['--tw-prose-bold' as any]: 'inherit'
            }}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
          />
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        )}
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

