import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ChatWidget } from '../components/widget/ChatWidget'
import './widget-full.css'

interface WidgetConfig {
  siteKey?: string
  container?: string
  theme?: 'light' | 'dark'
  language?: 'pt' | 'en' | 'fr' | 'es'
  apiUrl?: string
}

interface BizinAgentAPI {
  init: (config?: WidgetConfig) => void
  destroy: () => void
}

let root: Root | null = null
let containerElement: HTMLElement | null = null

// Language detection utility
function detectLanguage(): 'pt' | 'en' | 'fr' | 'es' {
  // Check document language
  const docLang = document.documentElement.lang || navigator.language || 'pt'

  // Map common language codes to our supported languages
  const langMap: Record<string, 'pt' | 'en' | 'fr' | 'es'> = {
    'pt': 'pt',
    'pt-pt': 'pt',
    'pt-br': 'pt',
    'en': 'en',
    'en-us': 'en',
    'en-gb': 'en',
    'fr': 'fr',
    'fr-fr': 'fr',
    'es': 'es',
    'es-es': 'es',
    'es-mx': 'es',
  }

  // Extract base language (e.g., 'en' from 'en-US')
  const baseLang = docLang.toLowerCase().split('-')[0]

  return langMap[docLang.toLowerCase()] || langMap[baseLang] || 'pt'
}

const BizinAgent: BizinAgentAPI = {
  init: (config: WidgetConfig = {}) => {
    const {
      container,
      theme = 'light',
      language = detectLanguage(),
      apiUrl = '',
    } = config

    // If already initialized, destroy first
    if (root) {
      BizinAgent.destroy()
    }

    // Create or find container
    if (container) {
      containerElement = document.querySelector(container)
    }
    
    if (!containerElement) {
      containerElement = document.createElement('div')
      containerElement.id = 'bizin-agent-container'
      document.body.appendChild(containerElement)
    }

    // Create React root and render
    root = createRoot(containerElement)
    root.render(
      <React.StrictMode>
        <ChatWidget 
          apiUrl={apiUrl}
          language={language}
          theme={theme}
        />
      </React.StrictMode>
    )
  },

  destroy: () => {
    if (root) {
      root.unmount()
      root = null
    }
    if (containerElement && containerElement.id === 'bizin-agent-container') {
      containerElement.remove()
      containerElement = null
    }
  }
}

// Expose to window
declare global {
  interface Window {
    BizinAgent: BizinAgentAPI
  }
}

window.BizinAgent = BizinAgent

// Auto-initialize if data attributes are present
document.addEventListener('DOMContentLoaded', () => {
  const script = document.querySelector('script[data-bizin-auto-init]')
  if (script) {
    const config: WidgetConfig = {
      siteKey: script.getAttribute('data-site-key') || undefined,
      container: script.getAttribute('data-container') || undefined,
      theme: (script.getAttribute('data-theme') as 'light' | 'dark') || 'light',
      language: (script.getAttribute('data-language') as 'pt' | 'en' | 'fr' | 'es') || detectLanguage(),
      apiUrl: script.getAttribute('data-api-url') || '',
    }
    BizinAgent.init(config)
  }
})

export default BizinAgent

