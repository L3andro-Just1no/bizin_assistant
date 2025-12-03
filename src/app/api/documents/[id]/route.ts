import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/documents/[id] - Get document details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Document fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const UpdateDocumentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'archived']).optional(),
})

// PATCH /api/documents/[id] - Update document
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const updates = UpdateDocumentSchema.parse(body)

    const supabase = createAdminClient()

    const { data: document, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Document update error:', error)
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      )
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Document update error:', error)
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

// DELETE /api/documents/[id] - Delete/archive document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    const supabase = createAdminClient()

    if (permanent) {
      // Get document to find file URL
      const { data: document } = await supabase
        .from('documents')
        .select('url, document_type')
        .eq('id', id)
        .single()

      if (document) {
        // Extract file name from URL
        const fileName = document.url.split('/').pop()
        const bucket = document.document_type === 'knowledge_base' 
          ? 'knowledge-base' 
          : 'user-uploads'

        // Delete from storage
        if (fileName) {
          await supabase.storage.from(bucket).remove([fileName])
        }
      }

      // Delete embeddings
      await supabase
        .from('document_embeddings')
        .delete()
        .eq('document_id', id)

      // Delete document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Document delete error:', error)
        return NextResponse.json(
          { error: 'Failed to delete document' },
          { status: 500 }
        )
      }
    } else {
      // Soft delete - archive
      const { error } = await supabase
        .from('documents')
        .update({ status: 'archived' })
        .eq('id', id)

      if (error) {
        console.error('Document archive error:', error)
        return NextResponse.json(
          { error: 'Failed to archive document' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

