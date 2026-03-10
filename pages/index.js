import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)

  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1600&q=80',
      location: 'Positano, Italy',
      hotel: 'Le Sirenuse',
      tag: 'Amalfi Coast',
    },
    {
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600&q=80',
      location: 'Bali, Indonesia',
      hotel: 'Amanjiwo',
      tag: 'Southeast Asia',
    },
    {
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
      location: 'Santorini, Greece',
      hotel: 'Canaves Oia',
      tag: 'Greek Islands',
    },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const destinations = [
    { name: 'Italy', emoji: '🇮🇹', count: '48 stays', image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&q=70' },
    { name: 'Japan', emoji: '🇯🇵', count: '31 stays', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=70' },
    { name: 'Greece', emoji: '🇬🇷', count: '27 stays', image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=70' },
    { name: 'Morocco', emoji: '🇲🇦', count: '19 stays', image: 'https://images.unsplash.com/photo-1489493585363-d69421e0edd3?w=600&q=70' },
  ]

  const creators = [
    { name: 'Sofia Rami', handle: 'sofiarami', stays: 24, countries: 14, gradient: 'linear-gradient(135deg, #2D4A3E, #4A8A70)' },
    { name: 'Marc Leblanc', handle: 'marctravel', stays: 31, countries: 19, gradient: 'linear-gradient(135deg, #3A2D1A, #8A6A2D)' },
    { name: 'Yuki Tanaka', handle: 'yukiexplores', stays: 18, countries: 11, gradient: 'linear-gradient(135deg, #1A2D4A, #2D5A8A)' },
  ]

  return (
    <>
      <Head>
        <title>GoThereNow — Travel the world through creators you trust</title>
        <meta name="description" content="Discover and book hotels recommended by travel creators you follow." />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        :root {
          --cream: #F5F0E8;
          --dark: #0D1208;
          --teal: #4A8C7A;
          --teal-light: #6BB5A0;
          --gold: #C4A35A;
          --muted: rgba(255,255,255,0.45);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: var(--dark); font-family: 'DM Sans', sans-serif; color: white; overflow-x: hidden; }
        .serif { font-family: 'Cormorant Garamond', serif; }

        /* NAV */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 24px 48px;
          display: flex; align-items: center; justify-content: space-between;
          transition: all 0.4s ease;
        }
        .nav.scrolled {
          background: rgba(13,18,8,0.92);
          backdrop-filter: blur(20px);
          padding: 16px 48px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .nav-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 300;
          color: white;
          letter-spacing: 2px;
          text-decoration: none;
        }
        .nav-logo span { color: var(--teal-light); font-style: italic; }
        .nav-links { display: flex; align-items: center; gap: 36px; }
        .nav-links a {
          font-size: 12px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: white; }
        .nav-cta {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.25);
          color: white;
          padding: 10px 24px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 1px;
          text-decoration: none;
          transition: all 0.3s;
        }
        .nav-cta:hover { background: white; color: var(--dark); }

        /* HERO */
        .hero {
          position: relative;
          height: 100vh;
          min-height: 700px;
          overflow: hidden;
        }
        .hero-slide {
          position: absolute; inset: 0;
          opacity: 0;
          transition: opacity 1.2s ease;
        }
        .hero-slide.active { opacity: 1; }
        .hero-img {
          width: 100%; height: 100%;
          object-fit: cover;
          transform: scale(1.05);
          transition: transform 6s ease;
        }
        .hero-slide.active .hero-img { transform: scale(1); }
        .hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(13,18,8,0.2) 0%,
            rgba(13,18,8,0.1) 40%,
            rgba(13,18,8,0.7) 100%
          );
        }
        .hero-content {
          position: absolute;
          bottom: 80px; left: 0; right: 0;
          padding: 0 48px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }
        .hero-text { max-width: 640px; }
        .hero-tag {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
          color: var(--teal-light);
          margin-bottom: 20px;
        }
        .hero-tag::before { content: ''; display: block; width: 24px; height: 1px; background: var(--teal-light); }
        .hero-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(52px, 7vw, 88px);
          font-weight: 300;
          line-height: 1.0;
          color: white;
          margin-bottom: 24px;
          letter-spacing: -0.5px;
        }
        .hero-h1 em { font-style: italic; color: var(--teal-light); }
        .hero-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.55);
          line-height: 1.8;
          max-width: 420px;
          margin-bottom: 36px;
        }
        .hero-actions { display: flex; gap: 16px; align-items: center; }
        .btn-primary {
          background: var(--teal);
          color: white;
          padding: 14px 32px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-decoration: none;
          transition: all 0.3s;
          border: none; cursor: pointer;
        }
        .btn-primary:hover { background: var(--teal-light); transform: translateY(-1px); }
        .btn-ghost {
          color: rgba(255,255,255,0.6);
          font-size: 13px;
          text-decoration: none;
          display: flex; align-items: center; gap: 6px;
          transition: color 0.2s;
        }
        .btn-ghost:hover { color: white; }
        .hero-card {
          background: rgba(13,18,8,0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 24px;
          min-width: 220px;
        }
        .hero-card-loc {
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          color: var(--teal-light); margin-bottom: 6px;
        }
        .hero-card-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 400;
          color: white; margin-bottom: 12px;
        }
        .hero-card-rating { color: var(--gold); font-size: 12px; margin-bottom: 14px; }
        .hero-card-btn {
          display: block; width: 100%;
          background: var(--teal);
          color: white; text-align: center;
          padding: 10px; border-radius: 8px;
          font-size: 12px; font-weight: 600;
          text-decoration: none;
          transition: background 0.2s;
        }

        /* SLIDE DOTS */
        .slide-dots {
          position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 8px;
        }
        .dot {
          width: 24px; height: 2px; border-radius: 2px;
          background: rgba(255,255,255,0.25);
          cursor: pointer; transition: all 0.3s;
          border: none;
        }
        .dot.active { background: var(--teal-light); width: 40px; }

        /* SECTION */
        .section { padding: 100px 48px; }
        .section-label {
          font-size: 10px; letter-spacing: 3px; text-transform: uppercase;
          color: var(--teal-light);
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 16px;
        }
        .section-label::before { content: ''; display: block; width: 30px; height: 1px; background: var(--teal-light); }
        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(36px, 4vw, 56px);
          font-weight: 300;
          line-height: 1.1;
          color: white;
          margin-bottom: 16px;
        }
        .section-title em { font-style: italic; color: var(--teal-light); }
        .section-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.4);
          max-width: 480px;
          line-height: 1.8;
        }

        /* HOW IT WORKS */
        .how { background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 60px; margin-top: 60px; }
        .how-step { }
        .step-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 80px; font-weight: 300;
          color: rgba(255,255,255,0.06);
          line-height: 1; margin-bottom: 16px;
        }
        .step-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px; font-weight: 400;
          color: white; margin-bottom: 10px;
        }
        .step-desc { font-size: 14px; color: rgba(255,255,255,0.35); line-height: 1.8; }

        /* DESTINATIONS */
        .dest-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 60px; }
        .dest-card {
          position: relative; border-radius: 16px; overflow: hidden;
          aspect-ratio: 3/4; cursor: pointer;
          transition: transform 0.4s ease;
        }
        .dest-card:hover { transform: scale(1.02); }
        .dest-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
        .dest-card:hover .dest-img { transform: scale(1.08); }
        .dest-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(13,18,8,0.85) 0%, transparent 60%);
        }
        .dest-info { position: absolute; bottom: 20px; left: 20px; right: 20px; }
        .dest-country { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--teal-light); margin-bottom: 4px; }
        .dest-name { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 300; color: white; margin-bottom: 6px; }
        .dest-count { font-size: 12px; color: rgba(255,255,255,0.4); }

        /* CREATORS */
        .creators-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 60px; }
        .creator-card {
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; overflow: hidden;
          transition: border-color 0.3s, transform 0.3s;
          text-decoration: none; display: block;
        }
        .creator-card:hover { border-color: rgba(74,140,122,0.4); transform: translateY(-4px); }
        .creator-banner { height: 120px; display: flex; align-items: center; justify-content: center; font-size: 40px; }
        .creator-body { padding: 24px; }
        .creator-name { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; color: white; margin-bottom: 4px; }
        .creator-handle { font-size: 12px; color: var(--teal-light); margin-bottom: 16px; }
        .creator-stats { display: flex; gap: 24px; }
        .creator-stat-num { font-family: 'Cormorant Garamond', serif; font-size: 24px; color: white; }
        .creator-stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.3); }

        /* CTA BAND */
        .cta-band {
          position: relative; overflow: hidden;
          padding: 120px 48px;
          text-align: center;
          background: linear-gradient(135deg, #0D2018, #1A3528);
        }
        .cta-band::before {
          content: '';
          position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
          width: 800px; height: 800px;
          background: radial-gradient(circle, rgba(74,140,122,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-band-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(40px, 5vw, 72px);
          font-weight: 300;
          color: white;
          line-height: 1.1;
          margin-bottom: 20px;
          position: relative;
        }
        .cta-band-title em { font-style: italic; color: var(--teal-light); }
        .cta-band-sub { font-size: 15px; color: rgba(255,255,255,0.4); margin-bottom: 40px; position: relative; }
        .cta-band-actions { display: flex; gap: 16px; justify-content: center; position: relative; }

        /* FOOTER */
        .footer {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 48px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .footer-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; font-weight: 300;
          color: rgba(255,255,255,0.4);
          letter-spacing: 2px;
          text-decoration: none;
        }
        .footer-logo span { color: var(--teal-light); font-style: italic; }
        .footer-text { font-size: 12px; color: rgba(255,255,255,0.2); }

        @media (max-width: 768px) {
          .nav { padding: 20px 24px; }
          .nav.scrolled { padding: 14px 24px; }
          .nav-links { display: none; }
          .hero-content { padding: 0 24px; bottom: 60px; flex-direction: column; align-items: flex-start; gap: 20px; }
          .hero-card { display: none; }
          .section { padding: 70px 24px; }
          .how-grid { grid-template-columns: 1fr; gap: 40px; }
          .dest-grid { grid-template-columns: repeat(2, 1fr); }
          .creators-grid { grid-template-columns: 1fr; }
          .footer { flex-direction: column; gap: 16px; text-align: center; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <a href="/" className="nav-logo">Go<span>There</span>Now</a>
        <div className="nav-links">
          <a href="#">Discover</a>
          <a href="#">Creators</a>
          <a href="/signup">Join as creator</a>
          <a href="/login" className="nav-cta">Sign in</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        {slides.map((slide, i) => (
          <div key={i} className={`hero-slide${i === activeSlide ? ' active' : ''}`}>
            <img src={slide.image} alt={slide.location} className="hero-img" />
            <div className="hero-overlay" />
          </div>
        ))}

        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-tag">Creator-curated travel</div>
            <h1 className="hero-h1">
              Stay where<br />
              the <em>story</em><br />
              begins.
            </h1>
            <p className="hero-sub">
              Hotels handpicked by travel creators who've personally stayed there. Every recommendation is a trusted endorsement.
            </p>
            <div className="hero-actions">
              <a href="/signup" className="btn-primary">Explore stays →</a>
              <a href="#how" className="btn-ghost">How it works ↓</a>
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-card-loc">📍 {slides[activeSlide].location}</div>
            <div className="hero-card-name">{slides[activeSlide].hotel}</div>
            <div className="hero-card-rating">★★★★★</div>
            <a href="/signup" className="hero-card-btn">View & Book →</a>
          </div>
        </div>

        <div className="slide-dots">
          {slides.map((_, i) => (
            <button key={i} className={`dot${i === activeSlide ? ' active' : ''}`} onClick={() => setActiveSlide(i)} />
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section how" id="how">
        <div className="section-label">How it works</div>
        <h2 className="section-title">Travel through<br /><em>trusted</em> eyes.</h2>
        <div className="how-grid">
          {[
            { n: '01', title: 'Follow a creator', desc: 'Discover travel creators whose taste matches yours. Browse their personal map of hotels they\'ve actually stayed at.' },
            { n: '02', title: 'Find your stay', desc: 'Every pin on their map is a personal recommendation. Read their quote, see their rating, explore the details.' },
            { n: '03', title: 'Book with confidence', desc: 'Click through to Booking.com, Expedia, or Airbnb. No fake reviews — just real stays from real people you trust.' },
          ].map((s, i) => (
            <div key={i} className="how-step">
              <div className="step-num">{s.n}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-label">Top destinations</div>
        <h2 className="section-title">Where will you<br /><em>go</em> next?</h2>
        <div className="dest-grid">
          {destinations.map((d, i) => (
            <div key={i} className="dest-card">
              <img src={d.image} alt={d.name} className="dest-img" />
              <div className="dest-overlay" />
              <div className="dest-info">
                <div className="dest-country">{d.emoji} {d.count}</div>
                <div className="dest-name">{d.name}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CREATORS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-label">Featured creators</div>
        <h2 className="section-title">Their <em>world</em>,<br />your next trip.</h2>
        <p className="section-sub">Follow travel creators and book the exact hotels they've personally recommended.</p>
        <div className="creators-grid">
          {creators.map((c, i) => (
            <a key={i} href={`/${c.handle}`} className="creator-card">
              <div className="creator-banner" style={{ background: c.gradient }}>✈️</div>
              <div className="creator-body">
                <div className="creator-name">{c.name}</div>
                <div className="creator-handle">@{c.handle}</div>
                <div className="creator-stats">
                  <div>
                    <div className="creator-stat-num">{c.stays}</div>
                    <div className="creator-stat-label">Stays</div>
                  </div>
                  <div>
                    <div className="creator-stat-num">{c.countries}</div>
                    <div className="creator-stat-label">Countries</div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band">
        <h2 className="cta-band-title">Are you a<br /><em>travel creator?</em></h2>
        <p className="cta-band-sub">Share your favourite hotels and earn every time a follower books. Setup takes 5 minutes.</p>
        <div className="cta-band-actions">
          <a href="/signup?role=influencer" className="btn-primary" style={{ fontSize: '14px', padding: '16px 40px' }}>Join as a creator →</a>
          <a href="/login" className="btn-ghost">Sign in ↗</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <a href="/" className="footer-logo">Go<span>There</span>Now</a>
        <div className="footer-text">© 2026 GoThereNow · Travel the world through creators you trust.</div>
      </footer>
    </>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
