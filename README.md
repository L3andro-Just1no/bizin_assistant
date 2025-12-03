# Bizin Portugal AI Assistant

An AI-powered assistant widget and CRM for Bizin Portugal / Neomarca, helping users explore European funds, incentives, and support schemes in Portugal.

## Features

### AI Chat Widget
- Embeddable chat widget for websites
- Free tier with 5 message limit
- Paid sessions via Stripe (€49)
- Document upload for paid sessions
- PDF report generation
- Bilingual support (Portuguese/English)

### Admin CRM
- Dashboard with key metrics
- Knowledge base document management
- Conversation history and transcripts
- User session tracking

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4
- **Payments**: Stripe
- **Styling**: Tailwind CSS + shadcn/ui
- **PDF Generation**: @react-pdf/renderer

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
- Stripe account

### Environment Setup

Create a `.env.local` file:

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

### Database Setup

1. Create a new Supabase project
2. Run the migration in `supabase/migrations/001_initial.sql`
3. Run the storage setup in `supabase/storage_setup.sql`

### Installation

```bash
npm install
npm run dev
```

### Build Widget

```bash
npm run build:widget
```

This creates `public/widget.js` for embedding.

## Widget Integration

Add to your website:

```html
<script 
  src="https://your-domain.com/widget.js"
  data-bizin-auto-init
  data-api-url="https://your-api-domain.com"
  data-language="pt"
  data-theme="light"
></script>
```

Or initialize manually:

```javascript
window.BizinAgent.init({
  apiUrl: 'https://your-api-domain.com',
  language: 'pt',
  theme: 'light'
});
```

## Stripe Webhook Setup

1. Create a Stripe webhook endpoint pointing to `/api/webhooks/stripe`
2. Enable events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
3. Add the webhook secret to your environment variables

## Admin Access

1. Create an admin user in Supabase Auth
2. Add the user's email to the `admin_users` table
3. Access the CRM at `/admin`

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── admin/         # Admin CRM pages
│   └── embed/         # Widget demo
├── components/
│   ├── widget/        # Chat widget components
│   ├── admin/         # Admin components
│   └── ui/            # shadcn/ui components
├── lib/
│   ├── supabase/      # Database clients
│   ├── openai/        # AI integration
│   ├── stripe/        # Payment helpers
│   └── pdf/           # Report generation
└── types/             # TypeScript types
```

## Deployment

Deploy to Vercel:

```bash
vercel
```

Remember to:
1. Set all environment variables in Vercel
2. Configure Stripe webhook for production URL
3. Update CORS settings if needed

## License

Proprietary - Neomarca / Bizin Portugal
