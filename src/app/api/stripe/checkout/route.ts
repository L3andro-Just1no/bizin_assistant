import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const CheckoutRequestSchema = z.object({
  session_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payments are not configured. Please contact us at geral@neomarca.pt' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { session_id } = CheckoutRequestSchema.parse(body)

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const { getStripe, STRIPE_CONFIG } = await import('@/lib/stripe/config')
    
    const supabase = createAdminClient()
    const stripe = getStripe()

    // Verify session exists
    const { data: chatSession, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (sessionError || !chatSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if already paid
    if (chatSession.mode === 'paid') {
      return NextResponse.json(
        { error: 'Session is already paid' },
        { status: 400 }
      )
    }

    // Get the app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: STRIPE_CONFIG.currency,
            product_data: {
              name: 'Sessão Paga - Bizin Assistant',
              description: 'Acesso completo: mensagens ilimitadas, upload de documentos e relatório PDF personalizado',
            },
            unit_amount: STRIPE_CONFIG.paidSessionPrice,
          },
          quantity: 1,
        },
      ],
      metadata: {
        session_id,
      },
      success_url: `${appUrl}?payment_success=true&session_id=${session_id}`,
      cancel_url: `${appUrl}?payment_cancelled=true&session_id=${session_id}`,
    })

    return NextResponse.json({
      url: stripeSession.url,
      checkout_session_id: stripeSession.id,
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
