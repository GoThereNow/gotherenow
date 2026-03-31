export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'

const EXPEDIA_AFFILIATE = 'xkGKaCc'
function buildExpediaUrl(hotelName, city, country) {
  const destination = [hotelName, city, country].filter(Boolean).join(', ')
  return `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(hotelName)}&q=${encodeURIComponent(destination)}&affcid=${EXPEDIA_AFFILIATE}`
}

export default function Feed() {
  const router = useRouter()
  const mapContainer = useRef(null)
  const map = useRef(null)

  const [currentUser, setCurrentUser] = useState(null)
  const [stays, setStays] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLikes, setUserLikes] = useState({})
  const [likes, setLikes] = useState({})
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [hasFollows, setHasFollows] = useState(false)
  const [filterCountry, setFilterCountry] = useState('all')
  const [countries, setCountries] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchFeed() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setCurrentUser(session.user)

      const { data: follows } = await supabase
        .from('follows').select('influencer_id').eq('follower_id', session.user.id)

      if (!follows || follows.length === 0) { setHasFollows(false); setLoading(false); return }
      setHasFollows(true)

      const influencerIds = follows.map(f => f.influencer_id)
      const { data: recs } = await supabase
        .from('recommendations')
        .select('*, booking_links(*), influencers(id, handle, profiles(full_name, avatar_url))')
        .in('influencer_id', influencerIds)
        .order('created_at', { ascending: false })
        .limit(40)

      const data = recs || []
      setStays(data)
      setFiltered(data)
      const uniqueCountries = [...new Set(data.map(r => r.country).filter(Boolean))].sort()
      setCountries(uniqueCountries)

      if (data.length > 0) {
        const recIds = data.map(r => r.id)
        const { data: likesData } = await supabase
          .from('likes').select('recommendation_id, user_id').in('recommendation_id', recIds)
        const likeCounts = {}, userLikeMap = {}
        recIds.forEach(id => { likeCounts[id] = 0; userLikeMap[id] = false })
        likesData?.forEach(l => {
          likeCounts[l.recommendation_id] = (likeCounts[l.recommendation_id] || 0) + 1
          if (l.user_id === session.user.id) userLikeMap[l.recommendation_id] = true
        })
        setLikes(likeCounts)
        setUserLikes(userLikeMap)
      }
      setLoading(false)
    }
    fetchFeed()
  }, [])

  // Filter + search
  useEffect(() => {
    let result = stays
    if (filterCountry !== 'all') {
      result = result.filter(s => s.country === filterCountry)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.hotel_name?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.country?.toLowerCase().includes(q) ||
        s.influencers?.handle?.toLowerCase().includes(q) ||
        s.influencers?.profiles?.full_name?.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [filterCountry, searchQuery, stays])

  // Init map
  useEffect(() => {
    if (loading || !filtered.length) return
    if (map.current) {
      // Update markers on filter change
      return
    }
    setTimeout(() => {
      if (!mapContainer.current) return
      import('mapbox-gl').then(mod => {
        const mapboxgl = mod.default || mod
        mapboxgl.accessToken = 'pk.eyJ1IjoiZ290aGVyZW5vdyIsImEiOiJjbWxmYXJpYm0wMzByM2lwcGpzNjl4Ymx5In0.lipvyNXWoQmIDCah_0Ss_w'
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [15, 20], zoom: 0.65,
          projection: 'mercator',
          renderWorldCopies: false,
          attributionControl: false,
          cooperativeGestures: true,
        })
        map.current.setMinZoom(0.65)
        map.current.setMaxBounds([[-200, -85], [200, 85]])
        map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
        map.current.on('load', () => {
          map.current.resize()
          stays.forEach(stay => {
            if (!stay.latitude || !stay.longitude) return
            const el = document.createElement('div')
            el.style.cssText = 'width:24px;height:24px;background:#1a6b7a;border:2px solid white;border-radius:50%;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);z-index:2;'
            const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 15, className: 'hover-popup' })
              .setLngLat([stay.longitude, stay.latitude])
              .setHTML(
                '<div style="font-family:DM Sans,sans-serif;width:200px;display:flex;border-radius:10px;overflow:hidden;">' +
                (stay.photo_url ? '<div style="width:70px;flex-shrink:0;background:url(' + stay.photo_url + ') center/cover;"></div>' : '') +
                '<div style="padding:8px 10px;background:white;flex:1;">' +
                '<div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#b5654a;margin-bottom:2px">' + ([stay.city, stay.country].filter(Boolean).join(', ')) + '</div>' +
                '<div style="font-size:12px;font-weight:700;color:#1a6b7a;line-height:1.3">' + stay.hotel_name + '</div>' +
                (stay.star_rating ? '<div style="font-size:11px;color:#b5654a;margin-top:2px">' + '★'.repeat(stay.star_rating) + '</div>' : '') +
                '</div></div>'
              )
            el.addEventListener('mouseenter', () => popup.addTo(map.current))
            el.addEventListener('mouseleave', () => popup.remove())
            el.addEventListener('click', () => { popup.remove(); setSelectedHotel(stay); setShowModal(true) })
            new mapboxgl.Marker(el).setLngLat([stay.longitude, stay.latitude]).addTo(map.current)
          })
        })
      })
    }, 200)
  }, [loading, stays])

  const toggleLike = async (recId) => {
    const already = userLikes[recId]
    setUserLikes(prev => ({ ...prev, [recId]: !already }))
    setLikes(prev => ({ ...prev, [recId]: (prev[recId] || 0) + (already ? -1 : 1) }))
    if (already) {
      await supabase.from('likes').delete().eq('user_id', currentUser.id).eq('recommendation_id', recId)
    } else {
      await supabase.from('likes').insert({ user_id: currentUser.id, recommendation_id: recId })
    }
  }

  return (
    <div style={{ background: '#f7f5f2', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <Head>
        <title>Following — GoThereNow</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f7f5f2; font-family: 'DM Sans', sans-serif; }

        .profile-hero { padding: 80px 56px 16px; border-bottom: 1px solid rgba(26,107,122,0.1); display: flex; align-items: center; gap: 24px; }
        .profile-info { flex: 1; }
        .profile-eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 4px; display: block; }
        .profile-name { font-family: 'Playfair Display', serif; font-size: clamp(20px, 3vw, 32px); font-weight: 700; color: #1a6b7a; line-height: 1.05; margin-bottom: 6px; }
        .profile-bio { font-size: 12px; color: rgba(26,107,122,0.6); line-height: 1.6; max-width: 480px; margin-bottom: 12px; }
        .profile-stats { display: flex; gap: 32px; }
        .stat-num { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1a6b7a; line-height: 1; }
        .stat-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.5); margin-top: 2px; font-weight: 600; }

        .tabs { display: flex; align-items: center; justify-content: space-between; padding: 0 56px; border-bottom: 1px solid rgba(26,107,122,0.12); background: #f7f5f2; }
        .tabs-left { display: flex; }
        .tab-btn { padding: 18px 24px; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.35); background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; font-family: 'DM Sans', sans-serif; margin-bottom: -1px; }
        .tab-btn.active { color: #1a6b7a; border-bottom-color: #1a6b7a; }
        .filter-select { font-size: 12px; font-family: 'DM Sans', sans-serif; color: #1a6b7a; background: white; border: 1px solid rgba(26,107,122,0.2); padding: 7px 14px; border-radius: 100px; outline: none; cursor: pointer; font-weight: 600; }

        .content { padding: 32px 56px; }
        .feed-map-container { border-radius: 16px; overflow: hidden; border: 1px solid rgba(26,107,122,0.15); aspect-ratio: 2/1.4; box-shadow: 0 4px 20px rgba(26,107,122,0.1); }
        .hover-popup { z-index: 999 !important; }
        .hover-popup .mapboxgl-popup-content { z-index: 999 !important; padding: 0; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .section-eyebrow { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 6px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #1a6b7a; margin-bottom: 14px; }
        .feed-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }

        .empty-state { text-align: center; padding: 80px 0; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-title { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #1a6b7a; margin-bottom: 8px; }
        .empty-sub { font-size: 14px; color: rgba(26,107,122,0.5); margin-bottom: 24px; line-height: 1.6; }
        .explore-btn { background: #1a6b7a; color: white; padding: 12px 28px; border-radius: 100px; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block; }

        .modal-overlay { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); }
        .modal { background: #f7f5f2; width: 100%; max-width: 440px; position: relative; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden; }
        .modal-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; background: rgba(26,107,122,0.08); border: none; cursor: pointer; color: #1a6b7a; font-size: 14px; display: flex; align-items: center; justify-content: center; border-radius: 50%; z-index: 10; }
        .modal-loc { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 8px; }
        .modal-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #1a6b7a; margin-bottom: 14px; }
        .modal-link { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; border: 1px solid rgba(26,107,122,0.15); text-decoration: none; color: #1a6b7a; border-radius: 10px; background: white; margin-bottom: 8px; }
        .modal-link:hover { background: rgba(26,107,122,0.04); }

        @media (max-width: 768px) {
          .profile-hero { padding: 80px 20px 16px; flex-direction: column; align-items: flex-start; gap: 14px; }
          .tabs { padding: 0 20px; }
          .tab-btn { padding: 14px 16px; font-size: 10px; }
          .content { padding: 20px; }
          .profile-stats { gap: 16px; }
          .feed-side-by-side { flex-direction: column !important; }
          .feed-map-side { width: 100% !important; }
          .feed-map-container { aspect-ratio: 4/3; }
        }
        @media (max-width: 480px) {
          .profile-name { font-size: 22px; }
          .feed-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <Nav />

      {/* HEADER — exact same as creator page */}
      <div className="profile-hero">
        <div style={{width:64, height:64, borderRadius:'50%', background:'rgba(26,107,122,0.08)', border:'2px solid #1a6b7a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0}}>✈️</div>
        <div className="profile-info">
          <span className="profile-eyebrow">following</span>
          <h1 className="profile-name">Your Feed</h1>
          <p className="profile-bio">Hotels recommended by the creators you follow.</p>
          <div className="profile-stats">
            <div><div className="stat-num">{stays.length}</div><div className="stat-label">Stays</div></div>
            <div><div className="stat-num">{new Set(stays.map(r => r.country)).size}</div><div className="stat-label">Countries</div></div>
          </div>
        </div>
      </div>

      {/* TABS + FILTER */}
      <div className="tabs">
        <div className="tabs-left">
          <button className="tab-btn active">Stays</button>
        </div>
        <div style={{display:'flex', gap:'10px', alignItems:'center', padding:'8px 0'}}>
          <div style={{position:'relative'}}>
            <input
              type="text"
              placeholder="Search hotels, cities..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{fontSize:'12px', fontFamily:'DM Sans, sans-serif', color:'#1a6b7a', background:'white', border:'1px solid rgba(26,107,122,0.2)', padding:'7px 14px 7px 30px', borderRadius:'100px', outline:'none', width:'200px'}}
            />
            <span style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:'rgba(26,107,122,0.4)'}}>🔍</span>
          </div>
          {countries.length > 0 && (
            <select className="filter-select" value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
              <option value="all">All countries</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="content">
        {loading ? (
          <div style={{textAlign:'center', padding:'60px 0', color:'rgba(26,107,122,0.4)'}}>Loading your feed...</div>
        ) : !hasFollows ? (
          <div className="empty-state">
            <div className="empty-icon">✈️</div>
            <div className="empty-title">Your feed is empty</div>
            <div className="empty-sub">Follow creators to see their hotel recommendations here.</div>
            <Link href="/explore" className="explore-btn">Explore creators →</Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏨</div>
            <div className="empty-title">Nothing yet</div>
            <div className="empty-sub">The creators you follow haven't added any stays yet.</div>
            <Link href="/explore" className="explore-btn">Discover more creators →</Link>
          </div>
        ) : (
          <div className="feed-side-by-side" style={{display:'flex', gap:'24px', alignItems:'flex-start'}}>
            <div className="feed-map-side" style={{width:'50%', flexShrink:0}}>
              <div className="feed-map-container" ref={mapContainer} />
            </div>
            <div style={{flex:1, minWidth:0, maxHeight:'500px', overflowY:'auto'}}>
              <div className="section-eyebrow">from people you follow</div>
              <h2 className="section-title">Recent stays</h2>
              <div className="feed-grid">
                {filtered.map(stay => (
                  <div key={stay.id} onClick={() => { setSelectedHotel(stay); setShowModal(true) }}
                    style={{background:'white', borderRadius:'12px', padding:'12px 14px', cursor:'pointer', border:'1px solid rgba(26,107,122,0.1)', boxShadow:'0 2px 8px rgba(26,107,122,0.06)', transition:'all 0.2s'}}
                    onMouseEnter={e => e.currentTarget.style.borderColor='rgba(26,107,122,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='rgba(26,107,122,0.1)'}
                  >
                    {stay.photo_url && <img src={stay.photo_url} alt={stay.hotel_name} style={{width:'100%', height:'80px', objectFit:'cover', borderRadius:'8px', marginBottom:'8px'}} />}
                    <div style={{fontSize:'9px', letterSpacing:'2px', textTransform:'uppercase', color:'#b5654a', marginBottom:'3px'}}>📍 {[stay.city, stay.country].filter(Boolean).join(', ')}</div>
                    <div style={{fontFamily:'Playfair Display, serif', fontSize:'14px', fontWeight:600, color:'#1a6b7a', marginBottom:'4px'}}>{stay.hotel_name}</div>
                    {stay.star_rating > 0 && <div style={{fontSize:'11px', color:'#b5654a', marginBottom:'4px'}}>{'★'.repeat(stay.star_rating)}</div>}
                    <div style={{fontSize:'11px', color:'rgba(26,107,122,0.5)', marginBottom:'6px'}}>by {stay.influencers?.profiles?.full_name || stay.influencers?.handle}</div>
                    <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                      <button onClick={e => { e.stopPropagation(); toggleLike(stay.id) }} style={{background:'none', border:'none', cursor:'pointer', fontSize:'12px', color: userLikes[stay.id] ? '#e05c7a' : 'rgba(26,107,122,0.5)', fontWeight:600, padding:0}}>
                        {userLikes[stay.id] ? '❤️' : '🤍'} {likes[stay.id] || ''}
                      </button>
                      <span style={{fontSize:'11px', fontWeight:700, color:'#b5654a', cursor:'pointer'}} onClick={e => { e.stopPropagation(); setSelectedHotel(stay); setShowModal(true) }}>Book Now →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOOKING MODAL */}
      {showModal && selectedHotel && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            {selectedHotel.photo_url ? (
              <div style={{position:'relative', height:'200px', overflow:'hidden', borderRadius:'20px 20px 0 0'}}>
                <img src={selectedHotel.photo_url} alt={selectedHotel.hotel_name} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                <div style={{position:'absolute', inset:0, background:'linear-gradient(to top, rgba(10,40,50,0.85) 0%, transparent 60%)'}} />
                <div style={{position:'absolute', bottom:0, left:0, right:0, padding:'16px 20px'}}>
                  <div style={{fontSize:'9px', letterSpacing:'2px', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', marginBottom:'3px'}}>📍 {[selectedHotel.city, selectedHotel.country].filter(Boolean).join(', ')}</div>
                  <h3 style={{fontFamily:"'Playfair Display',serif", fontSize:'20px', fontWeight:700, color:'white', margin:0}}>{selectedHotel.hotel_name}</h3>
                </div>
              </div>
            ) : null}
            <div style={{padding:'20px 24px 24px'}}>
              {!selectedHotel.photo_url && (
                <>
                  <div className="modal-loc">📍 {[selectedHotel.city, selectedHotel.country].filter(Boolean).join(', ')}</div>
                  <div className="modal-name">{selectedHotel.hotel_name}</div>
                </>
              )}
              {selectedHotel.star_rating > 0 && (
                <div style={{fontSize:'16px', color:'#b5654a', marginBottom:'12px'}}>
                  {'★'.repeat(selectedHotel.star_rating)}{'☆'.repeat(5 - selectedHotel.star_rating)}
                </div>
              )}
              {selectedHotel.booking_links?.length > 0 ? selectedHotel.booking_links.map(link => (
                <a key={link.id} href={link.affiliate_url} target="_blank" rel="noopener noreferrer" className="modal-link">
                  <div style={{fontSize:'14px', fontWeight:600}}>{link.platform}</div>
                  <span>→</span>
                </a>
              )) : (
                <a href={buildExpediaUrl(selectedHotel.hotel_name, selectedHotel.city, selectedHotel.country)} target="_blank" rel="noopener noreferrer" className="modal-link">
                  <div>
                    <div style={{fontSize:'14px', fontWeight:600}}>Search on Expedia</div>
                    <div style={{fontSize:'11px', color:'rgba(26,107,122,0.45)', marginTop:'2px'}}>Find the best price</div>
                  </div>
                  <span>→</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
