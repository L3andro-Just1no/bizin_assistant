'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, FileText, MessageSquare, FileOutput, Mail, Phone } from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgrade: () => void
  language: 'pt' | 'en' | 'fr' | 'es'
  theme: 'light' | 'dark'
}

const TRANSLATIONS = {
  pt: {
    title: 'Limite de mensagens atingido',
    description: 'Atingiu o limite de mensagens gratuitas. Para continuar a conversa e obter uma análise personalizada, entre em contacto connosco:',
    features: [
      { icon: MessageSquare, text: 'Mensagens ilimitadas' },
      { icon: FileText, text: 'Upload de documentos para análise' },
      { icon: FileOutput, text: 'Relatório PDF personalizado' },
    ],
    contact: 'Contacte-nos',
    email: 'geral@neomarca.pt',
    phone: '+351 289 098 720',
    close: 'Fechar',
  },
  en: {
    title: 'Message limit reached',
    description: 'You have reached the free message limit. To continue the conversation and get a personalized analysis, contact us:',
    features: [
      { icon: MessageSquare, text: 'Unlimited messages' },
      { icon: FileText, text: 'Document upload for analysis' },
      { icon: FileOutput, text: 'Personalized PDF report' },
    ],
    contact: 'Contact us',
    email: 'geral@neomarca.pt',
    phone: '+351 289 098 720',
    close: 'Close',
  },
  fr: {
    title: 'Limite de messages atteint',
    description: 'Vous avez atteint la limite de messages gratuits. Pour continuer la conversation et obtenir une analyse personnalisée, contactez-nous :',
    features: [
      { icon: MessageSquare, text: 'Messages illimités' },
      { icon: FileText, text: 'Téléchargement de documents pour analyse' },
      { icon: FileOutput, text: 'Rapport PDF personnalisé' },
    ],
    contact: 'Contactez-nous',
    email: 'geral@neomarca.pt',
    phone: '+351 289 098 720',
    close: 'Fermer',
  },
  es: {
    title: 'Límite de mensajes alcanzado',
    description: 'Ha alcanzado el límite de mensajes gratuitos. Para continuar la conversación y obtener un análisis personalizado, contáctenos:',
    features: [
      { icon: MessageSquare, text: 'Mensajes ilimitados' },
      { icon: FileText, text: 'Subida de documentos para análisis' },
      { icon: FileOutput, text: 'Informe PDF personalizado' },
    ],
    contact: 'Contáctenos',
    email: 'geral@neomarca.pt',
    phone: '+351 289 098 720',
    close: 'Cerrar',
  }
}

export function UpgradeModal({ isOpen, onClose, language }: UpgradeModalProps) {
  const t = TRANSLATIONS[language]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-center text-xl">{t.title}</DialogTitle>
          <DialogDescription className="text-center">
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {t.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-600/20 flex items-center justify-center">
                <feature.icon className="w-4 h-4 text-teal-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Contact info */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold text-teal-800">{t.contact}</p>
          <a 
            href={`mailto:${t.email}`}
            className="flex items-center gap-2 text-sm text-teal-700 hover:text-teal-900"
          >
            <Mail className="w-4 h-4" />
            {t.email}
          </a>
          <a 
            href={`tel:${t.phone.replace(/\s/g, '')}`}
            className="flex items-center gap-2 text-sm text-teal-700 hover:text-teal-900"
          >
            <Phone className="w-4 h-4" />
            {t.phone}
          </a>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full"
          >
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
