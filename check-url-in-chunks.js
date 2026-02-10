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

const CORRECT_URL = 'https://checkout.stripe.com/c/pay/cs_live_a19eZVkKPgeeCTgMBkA9GNmnelnu9cBma9YtbWN9g2f0TWR4wr6NuWFZh8#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdkdWxOYHwnPyd1blppbHNgWlVVYDdcZkxUTzNUbmJnb3RvU05JYH1nZzU1SmNrN09jcWonKSdjd2hoVmB3c2B3Jz9xd3BgKSdnZGZuYndqcGthRmppancnPycmMT08NDdnJyknaWR8anBxUXx1YCc%2FJ3Zsa2JpYFpscWBoJyknYGtkZ2lgVWlkZmBtamlhYHd2Jz9xd3BgeCUl'

async function check() {
  console.log('🔍 A verificar se o URL completo está nos chunks...\n')
  console.log('📏 Tamanho do URL correto:', CORRECT_URL.length, 'caracteres\n')
  
  const { data: embeddings } = await supabase
    .from('document_embeddings')
    .select('chunk_index, chunk_text')
    .order('chunk_index', { ascending: true })
  
  if (!embeddings || embeddings.length === 0) {
    console.log('❌ Nenhum embedding encontrado!')
    return
  }
  
  console.log(`✅ ${embeddings.length} chunks encontrados\n`)
  console.log('═'.repeat(80))
  
  let foundComplete = false
  let foundPartial = false
  
  embeddings.forEach((emb, idx) => {
    const hasStripeLink = emb.chunk_text.includes('checkout.stripe.com')
    
    if (hasStripeLink) {
      console.log(`\n📦 Chunk ${emb.chunk_index}:`)
      
      // Extract URL from chunk
      const urlMatch = emb.chunk_text.match(/https:\/\/checkout\.stripe\.com[^\s\)]+/)
      
      if (urlMatch) {
        const extractedUrl = urlMatch[0]
        console.log(`   📏 Tamanho do URL extraído: ${extractedUrl.length} caracteres`)
        console.log(`   🔗 URL: ${extractedUrl.substring(0, 100)}...${extractedUrl.substring(extractedUrl.length - 20)}`)
        
        if (extractedUrl === CORRECT_URL) {
          console.log(`   ✅ URL COMPLETO E CORRETO!`)
          foundComplete = true
        } else if (extractedUrl.length < CORRECT_URL.length) {
          console.log(`   ⚠️  URL TRUNCADO! Faltam ${CORRECT_URL.length - extractedUrl.length} caracteres`)
          foundPartial = true
          
          // Check where it was cut
          const cutPoint = extractedUrl.length
          console.log(`   📍 Cortado em: "${extractedUrl.substring(extractedUrl.length - 30)}"`)
          console.log(`   📍 Deveria ter: "${CORRECT_URL.substring(cutPoint - 30, cutPoint + 30)}"`)
        } else {
          console.log(`   ⚠️  URL diferente`)
        }
        
        // Show context around URL
        const urlIndex = emb.chunk_text.indexOf(extractedUrl)
        const contextBefore = emb.chunk_text.substring(Math.max(0, urlIndex - 50), urlIndex)
        const contextAfter = emb.chunk_text.substring(urlIndex + extractedUrl.length, Math.min(emb.chunk_text.length, urlIndex + extractedUrl.length + 50))
        
        console.log(`\n   📄 Contexto:`)
        console.log(`      Antes: "...${contextBefore}"`)
        console.log(`      Depois: "${contextAfter}..."`)
      }
    }
  })
  
  console.log('\n' + '═'.repeat(80))
  console.log('\n💡 CONCLUSÃO:')
  if (foundComplete) {
    console.log('✅ URL completo EXISTE nos embeddings')
    console.log('   → Problema: GPT pode estar a truncar na resposta')
  } else if (foundPartial) {
    console.log('❌ URL foi CORTADO durante o chunking!')
    console.log('   → Solução: Aumentar tamanho dos chunks ou ajustar overlap')
  } else {
    console.log('❓ URL não encontrado nos chunks')
  }
}

check().catch(console.error)
