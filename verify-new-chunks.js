const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

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

async function verify() {
  console.log('🔍 A verificar novo upload...\n')
  
  // Check documents
  const { data: docs } = await supabase
    .from('documents')
    .select('id, title, created_at')
    .eq('document_type', 'knowledge_base')
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (!docs || docs.length === 0) {
    console.log('❌ Nenhum documento encontrado. Faz upload primeiro!')
    return
  }
  
  const doc = docs[0]
  console.log(`📄 Último documento: ${doc.title}`)
  console.log(`📅 Carregado: ${new Date(doc.created_at).toLocaleString('pt-PT')}\n`)
  
  // Check embeddings
  const { data: embeddings } = await supabase
    .from('document_embeddings')
    .select('chunk_index, chunk_text')
    .eq('document_id', doc.id)
    .order('chunk_index', { ascending: true })
  
  if (!embeddings || embeddings.length === 0) {
    console.log('⚠️  Nenhum embedding encontrado. Aguarda processamento...')
    return
  }
  
  console.log(`✅ ${embeddings.length} chunks criados\n`)
  console.log('═'.repeat(80))
  
  let foundCompleteInvestimento = false
  let foundCompleteFormacao = false
  
  embeddings.forEach((emb) => {
    const hasStripe = emb.chunk_text.includes('checkout.stripe.com')
    
    if (hasStripe) {
      const urlMatches = emb.chunk_text.match(/https:\/\/checkout\.stripe\.com[^\s\)]+/g)
      
      if (urlMatches) {
        urlMatches.forEach(url => {
          const isInvestimento = url.includes('cs_live_a19eZVk')
          const isFormacao = url.includes('cs_live_a1LvZJZ')
          
          console.log(`\n📦 Chunk ${emb.chunk_index}:`)
          console.log(`   ${isInvestimento ? '💰 INVESTIMENTO' : '📚 FORMAÇÃO'}`)
          console.log(`   📏 Tamanho do chunk: ${emb.chunk_text.length} caracteres`)
          console.log(`   📏 Tamanho do URL: ${url.length} caracteres`)
          console.log(`   🔗 URL: ${url.substring(0, 60)}...${url.substring(url.length - 20)}`)
          
          if (url.length >= 340) {
            console.log(`   ✅ URL COMPLETO!`)
            if (isInvestimento) foundCompleteInvestimento = true
            if (isFormacao) foundCompleteFormacao = true
          } else {
            console.log(`   ❌ URL ainda truncado (faltam ~${345 - url.length} chars)`)
          }
        })
      }
    }
  })
  
  console.log('\n' + '═'.repeat(80))
  console.log('\n💡 RESULTADO:')
  console.log(`   Investimento: ${foundCompleteInvestimento ? '✅ OK' : '❌ Ainda truncado'}`)
  console.log(`   Formação: ${foundCompleteFormacao ? '✅ OK' : '❌ Ainda truncado'}`)
  
  if (foundCompleteInvestimento && foundCompleteFormacao) {
    console.log('\n🎉 TUDO CERTO! Agora o RAG vai enviar URLs completos ao GPT!')
  } else {
    console.log('\n⚠️  URLs ainda estão truncados. Chunks precisam ser maiores.')
  }
}

verify().catch(console.error)
