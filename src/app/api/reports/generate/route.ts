import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

const GenerateReportSchema = z.object({
  session_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id } = GenerateReportSchema.parse(body)

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

    // Verify session is paid
    if (session.mode !== 'paid') {
      return NextResponse.json(
        { error: 'Report generation is only available for paid sessions' },
        { status: 403 }
      )
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })

    if (messagesError) {
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Get session documents
    const { data: sessionDocs } = await supabase
      .from('session_documents')
      .select(`
        document:documents(title)
      `)
      .eq('session_id', session_id)

    const documents = sessionDocs?.map(sd => sd.document as unknown as { title: string }).filter(Boolean) || []

    // Generate PDF using dynamic import to avoid SSR issues
    const { renderReportToBuffer } = await import('@/lib/pdf/report')

    const reportData = {
      sessionId: session_id,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      language: (session.language || 'pt') as 'pt' | 'en' | 'fr' | 'es',
      messages: messages || [],
      documents,
    }

    const pdfBuffer = await renderReportToBuffer(reportData)

    // Upload PDF to storage
    const reportId = uuidv4()
    const fileName = `report-${reportId}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Report upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload report' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(fileName)

    // Save report record
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        session_id,
        url: urlData.publicUrl,
      })
      .select()
      .single()

    if (reportError) {
      console.error('Report record error:', reportError)
      return NextResponse.json(
        { error: 'Failed to save report record' },
        { status: 500 }
      )
    }

    // End the session after generating report
    await supabase
      .from('sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', session_id)

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Report generation error:', error)
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

