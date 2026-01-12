import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/sessions/[id]/end - End a session (for beacon API compatibility)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    console.log('🔚 API: Ending session:', id)
    
    const supabase = createAdminClient()

    const { data: session, error } = await supabase
      .from('sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ API: Failed to end session:', id, error)
      return NextResponse.json(
        { error: 'Failed to end session' },
        { status: 500 }
      )
    }

    console.log('✅ API: Session ended successfully:', id, 'Status:', session.status, 'Ended at:', session.ended_at)

    return NextResponse.json({ session })
  } catch (error) {
    console.error('❌ API: Session end error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
