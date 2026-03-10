export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

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

  // Fetch influencer + recommendations
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

  // Init map — dynamically import mapbox to avoid SSR issues
  useEffect(() => {
    if (!mapContainer.current || map.current) return
    import('mapbox-gl').then(mapboxgl => {
      mapboxgl = mapboxgl.default || mapboxgl
      mapboxgl.accessToken = 'pk.eyJ1IjoiZ290aGVyZW5vdyIsImEiOiJjbWxmYXJpYm0wMzByM2lwcGpzNjl4Ymx5In0.lipvyNXWoQmIDCah_0Ss_w'
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [20, 25],
        zoom: 1.8,
        attributionControl: false,
      })
      map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    })
  }, [])

  // Add markers when recommendations load
  useEffect(() => {
    if (!map.current || recommendations.length === 0) return

    import('mapbox-gl').then(mapboxgl => {
      mapboxgl = mapboxgl.default || mapboxgl

      // Clear old markers
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      recommendations.forEach((rec) => {
        if (!rec.latitude || !rec.longitude) return

        const el = document.createElement('div')
        el.style.cssText = `
          width: 36px; height: 36px;
          background: #1C1410;
          border: 2.5px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(28,20,16,0.3);
          transition: all 0.2s;
        `
        const inner = document.createElement('span')
        inner.style.cssText = 'transform: rotate(45deg); font-size: 14px;'
        inner.textContent = '📍'
        el.appendChild(inner)
        el.addEventListener('mouseenter', () => { el.style.background = '#C4622D'; el.style.transform = 'rotate(-45deg) scale(1.2)' })
        el.addEventListener('mouseleave', () => {
          if (selectedHotel?.id !== rec.id) { el.style.background = '#1C1410'; el.style.transform = 'rotate(-45deg) scale(1)' }
        })

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setHTML(`
            <div style="padding:16px;">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#C4622D;font-weight:600;margin-bottom:3px;">${rec.city || ''}, ${rec.country}</div>
              <div style="font-family:'Georgia',serif;font-size:15px;font-weight:600;margin-bottom:6px;color:#1C1410;">${rec.hotel_name}</div>
              <button onclick="document.dispatchEvent(new CustomEvent('openHotel', {detail: '${rec.id}'}))"
                style="width:100%;background:#C4622D;color:white;border:none;padding:9px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:sans-serif;">
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

  const openBookingModal = (hotel) => {
    setSelectedHotel(hotel)
    setShowModal(true)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#FAF7F2' }}>
      <div className="text-center">
        <div className="font-display text-2xl text-espresso mb-2">Go<span className="text-terracotta">There</span>Now</div>
        <div className="text-sm text-muted">Loading...</div>
      </div>
    </div>
  )

  if (!influencer) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#FAF7F2' }}>
      <div className="text-center">
        <div className="text-4xl mb-4">🗺️</div>
        <h1 className="font-display text-2xl text-espresso mb-2">Creator not found</h1>
        <p className="text-muted mb-6">This profile doesn't exist yet.</p>
        <Link href="/" className="text-sm font-medium text-terracotta hover:underline">← Back home</Link>
      </div>
    </div>
  )

  const profile = influencer.profiles

  return (
    <>
      <Head>
        <title>{profile?.full_name || influencer.handle} — GoThereNow</title>
        <meta name="description" content={`Travel recommendations by ${profile?.full_name || influencer.handle}. Book the hotels they've personally stayed at.`} />
      </Head>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
        style={{ background: 'rgba(250,247,242,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(196,98,45,0.1)' }}>
        <Link href="/" className="font-display text-xl text-espresso">Go<span className="text-terracotta">There</span>Now</Link>
        <Link href="/signup" className="text-xs font-semibold text-white bg-terracotta px-4 py-2 rounded-full hover:bg-terracotta-light transition-colors">
          Join free
        </Link>
      </nav>

      {/* PROFILE HERO */}
      <div className="pt-14" style={{ background: '#1C1410' }}>
        <div className="relative overflow-hidden">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=1400&q=60)',
            backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.18
          }} />
          <div className="relative z-10 max-w-4xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl border-2 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #C4622D, #D4A853)', borderColor: '#C4622D' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} className="w-full h-full object-cover" />
                  : '✈️'}
              </div>
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white border"
                style={{ background: '#C4622D', borderColor: '#1C1410', fontSize: '9px' }}>✓</div>
            </div>

            <div className="flex-1">
              <h1 className="font-display text-3xl text-white mb-1">{profile?.full_name || influencer.handle}</h1>
              <div className="text-sm mb-2" style={{ color: '#E8845A' }}>@{influencer.handle} · Travel Creator</div>
              {profile?.bio && <p className="text-sm mb-4 max-w-md leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{profile.bio}</p>}
              <div className="flex gap-8">
                {[
                  { num: recommendations.length, label: 'Stays' },
                  { num: influencer.follower_count ? `${(influencer.follower_count/1000).toFixed(0)}K` : '—', label: 'Followers' },
                  { num: new Set(recommendations.map(r => r.country)).size, label: 'Countries' },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="font-display text-xl text-white">{s.num}</div>
                    <div className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 self-start md:self-auto mt-2 md:mt-0">
              {influencer.instagram_url && (
                <a href={influencer.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
                  📸 Instagram
                </a>
              )}
              {influencer.tiktok_url && (
                <a href={influencer.tiktok_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold text-white"
                  style={{ background: '#010101' }}>
                  ♪ TikTok
                </a>
              )}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="max-w-4xl mx-auto px-6 flex gap-0">
            {[
              { id: 'map', label: '🗺 Map View' },
              { id: 'list', label: '🏨 All Stays' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="px-6 py-4 text-xs font-semibold uppercase tracking-widest transition-all"
                style={{
                  color: activeTab === tab.id ? '#E8845A' : 'rgba(255,255,255,0.35)',
                  borderBottom: activeTab === tab.id ? '2px solid #C4622D' : '2px solid transparent',
                  background: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* MAP */}
        <div className={activeTab === 'map' ? '' : 'hidden'}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl text-espresso">{profile?.full_name?.split(' ')[0]}'s Recommendations</h2>
              <p className="text-sm text-muted mt-1">Click any pin to see details & book</p>
            </div>
            <div className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: '#F5EFE6', color: '#8B7D72' }}>
              {recommendations.length} stays
            </div>
          </div>

          <div ref={mapContainer} style={{ height: '440px', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(196,98,45,0.15)' }} />

          {recommendations.length > 0 && (
            <div className="mt-8">
              <h3 className="font-display text-xl text-espresso mb-4">Recent Stays</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.slice(0, 4).map((rec, i) => (
                  <HotelCard key={rec.id} rec={rec} index={i} onBook={() => openBookingModal(rec)}
                    onMapFocus={() => {
                      setActiveTab('map')
                      map.current?.flyTo({ center: [rec.longitude, rec.latitude], zoom: 10, duration: 800 })
                    }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ALL STAYS LIST */}
        <div className={activeTab === 'list' ? '' : 'hidden'}>
          <div className="mb-6">
            <h2 className="font-display text-2xl text-espresso">All Stays</h2>
            <p className="text-sm text-muted mt-1">{recommendations.length} personal recommendations</p>
          </div>
          {recommendations.length === 0 ? (
            <div className="text-center py-16 text-muted">No recommendations yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec, i) => (
                <HotelCard key={rec.id} rec={rec} index={i} onBook={() => openBookingModal(rec)}
                  onMapFocus={() => {
                    setActiveTab('map')
                    map.current?.flyTo({ center: [rec.longitude, rec.latitude], zoom: 10, duration: 800 })
                  }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOOKING MODAL */}
      {showModal && selectedHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(28,20,16,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="w-full max-w-md rounded-3xl p-8 relative" style={{ background: 'white' }}>
            <button onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: '#F5EFE6', border: 'none', cursor: 'pointer' }}>✕</button>

            <div className="text-xs uppercase tracking-widest font-semibold text-terracotta mb-1">
              {[selectedHotel.city, selectedHotel.country].filter(Boolean).join(', ')}
            </div>
            <h3 className="font-display text-2xl text-espresso mb-4">{selectedHotel.hotel_name}</h3>

            {selectedHotel.influencer_quote && (
              <blockquote className="text-sm italic text-muted mb-6 pl-4 border-l-2 border-terracotta leading-relaxed">
                "{selectedHotel.influencer_quote}"
              </blockquote>
            )}

            <div className="text-xs uppercase tracking-widest font-semibold text-muted mb-3">Book on</div>
            <div className="flex flex-col gap-3">
              {selectedHotel.booking_links?.length > 0 ? (
                selectedHotel.booking_links.map((link, i) => (
                  <a key={i} href={link.affiliate_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02]"
                    style={{ border: '1px solid rgba(28,20,16,0.1)', textDecoration: 'none', color: '#1C1410' }}>
                    <div>
                      <div className="font-semibold text-sm">{link.platform}</div>
                      {link.note && <div className="text-xs text-muted mt-0.5">{link.note}</div>}
                    </div>
                    <span className="text-muted text-sm">→</span>
                  </a>
                ))
              ) : (
                <div className="text-sm text-muted text-center py-4">Booking links coming soon.</div>
              )}
            </div>

            <p className="text-center text-xs text-muted mt-5 leading-relaxed">
              🤝 Booking links may earn affiliate commissions that support {profile?.full_name?.split(' ')[0]} — at no extra cost to you.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-8 text-xs text-muted" style={{ borderTop: '1px solid rgba(28,20,16,0.08)' }}>
        <Link href="/" className="font-display text-base text-espresso">Go<span className="text-terracotta">There</span>Now</Link>
        <p className="mt-1">Travel the world through creators you trust.</p>
      </div>
    </>
  )
}

function HotelCard({ rec, index, onBook, onMapFocus }) {
  const gradients = [
    'linear-gradient(135deg, #1a3a4a, #2d6a8a)',
    'linear-gradient(135deg, #3a2a1a, #8a6a2d)',
    'linear-gradient(135deg, #1a3a2a, #2d8a5a)',
    'linear-gradient(135deg, #2a1a3a, #6a2d8a)',
  ]
  const emojis = ['🏯', '🏜', '🌿', '🌊', '🏔', '🌴', '🏛', '🗼']

  return (
    <div className="rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      style={{ background: 'white', border: '1px solid rgba(28,20,16,0.07)' }}>
      <div style={{ height: '140px', background: gradients[index % gradients.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px', position: 'relative' }}>
        {rec.photo_url
          ? <img src={rec.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          : emojis[index % emojis.length]}
        {index === 0 && (
          <div className="absolute top-3 left-3 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide"
            style={{ background: '#C4622D' }}>Latest</div>
        )}
      </div>

      <div className="p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-terracotta mb-1">
          📍 {[rec.city, rec.country].filter(Boolean).join(', ')}
        </div>
        <h3 className="font-display text-lg text-espresso mb-1">{rec.hotel_name}</h3>
        {rec.star_rating && (
          <div className="text-xs mb-2" style={{ color: '#D4A853' }}>{'★'.repeat(rec.star_rating)}</div>
        )}
        {rec.influencer_quote && (
          <p className="text-xs text-muted italic leading-relaxed mb-3 line-clamp-2">"{rec.influencer_quote}"</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-1 flex-wrap">
            {rec.booking_links?.map((l, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-md" style={{ background: '#F5EFE6', color: '#8B7D72' }}>{l.platform}</span>
            ))}
          </div>
          <button onClick={onBook}
            className="text-xs font-semibold text-white px-4 py-2 rounded-full"
            style={{ background: '#1C1410', fontFamily: 'DM Sans, sans-serif', border: 'none', cursor: 'pointer' }}>
            Book Now →
          </button>
        </div>
      </div>
    </div>
  )
}
export async function getServerSideProps() {
  return { props: {} }
}

