import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateChatResponse } from '@/lib/openai/chat'
import { FREE_MESSAGE_LIMIT } from '@/types'
import { z } from 'zod'

const ChatRequestSchema = z.object({
  session_id: z.string().uuid(),
  message: z.string().min(1).max(5000),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, message } = ChatRequestSchema.parse(body)

    const supabase = createAdminClient()

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if session is ended
    if (session.status === 'ended') {
      return NextResponse.json(
        { error: 'Session has ended' },
        { status: 400 }
      )
    }

    // All sessions have unlimited messages
    const isPaid = session.mode === 'paid'

    // Save user message
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        session_id,
        role: 'user',
        content: message,
      })

    if (userMsgError) {
      console.error('Failed to save user message:', userMsgError)
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    // Get conversation history
    const { data: historyMessages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(20) // Limit history to last 20 messages for context

    const conversationHistory = (historyMessages || [])
      .slice(0, -1) // Exclude the message we just added
      .map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      }))

    // Generate AI response
    const aiResponse = await generateChatResponse(
      message,
      conversationHistory,
      {
        sessionId: session_id,
        language: session.language || 'pt',
        isPaid,
      }
    )

    // Save assistant message
    const { data: assistantMsg, error: assistantMsgError } = await supabase
      .from('messages')
      .insert({
        session_id,
        role: 'assistant',
        content: aiResponse,
      })
      .select()
      .single()

    if (assistantMsgError) {
      console.error('Failed to save assistant message:', assistantMsgError)
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      )
    }

    // Return response
    return NextResponse.json({
      message: assistantMsg,
      upgrade_required: false,
    })
  } catch (error) {
    console.error('Chat error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

