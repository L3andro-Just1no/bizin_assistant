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
        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 p-1.5">
          <svg width="152" height="74" viewBox="0 0 152 74" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M151.795 23.889C151.549 22.0017 151.016 20.2989 150.206 18.8014C149.386 17.2936 148.228 16.1037 146.711 15.2011C145.193 14.3087 143.277 13.8266 140.939 13.7445C138.069 13.6932 135.547 14.2369 133.384 15.3754C131.693 16.2678 130.217 17.4269 128.936 18.8322C128.474 16.4217 126.363 14.5651 123.769 14.5651C121.176 14.5651 119.023 16.4114 118.582 18.9347L112.042 56.6201H123L128.208 26.5764C128.3 26.4431 128.382 26.3097 128.474 26.1866C129.305 25.0481 130.319 24.1352 131.529 23.4685C132.728 22.7915 134.164 22.4838 135.824 22.535C137.321 22.5658 138.469 22.8838 139.258 23.5095C140.048 24.1352 140.56 24.9763 140.796 26.0328C141.032 27.0995 141.073 28.3099 140.909 29.6844L136.367 56.6201H147.356L151.867 29.7972C152.072 27.7458 152.051 25.7764 151.805 23.889H151.795Z" fill="#1C2544"/>
            <path d="M48.9172 56.6101H59.8651L66.1591 20.8634C66.7229 17.5708 64.2012 14.5654 60.8594 14.5654C58.2455 14.5654 56.0108 16.4425 55.5597 19.0274L48.9069 56.6101H48.9172Z" fill="#1C2544"/>
            <path d="M73.4578 14.5859C71.3256 14.5859 69.5112 16.1143 69.1422 18.2068C68.6706 20.8942 70.731 23.3559 73.4578 23.3559H87.2247L65.2263 47.6658C64.1705 48.8351 63.4632 50.2814 63.1864 51.8405L62.3561 56.6101H96.2865L97.8036 47.8709H77.9477L101.084 22.2789C102.068 21.1814 102.734 19.8377 102.991 18.3811L103.021 18.1863C103.349 16.2989 101.904 14.5757 99.9973 14.5757H73.4578V14.5859Z" fill="#1C2544"/>
            <path d="M98.6954 56.6101H109.643L115.968 20.8429C116.532 17.5503 114.01 14.5449 110.668 14.5449C108.054 14.5449 105.82 16.422 105.369 19.0069L98.6954 56.6101Z" fill="#1C2544"/>
            <path d="M32.9873 24.7402H5.57648L0 56.6097H32.9873C41.7826 56.6097 48.9172 49.4706 48.9172 40.6698C48.9172 31.8691 41.7826 24.73 32.9873 24.73V24.7402Z" fill="#1C2544"/>
            <path d="M27.7286 0H15.2943C12.2293 0 9.61533 2.19506 9.08228 5.21071L4.35663 31.8695H28.2617C37.1594 31.8695 44.3453 24.5765 44.1813 15.6321C44.0173 6.68776 36.4931 0 27.7286 0Z" fill="#87C76C"/>
            <path d="M40.2039 26.4737C37.2722 29.7971 33.0078 31.8793 28.2514 31.8793H4.35663L5.61749 24.7402H32.9873C35.591 24.7402 38.0513 25.3557 40.2039 26.4737Z" fill="#419A59"/>
            <path d="M63.0736 12.5755C66.5441 12.5755 69.3574 9.76035 69.3574 6.28773C69.3574 2.81511 66.5441 0 63.0736 0C59.6032 0 56.7899 2.81511 56.7899 6.28773C56.7899 9.76035 59.6032 12.5755 63.0736 12.5755Z" fill="#87C76C"/>
            <path d="M112.821 12.5755C116.292 12.5755 119.105 9.76035 119.105 6.28773C119.105 2.81511 116.292 0 112.821 0C109.351 0 106.537 2.81511 106.537 6.28773C106.537 9.76035 109.351 12.5755 112.821 12.5755Z" fill="#87C76C"/>
          </svg>
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

