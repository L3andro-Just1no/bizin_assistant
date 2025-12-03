import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Admin client with service role key - use only on server-side
let _adminClient: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error('Supabase environment variables are not set')
    }

    _adminClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return _adminClient
}

