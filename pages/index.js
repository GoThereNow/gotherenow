import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Home() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const stays = [
    { location: 'Positano, Italy', hotel: 'Le Sirenuse', tag: 'Amalfi Coast', creator: 'sofiarami', image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80' },
    { location: 'Kyoto, Japan', hotel: 'Aman Kyoto', tag: 'Japan', creator: 'yukiexplores', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80' },
    { location: 'Santorini, Greece', hotel: 'Canaves Oia', tag: 'Greek Islands', creator: 'marctravel', image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80' },
    { location: 'Morocco', hotel: 'Amanjena', tag: 'Africa', creator: 'sofiarami', image: 'https://images.unsplash.com/photo-1489493585363-d69421e0edd3?w=800&q=80' },
  ]

  return (
    <>
      <Head>
        <title>GoThereNow — Travel the world through creators you trust</title>
        <meta name="description" content="Discover and book hotels recommended by travel creators you follow." />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #080E0D; font-family: 'DM Sans', sans-serif; color: white; overflow-x: hidden; }

        /* NAV */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 28px 56px;
          display: flex; align-items: center; justify-content: space-between;
          transition: all 0.5s ease;
        }
        .nav.scrolled {
          background: rgba(8,14,13,0.95);
          backdrop-filter: blur(20px);
          padding: 18px 56px;
          border-bottom: 1px solid rgba(0,86,99,0.2);
        }
        .logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 300;
          color: white; letter-spacing: 3px;
          text-decoration: none; text-transform: uppercase;
        }
        .logo em { font-style: italic; color: #005663; }
        .nav-right { display: flex; align-items: center; gap: 40px; }
        .nav-link {
          font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.35); text-decoration: none;
          transition: color 0.2s;
        }
        .nav-link:hover { color: white; }
        .nav-btn {
          font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
          color: #005663; text-decoration: none;
          padding-bottom: 2px;
          border-bottom: 1px solid #005663;
          transition: opacity 0.2s;
        }
        .nav-btn:hover { opacity: 0.7; }

        /* HERO — static, full screen */
        .hero {
          position: relative;
          height: 100vh; min-height: 700px;
          overflow: hidden;
          display: flex; align-items: flex-end;
        }
        .hero-bg {
          position: absolute; inset: 0;
        }
        .hero-img {
          width: 100%; height: 100%; object-fit: cover;
          filter: brightness(0.55) saturate(0.7);
        }
        .hero-teal-wash {
          position: absolute; inset: 0;
          background: rgba(0,40,50,0.45);
          mix-blend-mode: multiply;
        }
        .hero-gradient {
          position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(8,14,13,0.1) 0%,
            rgba(8,14,13,0.0) 30%,
            rgba(8,14,13,0.6) 70%,
            rgba(8,14,13,1.0) 100%
          );
        }
        .hero-content {
          position: relative; z-index: 2;
          width: 100%; padding: 0 56px 80px;
          display: grid; grid-template-columns: 1fr auto;
          align-items: flex-end; gap: 60px;
        }
        .hero-label {
          font-size: 10px; letter-spacing: 4px; text-transform: uppercase;
          color: #005663; margin-bottom: 20px;
          display: flex; align-items: center; gap: 12px;
        }
        .hero-label::before { content: ''; display: block; width: 32px; height: 1px; background: #005663; }
        .hero-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(56px, 8vw, 104px);
          font-weight: 300; line-height: 0.95;
          color: white; letter-spacing: -1px;
          margin-bottom: 28px;
          text-shadow: 0 4px 40px rgba(0,0,0,0.5);
        }
        .hero-h1 em { font-style: italic; color: rgba(255,255,255,0.75); }
        .hero-sub {
          font-size: 14px; color: rgba(255,255,255,0.4);
          line-height: 1.9; max-width: 380px;
          margin-bottom: 40px;
        }
        .hero-actions { display: flex; gap: 24px; align-items: center; }
        .btn-main {
          background: #005663;
          color: white; padding: 14px 36px;
          font-size: 12px; font-weight: 500;
          letter-spacing: 1.5px; text-transform: uppercase;
          text-decoration: none; border-radius: 2px;
          transition: all 0.3s;
        }
        .btn-main:hover { background: #006f80; }
        .btn-text {
          font-size: 12px; letter-spacing: 1px; text-transform: uppercase;
          color: rgba(255,255,255,0.35); text-decoration: none;
          transition: color 0.2s;
        }
        .btn-text:hover { color: white; }
        .hero-badge {
          text-align: right;
        }
        .hero-badge-loc {
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          color: #005663; margin-bottom: 6px;
        }
        .hero-badge-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 300; color: white;
          text-shadow: 0 2px 20px rgba(0,0,0,0.5);
        }
        .hero-badge-creator {
          font-size: 11px; color: rgba(255,255,255,0.3);
          margin-top: 6px;
        }

        /* DIVIDER */
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(0,86,99,0.3), transparent);
        }

        /* STAYS GRID */
        .stays { padding: 100px 56px; }
        .stays-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 56px;
        }
        .section-eyebrow {
          font-size: 10px; letter-spacing: 4px; text-transform: uppercase;
          color: #005663; margin-bottom: 14px;
          display: flex; align-items: center; gap: 12px;
        }
        .section-eyebrow::before { content: ''; display: block; width: 28px; height: 1px; background: #005663; }
        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(36px, 4vw, 52px);
          font-weight: 300; color: white; line-height: 1.05;
        }
        .section-title em { font-style: italic; }
        .view-all {
          font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.3); text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 2px; transition: all 0.2s; white-space: nowrap;
        }
        .view-all:hover { color: white; border-color: white; }

        .stays-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 2px;
          height: 520px;
        }
        .stay-card {
          position: relative; overflow: hidden; cursor: pointer;
          transition: flex 0.4s ease;
        }
        .stay-img {
          width: 100%; height: 100%; object-fit: cover;
          filter: brightness(0.6) saturate(0.75);
          transition: transform 0.6s ease, filter 0.4s ease;
        }
        .stay-card:hover .stay-img { transform: scale(1.05); filter: brightness(0.5) saturate(0.8); }
        .stay-teal {
          position: absolute; inset: 0;
          background: rgba(0,40,50,0.35);
          mix-blend-mode: multiply;
        }
        .stay-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,14,13,0.95) 0%, transparent 55%);
        }
        .stay-info {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 24px 20px;
        }
        .stay-loc {
          font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
          color: #005663; margin-bottom: 5px;
        }
        .stay-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; font-weight: 300; color: white;
          margin-bottom: 6px; line-height: 1.1;
        }
        .stay-creator {
          font-size: 10px; color: rgba(255,255,255,0.25);
        }

        /* HOW */
        .how {
          padding: 100px 56px;
          border-top: 1px solid rgba(255,255,255,0.04);
          display: grid; grid-template-columns: 1fr 1fr; gap: 100px; align-items: center;
        }
        .how-steps { display: flex; flex-direction: column; gap: 48px; }
        .how-step { display: flex; gap: 24px; align-items: flex-start; }
        .step-n {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px; color: #005663;
          letter-spacing: 2px; padding-top: 4px;
          flex-shrink: 0; width: 28px;
        }
        .step-body {}
        .step-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 400; color: white;
          margin-bottom: 8px;
        }
        .step-desc { font-size: 13px; color: rgba(255,255,255,0.3); line-height: 1.8; }
        .how-visual {
          position: relative; aspect-ratio: 3/4;
          border-radius: 4px; overflow: hidden;
        }
        .how-visual-img {
          width: 100%; height: 100%; object-fit: cover;
          filter: brightness(0.55) saturate(0.7);
        }
        .how-visual-wash {
          position: absolute; inset: 0;
          background: rgba(0,40,50,0.4);
          mix-blend-mode: multiply;
        }
        .how-visual-caption {
          position: absolute; bottom: 28px; left: 28px; right: 28px;
        }
        .how-visual-loc {
          font-size: 9px; letter-spacing: 3px; text-transform: uppercase;
          color: #005663; margin-bottom: 6px;
        }
        .how-visual-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 300; color: white;
        }

        /* CREATOR CTA */
        .creator-cta {
          padding: 120px 56px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 100px; align-items: center;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .cta-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(40px, 4vw, 60px);
          font-weight: 300; color: white; line-height: 1.05;
          margin-bottom: 20px;
        }
        .cta-title em { font-style: italic; color: #005663; }
        .cta-sub { font-size: 14px; color: rgba(255,255,255,0.3); line-height: 1.9; margin-bottom: 36px; max-width: 380px; }
        .cta-stats { display: flex; gap: 48px; }
        .cta-stat-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 48px; font-weight: 300; color: white; line-height: 1;
          margin-bottom: 4px;
        }
        .cta-stat-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.2); }

        /* FOOTER */
        .footer {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 40px 56px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .footer-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px; font-weight: 300; letter-spacing: 3px;
          text-transform: uppercase; color: rgba(255,255,255,0.25);
          text-decoration: none;
        }
        .footer-logo em { font-style: italic; color: #005663; }
        .footer-text { font-size: 11px; color: rgba(255,255,255,0.15); letter-spacing: 1px; }

        @media (max-width: 768px) {
          .nav { padding: 20px 24px; }
          .nav.scrolled { padding: 14px 24px; }
          .nav-right .nav-link { display: none; }
          .hero-content { padding: 0 24px 60px; grid-template-columns: 1fr; }
          .hero-badge { display: none; }
          .stays { padding: 70px 24px; }
          .stays-grid { grid-template-columns: 1fr 1fr; height: auto; }
          .stay-card { aspect-ratio: 3/4; }
          .how { padding: 70px 24px; grid-template-columns: 1fr; gap: 60px; }
          .how-visual { display: none; }
          .creator-cta { padding: 70px 24px; grid-template-columns: 1fr; gap: 48px; }
          .footer { padding: 32px 24px; flex-direction: column; gap: 12px; text-align: center; }
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

      {/* HERO — one still image */}
      <section className="hero">
        <div className="hero-bg">
          <img
            src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1800&q=80"
            alt="Travel"
            className="hero-img"
          />
          <div className="hero-teal-wash" />
          <div className="hero-gradient" />
        </div>

        <div className="hero-content">
          <div>
            <div className="hero-label">Creator-curated travel</div>
            <h1 className="hero-h1">
              Stay where<br />
              the <em>story</em><br />
              begins.
            </h1>
            <p className="hero-sub">
              Hotels personally recommended by travel creators. Every pin on the map is a stay they've lived.
            </p>
            <div className="hero-actions">
              <a href="/signup" className="btn-main">Explore stays</a>
              <a href="/signup?role=influencer" className="btn-text">For creators →</a>
            </div>
          </div>

          <div className="hero-badge">
            <div className="hero-badge-loc">📍 Lake Como, Italy</div>
            <div className="hero-badge-name">Grand Hotel Tremezzo</div>
            <div className="hero-badge-creator">via @marctravel</div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* STAYS GRID */}
      <section className="stays" id="stays">
        <div className="stays-header">
          <div>
            <div className="section-eyebrow">Handpicked stays</div>
            <h2 className="section-title">Where creators<br /><em>actually</em> sleep.</h2>
          </div>
          <a href="/signup" className="view-all">View all stays →</a>
        </div>

        <div className="stays-grid">
          {stays.map((s, i) => (
            <div key={i} className="stay-card">
              <img src={s.image} alt={s.hotel} className="stay-img" />
              <div className="stay-teal" />
              <div className="stay-overlay" />
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
          <div className="section-eyebrow">How it works</div>
          <h2 className="section-title" style={{ marginBottom: '56px' }}>
            Travel through<br /><em>trusted</em> eyes.
          </h2>
          <div className="how-steps">
            {[
              { n: '01', title: 'Follow a creator', desc: 'Browse travel creators whose taste matches yours. Explore their personal map of hotels they\'ve actually stayed at.' },
              { n: '02', title: 'Find your stay', desc: 'Every pin is a personal endorsement. Read their quote, see their rating, and feel the story behind the recommendation.' },
              { n: '03', title: 'Book with confidence', desc: 'Click through to Booking.com or Expedia. Real stays. Real people. No algorithms, no ads.' },
            ].map((s, i) => (
              <div key={i} className="how-step">
                <div className="step-n">{s.n}</div>
                <div className="step-body">
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="how-visual">
          <img
            src="https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80"
            alt="Italy"
            className="how-visual-img"
          />
          <div className="how-visual-wash" />
          <div className="how-visual-caption">
            <div className="how-visual-loc">📍 Tuscany, Italy</div>
            <div className="how-visual-name">Rosewood Castiglion del Bosco</div>
          </div>
        </div>
      </section>

      {/* CREATOR CTA */}
      <section className="creator-cta">
        <div>
          <div className="section-eyebrow">For creators</div>
          <h2 className="cta-title">Share where<br />you've <em>been.</em><br />Earn when<br />they <em>go.</em></h2>
        </div>
        <div>
          <p className="cta-sub">Add the hotels you've personally stayed at. Your followers book through your map. You earn a commission — automatically.</p>
          <a href="/signup?role=influencer" className="btn-main" style={{ display: 'inline-block', marginBottom: '48px' }}>
            Join as a creator
          </a>
          <div className="cta-stats">
            {[
              { num: '5', label: 'Minutes to set up' },
              { num: '∞', label: 'Hotels you can add' },
              { num: '100+', label: 'Booking platforms' },
            ].map((s, i) => (
              <div key={i}>
                <div className="cta-stat-num">{s.num}</div>
                <div className="cta-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <a href="/" className="footer-logo">Go<em>There</em>Now</a>
        <div className="footer-text">© 2026 · Travel the world through creators you trust.</div>
      </footer>
    </>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
