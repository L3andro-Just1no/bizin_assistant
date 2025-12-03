import { openai, OPENAI_CONFIG, SYSTEM_PROMPT_PT, SYSTEM_PROMPT_EN } from './config'
import { createAdminClient } from '@/lib/supabase/admin'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatContext {
  sessionId: string
  language: 'pt' | 'en'
  isPaid: boolean
}

// Fallback responses when OpenAI is unavailable
const FALLBACK_RESPONSES = {
  pt: [
    'Obrigado pela sua mensagem! Neste momento o nosso assistente AI está temporariamente indisponível. Por favor, contacte-nos diretamente em geral@neomarca.pt ou +351 289 098 720 para assistência imediata.',
    'Lamentamos, mas estamos com dificuldades técnicas temporárias. A equipa Neomarca está disponível para ajudar em geral@neomarca.pt',
  ],
  en: [
    'Thank you for your message! Our AI assistant is temporarily unavailable. Please contact us directly at geral@neomarca.pt or +351 289 098 720 for immediate assistance.',
    'We apologize, but we are experiencing temporary technical difficulties. The Neomarca team is available to help at geral@neomarca.pt',
  ],
}

export async function generateChatResponse(
  userMessage: string,
  conversationHistory: Message[],
  context: ChatContext
): Promise<string> {
  const { language } = context
  
  // Check if OpenAI is configured
  if (!process.env.OPENAI_API_KEY) {
    const responses = FALLBACK_RESPONSES[language]
    return responses[0]
  }

  // Get system prompt based on language
  const systemPrompt = language === 'pt' ? SYSTEM_PROMPT_PT : SYSTEM_PROMPT_EN

  // Get relevant knowledge base context if available (skip if it might fail)
  let knowledgeContext: string | null = null
  try {
    knowledgeContext = await getKnowledgeContext(userMessage)
  } catch (error) {
    console.error('Knowledge context fetch error:', error)
    // Continue without knowledge context
  }
  
  // Build the full system prompt with knowledge context
  let fullSystemPrompt = systemPrompt
  if (knowledgeContext) {
    fullSystemPrompt += `\n\n---\nContexto adicional da base de conhecimento:\n${knowledgeContext}`
  }

  // Build messages array for OpenAI
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: fullSystemPrompt },
    ...conversationHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })),
    { role: 'user', content: userMessage }
  ]

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      messages,
      max_tokens: OPENAI_CONFIG.maxTokens,
      temperature: OPENAI_CONFIG.temperature,
    })

    return response.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.'
  } catch (error: unknown) {
    console.error('OpenAI API error:', error)
    
    // Check if it's a quota error
    if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
      const responses = FALLBACK_RESPONSES[language]
      return responses[Math.floor(Math.random() * responses.length)]
    }
    
    // Return fallback for any other error
    const responses = FALLBACK_RESPONSES[language]
    return responses[0]
  }
}

async function getKnowledgeContext(query: string): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    
    // First, generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    })

    const queryEmbedding = embeddingResponse.data[0].embedding

    // Search for similar documents using pgvector
    const { data: results, error } = await supabase.rpc('search_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 3,
    })

    if (error || !results || results.length === 0) {
      return null
    }

    // Combine the relevant chunks into context
    const contextParts = results.map((r: { chunk_text: string; similarity: number }) => r.chunk_text)
    return contextParts.join('\n\n---\n\n')
  } catch (error) {
    console.error('Knowledge context fetch error:', error)
    return null
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Embedding generation error:', error)
    throw new Error('Failed to generate embedding')
  }
}

