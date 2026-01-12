'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  MessageSquare, 
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'

interface Session {
  id: string
  mode: 'free' | 'paid'
  status: 'active' | 'ended'
  started_at: string
  ended_at: string | null
  message_count: number
  language: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminConversationsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [modeFilter, setModeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchSessions = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (modeFilter !== 'all') params.append('mode', modeFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`/api/sessions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, modeFilter, statusFilter])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const filteredSessions = sessions.filter(session =>
    session.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Conversas</h1>
        <p className="text-gray-500 mt-1">
          Visualizar e analisar conversas com o assistente AI
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Sessões</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar por ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="free">Gratuito</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="ended">Terminado</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchSessions}
                disabled={isLoading}
                title="Atualizar"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID da Sessão</TableHead>
                    <TableHead>Modo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Mensagens</TableHead>
                    <TableHead>Iniciada</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {session.id.slice(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.mode === 'paid' ? 'default' : 'secondary'}>
                          {session.mode === 'paid' ? 'Pago' : 'Gratuito'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            session.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-sm text-gray-600">
                            {session.status === 'active' ? 'Ativo' : 'Terminado'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {session.message_count}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {format(new Date(session.started_at), "d MMM yyyy, HH:mm", { locale: pt })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {session.ended_at 
                            ? formatDistanceToNow(new Date(session.started_at), { locale: pt })
                            : 'Em curso'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/conversations/${session.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Mostrando {filteredSessions.length} de {pagination.total} sessões
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {pagination.page} de {pagination.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

