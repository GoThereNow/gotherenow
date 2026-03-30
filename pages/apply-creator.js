export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'

export default function ApplyCreator() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [handle, setHandle] = useState('')
  const [form, setForm] = useState({
    instagram_url: '',
    tiktok_url: '',
    follower_count: '',
    why: '',
  })

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setCurrentUser(session.user)

      const { data: inf } = await supabase
        .from('influencers')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (inf) {
        setHandle(inf.handle)
        setForm({
          instagram_url: inf.instagram_url || '',
          tiktok_url: inf.tiktok_url || '',
          follower_count: inf.follower_count || '',
          why: '',
        })
        if (inf.approved) setIsApproved(true)
        if (inf.creator_application_submitted) setAlreadyApplied(true)
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    // Update influencer with application details
    await supabase.from('influencers').update({
      instagram_url: form.instagram_url || null,
      tiktok_url: form.tiktok_url || null,
      follower_count: form.follower_count ? parseInt(form.follower_count) : null,
      creator_application_submitted: true,
      creator_application_why: form.why,
    }).eq('user_id', currentUser.id)

    setSubmitted(true)
    setSaving(false)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f7f5f2' }}>
      <div style={{ textAlign:'center', color:'#1a6b7a' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ background:'#f7f5f2', minHeight:'100vh', fontFamily:'DM Sans, sans-serif' }}>
      <Head>
        <title>Apply for Creator Program — GoThereNow</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f7f5f2; font-family: 'DM Sans', sans-serif; }
        .wrap { max-width: 560px; margin: 0 auto; padding: 100px 24px 60px; }
        .page-eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 8px; }
        .page-title { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; color: #1a6b7a; margin-bottom: 8px; }
        .page-sub { font-size: 15px; color: rgba(26,107,122,0.55); line-height: 1.7; margin-bottom: 36px; }
        .card { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 20px rgba(26,107,122,0.08); border: 1px solid rgba(26,107,122,0.08); margin-bottom: 20px; }
        .card-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #1a6b7a; margin-bottom: 6px; }
        .card-sub { font-size: 13px; color: rgba(26,107,122,0.5); margin-bottom: 20px; line-height: 1.6; }
        .field { margin-bottom: 16px; }
        .label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.5); font-weight: 700; margin-bottom: 7px; display: block; }
        .input { width: 100%; padding: 12px 16px; background: #f7f5f2; border: 1px solid rgba(26,107,122,0.15); color: #1a6b7a; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; border-radius: 10px; }
        .input:focus { border-color: rgba(26,107,122,0.4); background: white; }
        .input::placeholder { color: rgba(26,107,122,0.3); }
        textarea.input { resize: vertical; min-height: 100px; }
        .perks { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
        .perk { display: flex; align-items: center; gap: 12px; font-size: 14px; color: rgba(26,107,122,0.7); }
        .perk-icon { font-size: 20px; flex-shrink: 0; }
        .submit-btn { background: #b5654a; color: white; padding: 14px 32px; border-radius: 100px; font-size: 14px; font-weight: 700; border: none; cursor: pointer; font-family: 'Playfair Display', serif; width: 100%; transition: all 0.2s; }
        .submit-btn:hover { background: #a05540; }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .success-icon { width: 64px; height: 64px; border-radius: 50%; background: rgba(26,107,122,0.08); display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 20px; }
      `}</style>

      <Nav />

      <div className="wrap">
        {isApproved ? (
          <div style={{textAlign:'center', paddingTop:'40px'}}>
            <div className="success-icon">✦</div>
            <h1 className="page-title" style={{textAlign:'center'}}>You're a Creator!</h1>
            <p className="page-sub" style={{textAlign:'center'}}>You already have Creator Program access. Add hotels to your profile and start earning commission.</p>
            <Link href={`/${handle}`} style={{background:'#1a6b7a', color:'white', padding:'14px 32px', borderRadius:'100px', fontSize:'14px', fontWeight:700, textDecoration:'none', display:'inline-block'}}>Go to my profile →</Link>
          </div>
        ) : alreadyApplied || submitted ? (
          <div style={{textAlign:'center', paddingTop:'40px'}}>
            <div className="success-icon">✉️</div>
            <h1 className="page-title" style={{textAlign:'center'}}>Application received!</h1>
            <p className="page-sub" style={{textAlign:'center'}}>We'll review your application and get back to you within 2-3 business days. In the meantime, keep adding hotels to your profile!</p>
            <Link href={`/${handle}`} style={{background:'#1a6b7a', color:'white', padding:'14px 32px', borderRadius:'100px', fontSize:'14px', fontWeight:700, textDecoration:'none', display:'inline-block'}}>Back to my profile →</Link>
          </div>
        ) : (
          <>
            <div className="page-eyebrow">creator program</div>
            <h1 className="page-title">Apply to earn commission.</h1>
            <p className="page-sub">Everyone on GoThereNow can add hotels. Join the Creator Program to earn commission when your followers book through your profile.</p>

            <div className="card" style={{background:'#1a6b7a', marginBottom:'28px'}}>
              <div className="card-title" style={{color:'white', marginBottom:'16px'}}>What you get as a Creator</div>
              <div className="perks">
                {[
                  { icon: '💰', text: 'Earn commission on every booking through your profile' },
                  { icon: '✦', text: 'Creator badge on your profile' },
                  { icon: '📊', text: 'Access to earnings dashboard and click analytics' },
                  { icon: '🏨', text: 'Priority support for adding booking links' },
                ].map((p, i) => (
                  <div key={i} className="perk" style={{color:'rgba(255,255,255,0.8)'}}>
                    <span className="perk-icon">{p.icon}</span>
                    <span>{p.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="card">
                <div className="card-title">Your social presence</div>
                <div className="card-sub">Help us understand your audience. We accept creators of all sizes — quality over quantity.</div>
                <div className="field">
                  <label className="label">Instagram URL (optional)</label>
                  <input type="url" value={form.instagram_url} onChange={e => setForm({...form, instagram_url: e.target.value})} placeholder="https://instagram.com/yourhandle" className="input" />
                </div>
                <div className="field">
                  <label className="label">TikTok URL (optional)</label>
                  <input type="url" value={form.tiktok_url} onChange={e => setForm({...form, tiktok_url: e.target.value})} placeholder="https://tiktok.com/@yourhandle" className="input" />
                </div>
                <div className="field" style={{marginBottom:0}}>
                  <label className="label">Total followers (approximate)</label>
                  <input type="number" value={form.follower_count} onChange={e => setForm({...form, follower_count: e.target.value})} placeholder="e.g. 5000" className="input" />
                </div>
              </div>

              <div className="card">
                <div className="card-title">Why do you want to join?</div>
                <div className="card-sub">Tell us a bit about your travel content and why GoThereNow is a good fit.</div>
                <div className="field" style={{marginBottom:0}}>
                  <textarea required value={form.why} onChange={e => setForm({...form, why: e.target.value})} placeholder="I create travel content focused on luxury boutique hotels in Europe..." className="input" />
                </div>
              </div>

              <button type="submit" disabled={saving} className="submit-btn">
                {saving ? 'Submitting...' : 'Submit application →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
