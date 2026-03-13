export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'

export default function InfluencerProfile() {
  const router = useRouter()
  const { handle } = router.query
  const slug = handle ? handle.replace('@', '') : null

  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef([])

  const [influencer, setInfluencer] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState('map')
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!slug) return
    async function fetchData() {
      const { data: inf } = await supabase
        .from('influencers')
        .select('*, profiles(full_name, avatar_url, bio)')
        .eq('handle', slug)
        .single()
      if (!inf) { setLoading(false); return }
      setInfluencer(inf)
      const { data: recs } = await supabase
        .from('recommendations')
        .select('*, booking_links(*)')
        .eq('influencer_id', inf.id)
        .order('created_at', { ascending: false })
      setRecommendations(recs || [])
      setLoading(false)
    }
    fetchData()
  }, [slug])

  useEffect(() => {
    if (!mapContainer.current || map.current) return
    import('mapbox-gl').then(mapboxgl => {
      mapboxgl = mapboxgl.default || mapboxgl
      mapboxgl.accessToken = 'pk.eyJ1IjoiZ290aGVyZW5vdyIsImEiOiJjbWxmYXJpYm0wMzByM2lwcGpzNjl4Ymx5In0.lipvyNXWoQmIDCah_0Ss_w'
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [20, 25],
        zoom: 1.8,
        attributionControl: false,
      })
      map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
      map.current.on('load', () => {
        setMapLoaded(true)
        map.current.resize()
      })
    })
  }, [])

  useEffect(() => {
    if (!mapLoaded || recommendations.length === 0) return
    import('mapbox-gl').then(mapboxgl => {
      mapboxgl = mapboxgl.default || mapboxgl
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []
      recommendations.forEach((rec) => {
        if (!rec.latitude || !rec.longitude) return
        const el = document.createElement('div')
        el.style.cssText = `
          width: 32px; height: 32px;
          background: #1a6b7a;
          border: 2px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          transition: all 0.2s;
        `
        const inner = document.createElement('span')
        inner.style.cssText = 'transform: rotate(45deg); font-size: 12px; color: white;'
        inner.textContent = '✦'
        el.appendChild(inner)
        el.addEventListener('mouseenter', () => { el.style.background = 'white'; el.style.transform = 'rotate(-45deg) scale(1.2)' })
        el.addEventListener('mouseleave', () => {
          if (selectedHotel?.id !== rec.id) { el.style.background = '#1a6b7a'; el.style.transform = 'rotate(-45deg) scale(1)' }
        })
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setHTML(`
            <div style="padding:16px;background:#1a6b7a;min-width:180px;">
              <div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.5);margin-bottom:4px;">${rec.city || ''}, ${rec.country}</div>
              <div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:400;margin-bottom:10px;color:white;">${rec.hotel_name}</div>
              <button onclick="document.dispatchEvent(new CustomEvent('openHotel', {detail: '${rec.id}'}))"
                style="width:100%;background:white;color:#1a6b7a;border:none;padding:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:sans-serif;">
                View & Book →
              </button>
            </div>
          `)
        const marker = new mapboxgl.Marker(el)
          .setLngLat([rec.longitude, rec.latitude])
          .setPopup(popup)
          .addTo(map.current)
        el.addEventListener('click', () => {
          setSelectedHotel(rec)
          map.current.flyTo({ center: [rec.longitude, rec.latitude], zoom: 10, duration: 800 })
        })
        markersRef.current.push(marker)
      })
      const handleOpenHotel = (e) => {
        const rec = recommendations.find(r => r.id === e.detail)
        if (rec) { setSelectedHotel(rec); setShowModal(true) }
      }
      document.addEventListener('openHotel', handleOpenHotel)
      return () => document.removeEventListener('openHotel', handleOpenHotel)
    })
  }, [recommendations])

  const openBookingModal = (hotel) => { setSelectedHotel(hotel); setShowModal(true) }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#1a6b7a' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'Playfair Display,serif', fontSize:'24px', color:'white', marginBottom:'8px' }}>Go<em>There</em>Now</div>
        <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', letterSpacing:'2px', textTransform:'uppercase' }}>Loading...</div>
      </div>
    </div>
  )

  if (!influencer) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#1a6b7a' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'48px', marginBottom:'16px' }}>🗺️</div>
        <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:'28px', color:'white', marginBottom:'8px' }}>Creator not found</h1>
        <p style={{ color:'rgba(255,255,255,0.4)', marginBottom:'24px' }}>This profile doesn't exist yet.</p>
        <Link href="/" style={{ color:'white', fontSize:'13px', textDecoration:'none', borderBottom:'1px solid rgba(255,255,255,0.3)' }}>← Back home</Link>
      </div>
    </div>
  )

  const profile = influencer.profiles

  return (
    <div style={{ background: '#1a6b7a', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <Head>
        <title>{profile?.full_name || influencer.handle} — GoThereNow</title>
        <meta name="description" content={`Travel recommendations by ${profile?.full_name || influencer.handle}.`} />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        .profile-hero { padding: 100px 56px 60px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: flex-end; gap: 40px; }
        .avatar { width: 96px; height: 96px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 36px; background: rgba(26,107,122,0.08); }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .profile-info { flex: 1; }
        .profile-eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(26,107,122,0.45); margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
        .profile-eyebrow::before { content:''; display:block; width:20px; height:1px; background:rgba(255,255,255,0.3); }
        .profile-name { font-family: 'Playfair Display', serif; font-size: clamp(32px, 4vw, 52px); font-weight: 400; color: white; line-height: 1.05; margin-bottom: 10px; }
        .profile-bio { font-size: 14px; color: rgba(26,107,122,0.5); line-height: 1.8; max-width: 480px; margin-bottom: 20px; }
        .profile-stats { display: flex; gap: 40px; }
        .stat-num { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 300; color: white; line-height: 1; }
        .stat-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-top: 3px; }
        .profile-socials { display: flex; gap: 10px; flex-shrink: 0; align-self: flex-start; margin-top: 8px; }
        .social-btn { padding: 9px 18px; border-radius: 100px; font-size: 12px; font-weight: 600; color: white; text-decoration: none; border: 1px solid rgba(255,255,255,0.2); transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .social-btn:hover { background: rgba(26,107,122,0.08); }
        .tabs { display: flex; padding: 0 56px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .tab-btn { padding: 18px 24px; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.4); background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; font-family: 'DM Sans', sans-serif; margin-bottom: -1px; }
        .tab-btn.active { color: white; border-bottom-color: white; }
        .content { padding: 48px 56px; }
        .map-container { border-radius: 4px; overflow: hidden; border: 1px solid rgba(26,107,122,0.12); height: 460px; margin-bottom: 56px; }
        .section-eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(26,107,122,0.45); margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
        .section-eyebrow::before { content:''; display:block; width:20px; height:1px; background:rgba(255,255,255,0.3); }
        .section-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 300; color: white; margin-bottom: 24px; }
        .section-title em { font-style: italic; }
        .hotels-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3px; }
        .hotel-card { position: relative; overflow: hidden; cursor: pointer; aspect-ratio: 4/3; transition: transform 0.3s; }
        .hotel-card:hover { transform: scale(1.01); }
        .hotel-card-bg { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
        .hotel-card:hover .hotel-card-bg { transform: scale(1.06); }
        .hotel-card-gradient { position: absolute; inset: 0; background: linear-gradient(to top, rgba(26,107,122,0.95) 0%, transparent 55%); }
        .hotel-card-teal { position: absolute; inset: 0; background: rgba(10,45,55,0.3); mix-blend-mode: multiply; }
        .hotel-card-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; }
        .hotel-card-loc { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.5); margin-bottom: 4px; }
        .hotel-card-name { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 300; color: white; margin-bottom: 6px; }
        .hotel-card-quote { font-size: 11px; color: rgba(26,107,122,0.45); font-style: italic; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .hotel-card-book { background: #b5654a; color: white; padding: 8px 18px; font-size: 11px; font-weight: 700; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .hotel-card-book:hover { background: #a05540; }
        .hotel-card-latest { position: absolute; top: 16px; left: 16px; background: white; color: #1a6b7a; font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 5px 12px; }
        .modal-overlay { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); }
        .modal { background: #1a6b7a; border: 1px solid rgba(26,107,122,0.15); width: 100%; max-width: 440px; padding: 40px; position: relative; }
        .modal-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; background: rgba(26,107,122,0.08); border: none; cursor: pointer; color: white; font-size: 14px; display: flex; align-items: center; justify-content: center; }
        .modal-loc { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(26,107,122,0.45); margin-bottom: 8px; }
        .modal-name { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 300; color: white; margin-bottom: 20px; }
        .modal-quote { font-size: 14px; color: rgba(255,255,255,0.55); font-style: italic; line-height: 1.8; padding-left: 16px; border-left: 2px solid rgba(255,255,255,0.2); margin-bottom: 28px; }
        .modal-book-label { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 12px; }
        .modal-links { display: flex; flex-direction: column; gap: 8px; }
        .modal-link { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border: 1px solid rgba(26,107,122,0.15); text-decoration: none; color: white; transition: all 0.2s; }
        .modal-link:hover { background: rgba(255,255,255,0.08); }
        .modal-link-name { font-size: 14px; font-weight: 500; }
        .modal-link-note { font-size: 11px; color: rgba(26,107,122,0.4); margin-top: 2px; }
        .modal-disclaimer { text-align: center; font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 20px; line-height: 1.6; }
        .footer { text-align: center; padding: 40px 56px; border-top: 1px solid rgba(255,255,255,0.08); }
        .footer-logo { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 300; color: rgba(26,107,122,0.45); text-decoration: none; display: block; margin-bottom: 8px; }
        .footer-logo em { font-style: italic; }
        .footer-text { font-size: 12px; color: rgba(255,255,255,0.2); }
        @media (max-width: 768px) {
          .profile-hero { padding: 88px 24px 40px; flex-direction: column; align-items: flex-start; gap: 20px; }
          .profile-socials { align-self: auto; }
          .tabs { padding: 0 24px; }
          .content { padding: 32px 24px; }
          .hotels-grid { grid-template-columns: 1fr; }
          .profile-stats { gap: 24px; }
        }
      `}</style>

      <Nav />

      <div className="profile-hero">
        <div className="avatar">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} /> : '✈️'}
        </div>
        <div className="profile-info">
          <div className="profile-eyebrow">@{influencer.handle} · Travel Creator</div>
          <h1 className="profile-name">{profile?.full_name || influencer.handle}</h1>
          {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-stats">
            {[
              { num: recommendations.length, label: 'Stays' },
              { num: influencer.follower_count ? `${(influencer.follower_count/1000).toFixed(0)}K` : '—', label: 'Followers' },
              { num: new Set(recommendations.map(r => r.country)).size, label: 'Countries' },
            ].map((s, i) => (
              <div key={i}>
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="profile-socials">
          {influencer.instagram_url && (
            <a href={influencer.instagram_url} target="_blank" rel="noopener noreferrer" className="social-btn">📸 Instagram</a>
          )}
          {influencer.tiktok_url && (
            <a href={influencer.tiktok_url} target="_blank" rel="noopener noreferrer" className="social-btn">♪ TikTok</a>
          )}
        </div>
      </div>

      <div className="tabs">
        {[{ id: 'map', label: 'Map View' }, { id: 'list', label: 'All Stays' }].map(tab => (
          <button key={tab.id} className={`tab-btn${activeTab === tab.id ? ' active' : ''}`} onClick={() => { setActiveTab(tab.id); if (tab.id === 'map' && map.current) setTimeout(() => map.current.resize(), 50) }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="content">
        {activeTab === 'map' && (
          <div>
            <div className="map-container" ref={mapContainer} />
            {recommendations.length > 0 && (
              <div>
                <div className="section-eyebrow">Recent stays</div>
                <h2 className="section-title">{profile?.full_name?.split(' ')[0]}'s <em>recommendations</em></h2>
                <div className="hotels-grid">
                  {recommendations.slice(0, 4).map((rec, i) => (
                    <HotelCard key={rec.id} rec={rec} index={i} onBook={() => openBookingModal(rec)}
                      onMapFocus={() => { setActiveTab('map'); map.current?.flyTo({ center: [rec.longitude, rec.latitude], zoom: 10, duration: 800 }) }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'list' && (
          <div>
            <div className="section-eyebrow">All stays</div>
            <h2 className="section-title">{recommendations.length} personal <em>recommendations</em></h2>
            {recommendations.length === 0 ? (
              <div style={{ textAlign:'center', padding:'80px 0', color:'rgba(255,255,255,0.3)', fontSize:'14px' }}>No recommendations yet.</div>
            ) : (
              <div className="hotels-grid">
                {recommendations.map((rec, i) => (
                  <HotelCard key={rec.id} rec={rec} index={i} onBook={() => openBookingModal(rec)}
                    onMapFocus={() => { setActiveTab('map'); map.current?.flyTo({ center: [rec.longitude, rec.latitude], zoom: 10, duration: 800 }) }} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && selectedHotel && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            <div className="modal-loc">📍 {[selectedHotel.city, selectedHotel.country].filter(Boolean).join(', ')}</div>
            <h3 className="modal-name">{selectedHotel.hotel_name}</h3>
            {selectedHotel.influencer_quote && <blockquote className="modal-quote">"{selectedHotel.influencer_quote}"</blockquote>}
            <div className="modal-book-label">Book on</div>
            <div className="modal-links">
              {selectedHotel.booking_links?.length > 0 ? (
                selectedHotel.booking_links.map((link, i) => (
                  <a key={i} href={link.affiliate_url} target="_blank" rel="noopener noreferrer" className="modal-link">
                    <div>
                      <div className="modal-link-name">{link.platform}</div>
                      {link.note && <div className="modal-link-note">{link.note}</div>}
                    </div>
                    <span style={{ color:'rgba(255,255,255,0.4)' }}>→</span>
                  </a>
                ))
              ) : (
                <div style={{ textAlign:'center', padding:'20px', color:'rgba(255,255,255,0.3)', fontSize:'13px' }}>Booking links coming soon.</div>
              )}
            </div>
            <p className="modal-disclaimer">🤝 Booking links may earn affiliate commissions that support {profile?.full_name?.split(' ')[0]} — at no extra cost to you.</p>
          </div>
        </div>
      )}

      <footer className="footer">
        <Link href="/" className="footer-logo">Go<em>There</em>Now</Link>
        <div className="footer-text">Travel the world through creators you trust.</div>
      </footer>
    </div>
  )
}

function HotelCard({ rec, index, onBook }) {
  const gradients = [
    'linear-gradient(135deg, #0a2a35, #0d4050)',
    'linear-gradient(135deg, #0a3028, #0d5040)',
    'linear-gradient(135deg, #1a2a3a, #1d4060)',
    'linear-gradient(135deg, #2a1a2a, #3d2040)',
  ]
  return (
    <div className="hotel-card">
      {rec.photo_url ? (
        <img src={rec.photo_url} alt={rec.hotel_name} className="hotel-card-bg" />
      ) : (
        <div style={{ background: gradients[index % gradients.length], width:'100%', height:'100%', position:'absolute', inset:0 }} />
      )}
      <div className="hotel-card-teal" />
      <div className="hotel-card-gradient" />
      {index === 0 && <div className="hotel-card-latest">Latest</div>}
      <div className="hotel-card-info">
        <div className="hotel-card-loc">📍 {[rec.city, rec.country].filter(Boolean).join(', ')}</div>
        <div className="hotel-card-name">{rec.hotel_name}</div>
        {rec.influencer_quote && <div className="hotel-card-quote">"{rec.influencer_quote}"</div>}
        <button className="hotel-card-book" onClick={onBook}>Book Now →</button>
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
