-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for RAG embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table (for tracking chat users, can be anonymous)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  mode TEXT NOT NULL DEFAULT 'free' CHECK (mode IN ('free', 'paid')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  payment_id TEXT,
  metadata JSONB DEFAULT '{}',
  message_count INTEGER DEFAULT 0 NOT NULL,
  language TEXT DEFAULT 'pt' CHECK (language IN ('pt', 'en'))
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Documents table (for knowledge base and user uploads)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  document_type TEXT NOT NULL DEFAULT 'knowledge_base' CHECK (document_type IN ('knowledge_base', 'user_upload')),
  content_text TEXT, -- Extracted text content for search
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Document embeddings for RAG (vector search)
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 embedding dimension
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Session documents junction table (for user-uploaded documents per session)
CREATE TABLE session_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(session_id, document_id)
);

-- Reports table (generated PDF reports)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Admin users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_mode ON sessions(mode);
CREATE INDEX idx_sessions_started_at ON sessions(started_at DESC);

CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(document_type);

CREATE INDEX idx_document_embeddings_document_id ON document_embeddings(document_id);

CREATE INDEX idx_session_documents_session_id ON session_documents(session_id);
CREATE INDEX idx_session_documents_document_id ON session_documents(document_id);

CREATE INDEX idx_reports_session_id ON reports(session_id);

-- Create vector similarity search index
CREATE INDEX idx_document_embeddings_vector ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public can create sessions (anonymous users)
CREATE POLICY "Anyone can create sessions" ON sessions
  FOR INSERT WITH CHECK (true);

-- Users can read their own sessions
CREATE POLICY "Users can read their own sessions" ON sessions
  FOR SELECT USING (true);

-- Service role can update sessions
CREATE POLICY "Service role can update sessions" ON sessions
  FOR UPDATE USING (true);

-- Messages policies
CREATE POLICY "Anyone can insert messages" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read messages" ON messages
  FOR SELECT USING (true);

-- Documents policies (knowledge base is public read)
CREATE POLICY "Anyone can read active knowledge base documents" ON documents
  FOR SELECT USING (status = 'active');

-- Document embeddings are readable for search
CREATE POLICY "Anyone can read document embeddings" ON document_embeddings
  FOR SELECT USING (true);

-- Session documents
CREATE POLICY "Anyone can insert session documents" ON session_documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read session documents" ON session_documents
  FOR SELECT USING (true);

-- Reports
CREATE POLICY "Anyone can read reports" ON reports
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert reports" ON reports
  FOR INSERT WITH CHECK (true);

-- Admin users (only authenticated admins can read)
CREATE POLICY "Admins can read admin_users" ON admin_users
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admin_users)
  );

-- Function to update message count on session
CREATE OR REPLACE FUNCTION update_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sessions
  SET message_count = message_count + 1
  WHERE id = NEW.session_id AND NEW.role = 'user';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update message count
CREATE TRIGGER trigger_update_message_count
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_message_count();

-- Function to search documents by embedding similarity
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  document_id UUID,
  chunk_text TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.document_id,
    de.chunk_text,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM document_embeddings de
  JOIN documents d ON d.id = de.document_id
  WHERE d.status = 'active'
    AND d.document_type = 'knowledge_base'
    AND 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to documents
CREATE TRIGGER trigger_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

