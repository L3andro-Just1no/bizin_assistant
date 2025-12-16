import { NextRequest, NextResponse } from 'next/server'
import { getOpenAI } from '@/lib/openai/config'

// POST /api/voice/stt - Speech to Text
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audio = formData.get('audio') as File
    
    if (!audio) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      )
    }

    // Get OpenAI client
    const openai = getOpenAI()

    // Transcribe audio using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'pt', // Portuguese
    })

    return NextResponse.json({
      text: transcription.text,
    })
  } catch (error) {
    console.error('STT error:', error)
    
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}

