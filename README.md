# Bizin Assistant

AI-powered chat assistant and CRM for Bizin Portugal / Neomarca, helping users explore European funds, tax incentives, and entrepreneurship support programs in Portugal.

## 🌟 Features

### AI Chat Widget
- **Embeddable Widget**: Single-script integration for any website
- **Multi-language Support**: Portuguese, English, French, and Spanish
- **Voice Capabilities**: Speech-to-text and text-to-speech
- **Free Tier**: 5 messages per session
- **Paid Sessions**: Unlimited messages, document upload, PDF reports (€49)
- **Smart Greeting**: Asks for user's name to personalize conversations
- **Responsive Design**: Works seamlessly on mobile and desktop

### Admin CRM
- **Dashboard**: Key metrics and recent sessions overview
- **Knowledge Base Management**: Upload and manage AI training documents
- **Conversation History**: View all sessions with user names
- **Transcript Viewer**: Read full conversation details
- **Session Tracking**: Monitor free vs paid usage
- **Document Management**: PDF, DOCX, and TXT file support

### AI Knowledge Base
- **RAG Implementation**: Retrieval-Augmented Generation using vector embeddings
- **Semantic Search**: Finds relevant document chunks using OpenAI embeddings
- **Pure Knowledge Base**: Only answers from uploaded documents
- **Automatic Processing**: Text extraction, chunking, and embedding generation

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL with pgvector)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4o + Embeddings
- **Payments**: Stripe
- **PDF Generation**: @react-pdf/renderer
- **Widget Build**: Vite 7

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
- Stripe account

### 1. Clone and Install

```bash
git clone <repository-url>
cd bizin_assistant
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

Run migrations in Supabase SQL Editor:

```bash
# Run in order:
1. supabase/migrations/001_initial.sql
2. supabase/migrations/002_add_fr_es_languages.sql
3. supabase/storage_setup.sql
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 📦 Widget Deployment

### Build the Widget

```bash
npm run build:widget
```

This creates `public/widget.js` (417KB, gzipped: 123KB)

### Integration on Any Website

Add before closing `</body>` tag:

```html
<script 
  src="https://your-domain.com/widget.js"
  data-bizin-auto-init
  data-api-url="https://your-api-domain.com"
  data-language="pt"
  data-theme="light"
></script>
```

#### Configuration Options

| Attribute | Description | Default | Values |
|-----------|-------------|---------|--------|
| `data-api-url` | Your API endpoint | Current domain | Any URL |
| `data-language` | Widget language | `pt` | `pt`, `en`, `fr`, `es` |
| `data-theme` | Color theme | `light` | `light`, `dark` |

#### Manual Initialization

```javascript
<script src="https://your-domain.com/widget.js"></script>
<script>
  window.BizinAgent.init({
    apiUrl: 'https://your-api-domain.com',
    language: 'pt',
    theme: 'light'
  });
</script>
```

## 📚 Knowledge Base Management

### How It Works

1. **Upload Documents**: Admin uploads PDFs, DOCX, or TXT files
2. **Text Extraction**: System extracts and cleans text content
3. **Chunking**: Text split into ~1000 character chunks
4. **Embeddings**: OpenAI generates vector embeddings for each chunk
5. **Semantic Search**: User questions search for relevant chunks using vector similarity
6. **AI Response**: GPT-4o answers using only relevant document content

### Upload Methods

#### Via Admin Panel (Recommended)

1. Login at `/admin/login`
2. Go to "Documentos" section
3. Click "Carregar Documento"
4. Upload PDF, DOCX, or TXT files (max 10MB)

#### Via API

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@document.pdf" \
  -F "knowledge_base=true"
```

#### Bulk Upload Script

```javascript
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

  return response.json();
}

// Upload your docs
uploadDocument('./docs/european-funds.pdf');
uploadDocument('./docs/tax-incentives.pdf');
```

### Check Your Documents

```sql
-- List all knowledge base documents
SELECT id, title, status, created_at
FROM documents
WHERE document_type = 'knowledge_base'
ORDER BY created_at DESC;

-- Count embeddings per document
SELECT 
  d.title,
  COUNT(*) as chunk_count
