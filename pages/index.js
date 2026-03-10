export const dynamic = 'force-dynamic'

import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [influencers, setInfluencers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInfluencers() {
      const { data } = await supabase
        .from('influencers')
        .select('*, profiles(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(6)
      setInfluencers(data || [])
      setLoading(false)
    }
    fetchInfluencers()
  }, [])

  return (
    <>
      <Head>
        <title>GoThereNow — Travel Through Creators You Trust</title>
        <meta name="description" content="Discover and book hotels recommended by your favourite travel influencers." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: 'rgba(250,247,242,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(196,98,45,0.1)' }}>
        <div className="font-display text-2xl text-espresso">
          Go<span className="text-terracotta">There</span>Now
        </div>
        <div className="flex items-center gap-6">
          <Link href="/explore" className="text-sm font-medium text-muted hover:text-terracotta transition-colors">Explore</Link>
          <Link href="/login" className="text-sm font-medium text-muted hover:text-terracotta transition-colors">Sign in</Link>
          <Link href="/signup" className="text-sm font-medium text-white bg-espresso hover:bg-terracotta transition-colors px-5 py-2 rounded-full">
            Join free
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-20 overflow-hidden" style={{ minHeight: '100vh', background: '#1C1410' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1800&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.25
        }} />
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
        }} />

        <div className="relative z-10 max-w-5xl mx-auto px-8 pt-32 pb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest mb-8"
            style={{ background: 'rgba(196,98,45,0.2)', color: '#E8845A', border: '1px solid rgba(196,98,45,0.3)' }}>
            ✈️ Travel recommendations you can actually book
          </div>

          <h1 className="font-display text-white leading-tight mb-6" style={{ fontSize: 'clamp(42px, 7vw, 80px)' }}>
            Travel through the eyes<br />
            <em>of creators you trust.</em>
          </h1>

          <p className="text-lg mb-10 max-w-xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Every hotel pin on GoThereNow is a real recommendation from a real creator. Click it. Love it. Book it — without ever leaving the map.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/explore" className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white transition-all hover:scale-105"
              style={{ background: '#C4622D', fontSize: '15px' }}>
              Explore the Map →
            </Link>
            <Link href="/signup?role=influencer" className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontSize: '15px' }}>
              I'm a Creator
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-12 mt-16 pt-16" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              { num: '500+', label: 'Hotels recommended' },
              { num: '40+', label: 'Travel creators' },
              { num: '60+', label: 'Countries covered' },
            ].map((s, i) => (
              <div key={i}>
                <div className="font-display text-3xl text-white">{s.num}</div>
                <div className="text-xs uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-8" style={{ background: '#FAF7F2' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-widest font-semibold text-terracotta mb-3">How It Works</div>
            <h2 className="font-display text-4xl text-espresso">From scroll to booked, in seconds.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '📱', title: 'Creator posts a stay', desc: 'A travel influencer you follow posts about their hotel on Instagram or TikTok, with their GoThereNow link.' },
              { step: '02', icon: '🗺️', title: 'You land on the map', desc: 'Click their link and land on their personal map page — every hotel they\'ve ever recommended, pinned.' },
              { step: '03', icon: '🏨', title: 'Book in one tap', desc: 'Click a pin, see their review and pricing, then book directly — no middlemen, no extra fees.' },
            ].map((item, i) => (
              <div key={i} className="relative p-8 rounded-2xl" style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                <div className="font-display text-6xl font-bold mb-4" style={{ color: 'rgba(196,98,45,0.12)' }}>{item.step}</div>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8B7D72' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED CREATORS */}
      {!loading && influencers.length > 0 && (
        <section className="py-24 px-8" style={{ background: '#F5EFE6' }}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-baseline justify-between mb-12">
              <div>
                <div className="text-xs uppercase tracking-widest font-semibold text-terracotta mb-2">Creators</div>
                <h2 className="font-display text-4xl text-espresso">Featured on GoThereNow</h2>
              </div>
              <Link href="/explore" className="text-sm font-medium text-terracotta hover:underline">See all →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {influencers.map((inf, i) => (
                <Link key={inf.id} href={`/@${inf.handle}`}
                  className="group p-6 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg"
                  style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4"
                    style={{ background: 'linear-gradient(135deg, #C4622D, #D4A853)' }}>
                    {inf.profiles?.avatar_url ? (
                      <img src={inf.profiles.avatar_url} className="w-full h-full rounded-full object-cover" />
                    ) : '✈️'}
                  </div>
                  <div className="font-semibold text-espresso">{inf.profiles?.full_name || inf.handle}</div>
                  <div className="text-xs text-muted mt-1">@{inf.handle}</div>
                  <div className="text-xs font-medium text-terracotta mt-3">{inf.recommendation_count || 0} stays →</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 px-8 text-center" style={{ background: '#1C1410' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-4xl text-white mb-4">Are you a travel creator?</h2>
          <p className="mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Turn your hotel recommendations into a bookable map page. Share one link. Earn affiliate commissions on every booking.
          </p>
          <Link href="/signup?role=influencer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white transition-all hover:scale-105"
            style={{ background: '#C4622D', fontSize: '15px' }}>
            Create your free page →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-8 text-center" style={{ borderTop: '1px solid rgba(28,20,16,0.08)' }}>
        <div className="font-display text-xl text-espresso mb-2">Go<span className="text-terracotta">There</span>Now</div>
        <p className="text-xs text-muted">© 2025 GoThereNow. All rights reserved.</p>
      </footer>
    </>
  )
}
