'use client'

import { X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatHeaderProps {
  isPaid: boolean
  language: 'pt' | 'en' | 'fr' | 'es'
  theme: 'light' | 'dark'
  onClose: () => void
  onRestart?: () => void
}

const SUBTITLES = {
  pt: 'Assistente de Investimento',
  en: 'Investment Assistant',
  fr: 'Assistant d\'Investissement',
  es: 'Asistente de Inversión'
}

export function ChatHeader({ theme, onClose, onRestart, language }: ChatHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
          <img 
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='10' fill='%231e293b'/%3E%3Cpath d='M15 12h6c6 0 10 4 10 10s-4 10-10 10h-6V12zm6 16c3.5 0 6-2.5 6-6s-2.5-6-6-6h-2v12h2z' fill='%2310b981'/%3E%3C/svg%3E"
            alt="Bizin Logo" 
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Bizin Portugal</h3>
          <p className="text-xs text-white/80">{SUBTITLES[language]}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onRestart && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRestart}
            className={`hover:bg-white/20 text-white rounded-full w-8 h-8 ${
              theme === 'dark' ? 'hover:bg-white/10' : ''
            }`}
            title={
              language === 'pt' ? 'Reiniciar conversa' :
              language === 'fr' ? 'Redémarrer la conversation' :
              language === 'es' ? 'Reiniciar conversación' :
              'Restart conversation'
            }
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
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
    </div>
  )
}

