# spec kit, ai agent with simple crm

## 1. specify

### 1.1 context

Neomarca helps companies and entrepreneurs access European funds, incentives and support schemes.  
They now want an **AI agent** that can:

1. Talk with users in natural language, in text and voice  
2. Answer questions about available funds and schemes  
3. In a **paid mode**, allow users to upload documents and receive a **PDF report** at the end  

The agent will live inside Neomarca’s website as an embedded widget loaded via a JavaScript snippet.

In addition, Neomarca needs a **simple internal CRM** where the team can:

- Upload and manage documents that feed the knowledge base  
- Review interactions between the AI and human users  

This spec is for the **AI agent and its CRM only**, not for the public website itself.

---

### 1.2 problem to solve

Current issues:

- The team answers many repeated questions about eligibility and funding schemes  
- There is no guided, scalable way for a user to explore what funds might apply  
- Existing information is spread across documents and links, not centralised in a knowledge base  
- There is no single view of who asked what, or how the AI is being used  

We need to centralise this into:

- One AI entry point for users  
- One simple CRM view for Neomarca  

---

### 1.3 goals

**for end users**

- Ask the AI “my company does X, I plan to do Y, what support is available” and receive a clear, structured response  
- In free mode, get basic guidance and a sense of what is possible  
- In paid mode, share more detail, upload documents and receive a PDF report with personalised guidance  

**for neomarca**

- Have a clean way to upload and update documents that feed the AI knowledge base  
- See recent conversations and read transcripts to understand how the AI is used  
- Monetise access using Stripe, with a clear distinction between free and paid usage  

---

### 1.4 scope

in scope:

- AI agent widget for text chat with optional voice input and output  
- Freemium model  
  - free tier, message limited  
  - paid tier, with document upload and report generation  
- Stripe integration  
  - one off paid session  
  - simple subscription option, even if not fully exploited in phase one  
- PDF report creation at the end of a paid session  
- Simple CRM for Neomarca  
  - upload and manage documents that feed the knowledge base  
  - list of conversations  
  - view conversation transcript and basic metadata  

out of scope for phase one:

- Full blown CRM with user management, tagging, complex analytics and exports  
- Multi tenant support  
- Deep integration with external funding databases  
- Complex role based access control beyond “admin user” versus “no access”  

---

### 1.5 user types and key journeys

**user types**

- **visitor**  
  anonymous website visitor chatting in free mode  

- **paying user**  
  user who has completed a Stripe checkout and unlocked a paid session or subscription  

- **neomarca admin**  
  staff member accessing the internal CRM to manage documents and review conversations  

**key journeys**

1. **free usage**  
   - Visitor opens widget  
   - Asks a small number of questions  
   - Hits a free tier limit and is invited to upgrade  

2. **paid session**  
   - Visitor accepts paid session  
   - Goes through Stripe checkout  
   - Returns to the agent as a “paid session”  
   - Uploads one or more documents  
   - Receives a PDF report at the end  

3. **admin updates knowledge base**  
   - Admin logs into CRM  
   - Uploads new documents or replaces existing ones  
   - Marks a document as active or archived  
   - The knowledge base for future sessions uses the latest active documents  

4. **admin reviews conversations**  
   - Admin logs into CRM  
   - Sees a list of recent conversations, free and paid  
   - Opens any session to read the full transcript and basic metadata  

---

### 1.6 success criteria

- AI agent is embedded on the website through a single JavaScript snippet  
- Free mode enforces a clear limit on the number of messages per session  
- Paid sessions work end to end  
  - Stripe checkout completes  
  - Session is marked as paid  
  - Upload and report features are available  
- PDF report is generated for each paid session, with a stable, downloadable link  
- Admin can upload documents and see them listed in the CRM  
- Admin can open and read any conversation transcript  
- No API keys or secrets are exposed on the frontend  

---

## 2. plan

### 2.1 architecture overview

**frontend**

- AI widget implemented in React or vanilla JS, built as an embeddable bundle  
- Loaded via `<script>` tag that calls a global `initAiAgent({ siteKey, ... })` function  
- CRM implemented as a small admin web interface, behind authentication  

**backend**

- API endpoints for:  
  - starting a session  
  - sending messages  
  - streaming or returning assistant responses  
  - uploading documents  
  - generating PDF reports  
  - listing conversations for admins  
  - reading a single conversation transcript  
  - managing knowledge base documents  
  - Stripe checkout and webhooks  

- Hosted on serverless functions, for example Vercel functions or similar  

**external services**

- OpenAI for chat completions and possibly speech to text  
- A speech provider for text to speech, for example ElevenLabs, if we enable audio output  
- Stripe for payments  
- Object storage for document uploads and generated PDF reports  

---

### 2.2 data model, conceptual

```text
User
  id
  email (optional)
  createdAt

Session
  id
  userId (nullable)
  mode: 'free' | 'paid'
  status: 'active' | 'ended'
  startedAt
  endedAt (nullable)
  paymentId (nullable)
  metadata (for example country, language)

Message
  id
  sessionId
  role: 'user' | 'assistant' | 'system'
  text
  createdAt

Document
  id
  title
  description (optional)
  url
  mimeType
  sizeBytes
  status: 'active' | 'archived'
  createdAt
  updatedAt

SessionDocument
  id
  sessionId
  documentId

Report
  id
  sessionId
  url
  createdAt

AdminUser
  id
  email
  passwordHash or externalAuthId
  createdAt
