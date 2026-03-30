export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZ290aGVyZW5vdyIsImEiOiJjbWxmYXJpYm0wMzByM2lwcGpzNjl4Ymx5In0.lipvyNXWoQmIDCah_0Ss_w'
const EXPEDIA_AFFILIATE = 'xkGKaCc'

function buildExpediaUrl(hotelName, city, country) {
  const destination = [hotelName, city, country].filter(Boolean).join(', ')
  return `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(hotelName)}&q=${encodeURIComponent(destination)}&affcid=${EXPEDIA_AFFILIATE}`
}

export default function ProfilePage() {
  const router = useRouter()
  const { handle } = router.query
  const slug = handle ? handle.replace('@', '') : null

  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef([])
  const nearbyMarkersRef = useRef([])
  const searchTimeout = useRef(null)

  const [influencer, setInfluencer] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [isApprovedCreator, setIsApprovedCreator] = useState(false)
  const [activeTab, setActiveTab] = useState('map')

  // Social
  const [likes, setLikes] = useState({})
  const [userLikes, setUserLikes] = useState({})
  const [comments, setComments] = useState({})
  const [isFollowing, setIsFollowing] = useState(false)
  const [showComments, setShowComments] = useState({})
  const [commentText, setCommentText] = useState('')
  const [commentingOn, setCommentingOn] = useState(null)

  // Booking modal
  const [showModal, setShowModal] = useState(false)
  const [selectedHotel, setSelectedHotel] = useState(null)

  // Add/Edit modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [editRec, setEditRec] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const [form, setForm] = useState({
    hotel_name: '', city: '', country: '', latitude: '', longitude: '',
    influencer_quote: '', personal_rating: '5', photo_url: ''
  })

  // Fetch all data
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

      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user || null
      setCurrentUser(user)
      if (user && user.id === inf.user_id) setIsOwner(true)
      setIsApprovedCreator(inf.approved === true)

      if (recs && recs.length > 0) {
        const recIds = recs.map(r => r.id)
        const { data: likesData } = await supabase
          .from('likes').select('recommendation_id, user_id')
          .in('recommendation_id', recIds)
        const likeCounts = {}, userLikeMap = {}
        recIds.forEach(id => { likeCounts[id] = 0; userLikeMap[id] = false })
        likesData?.forEach(l => {
          likeCounts[l.recommendation_id] = (likeCounts[l.recommendation_id] || 0) + 1
          if (user && l.user_id === user.id) userLikeMap[l.recommendation_id] = true
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

      // Real follower count
      const { count } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('influencer_id', inf.id)
      setFollowerCount(count || 0)

      if (user && inf) {
        const { data: followData } = await supabase
          .from('follows').select('id')
          .eq('follower_id', user.id)
          .eq('influencer_id', inf.id)
          .single()
        setIsFollowing(!!followData)
      }
    }
    fetchData()
  }, [slug])

  // Init map
  useEffect(() => {
    if (loading) return
    if (map.current) return
    setTimeout(() => {
      if (!mapContainer.current) return
      import('mapbox-gl').then(mod => {
        const mapboxgl = mod.default || mod
        mapboxgl.accessToken = MAPBOX_TOKEN
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
          addMarkers(mapboxgl)
        })
      })
    }, 200)
  }, [loading])

  function addMarkers(mapboxgl) {
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    recommendations.forEach(rec => {
      if (!rec.latitude || !rec.longitude) return
      const el = document.createElement('div')
      el.style.cssText = 'width:28px;height:28px;background:#1a6b7a;border:2px solid white;border-radius:50%;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);z-index:2;'
      const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 15, className: 'hover-popup' })
        .setHTML(
          '<div style="font-family:DM Sans,sans-serif;width:220px;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.15);display:flex;">' +
          (rec.photo_url ? '<div style="width:80px;flex-shrink:0;background:url(' + rec.photo_url + ') center/cover;"></div>' : '') +
          '<div style="padding:10px 12px;background:white;flex:1;">' +
          '<div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#b5654a;margin-bottom:3px">' + [rec.city, rec.country].filter(Boolean).join(', ') + '</div>' +
          '<div style="font-size:13px;font-weight:700;color:#1a6b7a;margin-bottom:4px;line-height:1.3">' + rec.hotel_name + '</div>' +
          (rec.star_rating ? '<div style="font-size:12px;color:#b5654a">' + '★'.repeat(rec.star_rating) + '</div>' : '') +
          '</div></div>'
        )
      el.addEventListener('mouseenter', () => popup.setLngLat([rec.longitude, rec.latitude]).addTo(map.current))
      el.addEventListener('mouseleave', () => popup.remove())
      el.addEventListener('click', () => {
        popup.remove()
        setSelectedHotel(rec)
        setShowModal(true)
        map.current.flyTo({ center: [rec.longitude, rec.latitude], zoom: 13, duration: 800 })
        fetchNearbyHotels(mapboxgl, rec.latitude, rec.longitude)
      })
      new mapboxgl.Marker(el).setLngLat([rec.longitude, rec.latitude]).addTo(map.current)
      markersRef.current.push({ remove: () => el.remove() })
    })
  }

  async function fetchNearbyHotels(mapboxgl, lat, lng) {
    // Clear existing nearby markers
    nearbyMarkersRef.current.forEach(m => m.remove())
    nearbyMarkersRef.current = []

    try {
      const res = await fetch(`/api/hotel-search?action=nearby&lat=${lat}&lng=${lng}`)
      const data = await res.json()
      if (!data.results) return

      data.results.forEach(hotel => {
        if (!hotel.lat || !hotel.lng) return
        // Skip if it's already a creator hotel
        const isCreatorHotel = recommendations.some(r =>
          Math.abs(r.latitude - hotel.lat) < 0.001 && Math.abs(r.longitude - hotel.lng) < 0.001
        )
        if (isCreatorHotel) return

        const el = document.createElement('div')
        el.style.cssText = 'width:22px;height:22px;background:white;border:2px solid #1a6b7a;border-radius:50%;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;font-size:9px;color:#1a6b7a;font-weight:700;'
        el.textContent = '🏨'

        // Popup with hotel name and book button
        const popup = new mapboxgl.Popup({ offset: 20, closeButton: false, maxWidth: '220px' })
          .setHTML(`<div style="font-family:'DM Sans',sans-serif;padding:10px;">
            <div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#b5654a;margin-bottom:4px;">${hotel.address?.split(',').slice(-2).join(',').trim() || ''}</div>
            <div style="font-size:13px;font-weight:700;color:#1a6b7a;margin-bottom:8px;">${hotel.name}</div>
            <a href="https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(hotel.name)}&regionId=&startDate=&endDate=&rooms=1&_xpid=11905%7C1&affcid=xkGKaCc&q=${encodeURIComponent(hotel.name + ' ' + (hotel.address?.split(',')[0] || ''))}"
              target="_blank" style="display:block;background:#b5654a;color:white;padding:7px 12px;border-radius:6px;text-align:center;font-size:11px;font-weight:700;text-decoration:none;">
              Book on Expedia →
            </a>
          </div>`)

        const marker = new mapboxgl.Marker(el)
          .setLngLat([hotel.lng, hotel.lat])
          .setPopup(popup)
          .addTo(map.current)

        el.addEventListener('click', () => popup.toggle())
        nearbyMarkersRef.current.push(marker)
      })
    } catch (e) { console.error('Nearby hotels error:', e) }
  }

  useEffect(() => {
    if (activeTab === 'map' && map.current) setTimeout(() => map.current.resize(), 50)
  }, [activeTab])

  // Social actions
  const toggleLike = async (recId) => {
    if (!currentUser) { router.push('/login'); return }
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
    if (!currentUser) { router.push('/login'); return }
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

  const toggleFollow = async () => {
    if (!currentUser) { router.push('/login'); return }
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('influencer_id', influencer.id)
      setIsFollowing(false)
      setFollowerCount(prev => Math.max(0, prev - 1))
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, influencer_id: influencer.id })
      setIsFollowing(true)
      setFollowerCount(prev => prev + 1)
    }
  }

  // Hotel autocomplete
  const handleHotelNameChange = (value) => {
    setForm(prev => ({ ...prev, hotel_name: value }))
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (value.length < 3) { setSuggestions([]); setShowSuggestions(false); return }
    setSearching(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/hotel-search?action=search&query=${encodeURIComponent(value)}`)
        const data = await res.json()
        if (data.results?.length > 0) { setSuggestions(data.results); setShowSuggestions(true) }
      } catch (e) {}
      setSearching(false)
    }, 600)
  }

  const handleSelectSuggestion = async (place) => {
    setSuggestions([]); setShowSuggestions(false)
    setForm(prev => ({ ...prev, hotel_name: place.name }))
    try {
      const res = await fetch(`/api/hotel-search?action=details&place_id=${place.place_id}`)
      const data = await res.json()
      setForm(prev => ({
        ...prev,
        hotel_name: data.name || place.name,
        city: data.city || '',
        country: data.country || '',
        latitude: data.lat ? String(data.lat) : '',
        longitude: data.lng ? String(data.lng) : '',
        photo_url: data.photo_url || prev.photo_url,
      }))
    } catch (e) {}
  }

  // Add stay
  const handleAddRecommendation = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('recommendations').insert({
      influencer_id: influencer.id,
      hotel_name: form.hotel_name,
      city: form.city || null,
      country: form.country,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      influencer_quote: form.influencer_quote,
      star_rating: parseInt(form.personal_rating),
      photo_url: form.photo_url || null,
    })
    if (!error) {
      const { data: recs } = await supabase.from('recommendations').select('*, booking_links(*)').eq('influencer_id', influencer.id).order('created_at', { ascending: false })
      setRecommendations(recs || [])
      setShowAddModal(false)
      setForm({ hotel_name: '', city: '', country: '', latitude: '', longitude: '', influencer_quote: '', personal_rating: '5', photo_url: '' })
    }
    setSaving(false)
  }

  // Edit stay
  const openEdit = (rec) => {
    setEditRec(rec)
    setForm({
      hotel_name: rec.hotel_name || '', city: rec.city || '', country: rec.country || '',
      latitude: rec.latitude ? String(rec.latitude) : '', longitude: rec.longitude ? String(rec.longitude) : '',
      influencer_quote: rec.influencer_quote || '', personal_rating: rec.star_rating ? String(rec.star_rating) : '5',
      photo_url: rec.photo_url || '',
    })
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('recommendations').update({
      hotel_name: form.hotel_name, city: form.city || null, country: form.country,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      influencer_quote: form.influencer_quote,
      star_rating: parseInt(form.personal_rating),
      photo_url: form.photo_url || null,
    }).eq('id', editRec.id)
    const { data: recs } = await supabase.from('recommendations').select('*, booking_links(*)').eq('influencer_id', influencer.id).order('created_at', { ascending: false })
    setRecommendations(recs || [])
    setEditRec(null)
    setForm({ hotel_name: '', city: '', country: '', latitude: '', longitude: '', influencer_quote: '', personal_rating: '5', photo_url: '' })
    setSaving(false)
  }

  const handleDelete = async (id) => {
    await supabase.from('booking_links').delete().eq('recommendation_id', id)
    await supabase.from('recommendations').delete().eq('id', id)
    setRecommendations(prev => prev.filter(r => r.id !== id))
    setDeleteId(null)
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filename = `hotel-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('hotel-photos').upload(filename, file, { contentType: file.type, upsert: true })
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('hotel-photos').getPublicUrl(filename)
    setForm(f => ({ ...f, photo_url: urlData.publicUrl }))
    setUploading(false)
  }

  const resetForm = () => {
    setForm({ hotel_name: '', city: '', country: '', latitude: '', longitude: '', influencer_quote: '', personal_rating: '5', photo_url: '' })
    setSuggestions([]); setShowSuggestions(false)
  }

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
        <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:'28px', color:'#1a6b7a', marginBottom:'8px' }}>Profile not found</h1>
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
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: #f7f5f2; }

        .profile-hero { padding: 80px 56px 16px; border-bottom: 1px solid rgba(26,107,122,0.1); display: flex; align-items: center; gap: 24px; }
        .avatar { width: 64px; height: 64px; border-radius: 50%; border: 2px solid #1a6b7a; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 24px; background: rgba(26,107,122,0.08); }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .profile-info { flex: 1; }
        .profile-eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 4px; display: block; }
        .profile-name { font-family: 'Playfair Display', serif; font-size: clamp(20px, 3vw, 32px); font-weight: 700; color: #1a6b7a; line-height: 1.05; margin-bottom: 6px; }
        .profile-bio { font-size: 12px; color: rgba(26,107,122,0.6); line-height: 1.6; max-width: 480px; margin-bottom: 12px; }
        .profile-stats { display: flex; gap: 32px; }
        .stat-num { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1a6b7a; line-height: 1; }
        .stat-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.5); margin-top: 2px; font-weight: 600; }
        .profile-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; flex-shrink: 0; }
        .social-btn { padding: 9px 18px; border-radius: 100px; font-size: 12px; font-weight: 600; color: #1a6b7a; text-decoration: none; border: 1px solid rgba(26,107,122,0.25); transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .social-btn:hover { background: rgba(26,107,122,0.06); }

        .tabs { display: flex; padding: 0 56px; border-bottom: 1px solid rgba(26,107,122,0.12); background: #f7f5f2; }
        .tab-btn { padding: 18px 24px; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.35); background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; font-family: 'DM Sans', sans-serif; margin-bottom: -1px; }
        .tab-btn.active { color: #1a6b7a; border-bottom-color: #1a6b7a; }

        .content { padding: 32px 56px; }
        .hover-popup { z-index: 999 !important; }
        .hover-popup .mapboxgl-popup-content { z-index: 999 !important; padding: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .hover-popup .mapboxgl-popup-tip { z-index: 999 !important; }
        .map-container { border-radius: 16px; overflow: hidden; border: 1px solid rgba(26,107,122,0.15); aspect-ratio: 2/1.4; box-shadow: 0 4px 20px rgba(26,107,122,0.1); }

        .section-eyebrow { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 6px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #1a6b7a; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }

        .hotels-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .hotel-card-wrap { background: white; border-radius: 16px; overflow: visible; box-shadow: 0 4px 20px rgba(26,107,122,0.08); border: 1px solid rgba(26,107,122,0.08); position: relative; }
        .hotel-card { position: relative; overflow: hidden; cursor: pointer; aspect-ratio: 4/3; }
        .hotel-card-bg { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
        .hotel-card:hover .hotel-card-bg { transform: scale(1.06); }
        .hotel-card-gradient { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,40,50,0.92) 0%, transparent 55%); }
        .hotel-card-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 16px; }
        .hotel-card-nophoto { width: 100%; height: 100%; background: #f7f5f2; display: flex; flex-direction: column; justify-content: flex-end; padding: 16px; }
        .hotel-card-loc { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 3px; }
        .hotel-card-loc-dark { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.5); margin-bottom: 3px; }
        .hotel-card-name { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; color: white; margin-bottom: 8px; }
        .hotel-card-name-dark { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; color: #1a6b7a; margin-bottom: 8px; }
        .hotel-card-book { background: #b5654a; color: white; padding: 6px 14px; font-size: 11px; font-weight: 700; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; border-radius: 6px; }
        .hotel-card-latest { position: absolute; top: 12px; left: 12px; background: white; color: #1a6b7a; font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; z-index: 2; }
        .owner-actions { position: absolute; top: 12px; right: 12px; display: flex; gap: 6px; z-index: 10; }
        .owner-btn { background: white; color: #1a6b7a; border: none; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }

        .card-actions { display: flex; align-items: center; gap: 16px; padding: 10px 14px 6px; }
        .like-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 5px; font-size: 13px; color: rgba(26,107,122,0.6); font-family: 'DM Sans', sans-serif; font-weight: 600; padding: 0; }
        .like-btn.liked { color: #e05c7a; }
        .comment-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 5px; font-size: 13px; color: rgba(26,107,122,0.6); font-family: 'DM Sans', sans-serif; font-weight: 600; padding: 0; }
        .comments-section { padding: 8px 14px 14px; border-top: 1px solid rgba(26,107,122,0.06); }
        .comment-item { margin-bottom: 6px; font-size: 12px; }
        .comment-author { font-weight: 700; color: #1a6b7a; }
        .comment-text { color: rgba(26,107,122,0.7); }
        .comment-input-row { display: flex; gap: 8px; margin-top: 8px; }
        .comment-input { flex: 1; padding: 8px 12px; border: 1px solid rgba(26,107,122,0.15); border-radius: 100px; font-size: 12px; font-family: 'DM Sans', sans-serif; outline: none; color: #1a6b7a; background: white; }
        .comment-input::placeholder { color: rgba(26,107,122,0.3); }
        .comment-submit { background: #1a6b7a; color: white; border: none; border-radius: 100px; padding: 8px 14px; font-size: 12px; font-weight: 700; cursor: pointer; }

        .modal-overlay { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); }
        .modal { background: #f7f5f2; border: 1px solid rgba(26,107,122,0.15); width: 100%; max-width: 440px; position: relative; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden; }
        .modal-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; background: rgba(26,107,122,0.08); border: none; cursor: pointer; color: #1a6b7a; font-size: 14px; display: flex; align-items: center; justify-content: center; border-radius: 50%; z-index: 10; }
        .modal-body-pad { padding: 20px 28px 28px; }
        .modal-loc { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 8px; }
        .modal-name { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #1a6b7a; margin-bottom: 16px; }
        .modal-quote { font-size: 13px; color: rgba(26,107,122,0.6); line-height: 1.8; padding-left: 14px; border-left: 2px solid rgba(26,107,122,0.2); margin-bottom: 20px; }
        .modal-book-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.45); font-weight: 700; margin-bottom: 10px; }
        .modal-link { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; border: 1px solid rgba(26,107,122,0.15); text-decoration: none; color: #1a6b7a; transition: all 0.2s; border-radius: 10px; background: white; margin-bottom: 8px; }
        .modal-link:hover { background: rgba(26,107,122,0.04); }
        .modal-link-name { font-size: 14px; font-weight: 600; }
        .modal-link-note { font-size: 11px; color: rgba(26,107,122,0.45); margin-top: 2px; }
        .modal-disclaimer { text-align: center; font-size: 11px; color: rgba(26,107,122,0.3); margin-top: 16px; line-height: 1.6; }

        .add-modal { background: #f7f5f2; border: 1px solid rgba(26,107,122,0.15); width: 100%; max-width: 520px; position: relative; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden; }
        .add-modal-header { padding: 20px 28px 14px; background: #f7f5f2; border-bottom: 1px solid rgba(26,107,122,0.1); }
        .add-modal-eyebrow { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 4px; }
        .add-modal-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #1a6b7a; }
        .add-modal-body { padding: 16px 28px 24px; display: flex; flex-direction: column; gap: 10px; }
        .field-label { font-size: 12px; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; color: #1a6b7a; margin-bottom: 5px; display: block; }
        .field-input { width: 100%; padding: 10px 14px; background: white; border: 1px solid rgba(26,107,122,0.15); color: #1a6b7a; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; border-radius: 8px; }
        .field-input::placeholder { color: rgba(26,107,122,0.3); }
        .field-input:focus { border-color: rgba(26,107,122,0.4); }
        textarea.field-input { resize: none; height: 64px; }
        .autocomplete-drop { position: absolute; top: 100%; left: 0; right: 0; z-index: 100; background: white; border: 1px solid rgba(26,107,122,0.15); border-radius: 8px; margin-top: 4px; max-height: 240px; overflow-y: auto; box-shadow: 0 8px 24px rgba(26,107,122,0.12); }
        .autocomplete-item { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid rgba(26,107,122,0.06); }
        .autocomplete-item:hover { background: rgba(26,107,122,0.04); }
        .autocomplete-name { font-size: 13px; color: #1a6b7a; font-weight: 600; margin-bottom: 2px; }
        .autocomplete-sub { font-size: 11px; color: rgba(26,107,122,0.45); }
        .rating-row { display: flex; gap: 6px; }
        .rating-btn { flex: 1; padding: 8px 0; font-size: 13px; font-weight: 700; cursor: pointer; border: 1px solid rgba(26,107,122,0.15); background: white; color: rgba(26,107,122,0.4); font-family: 'DM Sans', sans-serif; border-radius: 8px; transition: all 0.2s; }
        .rating-btn.active { background: #1a6b7a; color: white; border-color: #1a6b7a; }
        .save-btn { background: #b5654a; color: white; padding: 13px; width: 100%; border: none; cursor: pointer; border-radius: 100px; font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 700; margin-top: 4px; }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .confirm-overlay { position: fixed; inset: 0; z-index: 300; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); }
        .confirm-box { background: #f7f5f2; padding: 32px; max-width: 320px; width: 100%; text-align: center; border-radius: 20px; }
        .confirm-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1a6b7a; margin-bottom: 8px; }
        .confirm-sub { font-size: 13px; color: rgba(26,107,122,0.5); margin-bottom: 24px; }
        .confirm-btns { display: flex; gap: 10px; }
        .confirm-cancel { flex: 1; padding: 12px; background: white; border: 1px solid rgba(26,107,122,0.2); color: #1a6b7a; font-size: 13px; font-weight: 600; cursor: pointer; border-radius: 8px; }
        .confirm-delete { flex: 1; padding: 12px; background: rgba(220,50,50,0.08); border: 1px solid rgba(220,50,50,0.2); color: rgb(180,40,40); font-size: 13px; font-weight: 600; cursor: pointer; border-radius: 8px; }

        .footer { text-align: center; padding: 40px 56px; border-top: 1px solid rgba(26,107,122,0.1); }
        .footer-logo { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1a6b7a; text-decoration: none; display: block; margin-bottom: 8px; }
        .footer-text { font-size: 12px; color: rgba(26,107,122,0.35); }

        @media (max-width: 768px) {
          .profile-hero { padding: 80px 20px 16px; flex-direction: column; align-items: flex-start; gap: 14px; }
          .profile-actions { align-self: flex-start; flex-direction: row; flex-wrap: wrap; }
          .tabs { padding: 0 20px; }
          .tab-btn { padding: 14px 16px; font-size: 10px; }
          .content { padding: 20px; }
          .hotels-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .profile-stats { gap: 16px; }
          .map-container { aspect-ratio: 4/3; }
          .map-split { flex-direction: column !important; }
          .map-split > div:first-child { width: 100% !important; }
        }
        @media (max-width: 480px) {
          .hotels-grid { grid-template-columns: 1fr; }
          .profile-name { font-size: 22px; }
        }
      `}</style>

      <Nav />

      {/* PROFILE HERO */}
      <div className="profile-hero">
        <div className="avatar">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} /> : '✈️'}
        </div>
        <div className="profile-info">
          <span className="profile-eyebrow">creator</span>
          <h1 className="profile-name">{profile?.full_name || influencer.handle}</h1>
          {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-stats">
            <div><div className="stat-num">{recommendations.length}</div><div className="stat-label">Stays</div></div>
            <div><div className="stat-num">{new Set(recommendations.map(r => r.country)).size}</div><div className="stat-label">Countries</div></div>
            <div><div className="stat-num">{followerCount}</div><div className="stat-label">Followers</div></div>
          </div>
        </div>
        <div className="profile-actions">
          {isOwner ? (
            <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px'}}>
              <button onClick={() => { resetForm(); setShowAddModal(true) }} style={{background:'#b5654a', color:'white', padding:'9px 20px', borderRadius:'100px', fontSize:'12px', fontWeight:700, border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif"}}>
                + Add a Stay
              </button>
              {!isApprovedCreator && (
                <a href="/apply-creator" style={{fontSize:'11px', color:'rgba(26,107,122,0.5)', textDecoration:'none', borderBottom:'1px solid rgba(26,107,122,0.2)'}}>
                  Apply for Creator Program →
                </a>
              )}
              {isApprovedCreator && (
                <span style={{fontSize:'11px', fontWeight:700, color:'#b5654a', background:'rgba(181,101,74,0.1)', padding:'4px 10px', borderRadius:'100px'}}>
                  ✦ Creator
                </span>
              )}
            </div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px'}}>
              <button onClick={toggleFollow} style={{background: isFollowing ? 'white' : '#1a6b7a', color: isFollowing ? '#1a6b7a' : 'white', padding:'9px 20px', borderRadius:'100px', fontSize:'12px', fontWeight:700, border: isFollowing ? '1px solid rgba(26,107,122,0.3)' : 'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif"}}>
                {isFollowing ? '✓ Following' : '+ Follow'}
              </button>
              {isApprovedCreator && (
                <span style={{fontSize:'11px', fontWeight:700, color:'#b5654a', background:'rgba(181,101,74,0.1)', padding:'4px 10px', borderRadius:'100px'}}>
                  ✦ Creator
                </span>
              )}
            </div>
          )}
          <div style={{display:'flex', gap:'8px'}}>
            {influencer.instagram_url && <a href={influencer.instagram_url} target="_blank" rel="noopener noreferrer" className="social-btn">📸</a>}
            {influencer.tiktok_url && <a href={influencer.tiktok_url} target="_blank" rel="noopener noreferrer" className="social-btn">🎵</a>}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        {[{ id: 'map', label: 'Map' }, { id: 'stays', label: 'Stays' }].map(tab => (
          <button key={tab.id} className={`tab-btn${activeTab === tab.id ? ' active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="content">
        {/* MAP TAB */}
        <div style={{ display: activeTab === 'map' ? 'flex' : 'none', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ width: '50%', flexShrink: 0 }}>
            <div className="map-container" ref={mapContainer} />
          </div>
          <div style={{ flex: 1, minWidth: 0, maxHeight: '500px', overflowY: 'auto' }}>
            <div className="section-eyebrow">recent stays</div>
            <h2 className="section-title" style={{fontSize:'18px', marginBottom:'14px'}}>{profile?.full_name?.split(' ')[0]}'s stays</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {recommendations.slice(0, 5).map((rec) => (
                <div key={rec.id} onClick={() => { setSelectedHotel(rec); setShowModal(true) }}
                  style={{ background:'white', borderRadius:'12px', padding:'12px 14px', cursor:'pointer', border:'1px solid rgba(26,107,122,0.1)', boxShadow:'0 2px 8px rgba(26,107,122,0.06)', transition:'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='rgba(26,107,122,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='rgba(26,107,122,0.1)'}
                >
                  {rec.photo_url && <img src={rec.photo_url} alt={rec.hotel_name} style={{width:'100%', height:'80px', objectFit:'cover', borderRadius:'8px', marginBottom:'8px'}} />}
                  <div style={{ fontSize:'9px', letterSpacing:'2px', textTransform:'uppercase', color:'#b5654a', marginBottom:'3px' }}>📍 {[rec.city, rec.country].filter(Boolean).join(', ')}</div>
                  <div style={{ fontFamily:'Playfair Display, serif', fontSize:'14px', fontWeight:600, color:'#1a6b7a', marginBottom:'4px' }}>{rec.hotel_name}</div>
                  {rec.star_rating > 0 && <div style={{fontSize:'11px', color:'#b5654a', marginBottom:'4px'}}>{'★'.repeat(rec.star_rating)}{'☆'.repeat(5-rec.star_rating)}</div>}
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <button onClick={e => { e.stopPropagation(); toggleLike(rec.id) }} style={{background:'none', border:'none', cursor:'pointer', fontSize:'12px', color: userLikes[rec.id] ? '#e05c7a' : 'rgba(26,107,122,0.5)', fontWeight:600, padding:0}}>
                      {userLikes[rec.id] ? '❤️' : '🤍'} {likes[rec.id] || ''}
                    </button>
                    <span style={{fontSize:'11px', fontWeight:700, color:'#b5654a', cursor:'pointer'}} onClick={e => { e.stopPropagation(); setSelectedHotel(rec); setShowModal(true) }}>Book Now →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STAYS TAB */}
        {activeTab === 'stays' && (
          <div>
            <div className="section-eyebrow">all stays</div>
            <h2 className="section-title">{recommendations.length} {recommendations.length === 1 ? 'stay' : 'stays'}</h2>
            {recommendations.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(26,107,122,0.3)', fontSize:'14px' }}>
                {isOwner ? <><div style={{fontSize:'40px',marginBottom:'12px'}}>🗺️</div><div style={{marginBottom:'16px'}}>No stays yet — add your first hotel!</div><button onClick={() => { resetForm(); setShowAddModal(true) }} style={{background:'#b5654a', color:'white', padding:'10px 24px', borderRadius:'100px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'13px'}}>+ Add a Stay</button></> : <div style={{textAlign:'center', padding:'60px 0', color:'rgba(26,107,122,0.3)', fontSize:'14px'}}>No stays yet.</div>}
              </div>
            ) : (
              <div className="hotels-grid">
                {recommendations.map((rec, i) => (
                  <div key={rec.id} className="hotel-card-wrap">
                    {i === 0 && <div className="hotel-card-latest">Latest</div>}
                    {isOwner && (
                      <div className="owner-actions">
                        <button className="owner-btn" onClick={e => { e.stopPropagation(); openEdit(rec) }}>Edit</button>
                      </div>
                    )}
                    <div className="hotel-card" onClick={() => { setSelectedHotel(rec); setShowModal(true) }}>
                      {rec.photo_url ? (
                        <>
                          <img src={rec.photo_url} alt={rec.hotel_name} className="hotel-card-bg" />
                          <div className="hotel-card-gradient" />
                          <div className="hotel-card-info">
                            <div className="hotel-card-loc">📍 {[rec.city, rec.country].filter(Boolean).join(', ')}</div>
                            <div className="hotel-card-name">{rec.hotel_name}</div>
                            {rec.star_rating > 0 && <div style={{fontSize:'13px', color:'#b5654a', marginBottom:'6px', letterSpacing:'2px'}}>{'★'.repeat(rec.star_rating)}</div>}
                            <button className="hotel-card-book" onClick={e => { e.stopPropagation(); setSelectedHotel(rec); setShowModal(true) }}>Book Now →</button>
                          </div>
                        </>
                      ) : (
                        <div className="hotel-card-nophoto">
                          <div className="hotel-card-loc-dark">📍 {[rec.city, rec.country].filter(Boolean).join(', ')}</div>
                          <div className="hotel-card-name-dark">{rec.hotel_name}</div>
                          <button className="hotel-card-book" onClick={e => { e.stopPropagation(); setSelectedHotel(rec); setShowModal(true) }}>Book Now →</button>
                        </div>
                      )}
                    </div>
                    <div className="card-actions">
                      <button className={`like-btn${userLikes[rec.id] ? ' liked' : ''}`} onClick={() => toggleLike(rec.id)}>
                        {userLikes[rec.id] ? '❤️' : '🤍'} {likes[rec.id] > 0 ? likes[rec.id] : ''}
                      </button>
                      <button className="comment-btn" onClick={() => setShowComments(prev => ({...prev, [rec.id]: !prev[rec.id]}))}>
                        💬 {comments[rec.id]?.length > 0 ? comments[rec.id].length : ''}
                      </button>
                    </div>
                    {showComments[rec.id] && (
                      <div className="comments-section">
                        {comments[rec.id]?.map((cm, ci) => (
                          <div key={ci} className="comment-item">
                            <span className="comment-author">{cm.profiles?.full_name || 'User'} </span>
                            <span className="comment-text">{cm.text}</span>
                          </div>
                        ))}
                        <div className="comment-input-row">
                          <input className="comment-input" placeholder="Add a comment..." value={commentingOn === rec.id ? commentText : ''} onChange={e => { setCommentingOn(rec.id); setCommentText(e.target.value) }} onKeyDown={e => { if (e.key === 'Enter') submitComment(rec.id) }} />
                          <button className="comment-submit" onClick={() => submitComment(rec.id)}>Post</button>
                        </div>
                      </div>
                    )}
                  </div>
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
            {selectedHotel.photo_url ? (
              <div style={{position:'relative', height:'200px', overflow:'hidden', borderRadius:'20px 20px 0 0'}}>
                <img src={selectedHotel.photo_url} alt={selectedHotel.hotel_name} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                <div style={{position:'absolute', inset:0, background:'linear-gradient(to top, rgba(10,40,50,0.85) 0%, transparent 60%)'}} />
                <div style={{position:'absolute', bottom:0, left:0, right:0, padding:'16px 20px'}}>
                  <div style={{fontSize:'9px', letterSpacing:'2px', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', marginBottom:'3px'}}>📍 {[selectedHotel.city, selectedHotel.country].filter(Boolean).join(', ')}</div>
                  <h3 style={{fontFamily:"'Playfair Display',serif", fontSize:'20px', fontWeight:700, color:'white', margin:0}}>{selectedHotel.hotel_name}</h3>
                </div>
              </div>
            ) : (
              <div className="modal-body-pad" style={{paddingBottom:0}}>
                <div className="modal-loc">📍 {[selectedHotel.city, selectedHotel.country].filter(Boolean).join(', ')}</div>
                <h3 className="modal-name">{selectedHotel.hotel_name}</h3>
              </div>
            )}
            <div className="modal-body-pad">
              {selectedHotel.star_rating > 0 && (
                <div style={{fontSize:'18px', color:'#b5654a', marginBottom:'12px', letterSpacing:'2px'}}>
                  {'★'.repeat(selectedHotel.star_rating)}{'☆'.repeat(5 - selectedHotel.star_rating)}
                </div>
              )}
              {selectedHotel.influencer_quote && <div className="modal-quote">"{selectedHotel.influencer_quote}"</div>}
              <div className="modal-book-label">Book on</div>
              {selectedHotel.booking_links?.length > 0 ? selectedHotel.booking_links.map(link => (
                <a key={link.id} href={link.affiliate_url} target="_blank" rel="noopener noreferrer" className="modal-link">
                  <div><div className="modal-link-name">{link.platform}</div>{link.note && <div className="modal-link-note">{link.note}</div>}</div>
                  <span>→</span>
                </a>
              )) : (
                <a href={buildExpediaUrl(selectedHotel.hotel_name, selectedHotel.city, selectedHotel.country)}
                  target="_blank" rel="noopener noreferrer" className="modal-link">
                  <div><div className="modal-link-name">Search on Expedia</div><div className="modal-link-note">Find the best price</div></div>
                  <span>→</span>
                </a>
              )}
              <div className="modal-disclaimer">Links may be affiliate links.</div>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {(showAddModal || editRec) && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowAddModal(false); setEditRec(null); resetForm() } }}>
          <div className="add-modal">
            <div className="add-modal-header">
              <div className="add-modal-eyebrow">{editRec ? 'Edit stay' : 'New stay'}</div>
              <h2 className="add-modal-title">{editRec ? 'Edit details' : 'Add a Stay'}</h2>
              <button className="modal-close" onClick={() => { setShowAddModal(false); setEditRec(null); resetForm() }}>✕</button>
            </div>
            <form onSubmit={editRec ? handleEditSave : handleAddRecommendation} className="add-modal-body">
              <div>
                <label className="field-label">Hotel name *</label>
                <div style={{position:'relative'}}>
                  <input type="text" required value={form.hotel_name} onChange={e => editRec ? setForm({...form, hotel_name: e.target.value}) : handleHotelNameChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Start typing a hotel name..." className="field-input" autoComplete="off" />
                  {searching && <span style={{position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'11px', color:'rgba(26,107,122,0.4)'}}>searching...</span>}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="autocomplete-drop">
                      {suggestions.map((place, i) => (
                        <div key={i} className="autocomplete-item" onMouseDown={() => handleSelectSuggestion(place)}>
                          <div className="autocomplete-name">{place.name}</div>
                          <div className="autocomplete-sub">{place.address}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                <div><label className="field-label">City</label><input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Auto-filled" className="field-input" /></div>
                <div><label className="field-label">Country *</label><input type="text" required value={form.country} onChange={e => setForm({...form, country: e.target.value})} placeholder="Auto-filled" className="field-input" /></div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                <div><label className="field-label">Latitude</label><input type="text" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} placeholder="Auto-filled" className="field-input" /></div>
                <div><label className="field-label">Longitude</label><input type="text" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} placeholder="Auto-filled" className="field-input" /></div>
              </div>
              <div><label className="field-label">Your quote</label><textarea value={form.influencer_quote} onChange={e => setForm({...form, influencer_quote: e.target.value})} placeholder="What made this place special?" className="field-input" /></div>
              <div>
                <label className="field-label">Photo (optional)</label>
                <input type="url" value={form.photo_url} onChange={e => setForm({...form, photo_url: e.target.value})} placeholder="Auto-filled or paste a URL..." className="field-input" style={{marginBottom:'6px'}} />
                <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer'}}>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{display:'none'}} />
                  <span style={{padding:'6px 14px', background:'white', border:'1px solid rgba(26,107,122,0.2)', borderRadius:'6px', fontSize:'12px', color:'#1a6b7a', fontWeight:600}}>
                    {uploading ? '⏳ Uploading...' : '📁 Upload from device'}
                  </span>
                  {form.photo_url && <span style={{fontSize:'11px', color:'rgba(26,107,122,0.5)'}}>✓ Photo set</span>}
                </label>
              </div>
              <div>
                <label className="field-label">Your rating</label>
                <div className="rating-row">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" className={`rating-btn${form.personal_rating === String(n) ? ' active' : ''}`}
                      onClick={() => setForm({...form, personal_rating: String(n)})}>
                      {'★'.repeat(n)}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={saving} className="save-btn">{saving ? 'Saving...' : editRec ? 'Save changes' : 'Add Stay'}</button>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {deleteId && (
        <div className="confirm-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteId(null) }}>
          <div className="confirm-box">
            <div className="confirm-title">Remove stay?</div>
            <div className="confirm-sub">This will remove it from your profile permanently.</div>
            <div className="confirm-btns">
              <button className="confirm-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="confirm-delete" onClick={() => handleDelete(deleteId)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <Link href="/" className="footer-logo">GoThereNow</Link>
        <div className="footer-text">Travel the world through people you trust.</div>
      </footer>

    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
