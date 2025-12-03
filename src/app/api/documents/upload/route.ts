import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbedding } from '@/lib/openai/chat'
import { v4 as uuidv4 } from 'uuid'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

// POST /api/documents/upload - Upload a document
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const sessionId = formData.get('session_id') as string | null
    const isKnowledgeBase = formData.get('knowledge_base') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, Word, TXT' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // If it's a user upload, verify the session is paid
    if (sessionId && !isKnowledgeBase) {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('mode')
        .eq('id', sessionId)
        .single()

      if (sessionError || !session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        )
      }

      if (session.mode !== 'paid') {
        return NextResponse.json(
          { error: 'Document upload is only available for paid sessions' },
          { status: 403 }
        )
      }
    }

    // Generate unique file name
    const fileId = uuidv4()
    const fileExtension = file.name.split('.').pop() || 'bin'
    const fileName = `${fileId}.${fileExtension}`

    // Choose bucket based on document type
    const bucket = isKnowledgeBase ? 'knowledge-base' : 'user-uploads'

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    // Extract text content from file (simplified - in production use proper parsers)
    let contentText = ''
    if (file.type === 'text/plain') {
      contentText = await file.text()
    }
    // For PDF and Word files, you would use libraries like pdf-parse or mammoth
    // This is a placeholder - in production, implement proper text extraction

    // Save document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        title: file.name,
        url: urlData.publicUrl,
        mime_type: file.type,
        size_bytes: file.size,
        document_type: isKnowledgeBase ? 'knowledge_base' : 'user_upload',
        status: 'active',
        content_text: contentText || null,
      })
      .select()
      .single()

    if (docError) {
      console.error('Document record error:', docError)
      return NextResponse.json(
        { error: 'Failed to save document record' },
        { status: 500 }
      )
    }

    // If it's a knowledge base document, create embeddings for RAG
    if (isKnowledgeBase && contentText) {
      await createDocumentEmbeddings(supabase, document.id, contentText)
    }

    // If session-specific, link to session
    if (sessionId && !isKnowledgeBase) {
      const { error: linkError } = await supabase
        .from('session_documents')
        .insert({
          session_id: sessionId,
          document_id: document.id,
        })

      if (linkError) {
        console.error('Session document link error:', linkError)
      }
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createDocumentEmbeddings(
  supabase: ReturnType<typeof createAdminClient>,
  documentId: string,
  text: string
) {
  try {
    // Split text into chunks (simple approach - in production use better chunking)
    const chunkSize = 1000
    const overlap = 200
    const chunks: string[] = []

    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      const chunk = text.slice(i, i + chunkSize)
      if (chunk.trim()) {
        chunks.push(chunk.trim())
      }
    }

    // Generate embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i])

      await supabase.from('document_embeddings').insert({
        document_id: documentId,
        chunk_index: i,
        chunk_text: chunks[i],
        embedding,
      })
    }
  } catch (error) {
    console.error('Embedding creation error:', error)
    // Don't throw - embeddings can be retried later
  }
}

