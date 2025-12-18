'use client'

import { ChatWidget } from '@/components/widget'

export default function EmbedDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Widget Demo</h1>
        <p className="text-gray-600 mb-8">
          This page demonstrates the AI chat widget. Look for the chat bubble in the bottom right corner.
        </p>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Embed Instructions</h2>
          <p className="text-gray-600 mb-4">
            To embed the widget on your website, add the following code before the closing {`</body>`} tag:
          </p>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`<!-- Bizin Agent Widget -->
<script 
  src="https://your-domain.com/widget.js"
  data-bizin-auto-init
  data-api-url="https://your-api-domain.com"
  data-language="pt"
  data-theme="light"
></script>`}
          </pre>
          
          <h3 className="text-lg font-semibold mt-6 mb-3">Configuration Options</h3>
          <p className="text-sm text-gray-600 mb-4">
            <strong>Note:</strong> If no language is specified, the widget will automatically detect the website's language from the document's lang attribute or browser settings.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Attribute</th>
                <th className="text-left py-2">Description</th>
                <th className="text-left py-2">Default</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2"><code>data-api-url</code></td>
                <td className="py-2">API endpoint URL</td>
                <td className="py-2">Current domain</td>
              </tr>
              <tr className="border-b">
                <td className="py-2"><code>data-language</code></td>
                <td className="py-2">Widget language (pt, en, fr, or es)</td>
                <td className="py-2">Auto-detect</td>
              </tr>
              <tr className="border-b">
                <td className="py-2"><code>data-theme</code></td>
                <td className="py-2">Color theme (light or dark)</td>
                <td className="py-2">light</td>
              </tr>
              <tr className="border-b">
                <td className="py-2"><code>data-container</code></td>
                <td className="py-2">CSS selector for custom container</td>
                <td className="py-2">Body append</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-lg font-semibold mt-6 mb-3">Manual Initialization</h3>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`<script src="https://your-domain.com/widget.js"></script>
<script>
  window.BizinAgent.init({
    apiUrl: 'https://your-api-domain.com',
    language: 'pt',
    theme: 'light'
  });
</script>`}
          </pre>
        </div>
      </div>

      {/* The actual widget */}
      <ChatWidget 
        apiUrl="" 
        language="pt" 
        theme="light" 
      />
    </div>
  )
}

