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
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [activeTab, setActiveTab] = useState('map')

  // Fetch data
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

  // Init map once loading is done
  useEffect(() => {
    if (loading) return
    if (map.current) return

    const tryInit = () => {
      if (!mapContainer.current) return
      import('mapbox-gl').then(mod => {
        const mapboxgl = mod.default || mod
        mapboxgl.accessToken = 'pk.eyJ1IjoiZ290aGVyZW5vdyIsImEiOiJjbWxmYXJpYm0wMzByM2lwcGpzNjl4Ymx5In0.lipvyNXWoQmIDCah_0Ss_w'

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [15, 20],
          zoom: 0.65,
        projection: 'mercator',
        renderWorldCopies: false,
          attributionControl: false,
        })

        map.current.setMinZoom(0.65)
        map.current.setMaxBounds([[-200, -85], [200, 85]])
        map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

        map.current.on('load', () => {
          map.current.resize()
          recommendations.forEach(rec => {
            if (!rec.latitude || !rec.longitude) return
            const el = document.createElement('div')
            el.style.cssText = `
              width: 28px; height: 28px;
              background: #1a6b7a;
              border: 2px solid white;
              border-radius: 50%;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            `
            el.addEventListener('click', () => {
              setSelectedHotel(rec)
              setShowModal(true)
              map.current.flyTo({ center: [rec.longitude, rec.latitude], zoom: map.current.getZoom(), duration: 500 })
            })
            new mapboxgl.Marker(el)
              .setLngLat([rec.longitude, rec.latitude])
              .addTo(map.current)
          })
        })
      })
    }

    setTimeout(tryInit, 200)
  }, [loading])

  // Resize when switching to map tab
  useEffect(() => {
    if (activeTab === 'map' && map.current) {
      setTimeout(() => map.current.resize(), 50)
    }
  }, [activeTab])

  const openBookingModal = (hotel) => { setSelectedHotel(hotel); setShowModal(true) }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f7f5f2' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'Playfair Display,serif', fontSize:'24px', color:'#1a6b7a', marginBottom:'8px' }}>GoThereNow</div>
        <div style={{ fontSize:'13px', color:'rgba(26,107,122,0.4)', letterSpacing:'2px', textTransform:'uppercase' }}>Loading...</div>
      </div>
    </div>
  )

  if (!influencer) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f7f5f2' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'48px', marginBottom:'16px' }}>🗺️</div>
        <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:'28px', color:'#1a6b7a', marginBottom:'8px' }}>Creator not found</h1>
        <p style={{ color:'rgba(26,107,122,0.5)', marginBottom:'24px' }}>This profile doesn't exist yet.</p>
        <Link href="/" style={{ color:'#1a6b7a', fontSize:'13px', textDecoration:'none', borderBottom:'1px solid rgba(26,107,122,0.3)' }}>← Back home</Link>
      </div>
    </div>
  )

  const profile = influencer.profiles

  return (
    <div style={{ background:'#f7f5f2', minHeight:'100vh', fontFamily:'DM Sans, sans-serif' }}>
      <Head>
        <title>{profile?.full_name || influencer.handle} — GoThereNow</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: #f7f5f2; }

        .profile-hero { padding: 80px 56px 16px; border-bottom: 1px solid rgba(26,107,122,0.1); display: flex; align-items: center; gap: 24px; }
        .avatar { width: 64px; height: 64px; border-radius: 50%; border: 2px solid #1a6b7a; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 24px; background: rgba(26,107,122,0.08); }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .profile-info { flex: 1; }
        .profile-eyebrow { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 6px; display: block; }
        .profile-name { font-family: 'Playfair Display', serif; font-size: clamp(20px, 3vw, 32px); font-weight: 700; color: #1a6b7a; line-height: 1.05; margin-bottom: 6px; }
        .profile-bio { font-size: 12px; color: rgba(26,107,122,0.6); line-height: 1.6; max-width: 480px; margin-bottom: 12px; }
        .profile-stats { display: flex; gap: 32px; }
        .stat-num { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1a6b7a; line-height: 1; }
        .stat-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.5); margin-top: 2px; font-weight: 600; }
        .profile-socials { display: flex; gap: 10px; flex-shrink: 0; align-self: flex-start; margin-top: 8px; }
        .social-btn { padding: 9px 18px; border-radius: 100px; font-size: 12px; font-weight: 600; color: #1a6b7a; text-decoration: none; border: 1px solid rgba(26,107,122,0.25); transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .social-btn:hover { background: rgba(26,107,122,0.06); }

        .tabs { display: flex; padding: 0 56px; border-bottom: 1px solid rgba(26,107,122,0.12); background: #f7f5f2; }
        .tab-btn { padding: 18px 24px; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.35); background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; font-family: 'DM Sans', sans-serif; margin-bottom: -1px; }
        .tab-btn.active { color: #1a6b7a; border-bottom-color: #1a6b7a; }

        .content { padding: 24px 56px; }
        .map-container { border-radius: 16px; overflow: hidden; border: 1px solid rgba(26,107,122,0.15); width: 100%; aspect-ratio: 2/1.4; box-shadow: 0 4px 20px rgba(26,107,122,0.1); }

        .section-eyebrow { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #b5654a; font-weight: 600; margin-bottom: 6px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: #1a6b7a; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 1px; }
        .section-title em { text-transform: none; font-weight: 300; }

        .hotels-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .hotel-card { position: relative; overflow: hidden; cursor: pointer; border-radius: 16px; aspect-ratio: 4/3; transition: transform 0.3s; box-shadow: 0 4px 20px rgba(26,107,122,0.1); background: white; }
        .hotel-card:hover { transform: scale(1.01); }
        .hotel-card-bg { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
        .hotel-card:hover .hotel-card-bg { transform: scale(1.06); }
        .hotel-card-gradient { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,40,50,0.92) 0%, transparent 55%); border-radius: 16px; }
        .hotel-card-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; }
        .hotel-card-nophoto { width: 100%; height: 100%; background: white; display: flex; flex-direction: column; justify-content: flex-end; padding: 20px; }
        .hotel-card-loc { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 4px; }
        .hotel-card-loc-dark { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.5); margin-bottom: 4px; }
        .hotel-card-name { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 400; color: white; margin-bottom: 8px; }
        .hotel-card-name-dark { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 400; color: #1a6b7a; margin-bottom: 8px; }
        .hotel-card-book { background: #b5654a; color: white; padding: 8px 18px; font-size: 11px; font-weight: 700; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; border-radius: 6px; }
        .hotel-card-book:hover { background: #a05540; }
        .hotel-card-latest { position: absolute; top: 16px; left: 16px; background: white; color: #1a6b7a; font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 5px 12px; border-radius: 4px; }

        .modal-overlay { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); }
        .modal { background: #f7f5f2; border: 1px solid rgba(26,107,122,0.15); width: 100%; max-width: 440px; padding: 40px; position: relative; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
        .modal-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; background: rgba(26,107,122,0.08); border: none; cursor: pointer; color: #1a6b7a; font-size: 14px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
        .modal-loc { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #b5654a; font-weight: 600; margin-bottom: 8px; }
        .modal-name { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #1a6b7a; margin-bottom: 20px; }
        .modal-quote { font-size: 14px; color: rgba(26,107,122,0.6); line-height: 1.8; padding-left: 16px; border-left: 2px solid rgba(26,107,122,0.2); margin-bottom: 28px; }
        .modal-book-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.45); font-weight: 700; margin-bottom: 12px; }
        .modal-links { display: flex; flex-direction: column; gap: 8px; }
        .modal-link { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border: 1px solid rgba(26,107,122,0.15); text-decoration: none; color: #1a6b7a; transition: all 0.2s; border-radius: 10px; background: white; }
        .modal-link:hover { background: rgba(26,107,122,0.04); border-color: rgba(26,107,122,0.3); }
        .modal-link-name { font-size: 14px; font-weight: 600; }
        .modal-link-note { font-size: 11px; color: rgba(26,107,122,0.45); margin-top: 2px; }
        .modal-disclaimer { text-align: center; font-size: 11px; color: rgba(26,107,122,0.3); margin-top: 20px; line-height: 1.6; }

        .footer { text-align: center; padding: 40px 56px; border-top: 1px solid rgba(26,107,122,0.1); }
        .footer-logo { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1a6b7a; text-decoration: none; display: block; margin-bottom: 8px; }
        .footer-logo em { font-weight: 300; color: #b5654a; }
        .footer-text { font-size: 12px; color: rgba(26,107,122,0.35); }

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

      {/* PROFILE HERO */}
      <div className="profile-hero">
        <div className="avatar">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} /> : '✈️'}
        </div>
        <div className="profile-info">
          <div className="profile-eyebrow">creator</div>
          <h1 className="profile-name">{profile?.full_name || influencer.handle}</h1>
          {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-stats">
            <div>
              <div className="stat-num">{recommendations.length}</div>
              <div className="stat-label">Stays</div>
            </div>
            <div>
              <div className="stat-num">{new Set(recommendations.map(r => r.country)).size}</div>
              <div className="stat-label">Countries</div>
            </div>
            {influencer.follower_count > 0 && (
              <div>
                <div className="stat-num">{(influencer.follower_count / 1000).toFixed(0)}k</div>
                <div className="stat-label">Followers</div>
              </div>
            )}
          </div>
        </div>
        <div className="profile-socials">
          {influencer.instagram_url && (
            <a href={influencer.instagram_url} target="_blank" rel="noopener noreferrer" className="social-btn">📸 Instagram</a>
          )}
          {influencer.tiktok_url && (
            <a href={influencer.tiktok_url} target="_blank" rel="noopener noreferrer" className="social-btn">🎵 TikTok</a>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        {[{ id: 'map', label: 'Map View' }, { id: 'list', label: 'All Stays' }].map(tab => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="content">

        {/* MAP — always in DOM so map doesn't get destroyed */}
        <div style={{ display: activeTab === 'map' ? 'flex' : 'none', gap: '32px', alignItems: 'flex-start' }}>
          <div style={{ width: '55%', flexShrink: 0 }}>
            <div className="map-container" ref={mapContainer} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="section-eyebrow">recent stays</div>
            <h2 className="section-title" style={{ fontSize: '20px', marginBottom: '16px' }}>{profile?.full_name?.split(' ')[0]}'s stays</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recommendations.slice(0, 5).map((rec, i) => (
                <div key={rec.id} onClick={() => openBookingModal(rec)} style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', border: '1px solid rgba(26,107,122,0.1)', boxShadow: '0 2px 8px rgba(26,107,122,0.06)', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(26,107,122,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(26,107,122,0.1)'}
                >
                  <div style={{ fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: '#b5654a', marginBottom: '4px' }}>📍 {[rec.city, rec.country].filter(Boolean).join(', ')}</div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 600, color: '#1a6b7a', marginBottom: '6px' }}>{rec.hotel_name}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#b5654a' }}>Book Now →</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LIST */}
        {activeTab === 'list' && (
          <div>
            <div className="section-eyebrow">all stays</div>
            <h2 className="section-title">{recommendations.length} personal recommendations</h2>
            {recommendations.length === 0 ? (
              <div style={{ textAlign:'center', padding:'80px 0', color:'rgba(26,107,122,0.3)', fontSize:'14px' }}>No recommendations yet.</div>
            ) : (
              <div className="hotels-grid">
                {recommendations.map((rec, i) => (
                  <HotelCard key={rec.id} rec={rec} index={i} onBook={() => openBookingModal(rec)} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* BOOKING MODAL */}
      {showModal && selectedHotel && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            <div className="modal-loc">📍 {[selectedHotel.city, selectedHotel.country].filter(Boolean).join(', ')}</div>
            <h3 className="modal-name">{selectedHotel.hotel_name}</h3>
            {selectedHotel.influencer_quote && (
              <div className="modal-quote">"{selectedHotel.influencer_quote}"</div>
            )}
            <div className="modal-book-label">Book on</div>
            <div className="modal-links">
              {selectedHotel.booking_links?.length > 0 ? (
                selectedHotel.booking_links.map(link => (
                  <a key={link.id} href={link.affiliate_url} target="_blank" rel="noopener noreferrer" className="modal-link">
                    <div>
                      <div className="modal-link-name">{link.platform}</div>
                      {link.note && <div className="modal-link-note">{link.note}</div>}
                    </div>
                    <span>→</span>
                  </a>
                ))
              ) : (
                <div style={{ textAlign:'center', padding:'20px', color:'rgba(26,107,122,0.4)', fontSize:'13px' }}>Booking links coming soon.</div>
              )}
            </div>
            <div className="modal-disclaimer">Links may be affiliate links. Prices shown are indicative.</div>
          </div>
        </div>
      )}

      <footer className="footer">
        <Link href="/" className="footer-logo">GoThereNow</Link>
        <div className="footer-text">Travel the world through creators you trust.</div>
      </footer>

    </div>
  )
}

function HotelCard({ rec, index, onBook }) {
  return (
    <div className="hotel-card" onClick={onBook}>
      {index === 0 && <div className="hotel-card-latest">Latest</div>}
      {rec.photo_url ? (
        <>
          <img src={rec.photo_url} alt={rec.hotel_name} className="hotel-card-bg" />
          <div className="hotel-card-gradient" />
          <div className="hotel-card-info">
            <div className="hotel-card-loc">📍 {[rec.city, rec.country].filter(Boolean).join(', ')}</div>
            <div className="hotel-card-name">{rec.hotel_name}</div>
            <button className="hotel-card-book" onClick={e => { e.stopPropagation(); onBook() }}>Book Now →</button>
          </div>
        </>
      ) : (
        <div className="hotel-card-nophoto">
          <div className="hotel-card-loc-dark">📍 {[rec.city, rec.country].filter(Boolean).join(', ')}</div>
          <div className="hotel-card-name-dark">{rec.hotel_name}</div>
          <button className="hotel-card-book" onClick={e => { e.stopPropagation(); onBook() }}>Book Now →</button>
        </div>
      )}
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
