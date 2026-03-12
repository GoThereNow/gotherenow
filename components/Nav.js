import Link from 'next/link'

export default function Nav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '18px 48px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgb(0,86,99)',
      borderBottom: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 2px 24px rgba(0,0,0,0.2)',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <Link href="/" style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: '24px', fontWeight: 700,
        color: 'white', textDecoration: 'none', letterSpacing: '-0.5px',
      }}>
        Go<em style={{fontStyle:'italic', fontWeight:300, color:'rgba(255,255,255,0.7)'}}>There</em>Now
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
        <Link href="/" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Discover</Link>
        <Link href="/signup?role=influencer" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>For creators</Link>
        <Link href="/login" style={{
          background: 'white', color: 'rgb(0,86,99)',
          padding: '9px 22px', borderRadius: '100px',
          fontSize: '13px', fontWeight: 600, textDecoration: 'none',
        }}>Sign in</Link>
      </div>
    </nav>
  )
}