FROM document_embeddings de
JOIN documents d ON d.id = de.document_id
WHERE d.document_type = 'knowledge_base'
GROUP BY d.id, d.title;
```

## 💳 Stripe Configuration

### 1. Create Products

In Stripe Dashboard:
- Product: "Bizin Assistant - Paid Session"
- Price: €49.00 (one-time payment)

### 2. Setup Webhook

1. Create webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
2. Enable events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
3. Copy webhook secret to `.env.local`

### 3. Test Mode

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

## 👤 Admin Access

### Create Admin User

Run in Supabase SQL Editor:

```sql
-- 1. Create user in Supabase Auth (via Dashboard or API)
-- 2. Add to admin_users table
INSERT INTO admin_users (email)
VALUES ('admin@bizin.pt');
```

### Access CRM

Navigate to `/admin/login` and sign in.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── chat/              # Chat completions
│   │   ├── sessions/          # Session management
│   │   ├── documents/         # Document upload/management
│   │   ├── reports/           # PDF generation
│   │   ├── stripe/            # Stripe checkout
│   │   ├── voice/             # STT/TTS
│   │   └── webhooks/          # Stripe webhooks
│   ├── admin/                 # Admin CRM pages
│   │   ├── (auth)/login/      # Admin login
│   │   └── (dashboard)/       # Dashboard, conversations, documents
│   └── embed/                 # Widget demo page
├── components/
│   ├── widget/                # Chat widget components
│   │   ├── ChatWidget.tsx     # Main widget
│   │   ├── ChatMessage.tsx    # Message component
│   │   ├── ChatInput.tsx      # Input with voice
│   │   ├── VoiceRecorder.tsx  # Voice recording
│   │   ├── VoicePlayer.tsx    # Audio playback
│   │   └── DocumentUpload.tsx # Document upload
│   ├── admin/                 # Admin components
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── supabase/              # Database clients
│   ├── openai/                # AI integration
│   │   ├── config.ts          # Model config & prompts
│   │   └── chat.ts            # RAG implementation
│   ├── stripe/                # Payment helpers
│   └── pdf/                   # Report generation
└── types/                     # TypeScript types

public/
├── widget.js                  # Built widget bundle
└── widget-demo.html          # Local test page

supabase/
├── migrations/                # Database migrations
└── storage_setup.sql         # Storage buckets
```

## 🎯 Development Commands

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build            # Build Next.js app
npm run start            # Start production server

# Widget
npm run build:widget     # Build embeddable widget

# Code Quality
npm run lint             # Run ESLint
```

## 🚢 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables

Set in Vercel Dashboard → Project Settings → Environment Variables:
- All variables from `.env.local`
- Update `NEXT_PUBLIC_APP_URL` to production URL

### Post-Deployment Checklist

- [ ] Update Stripe webhook URL to production
- [ ] Test widget on external website
- [ ] Verify CORS configuration if needed
- [ ] Upload knowledge base documents
- [ ] Test free and paid flows
- [ ] Test voice features (requires HTTPS)
- [ ] Monitor Supabase usage
- [ ] Check OpenAI API quota

## 🔧 Troubleshooting

### Widget Shows Old Greeting

1. Rebuild widget: `npm run build:widget`
2. Deploy updated `public/widget.js`
3. Clear browser cache on external site

### "I don't have that information" for Everything

1. Check documents uploaded: Admin → Documentos
2. Verify `document_type = 'knowledge_base'` and `status = 'active'`
3. Check embeddings exist:
   ```sql
   SELECT COUNT(*) FROM document_embeddings;
   ```
4. Verify OpenAI API key is set

### Database Language Constraint Error

Run migration `002_add_fr_es_languages.sql` to enable French and Spanish.

### Voice Recording Not Working

- Requires HTTPS in production
- Check browser microphone permissions
- Verify OpenAI API key for Whisper API

### Name Not Showing in Admin

- User must respond to greeting with their name
- System extracts names from patterns like "me chamo João", "my name is John"
- Falls back to session ID if no name found

## 📄 API Endpoints

### Public Endpoints

- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/end` - End session
- `POST /api/chat` - Send message
- `POST /api/voice/stt` - Speech-to-text
- `POST /api/voice/tts` - Text-to-speech
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Admin Endpoints

- `GET /api/sessions` - List all sessions (with pagination)
- `POST /api/documents/upload` - Upload knowledge base document
- `GET /api/documents` - List documents
- `DELETE /api/documents/:id` - Delete document
- `POST /api/reports/generate` - Generate PDF report

## 🌍 Multi-language Support

The system automatically detects the website's language from:
1. LocalStorage (`language`, `locale`, `i18nextLng`)
2. URL path (`/pt/`, `/en/`, `/fr/`, `/es/`)
3. HTML `lang` attribute
4. Cookies (`NEXT_LOCALE`)
5. Browser language (`navigator.language`)

Supported languages:
- **Portuguese (PT)**: Default
- **English (EN)**
- **French (FR)**
- **Spanish (ES)**

## 📊 Monitoring

### Key Metrics in Admin Dashboard

- Total sessions (with user messages)
- Paid sessions count
- Active knowledge base documents
- Total messages exchanged

### Check Logs

- **Vercel**: Dashboard → Project → Logs
- **Supabase**: Dashboard → Logs
- **OpenAI**: Platform → Usage

## 🔐 Security

- API keys never exposed on frontend
- Supabase RLS (Row Level Security) enabled
- Admin routes protected by Supabase Auth
- Stripe webhooks verified with signature
- File uploads validated and scanned
- CORS configured for specific domains

## 📝 License

Proprietary - Neomarca / Bizin Portugal

## 🤝 Support

For questions or issues:
- Email: geral@neomarca.pt
- Check project documentation
- Review Supabase/Vercel logs

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Built with**: Next.js 16, React 19, OpenAI GPT-4o
