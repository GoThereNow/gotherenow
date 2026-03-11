import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const router = useRouter()
  const [role, setRole] = useState(router.query?.role === 'influencer' ? 'influencer' : 'traveller')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [handle, setHandle] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signupError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    if (signupError) { setError(signupError.message); setLoading(false); return }

    if (role === 'influencer' && handle && data.user) {
      await supabase.from('influencers').insert({
        user_id: data.user.id,
        handle: handle.replace('@', '').toLowerCase(),
        approved: false,
      })
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Sign Up — GoThereNow</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <Page>
        <div className="card">
          <Link href="/" className="logo">Go<em>There</em>Now</Link>

          {success ? (
            <div className="success-state">
              <div className="success-icon">✓</div>
              <h2 className="title">Check your email.</h2>
              <p className="subtitle">We sent a confirmation link to <strong style={{color:'white'}}>{email}</strong>. Click it to activate your account.</p>
              <Link href="/login" className="btn" style={{display:'block', textAlign:'center', textDecoration:'none', marginTop:'28px'}}>
                Back to sign in →
              </Link>
            </div>
          ) : (
            <>
              <h1 className="title">Join GoThereNow.</h1>
              <p className="subtitle">Create your free account</p>

              <div className="role-toggle">
                <button className={`role-btn${role === 'traveller' ? ' active' : ''}`} onClick={() => setRole('traveller')}>
                  🌍 Traveller
                </button>
                <button className={`role-btn${role === 'influencer' ? ' active' : ''}`} onClick={() => setRole('influencer')}>
                  ✈️ Creator
                </button>
              </div>

              {error && <div className="error">{error}</div>}

              <form onSubmit={handleSignup} className="form">
                <div className="field">
                  <label className="label">Full name</label>
                  <input type="text" required value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your name" className="input" />
                </div>

                <div className="field">
                  <label className="label">Email</label>
                  <input type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com" className="input" />
                </div>

                <div className="field">
                  <label className="label">Password</label>
                  <input type="password" required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" className="input" />
                </div>

                {role === 'influencer' && (
                  <div className="field">
                    <label className="label">Your handle</label>
                    <input type="text" required value={handle}
                      onChange={e => setHandle(e.target.value)}
                      placeholder="e.g. sofiarami" className="input" />
                    <div className="field-hint">gotherenow.app/@{handle || 'yourhandle'}</div>
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn">
                  {loading ? 'Creating account...' : role === 'influencer' ? 'Create creator account →' : 'Create account →'}
                </button>
              </form>

              <div className="divider"><span>or</span></div>

              <p className="switch">
                Already have an account?{' '}
                <Link href="/login" className="switch-link">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </Page>
    </>
  )
}

function Page({ children }) {
  return (
    <div className="page">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }

        .page {
          min-height: 100vh;
          background: rgb(0,86,99);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          position: relative; overflow: hidden;
        }
        .page::before {
          content: '';
          position: absolute; top: -200px; right: -200px;
          width: 600px; height: 600px; border-radius: 50%;
          background: rgba(255,255,255,0.04); pointer-events: none;
        }
        .page::after {
          content: '';
          position: absolute; bottom: -150px; left: -150px;
          width: 500px; height: 500px; border-radius: 50%;
          background: rgba(255,255,255,0.04); pointer-events: none;
        }

        .card {
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 4px;
          padding: 52px 48px;
          width: 100%; max-width: 440px;
          position: relative; z-index: 1;
        }

        .logo {
          display: block;
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 400;
          color: white; letter-spacing: 1px;
          text-decoration: none; margin-bottom: 36px;
        }
        .logo em { font-style: italic; color: rgba(255,255,255,0.6); }

        .title {
          font-family: 'Playfair Display', serif;
          font-size: 36px; font-weight: 400;
          color: white; line-height: 1.1; margin-bottom: 8px;
        }
        .subtitle {
          font-size: 14px; color: rgba(255,255,255,0.45); margin-bottom: 28px;
        }

        .role-toggle {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 2px; margin-bottom: 28px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 2px; overflow: hidden;
        }
        .role-btn {
          padding: 11px; font-size: 13px; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          border: none; cursor: pointer;
          background: transparent; color: rgba(255,255,255,0.4);
          transition: all 0.2s;
        }
        .role-btn.active { background: white; color: rgb(0,86,99); font-weight: 700; }

        .error {
          background: rgba(255,80,80,0.15);
          border: 1px solid rgba(255,80,80,0.3);
          color: #ffaaaa; font-size: 13px;
          padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;
        }

        .form { display: flex; flex-direction: column; gap: 18px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .label {
          font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.5);
        }
        .input {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: white; padding: 13px 16px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          outline: none; border-radius: 2px; transition: border-color 0.2s;
        }
        .input::placeholder { color: rgba(255,255,255,0.25); }
        .input:focus { border-color: rgba(255,255,255,0.5); }
        .field-hint {
          font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px;
        }

        .btn {
          background: white; color: rgb(0,86,99);
          padding: 14px; font-size: 14px; font-weight: 700;
          font-family: 'Playfair Display', serif;
          border: none; cursor: pointer; border-radius: 2px;
          transition: all 0.2s; margin-top: 4px; letter-spacing: 0.5px;
        }
        .btn:hover { background: rgba(255,255,255,0.9); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .divider {
          display: flex; align-items: center; gap: 16px; margin: 24px 0;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.1);
        }
        .divider span { font-size: 12px; color: rgba(255,255,255,0.25); }

        .switch {
          text-align: center; font-size: 13px; color: rgba(255,255,255,0.4);
        }
        .switch-link {
          color: white; font-weight: 600; text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.3);
          padding-bottom: 1px; transition: border-color 0.2s;
        }
        .switch-link:hover { border-color: white; }

        .success-state { text-align: center; }
        .success-icon {
          width: 56px; height: 56px; border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; color: white;
          margin: 0 auto 24px;
        }

        @media (max-width: 480px) {
          .card { padding: 36px 28px; }
          .title { font-size: 28px; }
        }
      `}</style>
      {children}
    </div>
  )
}

export async function getServerSideProps(context) {
  return { props: {} }
}
