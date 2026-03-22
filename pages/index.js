export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'

const EXPEDIA_AFFILIATE = 'xkGKaCc'
function buildExpediaUrl(hotelName, city, country) {
  const destination = [hotelName, city, country].filter(Boolean).join(', ')
  return `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(hotelName)}&q=${encodeURIComponent(destination)}&affcid=${EXPEDIA_AFFILIATE}`
}

export default function Home() {
  const [stays, setStays] = useState([])
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  useEffect(() => {
    async function fetchData() {
      const { data: recs } = await supabase
        .from('recommendations')
        .select('*, influencers(handle, profiles(full_name, avatar_url))')
        .not('photo_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(8)
      setStays(recs || [])

      const { data: infs } = await supabase
        .from('influencers')
        .select('*, profiles(full_name, avatar_url, bio)')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(6)
      setCreators(infs || [])

      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div style={{ background: '#f7f5f2', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <Head>
        <title>GoThereNow — Stay where creators stay</title>
        <meta name="description" content="Discover and book hotels recommended by creators you follow. Real stays, real people, bookable in one click." />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f7f5f2; font-family: 'DM Sans', sans-serif; }

        /* HERO */
        .hero { position: relative; height: 100vh; min-height: 600px; overflow: hidden; display: flex; flex-direction: column; }
        .hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; filter: brightness(0.55); }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(26,107,122,0.3) 0%, rgba(10,40,50,0.7) 100%); }
        .hero-content { position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 0 24px; }
        .hero-eyebrow { font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 20px; font-weight: 600; }
        .hero-title { font-family: 'Playfair Display', serif; font-size: clamp(42px, 7vw, 90px); font-weight: 700; color: white; line-height: 1.0; margin-bottom: 24px; max-width: 800px; }
        .hero-sub { font-size: clamp(16px, 2vw, 20px); color: rgba(255,255,255,0.7); max-width: 520px; line-height: 1.6; margin-bottom: 40px; }
        .hero-actions { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
        .hero-btn-primary { background: white; color: #1a6b7a; padding: 16px 36px; border-radius: 100px; font-size: 15px; font-weight: 700; text-decoration: none; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .hero-btn-primary:hover { background: rgba(255,255,255,0.9); transform: translateY(-2px); }
        .hero-btn-secondary { background: transparent; color: white; padding: 16px 36px; border-radius: 100px; font-size: 15px; font-weight: 700; text-decoration: none; border: 2px solid rgba(255,255,255,0.4); transition: all 0.2s; }
        .hero-btn-secondary:hover { border-color: white; background: rgba(255,255,255,0.1); }
        .hero-scroll { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.4); font-size: 11px; letter-spacing: 3px; text-transform: uppercase; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .hero-scroll-line { width: 1px; height: 40px; background: rgba(255,255,255,0.3); }

        /* STATS BAR */
        .stats-bar { background: #1a6b7a; padding: 20px 56px; display: flex; gap: 48px; justify-content: center; }
        .stats-item { text-align: center; color: white; }
        .stats-num { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; line-height: 1; }
        .stats-label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-top: 4px; }

        /* SECTIONS */
        .section { padding: 80px 56px; }
        .section-alt { background: white; }
        .section-header { margin-bottom: 40px; }
        .section-eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 8px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: clamp(28px, 3vw, 44px); font-weight: 700; color: #1a6b7a; }
        .section-sub { font-size: 15px; color: rgba(26,107,122,0.55); margin-top: 8px; max-width: 480px; line-height: 1.6; }
        .section-link { font-size: 13px; font-weight: 700; color: #b5654a; text-decoration: none; margin-top: 12px; display: inline-block; }
        .section-link:hover { text-decoration: underline; }

        /* STAYS GRID */
        .stays-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .stay-card { border-radius: 16px; overflow: hidden; position: relative; aspect-ratio: 3/4; cursor: pointer; box-shadow: 0 8px 32px rgba(0,0,0,0.15); transition: transform 0.3s; }
        .stay-card:hover { transform: translateY(-4px); }
        .stay-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .stay-card:hover img { transform: scale(1.05); }
        .stay-card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,40,50,0.9) 0%, transparent 50%); }
        .stay-card-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; }
        .stay-card-loc { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.55); margin-bottom: 4px; }
        .stay-card-name { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: white; margin-bottom: 8px; line-height: 1.2; }
        .stay-card-creator { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; }
        .stay-card-avatar { width: 22px; height: 22px; border-radius: 50%; background: rgba(255,255,255,0.2); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 10px; border: 1px solid rgba(255,255,255,0.3); }
        .stay-card-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .stay-card-creator-name { font-size: 11px; color: rgba(255,255,255,0.7); font-weight: 600; }
        .stay-book-btn { background: white; color: #1a6b7a; padding: 7px 16px; border-radius: 100px; font-size: 11px; font-weight: 700; text-decoration: none; display: inline-block; }
        .stay-book-btn:hover { background: rgba(255,255,255,0.9); }

        /* CREATORS GRID */
        .creators-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .creator-card { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 20px rgba(26,107,122,0.08); border: 1px solid rgba(26,107,122,0.06); text-decoration: none; display: block; transition: all 0.2s; }
        .creator-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(26,107,122,0.15); }
        .creator-avatar { width: 64px; height: 64px; border-radius: 50%; background: rgba(26,107,122,0.08); border: 2px solid #1a6b7a; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 14px; }
        .creator-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .creator-name { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #1a6b7a; margin-bottom: 3px; }
        .creator-handle { font-size: 12px; color: rgba(26,107,122,0.4); margin-bottom: 10px; }
        .creator-bio { font-size: 13px; color: rgba(26,107,122,0.6); line-height: 1.6; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .creator-follow-btn { background: #1a6b7a; color: white; padding: 8px 20px; border-radius: 100px; font-size: 12px; font-weight: 700; display: inline-block; }

        /* HOW IT WORKS */
        .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
        .how-item { text-align: center; }
        .how-icon { font-size: 40px; margin-bottom: 16px; }
        .how-num { font-family: 'Playfair Display', serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 8px; }
        .how-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1a6b7a; margin-bottom: 10px; }
        .how-text { font-size: 14px; color: rgba(26,107,122,0.6); line-height: 1.7; }

        /* CTA */
        .cta { background: #1a6b7a; padding: 100px 56px; text-align: center; }
        .cta-title { font-family: 'Playfair Display', serif; font-size: clamp(32px, 4vw, 56px); font-weight: 700; color: white; margin-bottom: 16px; }
        .cta-sub { font-size: 16px; color: rgba(255,255,255,0.6); margin-bottom: 40px; }
        .cta-form { display: flex; gap: 12px; max-width: 420px; margin: 0 auto; }
        .cta-input { flex: 1; padding: 14px 20px; border-radius: 100px; border: none; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; color: #1a6b7a; }
        .cta-btn { background: #b5654a; color: white; padding: 14px 28px; border-radius: 100px; border: none; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; white-space: nowrap; }
        .cta-btn:hover { background: #a05540; }

        /* FOOTER */
        .footer { padding: 40px 56px; border-top: 1px solid rgba(26,107,122,0.1); display: flex; justify-content: space-between; align-items: center; }
        .footer-logo { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1a6b7a; text-decoration: none; }
        .footer-links { display: flex; gap: 24px; }
        .footer-link { font-size: 13px; color: rgba(26,107,122,0.45); text-decoration: none; }
        .footer-link:hover { color: #1a6b7a; }
        .footer-copy { font-size: 12px; color: rgba(26,107,122,0.3); }

        @media (max-width: 1024px) { .stays-grid { grid-template-columns: repeat(3, 1fr); } .creators-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .section { padding: 60px 24px; }
          .stats-bar { padding: 20px 24px; gap: 24px; flex-wrap: wrap; }
          .stays-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .creators-grid { grid-template-columns: 1fr; }
          .how-grid { grid-template-columns: 1fr; gap: 32px; }
          .cta { padding: 60px 24px; }
          .cta-form { flex-direction: column; }
          .footer { flex-direction: column; gap: 16px; text-align: center; padding: 32px 24px; }
          .footer-links { flex-wrap: wrap; justify-content: center; }
        }
      `}</style>

      <Nav />

      {/* HERO */}
      <div className="hero">
        <img src="/positano.avif" alt="GoThereNow" className="hero-img" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-eyebrow">The new way to travel</div>
          <h1 className="hero-title">Stay where creators stay.</h1>
          <p className="hero-sub">Discover and book hotels recommended by people whose taste you trust. Real stays, honest reviews, one click to book.</p>
          <div className="hero-actions">
            <Link href="/explore" className="hero-btn-primary">Explore stays →</Link>
            <Link href="/signup" className="hero-btn-secondary">Share your hotels</Link>
          </div>
        </div>
        <div className="hero-scroll">
          <div className="hero-scroll-line" />
          scroll
        </div>
      </div>

      {/* STATS BAR */}
      <div className="stats-bar">
        {[
          { num: stays.length || '0', label: 'Hotels listed' },
          { num: creators.length || '0', label: 'Creators' },
          { num: new Set(stays.map(s => s.country)).size || '0', label: 'Countries' },
          { num: '100%', label: 'Honest picks' },
        ].map((s, i) => (
          <div key={i} className="stats-item">
            <div className="stats-num">{s.num}</div>
            <div className="stats-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* TRENDING STAYS */}
      <div className="section">
        <div className="section-header">
          <div className="section-eyebrow">trending now</div>
          <h2 className="section-title">Hotels creators love</h2>
          <p className="section-sub">Handpicked by creators with real taste. Every stay is bookable in one click.</p>
          <Link href="/explore" className="section-link">See all stays →</Link>
        </div>
        {loading ? (
          <div style={{textAlign:'center', padding:'40px', color:'rgba(26,107,122,0.4)'}}>Loading...</div>
        ) : stays.length === 0 ? (
          <div style={{textAlign:'center', padding:'40px', color:'rgba(26,107,122,0.4)'}}>No stays yet — be the first to add one!</div>
        ) : (
          <div className="stays-grid">
            {stays.map(stay => (
              <div key={stay.id} className="stay-card">
                <img src={stay.photo_url} alt={stay.hotel_name} />
                <div className="stay-card-overlay" />
                <div className="stay-card-content">
                  <div className="stay-card-loc">📍 {[stay.city, stay.country].filter(Boolean).join(', ')}</div>
                  <div className="stay-card-name">{stay.hotel_name}</div>
                  <div className="stay-card-creator">
                    <div className="stay-card-avatar">
                      {stay.influencers?.profiles?.avatar_url
                        ? <img src={stay.influencers.profiles.avatar_url} alt="" />
                        : '✈️'}
                    </div>
                    <span className="stay-card-creator-name">{stay.influencers?.profiles?.full_name || stay.influencers?.handle}</span>
                  </div>
                  <a href={buildExpediaUrl(stay.hotel_name, stay.city, stay.country)} target="_blank" rel="noopener noreferrer" className="stay-book-btn">Book Now →</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FEATURED CREATORS */}
      {creators.length > 0 && (
        <div className="section section-alt">
          <div className="section-header">
            <div className="section-eyebrow">meet the creators</div>
            <h2 className="section-title">Discover who's sharing</h2>
            <p className="section-sub">Follow creators to get their latest hotel picks in your feed.</p>
            <Link href="/explore" className="section-link">See all creators →</Link>
          </div>
          <div className="creators-grid">
            {creators.slice(0, 6).map(creator => (
              <Link key={creator.id} href={`/${creator.handle}`} className="creator-card">
                <div className="creator-avatar">
                  {creator.profiles?.avatar_url
                    ? <img src={creator.profiles.avatar_url} alt={creator.profiles.full_name} />
                    : '✈️'}
                </div>
                <div className="creator-name">{creator.profiles?.full_name || creator.handle}</div>
                <div className="creator-handle">@{creator.handle}</div>
                {creator.profiles?.bio && <div className="creator-bio">{creator.profiles.bio}</div>}
                <span className="creator-follow-btn">View profile →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* HOW IT WORKS */}
      <div className="section">
        <div className="section-header">
          <div className="section-eyebrow">how it works</div>
          <h2 className="section-title">Simple as that.</h2>
        </div>
        <div className="how-grid">
          <div className="how-item">
            <div className="how-icon">✈️</div>
            <div className="how-num">Step 01</div>
            <div className="how-title">Follow creators</div>
            <div className="how-text">Follow travel creators whose taste you trust. Their hotel picks show up in your personal feed.</div>
          </div>
          <div className="how-item">
            <div className="how-icon">🗺️</div>
            <div className="how-num">Step 02</div>
            <div className="how-title">Explore their map</div>
            <div className="how-text">Browse their interactive map. See every hotel they've stayed at, with their personal quote and nearby options.</div>
          </div>
          <div className="how-item">
            <div className="how-icon">🏨</div>
            <div className="how-num">Step 03</div>
            <div className="how-title">Book in one click</div>
            <div className="how-text">Click Book Now and land directly on the hotel. No searching, no scrolling — just the exact place they stayed.</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta">
        <h2 className="cta-title">Share where you've been.<br />Earn when they book.</h2>
        <p className="cta-sub">Add your hotels. Share your page. Earn commission every time a follower books.</p>
        <div className="cta-form">
          <input className="cta-input" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          <Link href={`/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`}>
            <button className="cta-btn">Get started →</button>
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <Link href="/" className="footer-logo">GoThereNow</Link>
        <div className="footer-links">
          <Link href="/explore" className="footer-link">Explore</Link>
          <Link href="/feed" className="footer-link">Feed</Link>
          <Link href="/signup" className="footer-link">Join</Link>
          <Link href="/login" className="footer-link">Sign in</Link>
        </div>
        <div className="footer-copy">© 2026 GoThereNow</div>
      </footer>

    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
