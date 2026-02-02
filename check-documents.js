// Script para verificar URLs nos documentos da knowledge base
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Ler .env.local manualmente
const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    // Remove aspas se existirem
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDocuments() {
  console.log('🔍 Verificando documentos da knowledge base...\n')
  
  // Buscar documentos
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, content_text')
    .eq('document_type', 'knowledge_base')
    .eq('status', 'active')
  
  if (error) {
    console.error('❌ Erro:', error)
    return
  }
  
  if (!documents || documents.length === 0) {
    console.log('⚠️  Nenhum documento encontrado na knowledge base!')
    console.log('\n📝 Precisa fazer upload de documentos no admin panel:')
    console.log('   http://localhost:3000/admin/documents')
    return
  }
  
  console.log(`✅ Encontrados ${documents.length} documento(s)\n`)
  
  // Procurar por URLs em cada documento
  documents.forEach((doc, index) => {
    console.log(`\n📄 Documento ${index + 1}: ${doc.title}`)
    console.log('─'.repeat(60))
    
    if (!doc.content_text) {
      console.log('   (Sem conteúdo)')
      return
    }
    
    // Procurar URLs (http/https)
    const urlRegex = /(https?:\/\/[^\s<>"]+)/g
    const urls = doc.content_text.match(urlRegex)
    
    if (urls && urls.length > 0) {
      console.log(`   🔗 URLs encontrados: ${urls.length}`)
      urls.forEach((url, i) => {
        // Verificar se o URL está truncado
        const isTruncated = url.includes('...') || url.endsWith('...')
        const status = isTruncated ? '❌ TRUNCADO' : '✅ COMPLETO'
        console.log(`      ${i + 1}. ${status}`)
        console.log(`         ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`)
      })
    } else {
      console.log('   ⚠️  Nenhum URL encontrado neste documento')
    }
    
    // Mostrar preview do conteúdo
    const preview = doc.content_text.substring(0, 200)
    console.log(`\n   Preview:`)
    console.log(`   ${preview}...`)
  })
  
  console.log('\n\n' + '='.repeat(60))
  console.log('💡 AÇÃO NECESSÁRIA:')
  console.log('='.repeat(60))
  console.log('Se os URLs estão TRUNCADOS (com "..."):')
  console.log('  1. Edite os documentos originais (PDF/DOCX/TXT)')
  console.log('  2. Certifique-se que os URLs estão COMPLETOS')
  console.log('  3. Faça re-upload no admin panel')
  console.log('\nSe os URLs estão COMPLETOS:')
  console.log('  ✅ O problema está resolvido!')
  console.log('  Inicie uma nova conversa para testar')
}

checkDocuments().catch(console.error)
