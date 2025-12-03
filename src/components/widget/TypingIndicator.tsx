'use client'

interface TypingIndicatorProps {
  theme: 'light' | 'dark'
}

export function TypingIndicator({ theme }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start">
      <div className={`rounded-2xl rounded-bl-md px-4 py-3 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <div className="flex gap-1">
          <span 
            className={`w-2 h-2 rounded-full animate-bounce ${
              theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'
            }`} 
            style={{ animationDelay: '0ms' }} 
          />
          <span 
            className={`w-2 h-2 rounded-full animate-bounce ${
              theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'
            }`} 
            style={{ animationDelay: '150ms' }} 
          />
          <span 
            className={`w-2 h-2 rounded-full animate-bounce ${
              theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'
            }`} 
            style={{ animationDelay: '300ms' }} 
          />
        </div>
      </div>
    </div>
  )
}

