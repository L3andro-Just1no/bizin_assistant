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

// Enhanced markdown parser with support for headings, links, and inline formatting
function parseMarkdown(text: string): string {
  const lines = text.split('\n')
  let inList = false
  const processedLines: string[] = []
  
  lines.forEach((line, index) => {
    let processedLine = line.trim()
    
    // Check for bullet points first
    const isBullet = /^[-*]\s+/.test(processedLine)
    
    if (isBullet) {
      if (!inList) {
        processedLines.push('<ul class="list-disc ml-4 my-2 space-y-1">')
        inList = true
      }
      let content = processedLine.replace(/^[-*]\s+/, '')
      content = parseInlineMarkdown(content)
      processedLines.push(`<li class="leading-relaxed">${content}</li>`)
    } else {
      // Close list if we were in one
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      
      // Check for headings (###, ##, #)
      const h3Match = processedLine.match(/^###\s+(.+)$/)
      const h2Match = processedLine.match(/^##\s+(.+)$/)
      const h1Match = processedLine.match(/^#\s+(.+)$/)
      
      if (h3Match) {
        const content = parseInlineMarkdown(h3Match[1])
        processedLines.push(`<h3 class="text-base font-bold mt-3 mb-1.5 text-gray-900" style="font-weight: 700; margin-top: 12px; margin-bottom: 6px;">${content}</h3>`)
      } else if (h2Match) {
        const content = parseInlineMarkdown(h2Match[1])
        processedLines.push(`<h2 class="text-lg font-bold mt-4 mb-2 text-gray-900" style="font-weight: 700; margin-top: 16px; margin-bottom: 8px;">${content}</h2>`)
      } else if (h1Match) {
        const content = parseInlineMarkdown(h1Match[1])
        processedLines.push(`<h1 class="text-xl font-bold mt-4 mb-2 text-gray-900" style="font-weight: 700; margin-top: 16px; margin-bottom: 8px;">${content}</h1>`)
      } else if (processedLine) {
        // Regular paragraph
        processedLine = parseInlineMarkdown(processedLine)
        processedLines.push(processedLine)
      } else {
        // Empty line
        processedLines.push('')
      }
    }
    
    // Close list at the end if still open
    if (index === lines.length - 1 && inList) {
      processedLines.push('</ul>')
    }
  })
  
  return processedLines.join('<br />')
}

// Parse inline markdown: links, bold, italic
function parseInlineMarkdown(text: string): string {
  let result = text
  
  // Links: [text](url) - MUST be done before bold/italic to preserve link text formatting
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
    // Allow bold/italic within link text
    const formattedLinkText = linkText
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
    
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-teal-600 hover:text-teal-700 underline font-medium" style="color: #0d9488; text-decoration: underline; cursor: pointer; font-weight: 500;">${formattedLinkText}</a>`
  })
  
  // Bold: **text** or __text__ (but not if already inside a link)
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 700;">$1</strong>')
  result = result.replace(/__(.+?)__/g, '<strong style="font-weight: 700;">$1</strong>')
  
  // Italic: *text* or _text_ (but not if part of bold or link)
  result = result.replace(/(?<!\*)\*(?!\*)([^\*]+?)\*(?!\*)/g, '<em>$1</em>')
  result = result.replace(/(?<!_)_(?!_)([^_]+?)_(?!_)/g, '<em>$1</em>')
  
  return result
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

