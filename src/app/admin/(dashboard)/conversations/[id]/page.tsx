import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SessionActions } from '@/components/admin/SessionActions'
import { ArrowLeft, Download, FileText, Clock, MessageSquare } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// Simple markdown parser for basic formatting
function parseMarkdown(text: string): string {
  let html = text
    // Bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700;">$1</strong>')
    .replace(/__(.*?)__/g, '<strong style="font-weight: 700;">$1</strong>')
    // Italic: *text* or _text_ (but not if part of bold)
    .replace(/(?<!\*)\*(?!\*)([^\*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_(?!_)([^_]+)_(?!_)/g, '<em>$1</em>')
  
  // Handle lists (bullet points with - or * at start of line)
  const lines = html.split('\n')
  let inList = false
  const processedLines: string[] = []
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    const isBullet = /^[-*]\s+/.test(trimmedLine)
    
    if (isBullet) {
      if (!inList) {
        processedLines.push('<ul class="list-disc ml-4 my-1">')
        inList = true
      }
      const content = trimmedLine.replace(/^[-*]\s+/, '')
      processedLines.push(`<li>${content}</li>`)
    } else {
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      processedLines.push(line)
    }
    
    // Close list at the end if still open
    if (index === lines.length - 1 && inList) {
      processedLines.push('</ul>')
    }
  })
  
  return processedLines.join('\n').replace(/\n/g, '<br />')
}

interface PageProps {
  params: Promise<{ id: string }>
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

interface DocumentInfo {
  id: string
  title: string
  url: string
  mime_type: string
  size_bytes: number
}

interface SessionDocument {
  id: string
  document: DocumentInfo | DocumentInfo[] | null
}

interface Report {
  id: string
  url: string
  created_at: string
}

export default async function ConversationDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch session with messages, documents, and reports
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (sessionError || !session) {
    notFound()
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: true })

  // Extract user name from first user messages
  let userName: string | null = null
  const userMessages = (messages || []).filter((m: Message) => m.role === 'user').slice(0, 5)
  
  if (userMessages.length > 0) {
    const firstMessage = userMessages[0].content.trim()
    
    // Pattern 1: Direct name responses
    if (firstMessage.length < 50 && firstMessage.split(' ').length <= 3) {
      const cleaned = firstMessage
        .replace(/^(olá|oi|hello|hi|hey|bom dia|boa tarde|boa noite|me chamo|meu nome é|i am|i'm|my name is|je suis|je m'appelle|me llamo|soy)/gi, '')
        .replace(/[.,!?]/g, '')
        .trim()
      
      if (cleaned && cleaned.length > 1 && cleaned.length < 30) {
        userName = cleaned
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      }
    }
    
    // Pattern 2: Look for "my name is" patterns
    if (!userName) {
      for (const msg of userMessages) {
        const content = msg.content.toLowerCase()
        const namePatterns = [
          /(?:me chamo|meu nome é|o meu nome é|sou o|sou a|chamo-me)\s+([a-zà-ÿ\s]{2,30})/i,
          /(?:my name is|i am|i'm|call me)\s+([a-z\s]{2,30})/i,
          /(?:je m'appelle|je suis)\s+([a-zà-ÿ\s]{2,30})/i,
          /(?:me llamo|mi nombre es|soy)\s+([a-zà-ÿ\s]{2,30})/i,
        ]
        
        for (const pattern of namePatterns) {
          const match = content.match(pattern)
          if (match && match[1]) {
            const extractedName = match[1].trim()
              .split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ')
            
            if (extractedName.length > 1 && extractedName.length < 30) {
              userName = extractedName
              break
            }
          }
        }
        if (userName) break
      }
    }
  }

  const { data: sessionDocs } = await supabase
    .from('session_documents')
    .select(`
      id,
      document:documents(id, title, url, mime_type, size_bytes)
    `)
    .eq('session_id', id)

  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: false })

  const calculateDuration = () => {
    if (!session.ended_at) return 'Em curso'
    const start = new Date(session.started_at)
    const end = new Date(session.ended_at)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.round(diffMs / 60000)
    if (diffMins < 60) return `${diffMins} minutos`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}min`
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const visibleMessages = (messages || []).filter((m: Message) => m.role !== 'system')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/conversations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {userName ? userName : `Sessão ${id.slice(0, 8)}...`}
          </h1>
          <p className="text-gray-500 mt-1">
            {userName && <span className="text-xs font-mono text-gray-400 mr-2">({id.slice(0, 8)}...)</span>}
            {format(new Date(session.started_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: pt })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={session.mode === 'paid' ? 'default' : 'secondary'} className="text-sm">
            {session.mode === 'paid' ? 'Sessão Paga' : 'Sessão Gratuita'}
          </Badge>
          <SessionActions 
            sessionId={id} 
            sessionStatus={session.status}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Mensagens</p>
                <p className="text-xl font-bold text-gray-900">{session.message_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Duração</p>
                <p className="text-xl font-bold text-gray-900">{calculateDuration()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Documentos</p>
                <p className="text-xl font-bold text-gray-900">{sessionDocs?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${session.status === 'active' ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center`}>
                <span className={`w-3 h-3 rounded-full ${session.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <p className="text-xl font-bold text-gray-900">
                  {session.status === 'active' ? 'Ativo' : 'Terminado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {visibleMessages.length > 0 ? (
                visibleMessages.map((message: Message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${
                          message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {message.role === 'user' ? 'Utilizador' : 'Assistente'}
                        </span>
                        <span className={`text-xs ${
                          message.role === 'user' ? 'text-white/60' : 'text-gray-400'
                        }`}>
                          {format(new Date(message.created_at), 'HH:mm')}
                        </span>
                      </div>
                      {message.role === 'assistant' ? (
                        <div 
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma mensagem nesta sessão
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Documents */}
          {sessionDocs && sessionDocs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documentos Carregados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sessionDocs.map((sd) => {
                    const doc = Array.isArray(sd.document) ? sd.document[0] : sd.document
                    if (!doc) return null
                    return (
                      <a
                        key={sd.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.title}</p>
                          <p className="text-xs text-gray-400">{formatBytes(doc.size_bytes)}</p>
                        </div>
                        <Download className="w-4 h-4 text-gray-400" />
                      </a>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reports */}
          {reports && reports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Relatórios Gerados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reports.map((report: Report) => (
                    <a
                      key={report.id}
                      href={report.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-emerald-700">Relatório PDF</p>
                        <p className="text-xs text-emerald-600/70">
                          {formatDistanceToNow(new Date(report.created_at), {
                            addSuffix: true,
                            locale: pt,
                          })}
                        </p>
                      </div>
                      <Download className="w-4 h-4 text-emerald-600" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">ID completo</dt>
                  <dd className="font-mono text-xs mt-1 bg-gray-100 p-2 rounded break-all">
                    {id}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Idioma</dt>
                  <dd className="text-gray-900">{session.language === 'en' ? 'Inglês' : 'Português'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Início</dt>
                  <dd className="text-gray-900">
                    {format(new Date(session.started_at), "d/MM/yyyy HH:mm:ss")}
                  </dd>
                </div>
                {session.ended_at && (
                  <div>
                    <dt className="text-gray-500">Fim</dt>
                    <dd className="text-gray-900">
                      {format(new Date(session.ended_at), "d/MM/yyyy HH:mm:ss")}
                    </dd>
                  </div>
                )}
                {session.payment_id && (
                  <div>
                    <dt className="text-gray-500">ID de Pagamento</dt>
                    <dd className="font-mono text-xs mt-1 bg-gray-100 p-2 rounded break-all">
                      {session.payment_id}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

