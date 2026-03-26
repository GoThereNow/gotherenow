import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, source = 'homepage' } = req.body
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' })

  // 1. Save to Supabase
  try {
    await supabase.from('waitlist').insert({ email, source })
  } catch (e) {
    console.error('Supabase error:', e)
  }

  // 2. Add to Mailchimp using fetch with explicit error handling
  const API_KEY = process.env.MAILCHIMP_API_KEY
  const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID

  if (!API_KEY || !AUDIENCE_ID) {
    console.error('Missing Mailchimp env vars')
    return res.status(200).json({ success: true, message: "You're on the list!" })
  }

  const DC = API_KEY.split('-').pop()
  const url = `https://${DC}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`
  const auth = Buffer.from(`anystring:${API_KEY}`).toString('base64')

  console.log('DC:', DC)
  console.log('URL:', url)
  console.log('API key last 4:', API_KEY.slice(-4))

  try {
    const mc = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
      }),
    })

    const text = await mc.text()
    console.log('Mailchimp status:', mc.status)
    console.log('Mailchimp body:', text)

    return res.status(200).json({ 
      success: true, 
      message: "You're on the list!",
      mc_status: mc.status,
      mc_body: text
    })
  } catch (e) {
    console.error('Mailchimp fetch error:', e.message)
    return res.status(200).json({ success: true, message: "You're on the list!" })
  }
}

export const config = { api: { bodyParser: true } }
