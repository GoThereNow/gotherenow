import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const stays = [
    { location: 'Positano, Italy', hotel: 'Le Sirenuse', creator: 'sofiarami', image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80' },
    { location: 'Kyoto, Japan', hotel: 'Aman Kyoto', creator: 'yukiexplores', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80' },
    { location: 'Santorini, Greece', hotel: 'Canaves Oia', creator: 'marctravel', image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80' },
    { location: 'Morocco', hotel: 'Amanjena', creator: 'sofiarami', image: 'https://images.unsplash.com/photo-1489493585363-d69421e0edd3?w=800&q=80' },
  ]

  return (
    <>
      <Head>
        <title>GoThereNow — Your feed, now bookable</title>
        <meta name="description" content="The first interactive map of creator-verified stays." />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: rgb(0,86,99); font-family: 'DM Sans', sans-serif; color: white; overflow-x: hidden; }

        /* NAV */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 24px 48px;
          display: flex; align-items: center; justify-content: space-between;
          transition: all 0.4s ease;
        }
        .nav.scrolled {
          background: rgba(0,86,99,0.95);
          backdrop-filter: blur(20px);
          padding: 16px 48px;
        }
        .logo {
          font-family: 'DM Sans', sans-serif;
          font-size: 20px; font-weight: 700;
          color: white; letter-spacing: -0.5px;
          text-decoration: none;
        }
        .logo em { font-style: normal; color: rgba(255,255,255,0.6); }
        .nav-right { display: flex; align-items: center; gap: 32px; }
        .nav-link {
          font-size: 13px; color: rgba(255,255,255,0.7);
          text-decoration: none; transition: color 0.2s;
        }
        .nav-link:hover { color: white; }
        .nav-btn {
          background: white; color: rgb(0,86,99);
          padding: 9px 22px; border-radius: 100px;
          font-size: 13px; font-weight: 600;
          text-decoration: none; transition: all 0.2s;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.9); }

        /* HERO */
        .hero {
          position: relative;
          height: 100vh; min-height: 680px;
          overflow: hidden;
        }
        .hero-photo {
          position: absolute; inset: 0;
        }
        .hero-img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center;
        }
        /* subtle vignette only — keep photo vivid */
        .hero-vignette {
          position: absolute; inset: 0;
          background: linear-gradient(
            to right,
            rgba(0,86,99,0.15) 0%,
            transparent 60%
          );
        }

        /* TEAL PANEL — the hero */
        .hero-panel {
          position: absolute;
          top: 50%; left: 64px;
          transform: translateY(-50%);
          background: rgb(0,86,99);
          padding: 52px 52px 44px;
          max-width: 480px;
          width: 42%;
        }
        .panel-headline {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 700;
          color: white;
          line-height: 1.0;
          letter-spacing: -1px;
          margin-bottom: 20px;
        }
        .panel-divider {
          width: 60px; height: 2px;
          background: rgba(255,255,255,0.35);
          margin-bottom: 20px;
        }
        .panel-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.8);
          line-height: 1.7;
          margin-bottom: 28px;
          font-weight: 300;
        }
        .panel-input {
          width: 100%;
          background: white;
          border: none;
          padding: 14px 18px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #333;
          margin-bottom: 10px;
          outline: none;
        }
        .panel-input::placeholder { color: #aaa; }
        .panel-btn {
          width: 100%;
          background: transparent;
          border: 2px solid white;
          color: white;
          padding: 13px 18px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: block;
          text-align: center;
          margin-bottom: 14px;
        }
        .panel-btn:hover { background: white; color: rgb(0,86,99); }
        .panel-privacy {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          line-height: 1.5;
        }

        /* SCROLL HINT */
        .scroll-hint {
          position: absolute;
          bottom: 32px; right: 48px;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          color: rgba(255,255,255,0.4);
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
        }
        .scroll-line {
          width: 1px; height: 40px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.4));
        }

        /* STRIP */
        .strip {
          background: rgb(0,86,99);
          padding: 18px 48px;
          display: flex; align-items: center; gap: 48px;
          overflow: hidden;
        }
        .strip-item {
          display: flex; align-items: center; gap: 10px;
          white-space: nowrap; flex-shrink: 0;
        }
        .strip-dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.4); }
        .strip-text { font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.7); }

        /* STAYS */
        .stays { padding: 96px 48px; background: rgb(0,86,99); }
        .stays-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 48px;
        }
        .eyebrow {
          font-size: 10px; letter-spacing: 3px; text-transform: uppercase;
          color: rgb(0,86,99); margin-bottom: 12px;
          display: flex; align-items: center; gap: 10px;
        }
        .eyebrow::before { content:''; display:block; width:24px; height:1px; background: rgb(0,86,99); }
        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(32px, 3.5vw, 48px);
          font-weight: 300; color: white; line-height: 1.05;
        }
        .section-title em { font-style: italic; }
        .view-all {
          font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.25); text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2px;
          transition: all 0.2s; white-space: nowrap;
        }
        .view-all:hover { color: white; border-color: rgba(255,255,255,0.4); }

        .stays-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 3px; height: 500px;
        }
        .stay-card {
          position: relative; overflow: hidden; cursor: pointer;
        }
        .stay-img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.6s ease;
        }
        .stay-card:hover .stay-img { transform: scale(1.06); }
        .stay-teal-wash {
          position: absolute; inset: 0;
          background: rgba(0,50,60,0.3);
          mix-blend-mode: multiply;
          transition: opacity 0.3s;
        }
        .stay-card:hover .stay-teal-wash { opacity: 0.5; }
        .stay-fade {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,86,99,0.85) 0%, transparent 50%);
        }
        .stay-info {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 22px 20px;
        }
        .stay-loc {
          font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.6); margin-bottom: 4px;
        }
        .stay-name {
          font-family: 'Playfair Display', serif;
          font-size: 19px; font-weight: 300; color: white; margin-bottom: 5px;
        }
        .stay-creator { font-size: 10px; color: rgba(255,255,255,0.3); }

        /* HOW */
        .how {
          padding: 96px 48px;
          border-top: 1px solid rgba(0,86,99,0.2);
          display: grid; grid-template-columns: 1fr 1fr; gap: 96px; align-items: center;
        }
        .how-steps { display: flex; flex-direction: column; gap: 44px; }
        .how-step { display: flex; gap: 24px; }
        .step-n {
          font-family: 'Playfair Display', serif;
          font-size: 13px; color: rgb(0,86,99);
          letter-spacing: 2px; padding-top: 3px; flex-shrink: 0; width: 28px;
        }
        .step-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 400; color: white; margin-bottom: 8px;
        }
        .step-desc { font-size: 13px; color: rgba(255,255,255,0.3); line-height: 1.8; }
        .how-visual { position: relative; aspect-ratio: 4/5; overflow: hidden; }
        .how-visual-img { width: 100%; height: 100%; object-fit: cover; }
        .how-visual-wash {
          position: absolute; inset: 0;
          background: rgba(0,50,60,0.4); mix-blend-mode: multiply;
        }
        .how-visual-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,86,99,0.9) 0%, transparent 50%);
        }
        .how-visual-caption {
          position: absolute; bottom: 28px; left: 28px; right: 28px;
        }
        .how-caption-loc {
          font-size: 9px; letter-spacing: 3px; text-transform: uppercase;
          color: rgba(255,255,255,0.5); margin-bottom: 6px;
        }
        .how-caption-name {
          font-family: 'Playfair Display', serif;
          font-size: 26px; font-weight: 300; color: white;
        }

        /* CREATOR CTA */
        .creator-band {
          background: rgb(0,86,99);
          padding: 96px 48px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 96px; align-items: center;
        }
        .cta-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 4vw, 56px);
          font-weight: 300; color: white; line-height: 1.05;
          margin-bottom: 16px;
        }
        .cta-title em { font-style: italic; }
        .cta-sub {
          font-size: 14px; color: rgba(255,255,255,0.55);
          line-height: 1.9; margin-bottom: 36px; max-width: 380px;
        }
        .btn-white {
          background: white; color: rgb(0,86,99);
          padding: 14px 36px; font-size: 13px; font-weight: 700;
          letter-spacing: 0.5px; text-decoration: none;
          display: inline-block; transition: all 0.2s;
        }
        .btn-white:hover { background: rgba(255,255,255,0.9); }
        .cta-stats { display: flex; flex-direction: column; gap: 36px; }
        .cta-stat-row {
          padding-bottom: 36px;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        .cta-stat-row:last-child { border-bottom: none; padding-bottom: 0; }
        .cta-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 56px; font-weight: 300; color: white; line-height: 1;
          margin-bottom: 4px;
        }
        .cta-stat-label {
          font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.4);
        }

        /* FOOTER */
        .footer {
          .stays { padding: 96px 48px; background: rgb(0,86,99); }
          border-top: 1px solid rgba(0,86,99,0.2);
          padding: 40px 48px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .footer-logo {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 700;
          color: rgba(255,255,255,0.3); text-decoration: none;
        }
        .footer-logo em { font-style: normal; color: rgb(0,86,99); }
        .footer-links { display: flex; gap: 32px; }
        .footer-link {
          font-size: 12px; color: rgba(255,255,255,0.2);
          text-decoration: none; transition: color 0.2s;
        }
        .footer-link:hover { color: rgba(255,255,255,0.5); }
        .footer-copy { font-size: 12px; color: rgba(255,255,255,0.15); }

        @media (max-width: 768px) {
          .nav { padding: 18px 24px; }
          .nav.scrolled { padding: 14px 24px; }
          .nav-right .nav-link { display: none; }
          .hero-panel {
            left: 20px; right: 20px; width: auto;
            top: auto; bottom: 40px; transform: none;
            padding: 32px 28px 28px;
          }
          .panel-headline { font-size: 30px; }
          .scroll-hint { display: none; }
          .strip { gap: 28px; padding: 14px 24px; }
          .stays { padding: 60px 24px; }
          .stays-grid { grid-template-columns: 1fr 1fr; height: auto; }
          .stay-card { aspect-ratio: 3/4; }
          .how { padding: 60px 24px; grid-template-columns: 1fr; gap: 48px; }
          .how-visual { display: none; }
          .creator-band { padding: 60px 24px; grid-template-columns: 1fr; gap: 48px; }
          .footer { padding: 32px 24px; flex-direction: column; gap: 20px; text-align: center; }
          .footer-links { justify-content: center; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <a href="/" className="logo">Go<em>There</em>Now</a>
        <div className="nav-right">
          <a href="#stays" className="nav-link">Discover</a>
          <a href="/signup?role=influencer" className="nav-link">For creators</a>
          <a href="/login" className="nav-btn">Sign in</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-photo">
          <img
            src="/positano.avif"
            alt="Positano coastline"
            className="hero-img"
          />
          <div className="hero-vignette" />
        </div>

        {/* TEAL PANEL */}
        <div className="hero-panel">
          <h1 className="panel-headline">YOUR FEED,<br />NOW BOOKABLE!</h1>
          <div className="panel-divider" />
          <p className="panel-sub">
            The first interactive map of creator-verified stays. Unlock exclusive VIP perks at the hotels they love.
          </p>
          <input
            type="email"
            className="panel-input"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <a href="/signup" className="panel-btn">Explore the map!</a>
          <div className="panel-privacy">Rest assured, your information stays private with GoThereNow!</div>
        </div>

        <div className="scroll-hint">
          <div className="scroll-line" />
          scroll
        </div>
      </section>

      {/* STRIP */}
      <div className="strip">
        {['Creator-verified stays', 'Interactive map', 'Book on Booking.com & Expedia', 'Trusted recommendations', 'No fake reviews'].map((item, i) => (
          <div key={i} className="strip-item">
            <div className="strip-dot" />
            <div className="strip-text">{item}</div>
          </div>
        ))}
      </div>

      {/* STAYS GRID */}
      <section className="stays" id="stays">
        <div className="stays-header">
          <div>
            <div className="eyebrow">Handpicked stays</div>
            <h2 className="section-title">Where creators<br /><em>actually</em> sleep.</h2>
          </div>
          <a href="/signup" className="view-all">View all stays →</a>
        </div>

        <div className="stays-grid">
          {stays.map((s, i) => (
            <div key={i} className="stay-card">
              <img src={s.image} alt={s.hotel} className="stay-img" />
              <div className="stay-teal-wash" />
              <div className="stay-fade" />
              <div className="stay-info">
                <div className="stay-loc">📍 {s.location}</div>
                <div className="stay-name">{s.hotel}</div>
                <div className="stay-creator">via @{s.creator}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how">
        <div>
          <div className="eyebrow">How it works</div>
          <h2 className="section-title" style={{ marginBottom: '52px' }}>Travel through<br /><em>trusted</em> eyes.</h2>
          <div className="how-steps">
            {[
              { n: '01', title: 'Follow a creator', desc: 'Browse travel creators whose taste matches yours. Explore their personal map of hotels they\'ve actually stayed at.' },
              { n: '02', title: 'Find your stay', desc: 'Every pin is a personal endorsement. Read their quote, their rating, and the story behind the recommendation.' },
              { n: '03', title: 'Book with confidence', desc: 'Click through to Booking.com or Expedia. Real stays. Real people. No algorithms, no sponsored posts.' },
            ].map((s, i) => (
              <div key={i} className="how-step">
                <div className="step-n">{s.n}</div>
                <div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="how-visual">
          <img
            src="/positano.avif"
            alt="Italy"
            className="how-visual-img"
          />
          <div className="how-visual-wash" />
          <div className="how-visual-overlay" />
          <div className="how-visual-caption">
            <div className="how-caption-loc">📍 Tuscany, Italy</div>
            <div className="how-caption-name">Rosewood Castiglion<br />del Bosco</div>
          </div>
        </div>
      </section>

      {/* CREATOR CTA */}
      <section className="creator-band">
        <div>
          <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ display:'inline-block', width:'24px', height:'1px', background:'rgba(255,255,255,0.3)', marginRight:'10px', verticalAlign:'middle' }}></span>
            For creators
          </div>
          <h2 className="cta-title">Share where<br />you've <em>been.</em><br />Earn when<br />they <em>go.</em></h2>
          <p className="cta-sub">Add the hotels you've personally stayed at. Your followers book through your map. You earn — automatically.</p>
          <a href="/signup?role=influencer" className="btn-white">Join as a creator →</a>
        </div>
        <div className="cta-stats">
          {[
            { num: '5', label: 'Minutes to set up' },
            { num: '100+', label: 'Booking platforms' },
            { num: '∞', label: 'Hotels you can add' },
          ].map((s, i) => (
            <div key={i} className="cta-stat-row">
              <div className="cta-stat-num">{s.num}</div>
              <div className="cta-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <a href="/" className="footer-logo">Go<em>There</em>Now</a>
        <div className="footer-links">
          <a href="/signup" className="footer-link">Sign up</a>
          <a href="/login" className="footer-link">Sign in</a>
          <a href="/signup?role=influencer" className="footer-link">For creators</a>
        </div>
        <div className="footer-copy">© 2026 GoThereNow</div>
      </footer>
    </>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
