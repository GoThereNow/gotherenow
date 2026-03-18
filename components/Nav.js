import Link from 'next/link'

export default function Nav() {
  return (
    <>
      <style>{`
        .gtn-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 18px 48px;
          display: flex; align-items: center; justify-content: space-between;
          background: #1a6b7a;
          border-bottom: 1px solid rgba(255,255,255,0.15);
          box-shadow: 0 2px 24px rgba(0,0,0,0.2);
        }
        .gtn-logo {
          font-family: 'Playfair Display', serif;
          font-size: 22px; font-weight: 700;
          color: white; text-decoration: none; letter-spacing: -0.5px;
        }
        .gtn-logo em { font-style: normal; font-weight: 700; color: rgba(255,255,255,0.55); }
        .gtn-nav-right { display: flex; align-items: center; gap: 40px; }
        .gtn-nav-link {
          font-size: 13px; color: rgba(255,255,255,0.7);
          text-decoration: none; transition: color 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .gtn-nav-link:hover { color: white; }
        .gtn-nav-btn {
          background: white; color: #1a6b7a;
          padding: 9px 22px; border-radius: 100px;
          font-size: 13px; font-weight: 600;
          text-decoration: none; transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .gtn-nav-btn:hover { background: rgba(255,255,255,0.9); }
        @media (max-width: 768px) {
          .gtn-nav { padding: 16px 24px; }
          .gtn-nav-right .gtn-nav-link { display: none; }
        }
      `}</style>

      <nav className="gtn-nav">
        <Link href="/" className="gtn-logo">Go<em>There</em>Now</Link>
        <div className="gtn-nav-right">
          <Link href="/explore" className="gtn-nav-link">Explore</Link>
          <Link href="/signup?role=influencer" className="gtn-nav-link">For creators</Link>
          <Link href="/login" className="gtn-nav-btn">Sign in</Link>
        </div>
      </nav>
    </>
  )
}
