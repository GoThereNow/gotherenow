export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Signup() {
  const router = useRouter()
  const defaultRole = router.query.role || 'user'

  const [role, setRole] = useState(defaultRole)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', handle: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Create auth user
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, role } }
    })

    if (authError) { setError(authError.message); setLoading(false); return }

    const userId = data.user?.id

    // Insert into profiles
    await supabase.from('profiles').upsert({
      id: userId,
      full_name: form.full_name,
      email: form.email,
      role,
    })

    // If influencer, create influencer record
    if (role === 'influencer' && form.handle) {
      await supabase.from('influencers').insert({
        user_id: userId,
        handle: form.handle.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      })
      router.push('/dashboard')
    } else {
      router.push('/')
    }
  }

  return (
    <>
      <Head><title>Join GoThereNow</title></Head>
      <div className="min-h-screen flex" style={{ background: '#FAF7F2' }}>

        {/* Left panel */}
        <div className="hidden md:flex flex-col justify-between w-1/2 p-12 text-white relative overflow-hidden"
          style={{ background: '#1C1410' }}>
          <div className="absolute inset-0" style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1488085061387-422e29b40080?w=900&q=70)',
            backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2
          }} />
          <div className="relative z-10">
            <Link href="/" className="font-display text-2xl text-white">Go<span className="text-terracotta-light">There</span>Now</Link>
          </div>
          <div className="relative z-10">
            <h2 className="font-display text-4xl leading-tight mb-4">Travel through the eyes of creators you trust.</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', lineHeight: '1.7' }}>
              Every pin is a personal recommendation. Every booking supports the creator.
            </p>
          </div>
          <div className="relative z-10 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>© 2025 GoThereNow</div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Link href="/" className="font-display text-xl text-espresso md:hidden block mb-8">Go<span className="text-terracotta">There</span>Now</Link>

            <h1 className="font-display text-3xl text-espresso mb-2">Create your account</h1>
            <p className="text-sm text-muted mb-8">Already have one? <Link href="/login" className="text-terracotta hover:underline">Sign in</Link></p>

            {/* Role toggle */}
            <div className="flex gap-2 p-1 rounded-xl mb-6" style={{ background: '#F5EFE6' }}>
              {[
                { id: 'user', label: '🌍 I\'m a Traveller' },
                { id: 'influencer', label: '✈️ I\'m a Creator' },
              ].map(r => (
                <button key={r.id} onClick={() => setRole(r.id)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: role === r.id ? 'white' : 'transparent',
                    color: role === r.id ? '#1C1410' : '#8B7D72',
                    boxShadow: role === r.id ? '0 1px 8px rgba(28,20,16,0.1)' : 'none',
                    border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
                  }}>
                  {r.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Full Name</label>
                <input type="text" required value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ border: '1.5px solid rgba(28,20,16,0.12)', background: 'white', fontFamily: 'DM Sans, sans-serif' }}
                  onFocus={e => e.target.style.borderColor = '#C4622D'}
                  onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'} />
              </div>

              {role === 'influencer' && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Your Handle</label>
                  <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1.5px solid rgba(28,20,16,0.12)', background: 'white' }}>
                    <span className="px-3 py-3 text-sm font-medium text-muted" style={{ background: '#F5EFE6', borderRight: '1px solid rgba(28,20,16,0.1)' }}>@</span>
                    <input type="text" required={role === 'influencer'} value={form.handle}
                      onChange={e => setForm({ ...form, handle: e.target.value })}
                      placeholder="yourname"
                      className="flex-1 px-3 py-3 text-sm outline-none"
                      style={{ fontFamily: 'DM Sans, sans-serif' }} />
                  </div>
                  <p className="text-xs text-muted mt-1">Your page will be: gotherenow.app/@{form.handle || 'yourname'}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Email</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ border: '1.5px solid rgba(28,20,16,0.12)', background: 'white', fontFamily: 'DM Sans, sans-serif' }}
                  onFocus={e => e.target.style.borderColor = '#C4622D'}
                  onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'} />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Password</label>
                <input type="password" required minLength={6} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ border: '1.5px solid rgba(28,20,16,0.12)', background: 'white', fontFamily: 'DM Sans, sans-serif' }}
                  onFocus={e => e.target.style.borderColor = '#C4622D'}
                  onBlur={e => e.target.style.borderColor = 'rgba(28,20,16,0.12)'} />
              </div>

              {error && <div className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</div>}

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 mt-2"
                style={{ background: '#C4622D', fontFamily: 'DM Sans, sans-serif', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Creating account...' : 'Create free account →'}
              </button>
            </form>

            <p className="text-xs text-muted text-center mt-6 leading-relaxed">
              By signing up you agree to our Terms of Service.<br />No credit card required.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
export async function getServerSideProps() {
  return { props: {} }
}


