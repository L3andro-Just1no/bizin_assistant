'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react'

interface DocumentUploadProps {
  sessionId: string
  apiUrl: string
  language: 'pt' | 'en' | 'fr' | 'es'
  theme: 'light' | 'dark'
  onClose: () => void
}

interface UploadedFile {
  name: string
  size: number
  status: 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

const TRANSLATIONS = {
  pt: {
    title: 'Carregar documentos',
    description: 'Carregue documentos para análise personalizada. Aceitamos PDF, Word e ficheiros de texto.',
    dropzone: 'Arraste ficheiros ou clique para selecionar',
    maxSize: 'Tamanho máximo: 10MB por ficheiro',
    uploading: 'A carregar...',
    success: 'Carregado com sucesso',
    error: 'Erro no carregamento',
    done: 'Concluído',
    close: 'Fechar',
  },
  en: {
    title: 'Upload documents',
    description: 'Upload documents for personalized analysis. We accept PDF, Word and text files.',
    dropzone: 'Drag files or click to select',
    maxSize: 'Maximum size: 10MB per file',
    uploading: 'Uploading...',
    success: 'Uploaded successfully',
    error: 'Upload error',
    done: 'Done',
    close: 'Close',
  },
  fr: {
    title: 'Télécharger des documents',
    description: 'Téléchargez des documents pour une analyse personnalisée. Nous acceptons les PDF, Word et fichiers texte.',
    dropzone: 'Glissez les fichiers ou cliquez pour sélectionner',
    maxSize: 'Taille maximale : 10 Mo par fichier',
    uploading: 'Téléchargement en cours...',
    success: 'Téléchargé avec succès',
    error: 'Erreur de téléchargement',
    done: 'Terminé',
    close: 'Fermer',
  },
  es: {
    title: 'Subir documentos',
    description: 'Sube documentos para análisis personalizado. Aceptamos PDF, Word y archivos de texto.',
    dropzone: 'Arrastra archivos o haz clic para seleccionar',
    maxSize: 'Tamaño máximo: 10MB por archivo',
    uploading: 'Subiendo...',
    success: 'Subido con éxito',
    error: 'Error de subida',
    done: 'Hecho',
    close: 'Cerrar',
  }
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
}

export function DocumentUpload({ sessionId, apiUrl, language, onClose }: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const t = TRANSLATIONS[language]

  const uploadFile = async (file: File, index: number) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('session_id', sessionId)

    try {
      const response = await fetch(`${apiUrl}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, status: 'success', progress: 100 } : f
        ))
      } else {
        const error = await response.json()
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, status: 'error', error: error.message } : f
        ))
      }
    } catch {
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'error', error: 'Network error' } : f
      ))
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      name: file.name,
      size: file.size,
      status: 'uploading' as const,
      progress: 0,
    }))

    setFiles(prev => [...prev, ...newFiles])

    // Upload each file
    const startIndex = files.length
    for (let i = 0; i < acceptedFiles.length; i++) {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map((f, idx) => 
          idx === startIndex + i && f.status === 'uploading'
            ? { ...f, progress: Math.min(f.progress + 10, 90) }
            : f
        ))
      }, 200)

      await uploadFile(acceptedFiles[i], startIndex + i)
      clearInterval(progressInterval)
    }
  }, [files.length, sessionId, apiUrl])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const hasUploading = files.some(f => f.status === 'uploading')

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-teal-500 bg-teal-50'
              : 'border-gray-200 hover:border-teal-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-teal-500' : 'text-gray-400'}`} />
          <p className="text-sm text-gray-600">{t.dropzone}</p>
          <p className="text-xs text-gray-400 mt-1">{t.maxSize}</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
              >
                <File className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                  {file.status === 'uploading' && (
                    <Progress value={file.progress} className="h-1 mt-1" />
                  )}
                </div>
                <div className="shrink-0">
                  {file.status === 'uploading' && (
                    <span className="text-xs text-gray-500">{t.uploading}</span>
                  )}
                  {file.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                  {file.status === 'error' && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <button onClick={() => removeFile(index)}>
                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={hasUploading}>
            {t.close}
          </Button>
          {files.length > 0 && !hasUploading && (
            <Button 
              onClick={onClose}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
            >
              {t.done}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

