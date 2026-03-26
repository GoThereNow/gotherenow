import { supabase } from '../../lib/supabase'

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID
const MAILCHIMP_DC = MAILCHIMP_API_KEY?.split('-')[1] || 'us11'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, source = 'homepage' } = req.body
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' })

  const results = { supabase: false, mailchimp: false, mailchimp_error: null }

  // 1. Save to Supabase
  try {
    const { error } = await supabase.from('waitlist').insert({ email, source })
    if (!error) results.supabase = true
    else results.supabase_error = error.message
  } catch (e) {
    results.supabase_error = e.message
  }

  // 2. Add to Mailchimp
  try {
    const url = `https://${MAILCHIMP_DC}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`
    console.log('Mailchimp URL:', url)
    console.log('Mailchimp DC:', MAILCHIMP_DC)
    console.log('Audience ID:', MAILCHIMP_AUDIENCE_ID)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64')}`,
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        tags: [source],
      }),
    })
    const data = await response.json()
    console.log('Mailchimp response:', JSON.stringify(data))

    if (data.id || data.status === 'subscribed') results.mailchimp = true
    if (data.title === 'Member Exists') results.mailchimp = true
    if (!results.mailchimp) results.mailchimp_error = data.detail || data.title || 'Unknown error'
  } catch (e) {
    results.mailchimp_error = e.message
  }

  return res.status(200).json({ 
    success: true, 
    message: "You're on the list!",
    debug: results 
  })
}

export const config = { api: { bodyParser: true } }
