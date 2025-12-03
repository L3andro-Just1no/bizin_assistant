'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatHeaderProps {
  isPaid: boolean
  language: 'pt' | 'en'
  theme: 'light' | 'dark'
  onClose: () => void
}

export function ChatHeader({ theme, onClose }: ChatHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            className="w-6 h-6"
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-sm">Bizin Portugal</h3>
          <p className="text-xs text-white/80">Assistente de Investimento</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className={`hover:bg-white/20 text-white rounded-full w-8 h-8 ${
          theme === 'dark' ? 'hover:bg-white/10' : ''
        }`}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}

