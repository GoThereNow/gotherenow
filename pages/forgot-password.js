import Nav from '../components/Nav'
import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://gotherenow.app/reset-password',
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div>
      <Head>
        <title>Reset Password — GoThereNow</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        .split { height: 100vh; overflow: hidden; display: grid; grid-template-columns: 1fr 1fr; }
        .photo-side { position: relative; overflow: hidden; }
        .photo-img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.65) saturate(0.8); }
        .photo-wash { position: absolute; inset: 0; background: rgba(0,50,60,0.45); mix-blend-mode: multiply; }
        .photo-gradient { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, rgba(26,107,122,0.9) 100%); }
        .photo-content { position: absolute; bottom: 48px; left: 48px; right: 48px; }
        .photo-quote { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400; color: white; line-height: 1.3; margin-bottom: 12px; }
        .photo-loc { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.45); }
        .form-side { background: #1a6b7a; display: flex; align-items: center; justify-content: center; padding: 24px 48px; height: 100vh; overflow: hidden; }
        .form-inner { width: 100%; max-width: 380px; }
        .form-title { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: white; margin-bottom: 6px; }
        .form-sub { font-size: 14px; color: rgba(255,255,255,0.45); margin-bottom: 24px; line-height: 1.6; }
        .error { background: rgba(255,80,80,0.15); border: 1px solid rgba(255,80,80,0.3); color: #ffaaaa; font-size: 13px; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; }
        .form { display: flex; flex-direction: column; gap: 12px; }
        .label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 6px; display: block; }
        .input { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: white; padding: 13px 16px; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; border-radius: 8px; width: 100%; }
        .input::placeholder { color: rgba(255,255,255,0.25); }
        .input:focus { border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.12); }
        .btn { background: white; color: #1a6b7a; padding: 14px; font-size: 14px; font-weight: 700; font-family: 'Playfair Display', serif; border: none; cursor: pointer; transition: all 0.2s; width: 100%; border-radius: 8px; }
        .btn:hover { background: rgba(255,255,255,0.88); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .back-link { display: block; text-align: center; margin-top: 20px; font-size: 13px; color: rgba(255,255,255,0.4); text-decoration: none; }
        .back-link:hover { color: white; }
        .success-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 22px; margin: 0 auto 20px; }
        @media (max-width: 768px) {
          .split { grid-template-columns: 1fr; }
          .photo-side { display: none; }
          .form-side { padding: 40px 20px; height: auto; min-height: 100vh; }
        }
      `}</style>

      <Nav />

      <div className="split">
        <div className="photo-side">
          <img src="/positano.avif" alt="GoThereNow" className="photo-img" />
          <div className="photo-wash" />
          <div className="photo-gradient" />
          <div className="photo-content">
            <div className="photo-quote">Every great trip starts with the right place to stay.</div>
            <div className="photo-loc">📍 Positano, Italy</div>
          </div>
        </div>
        <div className="form-side">
          <div className="form-inner">
            {sent ? (
              <div style={{textAlign:'center'}}>
                <div className="success-icon">✉️</div>
                <h2 className="form-title">Check your email.</h2>
                <p className="form-sub">We sent a password reset link to <strong style={{color:'white'}}>{email}</strong>. Click the link to set a new password.</p>
                <Link href="/login" className="btn" style={{display:'block', textAlign:'center', textDecoration:'none', marginTop:'24px'}}>Back to sign in →</Link>
              </div>
            ) : (
              <>
                <h1 className="form-title">Reset password.</h1>
                <p className="form-sub">Enter your email and we'll send you a link to reset your password.</p>
                {error && <div className="error">{error}</div>}
                <form onSubmit={handleSubmit} className="form">
                  <div>
                    <label className="label">Email</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="input" />
                  </div>
                  <button type="submit" disabled={loading} className="btn">
                    {loading ? 'Sending...' : 'Send reset link →'}
                  </button>
                </form>
                <Link href="/login" className="back-link">← Back to sign in</Link>
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

