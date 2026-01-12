# Upload Documents to Knowledge Base

The assistant now uses ONLY the documents in your database. You need to upload your knowledge base documents.

## Option 1: Use the Document Upload API

You can upload documents through the API endpoint `/api/documents/upload`. Here's how:

### Using curl:

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@/path/to/your/document.pdf" \
  -F "knowledge_base=true"
```

### Using Postman or similar:
1. POST to `http://localhost:3000/api/documents/upload`
2. Body type: `form-data`
3. Add fields:
   - `file`: (file upload) - your PDF, DOCX, or TXT file
   - `knowledge_base`: (text) - set to `true`

## Option 2: Manual SQL Insert (for testing)

If you want to quickly test with sample text, you can insert directly into the database:

```sql
-- 1. Insert a document
INSERT INTO documents (title, description, url, mime_type, size_bytes, document_type, content_text, status)
VALUES (
  'Sample Knowledge Document',
  'Information about European funds',
  'manual-upload',
  'text/plain',
  1000,
  'knowledge_base',
  'Your complete document text goes here. Include all the information you want the assistant to know about.',
  'active'
)
RETURNING id;

-- 2. Generate embedding for the document (you'll need to do this through the API)
-- The assistant uses the document_embeddings table to search for relevant content
```

## Option 3: Bulk Upload Script (Recommended)

Create a Node.js script to process multiple documents:

```javascript
// upload-docs.js
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function uploadDocument(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('knowledge_base', 'true');

  const response = await fetch('http://localhost:3000/api/documents/upload', {
    method: 'POST',
    body: form
  });

  const result = await response.json();
  console.log(`Uploaded: ${filePath}`, result);
  return result;
}

// Upload your documents
async function main() {
  await uploadDocument('./docs/european-funds.pdf');
  await uploadDocument('./docs/visas.pdf');
  await uploadDocument('./docs/portugal-2030.pdf');
  // Add more documents...
}

main().catch(console.error);
```

## Important Notes

1. **The assistant will ONLY use information from uploaded documents**
2. **Documents must be in `knowledge_base` type** to be used by the assistant
3. **The document upload API will automatically:**
   - Extract text from PDFs/DOCX
   - Split text into chunks
   - Generate embeddings
   - Store in `document_embeddings` table for vector search

## Checking Your Documents

To see what documents are currently in the knowledge base:

```sql
SELECT id, title, description, created_at, status
FROM documents
WHERE document_type = 'knowledge_base'
ORDER BY created_at DESC;
```

To see the embeddings:

```sql
SELECT 
  de.id,
  d.title,
  de.chunk_index,
  LEFT(de.chunk_text, 100) as chunk_preview,
  de.created_at
FROM document_embeddings de
JOIN documents d ON d.id = de.document_id
WHERE d.document_type = 'knowledge_base'
ORDER BY d.created_at DESC, de.chunk_index;
```

## Testing the Assistant

After uploading documents:
1. Open the chat widget
2. Ask a question related to the content in your documents
3. The assistant should answer based ONLY on the document content
4. If you ask about something not in the documents, it will say "I don't have that information"
