import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ChatWidget } from '../components/widget/ChatWidget'
import '../app/globals.css'
import './widget.css'

interface WidgetConfig {
  siteKey?: string
  container?: string
  theme?: 'light' | 'dark'
  language?: 'pt' | 'en'
  apiUrl?: string
}

interface BizinAgentAPI {
  init: (config?: WidgetConfig) => void
  destroy: () => void
}

let root: Root | null = null
let containerElement: HTMLElement | null = null

const BizinAgent: BizinAgentAPI = {
  init: (config: WidgetConfig = {}) => {
    const {
      container,
      theme = 'light',
      language = 'pt',
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
      language: (script.getAttribute('data-language') as 'pt' | 'en') || 'pt',
      apiUrl: script.getAttribute('data-api-url') || '',
    }
    BizinAgent.init(config)
  }
})

export default BizinAgent

