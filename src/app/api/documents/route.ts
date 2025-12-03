import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/documents - List knowledge base documents (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'active' | 'archived' | null
    const type = searchParams.get('type') || 'knowledge_base' // 'knowledge_base' | 'user_upload'

    const supabase = createAdminClient()

    let query = supabase
      .from('documents')
      .select('*')
      .eq('document_type', type)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error('Failed to fetch documents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Documents fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

