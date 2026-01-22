import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, CreditCard, FileText, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import Link from 'next/link'

interface Session {
  id: string
  mode: 'free' | 'paid'
  status: 'active' | 'ended'
  started_at: string
  message_count: number
  user_name?: string | null
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Get sessions with at least 1 user message for stats
  const { data: allSessionsWithMessages } = await supabase
    .from('messages')
    .select('session_id')
    .eq('role', 'user')

  const allSessionIdsWithUserMessages = [...new Set(
    (allSessionsWithMessages || []).map(m => m.session_id)
  )]

  // Get stats (only count sessions with user messages)
  const { count: totalSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .in('id', allSessionIdsWithUserMessages)

  const { count: paidSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('mode', 'paid')
    .in('id', allSessionIdsWithUserMessages)

  const { count: totalDocuments } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('document_type', 'knowledge_base')
    .eq('status', 'active')

  const { count: totalMessages } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })

  // Get sessions with at least 1 user message
  const { data: sessionsWithMessages } = await supabase
    .from('messages')
    .select('session_id')
    .eq('role', 'user')

  const sessionIdsWithUserMessages = [...new Set(
    (sessionsWithMessages || []).map(m => m.session_id)
  )]

  // Get recent sessions (only those with user messages)
  const { data: recentSessionsData } = await supabase
    .from('sessions')
    .select('id, mode, status, started_at, message_count')
    .in('id', sessionIdsWithUserMessages)
    .order('started_at', { ascending: false })
    .limit(5)

  // Extract user names for recent sessions
  const recentSessions = await Promise.all(
    (recentSessionsData || []).map(async (session) => {
      // Get first 5 user messages to find the name
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('session_id', session.id)
        .eq('role', 'user')
        .order('created_at', { ascending: true })
        .limit(5)

      let userName = null
      
      if (messages && messages.length > 0) {
        const firstMessage = messages[0].content.trim()
        
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
          for (const msg of messages) {
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

      return {
        ...session,
        user_name: userName,
      }
    })
  )

  const stats = [
    {
      title: 'Total de Sessões',
      value: totalSessions || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Sessões Pagas',
      value: paidSessions || 0,
      icon: CreditCard,
      color: 'bg-emerald-500',
    },
    {
      title: 'Documentos Ativos',
      value: totalDocuments || 0,
      icon: FileText,
      color: 'bg-amber-500',
    },
    {
      title: 'Total de Mensagens',
      value: totalMessages || 0,
      icon: MessageSquare,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral do sistema Bizin Assistant</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sessões Recentes</CardTitle>
          <Link 
            href="/admin/conversations" 
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            Ver todas →
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSessions && recentSessions.length > 0 ? (
              recentSessions.map((session: Session) => (
                <Link
                  key={session.id}
                  href={`/admin/conversations/${session.id}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      session.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">
                        {session.user_name || `Sessão ${session.id.slice(0, 8)}...`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(session.started_at), {
                          addSuffix: true,
                          locale: pt,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      session.mode === 'paid' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {session.mode === 'paid' ? 'Pago' : 'Gratuito'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {session.message_count} msgs
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                Nenhuma sessão encontrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

