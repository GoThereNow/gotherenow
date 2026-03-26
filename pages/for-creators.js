export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Nav from '../components/Nav'

export default function ForCreators() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'for-creators' })
      })
      setSubscribed(true)
    } catch (e) {}
  }

  return (
    <div style={{ background: '#f7f5f2', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <Head>
        <title>For Creators — GoThereNow</title>
        <meta name="description" content="Turn your hotel recommendations into commission. Share where you stay, earn when your followers book." />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f7f5f2; font-family: 'DM Sans', sans-serif; }

        .hero { background: #1a6b7a; padding: 120px 56px 80px; text-align: center; }
        .hero-eyebrow { font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: rgba(255,255,255,0.5); font-weight: 600; margin-bottom: 20px; }
        .hero-title { font-family: 'Playfair Display', serif; font-size: clamp(36px, 5vw, 72px); font-weight: 700; color: white; line-height: 1.05; margin-bottom: 20px; max-width: 800px; margin-left: auto; margin-right: auto; }
        .hero-sub { font-size: clamp(15px, 2vw, 18px); color: rgba(255,255,255,0.65); max-width: 520px; margin: 0 auto 40px; line-height: 1.7; }
        .hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .btn-primary { background: white; color: #1a6b7a; padding: 16px 36px; border-radius: 100px; font-size: 15px; font-weight: 700; text-decoration: none; transition: all 0.2s; display: inline-block; }
        .btn-primary:hover { background: rgba(255,255,255,0.9); transform: translateY(-2px); }
        .btn-secondary { background: transparent; color: white; padding: 16px 36px; border-radius: 100px; font-size: 15px; font-weight: 700; text-decoration: none; border: 2px solid rgba(255,255,255,0.35); transition: all 0.2s; display: inline-block; }
        .btn-secondary:hover { border-color: white; }

        .section { padding: 80px 56px; }
        .section-center { text-align: center; }
        .section-alt { background: white; }
        .section-eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 10px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: clamp(28px, 3vw, 44px); font-weight: 700; color: #1a6b7a; margin-bottom: 12px; }
        .section-sub { font-size: 15px; color: rgba(26,107,122,0.55); line-height: 1.7; max-width: 560px; margin: 0 auto; }

        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-top: 56px; }
        .step { text-align: center; }
        .step-num { font-family: 'Playfair Display', serif; font-size: 56px; font-weight: 700; color: rgba(26,107,122,0.1); line-height: 1; margin-bottom: 16px; }
        .step-icon { font-size: 36px; margin-bottom: 14px; }
        .step-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1a6b7a; margin-bottom: 10px; }
        .step-text { font-size: 14px; color: rgba(26,107,122,0.6); line-height: 1.7; }

        .earnings-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px; }
        .earning-card { background: white; border-radius: 20px; padding: 32px; box-shadow: 0 4px 20px rgba(26,107,122,0.08); border: 1px solid rgba(26,107,122,0.06); text-align: center; }
        .earning-num { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 700; color: #1a6b7a; line-height: 1; margin-bottom: 8px; }
        .earning-label { font-size: 13px; color: rgba(26,107,122,0.5); line-height: 1.5; }

        .features-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 48px; max-width: 800px; margin-left: auto; margin-right: auto; }
        .feature { display: flex; gap: 16px; align-items: flex-start; }
        .feature-icon { font-size: 24px; flex-shrink: 0; margin-top: 2px; }
        .feature-title { font-size: 15px; font-weight: 700; color: #1a6b7a; margin-bottom: 4px; }
        .feature-text { font-size: 13px; color: rgba(26,107,122,0.6); line-height: 1.6; }

        .faq-list { max-width: 680px; margin: 48px auto 0; }
        .faq-item { border-bottom: 1px solid rgba(26,107,122,0.1); padding: 20px 0; }
        .faq-q { font-size: 16px; font-weight: 700; color: #1a6b7a; margin-bottom: 8px; }
        .faq-a { font-size: 14px; color: rgba(26,107,122,0.65); line-height: 1.7; }

        .cta { background: #1a6b7a; padding: 100px 56px; text-align: center; }
        .cta-title { font-family: 'Playfair Display', serif; font-size: clamp(28px, 4vw, 48px); font-weight: 700; color: white; margin-bottom: 14px; }
        .cta-sub { font-size: 16px; color: rgba(255,255,255,0.6); margin-bottom: 36px; }
        .cta-form { display: flex; gap: 12px; max-width: 400px; margin: 0 auto; }
        .cta-input { flex: 1; padding: 14px 20px; border-radius: 100px; border: none; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; color: #1a6b7a; }
        .cta-btn { background: #b5654a; color: white; padding: 14px 24px; border-radius: 100px; border: none; font-size: 14px; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .cta-btn:hover { background: #a05540; }

        .footer { padding: 32px 56px; border-top: 1px solid rgba(26,107,122,0.1); display: flex; justify-content: space-between; align-items: center; }
        .footer-logo { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #1a6b7a; text-decoration: none; }
        .footer-links { display: flex; gap: 20px; }
        .footer-link { font-size: 13px; color: rgba(26,107,122,0.45); text-decoration: none; }
        .footer-link:hover { color: #1a6b7a; }

        @media (max-width: 768px) {
          .hero { padding: 100px 24px 60px; }
          .section { padding: 56px 24px; }
          .steps-grid { grid-template-columns: 1fr; gap: 32px; }
          .earnings-grid { grid-template-columns: 1fr; gap: 16px; }
          .features-grid { grid-template-columns: 1fr; }
          .cta { padding: 60px 24px; }
          .cta-form { flex-direction: column; }
          .footer { flex-direction: column; gap: 16px; text-align: center; padding: 24px; }
          .footer-links { flex-wrap: wrap; justify-content: center; }
        }
      `}</style>

      <Nav />

      {/* HERO */}
      <div className="hero">
        <div className="hero-eyebrow">for creators</div>
        <h1 className="hero-title">Your hotels. Your followers. Your commission.</h1>
        <p className="hero-sub">Add the hotels you've stayed at. Share your profile. Earn every time a follower books — from any hotel, anywhere in the world.</p>
        <div className="hero-actions">
          <Link href="/signup" className="btn-primary">Start for free →</Link>
          <Link href="/explore" className="btn-secondary">See how it works</Link>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="section section-center">
        <div className="section-eyebrow">how it works</div>
        <h2 className="section-title">Three steps to earning</h2>
        <p className="section-sub">No sponsorships needed. No brand deals. Just share where you stay and earn passively.</p>
        <div className="steps-grid">
          <div className="step">
            <div className="step-num">01</div>
            <div className="step-icon">✈️</div>
            <div className="step-title">Add your hotels</div>
            <div className="step-text">Add hotels you've personally stayed at. Include your own quote, a photo, and a star rating. Your profile builds automatically.</div>
          </div>
          <div className="step">
            <div className="step-num">02</div>
            <div className="step-icon">🗺️</div>
            <div className="step-title">Share your map</div>
            <div className="step-text">Share your GoThereNow profile link on TikTok, Instagram, or anywhere. Followers land on your interactive hotel map.</div>
          </div>
          <div className="step">
            <div className="step-num">03</div>
            <div className="step-icon">💰</div>
            <div className="step-title">Earn commission</div>
            <div className="step-text">Every time a follower books a hotel through your profile — yours or a nearby one — you earn a commission. Paid monthly.</div>
          </div>
        </div>
      </div>

      {/* EARNINGS */}
      <div className="section section-alt section-center">
        <div className="section-eyebrow">earnings potential</div>
        <h2 className="section-title">What can you earn?</h2>
        <p className="section-sub">Commission varies by platform, but here's a realistic example based on average hotel prices and conversion rates.</p>
        <div className="earnings-grid">
          <div className="earning-card">
            <div className="earning-num">$6</div>
            <div className="earning-label">Average commission per booking on a $200/night hotel</div>
          </div>
          <div className="earning-card">
            <div className="earning-num">50+</div>
            <div className="earning-label">Bookings per month with 10k engaged followers</div>
          </div>
          <div className="earning-card">
            <div className="earning-num">$300+</div>
            <div className="earning-label">Estimated monthly passive income</div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="section section-center">
        <div className="section-eyebrow">platform features</div>
        <h2 className="section-title">Everything you need</h2>
        <div className="features-grid">
          {[
            { icon: '🗺️', title: 'Interactive map', text: 'Your hotels appear as pins on a beautiful world map. Followers can explore and click through to book.' },
            { icon: '📸', title: 'Auto photo fill', text: 'We pull hotel photos automatically from Google Places so your profile always looks stunning.' },
            { icon: '🏨', title: 'Nearby hotels', text: 'Even if followers want something different, nearby hotels are shown — and you still earn commission.' },
            { icon: '❤️', title: 'Social features', text: 'Followers can like, comment, and follow you — building your audience directly on GoThereNow.' },
            { icon: '📊', title: 'Analytics', text: 'See how many clicks and bookings your hotels generate. Know what's working.' },
            { icon: '💸', title: 'Monthly payouts', text: 'Commission is tracked automatically and paid out monthly. No invoicing, no chasing.' },
          ].map((f, i) => (
            <div key={i} className="feature">
              <div className="feature-icon">{f.icon}</div>
              <div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-text">{f.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="section section-alt section-center">
        <div className="section-eyebrow">questions</div>
        <h2 className="section-title">FAQ</h2>
        <div className="faq-list">
          {[
            { q: 'Is GoThereNow free to join?', a: 'Yes, completely free. There are no monthly fees, no setup costs, and no minimum follower count required.' },
            { q: 'How do I get paid?', a: 'Commission is tracked automatically when followers book through your profile links. Payouts are processed monthly via bank transfer or PayPal.' },
            { q: 'Do I need a big following to earn?', a: 'No. Even with a small but engaged audience, you can earn. The more your followers trust your recommendations, the higher your conversion rate.' },
            { q: 'Which hotels can I add?', a: 'Any hotel you have personally stayed at. Your recommendations need to be genuine — that\'s what makes followers trust them.' },
            { q: 'Which booking platforms do you work with?', a: 'Currently Expedia, Hotels.com, and Booking.com (pending). We\'re adding more platforms every month.' },
            { q: 'Can I use GoThereNow alongside brand deals?', a: 'Absolutely. GoThereNow is a passive income layer on top of your existing content — it doesn\'t conflict with sponsorships or brand deals.' },
          ].map((item, i) => (
            <div key={i} className="faq-item">
              <div className="faq-q">{item.q}</div>
              <div className="faq-a">{item.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="cta">
        <h2 className="cta-title">Ready to turn your travels into income?</h2>
        <p className="cta-sub">Join GoThereNow free. No credit card required.</p>
        {subscribed ? (
          <div style={{color:'white', fontSize:'16px', fontWeight:600}}>✓ You're on the list! We'll be in touch.</div>
        ) : (
          <form onSubmit={handleSubmit} className="cta-form">
            <input className="cta-input" type="email" required placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            <button type="submit" className="cta-btn">Get started →</button>
          </form>
        )}
        <div style={{marginTop:'20px'}}>
          <Link href="/signup" style={{color:'rgba(255,255,255,0.5)', fontSize:'13px', textDecoration:'none'}}>Or create your account now →</Link>
        </div>
      </div>

      <footer className="footer">
        <Link href="/" className="footer-logo">GoThereNow</Link>
        <div className="footer-links">
          <Link href="/explore" className="footer-link">Explore</Link>
          <Link href="/about" className="footer-link">About</Link>
          <Link href="/terms" className="footer-link">Terms</Link>
          <Link href="/privacy" className="footer-link">Privacy</Link>
        </div>
      </footer>

    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}

