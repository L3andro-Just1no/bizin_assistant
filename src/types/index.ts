// Database types
export interface User {
  id: string
  email: string | null
  created_at: string
}

export interface Session {
  id: string
  user_id: string | null
  mode: 'free' | 'paid'
  status: 'active' | 'ended'
  started_at: string
  ended_at: string | null
  payment_id: string | null
  metadata: Record<string, unknown> | null
  message_count: number
}

export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface Document {
  id: string
  title: string
  description: string | null
  url: string
  mime_type: string
  size_bytes: number
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
  // For knowledge base documents - stores extracted text chunks
  content_chunks: string[] | null
}

export interface SessionDocument {
  id: string
  session_id: string
  document_id: string
  created_at: string
}

export interface Report {
  id: string
  session_id: string
  url: string
  created_at: string
}

export interface AdminUser {
  id: string
  email: string
  created_at: string
}

// API types
export interface ChatRequest {
  session_id: string
  message: string
}

export interface ChatResponse {
  message: Message
  remaining_messages?: number
  upgrade_required?: boolean
}

export interface CreateSessionRequest {
  language?: 'pt' | 'en'
  metadata?: Record<string, unknown>
}

export interface CreateSessionResponse {
  session: Session
}

export interface UploadDocumentRequest {
  session_id: string
  file: File
}

export interface GenerateReportRequest {
  session_id: string
}

export interface GenerateReportResponse {
  report: Report
}

// Widget configuration
export interface WidgetConfig {
  siteKey: string
  container?: string
  theme?: 'light' | 'dark'
  language?: 'pt' | 'en'
  apiUrl?: string
}

// Constants
export const FREE_MESSAGE_LIMIT = 999999 // Unlimited messages
export const PAID_SESSION_PRICE_CENTS = 4900 // €49.00

