'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Archive, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SessionActionsProps {
  sessionId: string
  sessionStatus: 'active' | 'ended'
}

export function SessionActions({ sessionId, sessionStatus }: SessionActionsProps) {
  const router = useRouter()
  const [isArchiving, setIsArchiving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const confirmationCode = sessionId.slice(0, 8)

  const handleArchive = async () => {
    setIsArchiving(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended' }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        alert('Erro ao arquivar sessão')
      }
    } catch (error) {
      console.error('Archive error:', error)
      alert('Erro ao arquivar sessão')
    } finally {
      setIsArchiving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmation !== confirmationCode) {
      setDeleteError(`Por favor, digite "${confirmationCode}" para confirmar`)
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch(`/api/sessions/${sessionId}?confirm=${confirmationCode}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setShowDeleteDialog(false)
        router.push('/admin/conversations')
        router.refresh()
      } else {
        const data = await res.json()
        setDeleteError(data.error || 'Erro ao eliminar sessão')
      }
    } catch (error) {
      console.error('Delete error:', error)
      setDeleteError('Erro ao eliminar sessão')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {sessionStatus === 'active' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            disabled={isArchiving}
          >
            {isArchiving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Archive className="w-4 h-4 mr-2" />
            )}
            Arquivar
          </Button>
        )}
        
        {sessionStatus === 'ended' && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Eliminar Sessão</DialogTitle>
            <DialogDescription className="text-center">
              Esta ação é irreversível. Todas as mensagens, documentos e relatórios associados serão permanentemente eliminados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>
                Para confirmar, digite o código da sessão: <strong>{confirmationCode}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="confirmation">Código de confirmação</Label>
              <Input
                id="confirmation"
                value={deleteConfirmation}
                onChange={(e) => {
                  setDeleteConfirmation(e.target.value)
                  setDeleteError(null)
                }}
                placeholder={confirmationCode}
                disabled={isDeleting}
                autoComplete="off"
              />
            </div>

            {deleteError && (
              <Alert variant="destructive">
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteConfirmation('')
                setDeleteError(null)
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || deleteConfirmation !== confirmationCode}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A eliminar...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Permanentemente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

