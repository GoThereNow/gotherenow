export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (authError) { setError(authError.message); setLoading(false); return }

    // Check if influencer
    const { data: inf } = await supabase
      .from('influencers')
      .select('id')
      .eq('user_id', data.user.id)
      .single()

    router.push(inf ? '/dashboard' : '/')
  }

  return (
    <>
      <Head><title>Sign In — GoThereNow</title></Head>
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#FAF7F2' }}>
        <div className="w-full max-w-md">
          <Link href="/" className="font-display text-2xl text-espresso block text-center mb-10">
            Go<span className="text-terracotta">There</span>Now
          </Link>

          <div className="p-8 rounded-3xl" style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
            <h1 className="font-display text-2xl text-espresso mb-1">Welcome back</h1>
            <p className="text-sm text-muted mb-6">
              No account? <Link href="/signup" className="text-terracotta hover:underline">Sign up free</Link>
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Email</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ border: '1.5px solid rgba(28,20,16,0.12)', background: '#FAF7F2', fontFamily: 'DM Sans, sans-serif' }} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Password</label>
                <input type="password" required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Your password"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ border: '1.5px solid rgba(28,20,16,0.12)', background: '#FAF7F2', fontFamily: 'DM Sans, sans-serif' }} />
              </div>

              {error && <div className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</div>}

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white mt-2"
                style={{ background: '#C4622D', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
export async function getServerSideProps() {
  return { props: {} }
}



