import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FAF7F2', textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '32px', marginBottom: '8px' }}>Page not found</h1>
        <p style={{ color: '#8B7D72', marginBottom: '24px' }}>This page doesn't exist.</p>
        <Link href="/" style={{ color: '#C4622D', textDecoration: 'none', fontWeight: 600 }}>← Back home</Link>
      </div>
    </div>
  )
}

