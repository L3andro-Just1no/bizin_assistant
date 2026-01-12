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

    return NextResponse.json({
      sessions,
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

