'use client'

import { useState } from 'react'
import { Volume2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VoicePlayerProps {
  text: string
  apiUrl: string
  theme?: 'light' | 'dark'
}

export function VoicePlayer({ text, apiUrl, theme = 'light' }: VoicePlayerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const playAudio = async () => {
    try {
      setIsLoading(true)

      const response = await fetch(`${apiUrl}/api/voice/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: 'nova', // Female voice, good for Portuguese
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate audio')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.onplay = () => {
        setIsPlaying(true)
        setIsLoading(false)
      }

      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }

      audio.onerror = () => {
        setIsPlaying(false)
        setIsLoading(false)
        alert('Erro ao reproduzir áudio')
      }

      await audio.play()
    } catch (error) {
      console.error('Audio playback error:', error)
      setIsLoading(false)
      alert('Erro ao gerar áudio. Tente novamente.')
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={playAudio}
      disabled={isLoading || isPlaying}
      className={`${
        theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
      }`}
      title="Ouvir mensagem"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Volume2 className={`w-4 h-4 ${isPlaying ? 'text-teal-500' : ''}`} />
      )}
    </Button>
  )
}

