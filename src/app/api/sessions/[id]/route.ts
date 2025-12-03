import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/sessions/[id] - Get session details with messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get messages for the session
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Failed to fetch messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Get session documents if any
    const { data: sessionDocs } = await supabase
      .from('session_documents')
      .select(`
        id,
        document:documents(id, title, url, mime_type, size_bytes)
      `)
      .eq('session_id', id)

    // Get reports if any
    const { data: reports } = await supabase
      .from('reports')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      session,
      messages: messages || [],
      documents: sessionDocs || [],
      reports: reports || [],
    })
  } catch (error) {
    console.error('Session fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const UpdateSessionSchema = z.object({
  status: z.enum(['active', 'ended']).optional(),
  mode: z.enum(['free', 'paid']).optional(),
  payment_id: z.string().optional(),
})

// PATCH /api/sessions/[id] - Update session
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const updates = UpdateSessionSchema.parse(body)

    const supabase = createAdminClient()

    // Build update object
    const updateData: Record<string, unknown> = { ...updates }
    
    if (updates.status === 'ended') {
      updateData.ended_at = new Date().toISOString()
    }

    const { data: session, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update session:', error)
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Session update error:', error)
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

