# Knowledge Base Setup - Complete Guide

## Summary of Changes

✅ **FIXED**: The assistant now uses **ONLY documents from your database** - no more hardcoded instructions!

### What Changed:

1. **System Prompts Updated** (`src/lib/openai/config.ts`)
   - Removed all hardcoded company information, visa details, program information
   - Assistant now only answers based on uploaded documents
   - If information is not in documents, assistant will say "I don't have that information"

2. **Enhanced Document Context** (`src/lib/openai/chat.ts`)
   - Documents are now clearly marked in the AI prompt
   - Knowledge base content is prioritized over any generic knowledge
   - Assistant explicitly informed when no relevant documents are found

## How to Upload Documents

### Option 1: Admin Panel (Recommended - Easiest)

1. **Login to Admin Panel**
   - Go to: `http://localhost:3000/admin/login`
   - Email: `admin@bizin.pt`
   - Password: `admin123`
   - (Make sure you've created this admin user in Supabase - see `scripts/create-admin.sql`)

2. **Go to Documents Section**
   - Click "Base de Conhecimento" in the sidebar
   - Or navigate to: `http://localhost:3000/admin/documents`

3. **Upload Documents**
   - Click "Carregar Documento" button
   - Drag and drop files or click to browse
   - Supports: PDF, Word (.docx), and TXT files
   - Max size: 10MB per file

4. **The system automatically:**
   - Extracts text from the documents
   - Splits text into chunks
   - Generates AI embeddings for semantic search
   - Stores everything in `document_embeddings` table

### Option 2: API Upload

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@/path/to/your/document.pdf" \
  -F "knowledge_base=true"
```

### Option 3: Bulk Upload Script

See `scripts/upload-knowledge-base.md` for Node.js script examples

## How It Works

### 1. User Asks a Question
```
User: "What European funds are available for startups?"
```

### 2. System Searches Documents
- Converts question to embedding vector
- Searches `document_embeddings` table using vector similarity
- Finds the 3-5 most relevant document chunks

### 3. AI Responds with Document Content
- Only uses information from the retrieved document chunks
- If no relevant documents found, says "I don't have that information"
- Cites specific information from your documents

## Database Tables

### `documents`
Stores metadata about uploaded files
- `id`, `title`, `url`, `mime_type`, `size_bytes`
- `document_type`: must be `'knowledge_base'` for AI to use
- `status`: `'active'` or `'archived'`
- `content_text`: extracted text content

### `document_embeddings`
Stores searchable chunks with AI embeddings
- `id`, `document_id`, `chunk_index`
- `chunk_text`: the actual text chunk (max ~1000 chars)
- `embedding`: vector(1536) - OpenAI embedding for semantic search

## Checking Your Documents

### See All Documents:
```sql
SELECT id, title, status, created_at
FROM documents
WHERE document_type = 'knowledge_base'
ORDER BY created_at DESC;
```

### See Document Chunks:
```sql
SELECT 
  d.title,
  de.chunk_index,
  LEFT(de.chunk_text, 100) as preview,
  de.created_at
FROM document_embeddings de
JOIN documents d ON d.id = de.document_id
WHERE d.document_type = 'knowledge_base'
  AND d.status = 'active'
ORDER BY d.created_at DESC, de.chunk_index;
```

### Count Embeddings:
```sql
SELECT 
  d.title,
  COUNT(*) as chunk_count
FROM document_embeddings de
JOIN documents d ON d.id = de.document_id
WHERE d.document_type = 'knowledge_base'
GROUP BY d.id, d.title
ORDER BY chunk_count DESC;
```

## Testing

1. **Upload a test document** with known content
2. **Open the chat widget** at `http://localhost:3000/embed`
3. **Ask a question** about something in your document
4. **Expected behavior:**
   - ✅ Assistant answers using document content
   - ✅ Answer is accurate to what's in the document
   - ✅ If you ask about something NOT in documents, assistant says "I don't have that information"

## Important Notes

- **Documents must have `document_type = 'knowledge_base'`** to be used by the assistant
- **Only `status = 'active'`** documents are searched
- **The assistant will NOT use:**
  - Any hardcoded information
  - General internet knowledge (unless in your documents)
  - Assumptions or guesses

- **The assistant WILL use:**
  - ONLY information explicitly in your uploaded documents
  - Multiple document chunks if relevant
  - Clear statements when information is unavailable

## Troubleshooting

### "I don't have that information" for everything
- Check if documents are uploaded: Admin panel → Documents
- Verify documents are marked as `knowledge_base` type
- Check if documents have `status = 'active'`
- Ensure OpenAI API key is set for embeddings

### Documents uploaded but not searchable
- Check if embeddings were created: Run the "Count Embeddings" SQL above
- If no embeddings, the text extraction may have failed
- Try re-uploading or use a different file format

### Assistant still giving generic answers
- Clear your browser cache
- Restart the dev server to pick up the updated system prompts
- Verify the changes in `src/lib/openai/config.ts` are saved

## Next Steps

1. ✅ Create admin user (see `scripts/create-admin.sql`)
2. ✅ Login to admin panel
3. ✅ Upload your knowledge base documents
4. ✅ Test the chat assistant with questions from your documents
5. ✅ Verify it only answers from document content

---

**Your assistant is now a pure knowledge base assistant!** It will only use the information you provide through document uploads.
