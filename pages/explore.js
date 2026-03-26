export const dynamic = 'force-dynamic'
const EXPEDIA_AFFILIATE = 'xkGKaCc'
function buildExpediaUrl(hotelName, city, country) {
  const destination = [hotelName, city, country].filter(Boolean).join(', ')
  return `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(destination)}&affcid=${EXPEDIA_AFFILIATE}`
}

import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'

export default function Explore() {
  const [stays, setStays] = useState([])
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stays')
  const [search, setSearch] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [userLikes, setUserLikes] = useState({})
  const [likes, setLikes] = useState({})

  useEffect(() => {
    async function fetchData() {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUser(session?.user || null)

      // Fetch all stays with creator info
      const { data: recs } = await supabase
        .from('recommendations')
        .select('*, influencers(handle, profiles(full_name, avatar_url))')
        .order('created_at', { ascending: false })
        .limit(60)
      setStays(recs || [])

      // Fetch all creators
      const { data: infs } = await supabase
        .from('influencers')
        .select('*, profiles(full_name, avatar_url, bio)')
        .eq('approved', true)
        .order('created_at', { ascending: false })
      setCreators(infs || [])

      // Fetch likes
      if (recs?.length > 0) {
        const recIds = recs.map(r => r.id)
        const { data: likesData } = await supabase
          .from('likes').select('recommendation_id, user_id')
          .in('recommendation_id', recIds)
        const likeCounts = {}, userLikeMap = {}
        recIds.forEach(id => { likeCounts[id] = 0; userLikeMap[id] = false })
        likesData?.forEach(l => {
          likeCounts[l.recommendation_id] = (likeCounts[l.recommendation_id] || 0) + 1
          if (session?.user && l.user_id === session.user.id) userLikeMap[l.recommendation_id] = true
        })
        setLikes(likeCounts)
        setUserLikes(userLikeMap)
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  const toggleLike = async (recId) => {
    if (!currentUser) { window.location.href = '/login'; return }
    const already = userLikes[recId]
    setUserLikes(prev => ({ ...prev, [recId]: !already }))
    setLikes(prev => ({ ...prev, [recId]: (prev[recId] || 0) + (already ? -1 : 1) }))
    if (already) {
      await supabase.from('likes').delete().eq('user_id', currentUser.id).eq('recommendation_id', recId)
    } else {
      await supabase.from('likes').insert({ user_id: currentUser.id, recommendation_id: recId })
    }
  }

  const filteredStays = stays.filter(s =>
    !search || s.hotel_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase()) ||
    s.country?.toLowerCase().includes(search.toLowerCase()) ||
    s.influencers?.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredCreators = creators.filter(c =>
    !search || c.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.handle?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ background: '#f7f5f2', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <Head>
        <title>Explore — GoThereNow</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f7f5f2; font-family: 'DM Sans', sans-serif; }
        .page-hero { padding: 100px 56px 40px; }
        .page-eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 8px; }
        .page-title { font-family: 'Playfair Display', serif; font-size: clamp(32px, 4vw, 52px); font-weight: 700; color: #1a6b7a; margin-bottom: 24px; }
        .search-bar { display: flex; align-items: center; gap: 12px; background: white; border: 1px solid rgba(26,107,122,0.15); border-radius: 100px; padding: 12px 20px; max-width: 480px; box-shadow: 0 2px 12px rgba(26,107,122,0.08); }
        .search-input { flex: 1; border: none; outline: none; font-size: 14px; color: #1a6b7a; font-family: 'DM Sans', sans-serif; background: transparent; }
        .search-input::placeholder { color: rgba(26,107,122,0.35); }
        .tabs { display: flex; padding: 0 56px; border-bottom: 1px solid rgba(26,107,122,0.12); background: #f7f5f2; }
        .tab-btn { padding: 16px 24px; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.35); background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; font-family: 'DM Sans', sans-serif; margin-bottom: -1px; }
        .tab-btn.active { color: #1a6b7a; border-bottom-color: #1a6b7a; }
        .content { padding: 40px 56px; }

        .stays-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .stay-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(26,107,122,0.08); border: 1px solid rgba(26,107,122,0.06); transition: transform 0.2s; cursor: pointer; }
        .stay-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(26,107,122,0.15); }
        .stay-card-photo { position: relative; aspect-ratio: 4/3; overflow: hidden; }
        .stay-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .stay-card:hover .stay-card-img { transform: scale(1.05); }
        .stay-card-gradient { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,40,50,0.8) 0%, transparent 60%); }
        .stay-card-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 14px; }
        .stay-card-nophoto { aspect-ratio: 4/3; background: rgba(26,107,122,0.05); display: flex; align-items: center; justify-content: center; font-size: 32px; }
        .stay-card-body { padding: 12px 14px 10px; }
        .stay-card-loc { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 3px; }
        .stay-card-loc-dark { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.5); margin-bottom: 3px; }
        .stay-card-name { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: white; }
        .stay-card-name-dark { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; color: #1a6b7a; margin-bottom: 4px; }
        .stay-card-loc-body { font-size: 11px; color: rgba(26,107,122,0.5); margin-bottom: 8px; }
        .stay-card-creator { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .creator-avatar-sm { width: 24px; height: 24px; border-radius: 50%; background: rgba(26,107,122,0.1); border: 1px solid rgba(26,107,122,0.2); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
        .creator-avatar-sm img { width: 100%; height: 100%; object-fit: cover; }
        .creator-name-sm { font-size: 11px; font-weight: 600; color: rgba(26,107,122,0.7); }
        .stay-card-actions { display: flex; align-items: center; gap: 12px; }
        .like-btn { background: none; border: none; cursor: pointer; font-size: 12px; color: rgba(26,107,122,0.5); font-weight: 600; padding: 0; display: flex; align-items: center; gap: 4px; }
        .like-btn.liked { color: #e05c7a; }
        .book-btn { margin-left: auto; font-size: 11px; font-weight: 700; color: #b5654a; background: none; border: none; cursor: pointer; padding: 0; }

        .creators-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .creator-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(26,107,122,0.08); border: 1px solid rgba(26,107,122,0.06); text-decoration: none; display: block; transition: transform 0.2s; }
        .creator-card:hover { transform: translateY(-3px); }
        .creator-avatar { width: 56px; height: 56px; border-radius: 50%; background: rgba(26,107,122,0.08); border: 2px solid #1a6b7a; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 12px; }
        .creator-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .creator-name { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; color: #1a6b7a; margin-bottom: 2px; }
        .creator-handle { font-size: 12px; color: rgba(26,107,122,0.45); margin-bottom: 8px; }
        .creator-bio { font-size: 12px; color: rgba(26,107,122,0.6); line-height: 1.5; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .creator-stats { display: flex; gap: 16px; }
        .creator-stat { font-size: 11px; color: rgba(26,107,122,0.5); }
        .creator-stat strong { font-weight: 700; color: #1a6b7a; display: block; font-size: 14px; }

        .empty { text-align: center; padding: 80px 0; color: rgba(26,107,122,0.3); font-size: 14px; }

        @media (max-width: 1024px) { .stays-grid { grid-template-columns: repeat(3, 1fr); } .creators-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .page-hero { padding: 80px 20px 24px; }
          .page-title { font-size: 28px; }
          .search-bar { max-width: 100%; }
          .tabs { padding: 0 20px; }
          .content { padding: 20px; }
          .stays-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .creators-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .stay-card-name { font-size: 13px; }
          .creator-card { padding: 16px; }
        }
        @media (max-width: 480px) {
          .stays-grid { grid-template-columns: repeat(2, 1fr); }
          .creators-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <Nav />

      <div className="page-hero">
        <div className="page-eyebrow">discover</div>
        <h1 className="page-title">Explore stays &amp; creators</h1>
        <div className="search-bar">
          <span style={{fontSize:'16px'}}>🔍</span>
          <input className="search-input" placeholder="Search hotels, cities, creators..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{background:'none', border:'none', cursor:'pointer', color:'rgba(26,107,122,0.4)', fontSize:'16px'}}>✕</button>}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${activeTab === 'stays' ? ' active' : ''}`} onClick={() => setActiveTab('stays')}>
          Stays {stays.length > 0 && `(${filteredStays.length})`}
        </button>
        <button className={`tab-btn${activeTab === 'creators' ? ' active' : ''}`} onClick={() => setActiveTab('creators')}>
          Creators {creators.length > 0 && `(${filteredCreators.length})`}
        </button>
      </div>

      <div className="content">
        {loading ? (
          <div className="empty">Loading...</div>
        ) : activeTab === 'stays' ? (
          filteredStays.length === 0 ? (
            <div className="empty">No stays found{search ? ` for "${search}"` : ''}.</div>
          ) : (
            <div className="stays-grid">
              {filteredStays.map(stay => (
                <div key={stay.id} className="stay-card">
                  <Link href={`/${stay.influencers?.handle}`} style={{textDecoration:'none'}}>
                    <div className="stay-card-photo">
                      {stay.photo_url ? (
                        <>
                          <img src={stay.photo_url} alt={stay.hotel_name} className="stay-card-img" />
                          <div className="stay-card-gradient" />
                          <div className="stay-card-overlay">
                            <div className="stay-card-loc">📍 {[stay.city, stay.country].filter(Boolean).join(', ')}</div>
                            <div className="stay-card-name">{stay.hotel_name}</div>
                          </div>
                        </>
                      ) : (
                        <div className="stay-card-nophoto">🏨</div>
                      )}
                    </div>
                  </Link>
                  <div className="stay-card-body">
                    {!stay.photo_url && (
                      <>
                        <div className="stay-card-name-dark">{stay.hotel_name}</div>
                        <div className="stay-card-loc-body">📍 {[stay.city, stay.country].filter(Boolean).join(', ')}</div>
                      </>
                    )}
                    <div className="stay-card-creator">
                      <div className="creator-avatar-sm">
                        {stay.influencers?.profiles?.avatar_url
                          ? <img src={stay.influencers.profiles.avatar_url} alt="" />
                          : '✈️'}
                      </div>
                      <Link href={`/${stay.influencers?.handle}`} style={{textDecoration:'none'}}>
                        <span className="creator-name-sm">{stay.influencers?.profiles?.full_name || stay.influencers?.handle}</span>
                      </Link>
                    </div>
                    <div className="stay-card-actions">
                      <button className={`like-btn${userLikes[stay.id] ? ' liked' : ''}`} onClick={() => toggleLike(stay.id)}>
                        {userLikes[stay.id] ? '❤️' : '🤍'} {likes[stay.id] > 0 ? likes[stay.id] : ''}
                      </button>
                      <a href={buildExpediaUrl(stay.hotel_name, stay.city, stay.country)} target="_blank" rel="noopener noreferrer" className="book-btn">Book Now →</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredCreators.length === 0 ? (
            <div className="empty">No creators found{search ? ` for "${search}"` : ''}.</div>
          ) : (
            <div className="creators-grid">
              {filteredCreators.map(creator => (
                <Link key={creator.id} href={`/${creator.handle}`} className="creator-card">
                  <div className="creator-avatar">
                    {creator.profiles?.avatar_url
                      ? <img src={creator.profiles.avatar_url} alt={creator.profiles.full_name} />
                      : '✈️'}
                  </div>
                  <div className="creator-name">{creator.profiles?.full_name || creator.handle}</div>
                  <div className="creator-handle">@{creator.handle}</div>
                  {creator.profiles?.bio && <div className="creator-bio">{creator.profiles.bio}</div>}
                  <div className="creator-stats">
                    <div className="creator-stat"><strong>{creator.follower_count || 0}</strong>Followers</div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>

    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
