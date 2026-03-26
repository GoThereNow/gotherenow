import { supabase } from '../../lib/supabase'

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID
const MAILCHIMP_DC = MAILCHIMP_API_KEY?.split('-')[1] || 'us11'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, source = 'homepage' } = req.body
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' })

  const results = { supabase: false, mailchimp: false }

  // 1. Save to Supabase
  try {
    const { error } = await supabase.from('waitlist').insert({ email, source })
    if (!error) results.supabase = true
  } catch (e) {
    console.error('Supabase error:', e)
  }

  // 2. Add to Mailchimp
  try {
    const response = await fetch(
      `https://${MAILCHIMP_DC}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`,
      {
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
      }
    )
    const data = await response.json()
    if (data.id || data.status === 'subscribed') results.mailchimp = true
    // If already subscribed, that's fine too
    if (data.title === 'Member Exists') results.mailchimp = true
  } catch (e) {
    console.error('Mailchimp error:', e)
  }

  if (results.supabase || results.mailchimp) {
    return res.status(200).json({ success: true, message: "You're on the list!" })
  }

  return res.status(500).json({ error: 'Failed to save email' })
}

export const config = { api: { bodyParser: true } }
