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
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        .page { min-height: 100vh; background: #1a6b7a; }
        .photo { width: 100%; height: 45vh; object-fit: cover; object-position: center; display: block; }
        .form-section { background: #1a6b7a; padding: 40px 28px 60px; }
        .form-title { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; color: white; margin-bottom: 6px; }
        .form-sub { font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 28px; }
        .error { background: rgba(255,80,80,0.15); border: 1px solid rgba(255,80,80,0.3); color: #ffaaaa; font-size: 13px; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px; }
        .form { display: flex; flex-direction: column; gap: 14px; }
        .label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.5); display: block; margin-bottom: 6px; }
        .input { width: 100%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 14px 16px; font-size: 15px; font-family: 'DM Sans', sans-serif; outline: none; border-radius: 4px; }
        .input::placeholder { color: rgba(255,255,255,0.25); }
        .input:focus { border-color: rgba(255,255,255,0.5); }
        .btn { width: 100%; background: #b5654a; color: white; padding: 16px; font-size: 15px; font-weight: 700; font-family: 'DM Sans', sans-serif; border: none; cursor: pointer; border-radius: 4px; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
        .btn:hover { background: rgba(255,255,255,0.88); }
        .btn:disabled { opacity: 0.6; }
        .divider { display: flex; align-items: center; gap: 16px; margin: 24px 0; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.12); }
        .divider span { font-size: 12px; color: rgba(255,255,255,0.25); }
        .switch { text-align: center; font-size: 14px; color: rgba(255,255,255,0.45); }
        .switch-link { color: white; font-weight: 700; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.4); padding-bottom: 1px; }
      `}</style>

      <Nav />

      <div className="page">
        <img src="/positano.avif" alt="GoThereNow" className="photo" />
        <div className="form-section">
          <h1 className="form-title">Welcome back.</h1>
          <p className="form-sub">Sign in to your account</p>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleLogin} className="form">
            <div>
              <label className="label">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="input" />
            </div>
            <div>
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
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
