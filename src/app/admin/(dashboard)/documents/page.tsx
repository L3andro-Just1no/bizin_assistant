'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Upload, 
  FileText, 
  Trash2, 
  Archive,
  RotateCcw,
  Loader2,
  Search
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

interface Document {
  id: string
  title: string
  description: string | null
  url: string
  mime_type: string
  size_bytes: number
  status: 'active' | 'archived'
  created_at: string
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    try {
      const status = showArchived ? '' : 'active'
      const res = await fetch(`/api/documents?type=knowledge_base${status ? `&status=${status}` : ''}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [showArchived])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true)
    
    for (const file of acceptedFiles) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('knowledge_base', 'true')

      try {
        const res = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (!res.ok) {
          const error = await res.json()
          console.error('Upload failed:', error)
        }
      } catch (error) {
        console.error('Upload error:', error)
      }
    }

    setIsUploading(false)
    setUploadDialogOpen(false)
    fetchDocuments()
  }, [fetchDocuments])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
  })

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      })
      if (res.ok) {
        fetchDocuments()
      }
    } catch (error) {
      console.error('Archive error:', error)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
      if (res.ok) {
        fetchDocuments()
      }
    } catch (error) {
      console.error('Restore error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem a certeza que deseja eliminar permanentemente este documento?')) {
      return
    }
    
    try {
      const res = await fetch(`/api/documents/${id}?permanent=true`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchDocuments()
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Base de Conhecimento</h1>
          <p className="text-gray-500 mt-1">
            Gerir documentos que alimentam o assistente AI
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700">
              <Upload className="w-4 h-4 mr-2" />
              Carregar Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Carregar Documento</DialogTitle>
              <DialogDescription>
                Carregue documentos PDF, Word ou TXT para a base de conhecimento.
              </DialogDescription>
            </DialogHeader>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-teal-400'
              }`}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                  <p className="text-sm text-gray-600">A carregar...</p>
                </div>
              ) : (
                <>
                  <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-teal-500' : 'text-gray-400'}`} />
                  <p className="text-sm text-gray-600">
                    Arraste ficheiros ou clique para selecionar
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, Word, TXT (máx. 10MB)
                  </p>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documentos</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar documentos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? 'Ocultar arquivados' : 'Mostrar arquivados'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum documento encontrado</p>
              <p className="text-sm text-gray-400 mt-1">
                Carregue documentos para começar a construir a base de conhecimento
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-gray-900 hover:text-teal-600"
                          >
                            {doc.title}
                          </a>
                          {doc.description && (
                            <p className="text-sm text-gray-500">{doc.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {doc.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatBytes(doc.size_bytes)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {format(new Date(doc.created_at), "d MMM yyyy", { locale: pt })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={doc.status === 'active' ? 'default' : 'secondary'}>
                        {doc.status === 'active' ? 'Ativo' : 'Arquivado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleArchive(doc.id)}
                            title="Arquivar"
                          >
                            <Archive className="w-4 h-4 text-gray-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRestore(doc.id)}
                            title="Restaurar"
                          >
                            <RotateCcw className="w-4 h-4 text-gray-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

