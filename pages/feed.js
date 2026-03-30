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
  const [currentUser, setCurrentUser] = useState(null)
  const [stays, setStays] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLikes, setUserLikes] = useState({})
  const [likes, setLikes] = useState({})
  const [comments, setComments] = useState({})
  const [showComments, setShowComments] = useState({})
  const [commentText, setCommentText] = useState('')
  const [commentingOn, setCommentingOn] = useState(null)
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [hasFollows, setHasFollows] = useState(false)
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    async function fetchFeed() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setCurrentUser(session.user)

      // Get who they follow
      const { data: follows } = await supabase
        .from('follows')
        .select('influencer_id')
        .eq('follower_id', session.user.id)

      if (!follows || follows.length === 0) {
        setHasFollows(false)
        setLoading(false)
        return
      }

      setHasFollows(true)
      const influencerIds = follows.map(f => f.influencer_id)

      // Get stays from followed creators
      const { data: recs } = await supabase
        .from('recommendations')
        .select('*, booking_links(*), influencers(id, handle, profiles(full_name, avatar_url))')
        .in('influencer_id', influencerIds)
        .order('created_at', { ascending: false })
        .limit(40)

      setStays(recs || [])

      if (recs?.length > 0) {
        const recIds = recs.map(r => r.id)
        const { data: likesData } = await supabase
          .from('likes').select('recommendation_id, user_id')
          .in('recommendation_id', recIds)
        const likeCounts = {}, userLikeMap = {}
        recIds.forEach(id => { likeCounts[id] = 0; userLikeMap[id] = false })
        likesData?.forEach(l => {
          likeCounts[l.recommendation_id] = (likeCounts[l.recommendation_id] || 0) + 1
          if (l.user_id === session.user.id) userLikeMap[l.recommendation_id] = true
        })
        setLikes(likeCounts)
        setUserLikes(userLikeMap)

        const { data: commentsData } = await supabase
          .from('comments').select('*, profiles(full_name)')
          .in('recommendation_id', recIds)
          .order('created_at', { ascending: true })
        const commentMap = {}
        recIds.forEach(id => { commentMap[id] = [] })
        commentsData?.forEach(c => {
          if (!commentMap[c.recommendation_id]) commentMap[c.recommendation_id] = []
          commentMap[c.recommendation_id].push(c)
        })
        setComments(commentMap)
      }

      setLoading(false)
    }
    fetchFeed()
  }, [])

  // Init map after loading
  useEffect(() => {
    if (loading || !stays.length) return
    if (map.current) return
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
            el.style.cssText = 'width:24px;height:24px;background:#1a6b7a;border:2px solid white;border-radius:50%;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);'
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
            el.addEventListener('click', () => {
              popup.remove()
              setSelectedHotel(stay)
              setShowModal(true)
            })
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

  const submitComment = async (recId) => {
    if (!commentText.trim()) return
    const { data } = await supabase.from('comments').insert({
      user_id: currentUser.id, recommendation_id: recId, text: commentText.trim()
    }).select('*, profiles(full_name)').single()
    if (data) {
      setComments(prev => ({ ...prev, [recId]: [...(prev[recId] || []), data] }))
      setCommentText('')
      setCommentingOn(null)
    }
  }

  return (
    <div style={{ background: '#f7f5f2', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <Head>
        <title>Your Feed — GoThereNow</title>
        <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f7f5f2; font-family: 'DM Sans', sans-serif; }

        .hover-popup { z-index: 999 !important; }
        .hover-popup .mapboxgl-popup-content { z-index: 999 !important; padding: 0; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .feed-layout { max-width: 100%; margin: 0; padding: 0 0 60px; }
        .feed-header { margin-bottom: 32px; }
        .feed-eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 6px; }
        .feed-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #1a6b7a; }

        .feed-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .feed-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(26,107,122,0.08); border: 1px solid rgba(26,107,122,0.06); }

        .feed-card-header { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
        .feed-avatar { width: 38px; height: 38px; border-radius: 50%; background: rgba(26,107,122,0.08); border: 2px solid #1a6b7a; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .feed-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .feed-creator-name { font-size: 14px; font-weight: 700; color: #1a6b7a; text-decoration: none; }
        .feed-creator-handle { font-size: 12px; color: rgba(26,107,122,0.45); }
        .feed-time { font-size: 11px; color: rgba(26,107,122,0.3); margin-left: auto; }

        .feed-photo { position: relative; width: 100%; aspect-ratio: 4/3; overflow: hidden; cursor: pointer; }
        .feed-photo img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
        .feed-photo:hover img { transform: scale(1.03); }
        .feed-photo-gradient { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,40,50,0.7) 0%, transparent 50%); }
        .feed-photo-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 16px; }
        .feed-photo-loc { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 3px; }
        .feed-photo-name { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: white; }
        .feed-nophoto { padding: 16px; }
        .feed-nophoto-loc { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.5); margin-bottom: 4px; }
        .feed-nophoto-name { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1a6b7a; }

        .feed-card-body { padding: 12px 16px 6px; }
        .feed-quote { font-size: 13px; color: rgba(26,107,122,0.65); line-height: 1.7; margin-bottom: 10px; padding-left: 12px; border-left: 2px solid rgba(26,107,122,0.15); }

        .feed-actions { display: flex; align-items: center; gap: 12px; padding: 8px 14px 10px; border-top: 1px solid rgba(26,107,122,0.06); }
        .feed-like-btn { background: none; border: none; cursor: pointer; font-size: 20px; padding: 0; line-height: 1; transition: transform 0.15s; }
        .feed-like-btn:active { transform: scale(1.3); }
        .feed-like-count { font-size: 13px; font-weight: 600; color: rgba(26,107,122,0.6); margin-right: 4px; }
        .feed-comment-btn { background: none; border: none; cursor: pointer; font-size: 20px; padding: 0; }
        .feed-comment-count { font-size: 13px; font-weight: 600; color: rgba(26,107,122,0.6); margin-right: 4px; }
        .feed-book-btn { margin-left: auto; background: #b5654a; color: white; padding: 8px 18px; border-radius: 100px; font-size: 12px; font-weight: 700; text-decoration: none; font-family: 'DM Sans', sans-serif; }
        .feed-book-btn:hover { background: #a05540; }

        .feed-comments { padding: 0 16px 14px; }
        .feed-comment-item { font-size: 13px; margin-bottom: 6px; }
        .feed-comment-author { font-weight: 700; color: #1a6b7a; }
        .feed-comment-text { color: rgba(26,107,122,0.7); }
        .feed-comment-input-row { display: flex; gap: 8px; margin-top: 10px; }
        .feed-comment-input { flex: 1; padding: 9px 14px; border: 1px solid rgba(26,107,122,0.15); border-radius: 100px; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; color: #1a6b7a; background: white; }
        .feed-comment-input::placeholder { color: rgba(26,107,122,0.3); }
        .feed-comment-submit { background: #1a6b7a; color: white; border: none; border-radius: 100px; padding: 9px 18px; font-size: 12px; font-weight: 700; cursor: pointer; }

        @media (max-width: 900px) { .feed-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .feed-grid { grid-template-columns: repeat(2, 1fr); } .feed-layout { padding: 80px 16px 40px; } }
        .empty-state { text-align: center; padding: 80px 0; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-title { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #1a6b7a; margin-bottom: 8px; }
        .empty-sub { font-size: 14px; color: rgba(26,107,122,0.5); margin-bottom: 24px; line-height: 1.6; }
        .explore-btn { background: #1a6b7a; color: white; padding: 12px 28px; border-radius: 100px; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block; }

        .modal-overlay { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); }
        .modal { background: #f7f5f2; width: 100%; max-width: 440px; position: relative; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden; }
        .modal-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; background: rgba(26,107,122,0.08); border: none; cursor: pointer; color: #1a6b7a; font-size: 14px; display: flex; align-items: center; justify-content: center; border-radius: 50%; z-index: 10; }
        .modal-body-pad { padding: 20px 24px 24px; }
        .modal-loc { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 6px; }
        .modal-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #1a6b7a; margin-bottom: 14px; }
        .modal-link { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; border: 1px solid rgba(26,107,122,0.15); text-decoration: none; color: #1a6b7a; border-radius: 10px; background: white; margin-bottom: 8px; }
        .modal-link:hover { background: rgba(26,107,122,0.04); }
        .modal-link-name { font-size: 14px; font-weight: 600; }
        .modal-link-note { font-size: 11px; color: rgba(26,107,122,0.45); margin-top: 2px; }
      `}</style>

      <Nav />

      <div style={{maxWidth:'1400px', margin:'0 auto', padding:'100px 40px 40px', display:'flex', gap:'32px', alignItems:'flex-start'}}>
        <div style={{width:'420px', flexShrink:0, position:'sticky', top:'80px'}}>
          <div style={{borderRadius:'16px', overflow:'hidden', border:'1px solid rgba(26,107,122,0.15)', height:'calc(100vh - 120px)', boxShadow:'0 4px 20px rgba(26,107,122,0.1)'}}>
            <div ref={mapContainer} style={{width:'100%', height:'100%'}} />
          </div>
        </div>
        <div style={{flex:1, minWidth:0}}>
      <div className="feed-layout" style={{paddingTop:'0', maxWidth:'100%'}}>
        <div className="feed-header">
          <div className="feed-eyebrow">your feed</div>
          <h1 className="feed-title">Stays from people you follow</h1>
        </div>

        {loading ? (
          <div style={{textAlign:'center', padding:'60px 0', color:'rgba(26,107,122,0.4)'}}>Loading your feed...</div>
        ) : !hasFollows ? (
          <div className="empty-state">
            <div className="empty-icon">✈️</div>
            <div className="empty-title">Your feed is empty</div>
            <div className="empty-sub">Follow creators to see their hotel recommendations here.<br />Discover amazing stays from people whose taste you trust.</div>
            <Link href="/explore" className="explore-btn">Explore creators →</Link>
          </div>
        ) : stays.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏨</div>
            <div className="empty-title">Nothing yet</div>
            <div className="empty-sub">The creators you follow haven't added any stays yet.</div>
            <Link href="/explore" className="explore-btn">Discover more creators →</Link>
          </div>
        ) : (
          <div className="feed-grid">
          {stays.map(stay => (
            <div key={stay.id} className="feed-card">
              {/* HEADER */}
              <div className="feed-card-header">
                <div className="feed-avatar">
                  {stay.influencers?.profiles?.avatar_url
                    ? <img src={stay.influencers.profiles.avatar_url} alt="" />
                    : '✈️'}
                </div>
                <div>
                  <Link href={`/${stay.influencers?.handle}`} className="feed-creator-name">
                    {stay.influencers?.profiles?.full_name || stay.influencers?.handle}
                  </Link>
                  <div className="feed-creator-handle">@{stay.influencers?.handle}</div>
                </div>
                <div className="feed-time">{new Date(stay.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>

              {/* PHOTO */}
              {stay.photo_url ? (
                <div className="feed-photo" onClick={() => { setSelectedHotel(stay); setShowModal(true) }}>
                  <img src={stay.photo_url} alt={stay.hotel_name} />
                  <div className="feed-photo-gradient" />
                  <div className="feed-photo-info">
                    <div className="feed-photo-loc">📍 {[stay.city, stay.country].filter(Boolean).join(', ')}</div>
                    <div className="feed-photo-name">{stay.hotel_name}</div>
                  </div>
                </div>
              ) : (
                <div className="feed-nophoto" onClick={() => { setSelectedHotel(stay); setShowModal(true) }} style={{cursor:'pointer'}}>
                  <div className="feed-nophoto-loc">📍 {[stay.city, stay.country].filter(Boolean).join(', ')}</div>
                  <div className="feed-nophoto-name">{stay.hotel_name}</div>
                </div>
              )}

              {/* QUOTE */}
              {stay.influencer_quote && (
                <div className="feed-card-body">
                  <div className="feed-quote">"{stay.influencer_quote}"</div>
                </div>
              )}

              {/* ACTIONS */}
              <div className="feed-actions">
                <button className="feed-like-btn" onClick={() => toggleLike(stay.id)}>
                  {userLikes[stay.id] ? '❤️' : '🤍'}
                </button>
                <span className="feed-like-count">{likes[stay.id] > 0 ? likes[stay.id] : ''}</span>
                <button className="feed-comment-btn" onClick={() => setShowComments(prev => ({...prev, [stay.id]: !prev[stay.id]}))}>
                  💬
                </button>
                <span className="feed-comment-count">{comments[stay.id]?.length > 0 ? comments[stay.id].length : ''}</span>
                <a href={buildExpediaUrl(stay.hotel_name, stay.city, stay.country)} target="_blank" rel="noopener noreferrer" className="feed-book-btn">
                  Book Now →
                </a>
              </div>

              {/* COMMENTS */}
              {showComments[stay.id] && (
                <div className="feed-comments">
                  {comments[stay.id]?.map((cm, i) => (
                    <div key={i} className="feed-comment-item">
                      <span className="feed-comment-author">{cm.profiles?.full_name || 'User'} </span>
                      <span className="feed-comment-text">{cm.text}</span>
                    </div>
                  ))}
                  <div className="feed-comment-input-row">
                    <input className="feed-comment-input" placeholder="Add a comment..."
                      value={commentingOn === stay.id ? commentText : ''}
                      onChange={e => { setCommentingOn(stay.id); setCommentText(e.target.value) }}
                      onKeyDown={e => { if (e.key === 'Enter') submitComment(stay.id) }} />
                    <button className="feed-comment-submit" onClick={() => submitComment(stay.id)}>Post</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          </div>
        )}
      </div>
        </div>
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
            <div className="modal-body-pad">
              {!selectedHotel.photo_url && <>
                <div className="modal-loc">📍 {[selectedHotel.city, selectedHotel.country].filter(Boolean).join(', ')}</div>
                <div className="modal-name">{selectedHotel.hotel_name}</div>
              </>}
              {selectedHotel.booking_links?.length > 0 ? selectedHotel.booking_links.map(link => (
                <a key={link.id} href={link.affiliate_url} target="_blank" rel="noopener noreferrer" className="modal-link">
                  <div><div className="modal-link-name">{link.platform}</div>{link.note && <div className="modal-link-note">{link.note}</div>}</div>
                  <span>→</span>
                </a>
              )) : (
                <a href={buildExpediaUrl(selectedHotel.hotel_name, selectedHotel.city, selectedHotel.country)} target="_blank" rel="noopener noreferrer" className="modal-link">
                  <div><div className="modal-link-name">Search on Expedia</div><div className="modal-link-note">Find the best price</div></div>
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
