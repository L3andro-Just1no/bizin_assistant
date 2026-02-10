const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envContent = fs.readFileSync('.env.local', 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function reset() {
  console.log('🧹 A limpar knowledge base...\n')
  
  // Step 1: Get all knowledge base documents
  const { data: docs } = await supabase
    .from('documents')
    .select('id, title')
    .eq('document_type', 'knowledge_base')
  
  if (!docs || docs.length === 0) {
    console.log('ℹ️  Nenhum documento para apagar.\n')
  } else {
    console.log(`📄 Encontrados ${docs.length} documento(s):\n`)
    
    for (const doc of docs) {
      console.log(`   - ${doc.title}`)
      
      // Delete embeddings
      const { error: embError } = await supabase
        .from('document_embeddings')
        .delete()
        .eq('document_id', doc.id)
      
      if (embError) {
        console.log(`      ❌ Erro ao apagar embeddings: ${embError.message}`)
      } else {
        console.log(`      ✅ Embeddings apagados`)
      }
      
      // Delete document
      const { error: docError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id)
      
      if (docError) {
        console.log(`      ❌ Erro ao apagar documento: ${docError.message}`)
      } else {
        console.log(`      ✅ Documento apagado`)
      }
    }
  }
  
  console.log('\n✅ Knowledge base limpa!')
  console.log('\n📋 PRÓXIMOS PASSOS:')
  console.log('   1. Vai ao admin: http://localhost:3000/admin/documents')
  console.log('   2. Faz upload do ficheiro .docx')
  console.log('   3. Executa: node verify-new-chunks.js')
  console.log('   4. Verifica se os URLs têm 345 caracteres ✅')
}

reset().catch(console.error)
