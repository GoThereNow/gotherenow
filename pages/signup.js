import Nav from '../components/Nav'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const cleanHandle = handle.replace('@', '').toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (!cleanHandle) { setError('Please choose a valid handle'); setLoading(false); return }

    // Check handle is unique
    const { data: existing } = await supabase
      .from('influencers')
      .select('id')
      .eq('handle', cleanHandle)
      .single()
    if (existing) { setError('That handle is already taken — try another'); setLoading(false); return }

    const { data, error: signupError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    if (signupError) { setError(signupError.message); setLoading(false); return }

    // Create influencer profile for everyone
    if (data.user) {
      await supabase.from('influencers').insert({
        user_id: data.user.id,
        handle: cleanHandle,
        approved: true, // everyone approved by default
        commission_rate: 0.5,
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  const handleHandleChange = (val) => {
    setHandle(val.replace('@', '').toLowerCase().replace(/[^a-z0-9_]/g, ''))
  }

  return (
    <div>
      <Head>
        <title>Join GoThereNow</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        .split { height: 100vh; overflow: hidden; display: grid; grid-template-columns: 1fr 1fr; }
        .photo-side { position: relative; overflow: hidden; }
        .photo-img { width: 100%; height: 100%; object-fit: cover; object-position: center; filter: brightness(0.65) saturate(0.8); }
        .photo-wash { position: absolute; inset: 0; background: rgba(0,50,60,0.45); mix-blend-mode: multiply; }
        .photo-gradient { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, rgba(26,107,122,0.9) 100%); }
        .photo-content { position: absolute; bottom: 48px; left: 48px; right: 48px; }
        .photo-quote { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400; color: white; line-height: 1.3; margin-bottom: 12px; }
        .photo-loc { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.45); }
        .form-side { background: #1a6b7a; display: flex; align-items: center; justify-content: center; padding: 24px 48px; height: 100vh; overflow: hidden; }
        .form-inner { width: 100%; max-width: 380px; }
        .form-title { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: white; margin-bottom: 4px; }
        .form-sub { font-size: 14px; color: rgba(255,255,255,0.45); margin-bottom: 24px; }
        .error { background: rgba(255,80,80,0.15); border: 1px solid rgba(255,80,80,0.3); color: #ffaaaa; font-size: 13px; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; }
        .form { display: flex; flex-direction: column; gap: 12px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.5); }
        .input { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: white; padding: 13px 16px; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; border-radius: 8px; }
        .input::placeholder { color: rgba(255,255,255,0.25); }
        .input:focus { border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.12); }
        .handle-wrap { position: relative; }
        .handle-prefix { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.4); font-size: 14px; pointer-events: none; }
        .handle-input { padding-left: 28px !important; }
        .handle-preview { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 4px; }
        .handle-preview span { color: rgba(255,255,255,0.6); }
        .btn { background: white; color: #1a6b7a; padding: 14px; font-size: 14px; font-weight: 700; font-family: 'Playfair Display', serif; border: none; cursor: pointer; transition: all 0.2s; margin-top: 4px; width: 100%; border-radius: 8px; }
        .btn:hover { background: rgba(255,255,255,0.88); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .divider { display: flex; align-items: center; gap: 16px; margin: 20px 0; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.1); }
        .divider span { font-size: 12px; color: rgba(255,255,255,0.25); }
        .switch { text-align: center; font-size: 13px; color: rgba(255,255,255,0.4); }
        .switch-link { color: white; font-weight: 600; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.3); }
        .switch-link:hover { border-color: white; }
        .success-wrap { text-align: center; }
        .success-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 22px; margin: 0 auto 20px; }
        @media (max-width: 768px) {
          .split { grid-template-columns: 1fr; }
          .photo-side { display: none; }
          .form-side { padding: 40px 24px; }
        }
      `}</style>

      <Nav />

      <div className="split">
        <div className="photo-side">
          <img src="/positano.avif" alt="GoThereNow" className="photo-img" />
          <div className="photo-wash" />
          <div className="photo-gradient" />
          <div className="photo-content">
            <div className="photo-quote">Share where you've been. Earn when they book.</div>
            <div className="photo-loc">📍 Positano, Italy</div>
          </div>
        </div>

        <div className="form-side">
          <div className="form-inner">
            {success ? (
              <div className="success-wrap">
                <div className="success-icon">✓</div>
                <h2 className="form-title">Check your email.</h2>
                <p className="form-sub" style={{marginBottom:0}}>We sent a confirmation link to <strong style={{color:'white'}}>{email}</strong>. Click it to activate your account.</p>
                <Link href="/login" className="btn" style={{display:'block', textAlign:'center', textDecoration:'none', marginTop:'28px'}}>
                  Back to sign in →
                </Link>
              </div>
            ) : (
              <>
                <h1 className="form-title">Join GoThereNow.</h1>
                <p className="form-sub">Discover and share hotels you love. Free forever.</p>
                {error && <div className="error">{error}</div>}
                <form onSubmit={handleSignup} className="form">
                  <div className="field">
                    <label className="label">Full name</label>
                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="input" />
                  </div>
                  <div className="field">
                    <label className="label">Your handle</label>
                    <div className="handle-wrap">
                      <span className="handle-prefix">@</span>
                      <input type="text" required value={handle} onChange={e => handleHandleChange(e.target.value)} placeholder="yourhandle" className="input handle-input" />
                    </div>
                    <div className="handle-preview">gotherenow.app/<span>{handle || 'yourhandle'}</span></div>
                  </div>
                  <div className="field">
                    <label className="label">Email</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="input" />
                  </div>
                  <div className="field">
                    <label className="label">Password</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input" />
                  </div>
                  <button type="submit" disabled={loading} className="btn">
                    {loading ? 'Creating account...' : 'Create account →'}
                  </button>
                </form>
                <div className="divider"><span>or</span></div>
                <p className="switch">Already have an account?{' '}<Link href="/login" className="switch-link">Sign in</Link></p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
