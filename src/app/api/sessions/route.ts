import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const CreateSessionSchema = z.object({
  language: z.enum(['pt', 'en', 'fr', 'es']).optional().default('pt'),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { language, metadata } = CreateSessionSchema.parse(body)

    const supabase = createAdminClient()

    // Create the session
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        mode: 'free',
        status: 'active',
        language,
        metadata: metadata || {},
        message_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create session:', error)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Session creation error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/sessions - List sessions (for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const mode = searchParams.get('mode') // 'free' | 'paid' | null
    const status = searchParams.get('status') // 'active' | 'ended' | null

    const supabase = createAdminClient()

    // First, get session IDs that have at least 1 user message
    const { data: sessionsWithMessages } = await supabase
      .from('messages')
      .select('session_id')
      .eq('role', 'user')

    const sessionIdsWithUserMessages = [...new Set(
      (sessionsWithMessages || []).map(m => m.session_id)
    )]

    if (sessionIdsWithUserMessages.length === 0) {
      // No sessions with user messages
      return NextResponse.json({
        sessions: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      })
    }

    let query = supabase
      .from('sessions')
      .select('*', { count: 'exact' })
      .in('id', sessionIdsWithUserMessages)
      .order('started_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (mode) {
      query = query.eq('mode', mode)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: sessions, error, count } = await query

    if (error) {
      console.error('Failed to fetch sessions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    // Extract user names from the first few messages of each session
    const sessionsWithNames = await Promise.all(
      (sessions || []).map(async (session) => {
        // Get first 5 user messages to find the name
        const { data: messages } = await supabase
          .from('messages')
          .select('role, content')
          .eq('session_id', session.id)
          .eq('role', 'user')
          .order('created_at', { ascending: true })
          .limit(5)

        let userName = null
        
        // Try to extract name from first user message (often it's in response to greeting)
        if (messages && messages.length > 0) {
          const firstMessage = messages[0].content.trim()
          
          // Pattern 1: Direct name responses (common after "Qual é o teu nome?")
          // Look for short messages that are likely just names
          if (firstMessage.length < 50 && firstMessage.split(' ').length <= 3) {
            // Remove common greetings/phrases
            const cleaned = firstMessage
              .replace(/^(olá|oi|hello|hi|hey|bom dia|boa tarde|boa noite|me chamo|meu nome é|i am|i'm|my name is|je suis|je m'appelle|me llamo|soy)/gi, '')
              .replace(/[.,!?]/g, '')
              .trim()
            
            if (cleaned && cleaned.length > 1 && cleaned.length < 30) {
              // Capitalize first letter of each word
              userName = cleaned
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')
            }
          }
          
          // Pattern 2: Look for "my name is" or similar patterns in any of the first messages
          if (!userName) {
            for (const msg of messages) {
              const content = msg.content.toLowerCase()
              const namePatterns = [
                /(?:me chamo|meu nome é|o meu nome é|sou o|sou a|chamo-me)\s+([a-zà-ÿ\s]{2,30})/i,
                /(?:my name is|i am|i'm|call me)\s+([a-z\s]{2,30})/i,
                /(?:je m'appelle|je suis)\s+([a-zà-ÿ\s]{2,30})/i,
                /(?:me llamo|mi nombre es|soy)\s+([a-zà-ÿ\s]{2,30})/i,
              ]
              
              for (const pattern of namePatterns) {
                const match = content.match(pattern)
                if (match && match[1]) {
                  const extractedName = match[1].trim()
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ')
                  
                  if (extractedName.length > 1 && extractedName.length < 30) {
                    userName = extractedName
                    break
                  }
                }
              }
              if (userName) break
            }
          }
        }

        return {
          ...session,
          user_name: userName,
        }
      })
    )

    return NextResponse.json({
      sessions: sessionsWithNames,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Sessions fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

