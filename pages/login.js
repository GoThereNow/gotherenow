import Nav from '../components/Nav'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div>
      <Head>
        <title>Sign In — GoThereNow</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        .split { height: 100vh; overflow: hidden; display: grid; grid-template-columns: 1fr 1fr; }
        .photo-side { position: relative; overflow: hidden; }
        .photo-img { width: 100%; height: 100%; object-fit: cover; object-position: center bottom; filter: brightness(0.65) saturate(0.8); }
        .photo-wash { position: absolute; inset: 0; background: rgba(0,50,60,0.45); mix-blend-mode: multiply; }
        .photo-gradient { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, rgba(26,107,122,0.9) 100%); }
        .photo-content { position: absolute; bottom: 48px; left: 48px; right: 48px; }
        .photo-quote { font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 300; color: white; line-height: 1.2; margin-bottom: 12px; }
        .photo-quote em { font-style: italic; }
        .photo-loc { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.45); }
        .form-side { background: #1a6b7a; display: flex; align-items: center; justify-content: center; padding: 24px 48px; height: 100vh; overflow: hidden; }
        .form-inner { width: 100%; max-width: 380px; }
        .form-title { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 400; color: white; margin-bottom: 6px; }
        .form-sub { font-size: 14px; color: rgba(255,255,255,0.45); margin-bottom: 20px; }
        .error { background: rgba(255,80,80,0.15); border: 1px solid rgba(255,80,80,0.3); color: #ffaaaa; font-size: 13px; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px; }
        .form { display: flex; flex-direction: column; gap: 12px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.5); }
        .input { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: white; padding: 13px 16px; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; }
        .input::placeholder { color: rgba(255,255,255,0.25); }
        .input:focus { border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.12); }
        .btn { background: #b5654a; color: white; padding: 14px; font-size: 14px; font-weight: 700; font-family: 'Playfair Display', serif; border: none; cursor: pointer; transition: all 0.2s; margin-top: 4px; width: 100%; }
        .btn:hover { background: #a05540; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .divider { display: flex; align-items: center; gap: 16px; margin: 24px 0; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.1); }
        .divider span { font-size: 12px; color: rgba(255,255,255,0.25); }
        .switch { text-align: center; font-size: 13px; color: rgba(255,255,255,0.4); }
        .switch-link { color: white; font-weight: 600; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 1px; }
        .switch-link:hover { border-color: white; }
        @media (max-width: 768px) {
          .split { grid-template-columns: 1fr; }
          .photo-side { display: none; }
          .form-side { padding: 40px 24px; min-height: 100vh; }
        }
      `}</style>

      <Nav />

      <div className="split">
        <div className="photo-side">
          <img src="/positano.avif" alt="GoThereNow" className="photo-img" />
          <div className="photo-wash" />
          <div className="photo-gradient" />
          <div className="photo-content">
            <div className="photo-quote">Stay where<br />the <em>story</em> begins.</div>
            <div className="photo-loc">📍 Positano, Italy</div>
          </div>
        </div>

        <div className="form-side">
          <div className="form-inner">
            <h1 className="form-title">Welcome back.</h1>
            <p className="form-sub">Sign in to your account</p>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleLogin} className="form">
              <div className="field">
                <label className="label">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="input" />
              </div>
              <div className="field">
                <label className="label">Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input" />
              </div>
              <button type="submit" disabled={loading} className="btn">
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>
            <div className="divider"><span>or</span></div>
            <p className="switch">Don't have an account?{' '}<Link href="/signup" className="switch-link">Sign up free</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
