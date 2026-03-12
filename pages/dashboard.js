export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZ290aGVyZW5vdyIsImEiOiJjbWxmYXJpYm0wMzByM2lwcGpzNjl4Ymx5In0.lipvyNXWoQmIDCah_0Ss_w'

export default function Dashboard() {
  const router = useRouter()
  const [influencer, setInfluencer] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [copied, setCopied] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef(null)

  const [form, setForm] = useState({
    hotel_name: '', city: '', country: '',
    latitude: '', longitude: '',
    influencer_quote: '', personal_rating: '5',
    photo_url: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: inf } = await supabase
        .from('influencers')
        .select('*, profiles(full_name, avatar_url, bio)')
        .eq('user_id', user.id)
        .single()
      if (!inf) { router.push('/signup?role=influencer'); return }
      setInfluencer(inf)
      const { data: recs } = await supabase
        .from('recommendations')
        .select('*, booking_links(*)')
        .eq('influencer_id', inf.id)
        .order('created_at', { ascending: false })
      setRecommendations(recs || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleHotelNameChange = (value) => {
    setForm(prev => ({ ...prev, hotel_name: value }))
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (value.length < 5) { setSuggestions([]); setShowSuggestions(false); return }
    setSearching(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const query = encodeURIComponent(value)
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&types=poi&limit=6&language=en`
        const res = await fetch(url)
        const data = await res.json()
        if (data.features) { setSuggestions(data.features); setShowSuggestions(true) }
      } catch (err) { console.error('Autocomplete error:', err) }
      setSearching(false)
    }, 600)
  }

  const handleSelectSuggestion = (feature) => {
    const name = feature.text || feature.place_name.split(',')[0]
    const lng = feature.center[0]
    const lat = feature.center[1]
    let city = '', country = ''
    if (feature.context) {
      feature.context.forEach(ctx => {
        if ((ctx.id.startsWith('place') || ctx.id.startsWith('district') || ctx.id.startsWith('locality')) && !city) city = ctx.text
        if (ctx.id.startsWith('country')) country = ctx.text
      })
    }
    if (!city) { const parts = feature.place_name.split(','); if (parts.length > 1) city = parts[1].trim() }
    setForm(prev => ({ ...prev, hotel_name: name, city, country, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }))
    setSuggestions([]); setShowSuggestions(false)
  }

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
      const { data: recs } = await supabase
        .from('recommendations').select('*, booking_links(*)')
        .eq('influencer_id', influencer.id).order('created_at', { ascending: false })
      setRecommendations(recs || [])
      setShowAddModal(false)
      setForm({ hotel_name: '', city: '', country: '', latitude: '', longitude: '', influencer_quote: '', personal_rating: '5', photo_url: '' })
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    await supabase.from('booking_links').delete().eq('recommendation_id', id)
    await supabase.from('recommendations').delete().eq('id', id)
    setRecommendations(prev => prev.filter(r => r.id !== id))
    setDeleteId(null)
  }

  const copyLink = () => {
    navigator.clipboard.writeText('https://gotherenow.app/' + influencer.handle)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'rgb(0,86,99)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '24px', color: 'white', marginBottom: '8px' }}>Go<em>There</em>Now</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>Loading...</div>
      </div>
    </div>
  )

  const profile = influencer?.profiles
  const countries = new Set(recommendations.map(r => r.country)).size
  const bookable = recommendations.filter(r => r.booking_links?.length > 0).length

  return (
    <div style={{ background: 'rgb(0,86,99)', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <Head>
        <title>Dashboard — GoThereNow</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        .wrap { max-width: 720px; margin: 0 auto; padding: 0 24px; }

        /* HEADER */
        .dash-top { padding: 100px 0 40px; }
        .dash-topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
        .dash-greeting { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 400; color: white; margin-bottom: 10px; }
        .dash-greeting em { font-style: italic; font-weight: 300; }
        .link-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .link-label { font-size: 13px; color: rgba(255,255,255,0.4); }
        .link-url { font-size: 13px; color: white; font-weight: 500; }
        .copy-btn { padding: 6px 16px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; border-radius: 100px; }
        .copy-btn:hover { background: rgba(255,255,255,0.18); }
        .add-btn { background: white; color: rgb(0,86,99); padding: 13px 28px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; font-family: 'Playfair Display', serif; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; border-radius: 100px; }
        .add-btn:hover { background: rgba(255,255,255,0.9); }
        .sign-out-btn { background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12px; color: rgba(255,255,255,0.3); padding: 0; transition: color 0.2s; display: block; margin-top: 6px; }
        .sign-out-btn:hover { color: rgba(255,255,255,0.6); }

        /* HOW IT WORKS BOX */
        .how-box { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); padding: 18px 22px; margin-bottom: 28px; display: flex; gap: 14px; align-items: flex-start; border-radius: 16px; }
        .how-icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
        .how-title { font-size: 14px; font-weight: 600; color: white; margin-bottom: 4px; }
        .how-text { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; }

        /* STAT BUBBLES */
        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 36px; }
        .stat-bubble { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.22); padding: 24px 20px; text-align: center; border-radius: 16px; }
        .stat-icon { font-size: 24px; margin-bottom: 10px; }
        .stat-num { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 300; color: white; line-height: 1; margin-bottom: 6px; }
        .stat-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.35); }

        /* STAYS SECTION */
        .section-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 400; color: white; margin-bottom: 16px; }

        .empty-state { text-align: center; padding: 60px 0; border: 1px dashed rgba(255,255,255,0.15); }
        .empty-icon { font-size: 40px; margin-bottom: 14px; }
        .empty-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 300; color: white; margin-bottom: 6px; }
        .empty-sub { font-size: 13px; color: rgba(255,255,255,0.35); margin-bottom: 24px; }

        /* STAY ROW */
        .stay-row { display: flex; align-items: center; gap: 16px; padding: 16px 18px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.22); margin-bottom: 8px; transition: background 0.2s; border-radius: 14px; }
        .stay-row:hover { background: rgba(255,255,255,0.2); }
        .stay-thumb { width: 48px; height: 48px; flex-shrink: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 22px; background: rgba(255,255,255,0.1); border-radius: 10px; }
        .stay-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .stay-info { flex: 1; min-width: 0; }
        .stay-name { font-size: 15px; font-weight: 600; color: white; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .stay-loc { font-size: 12px; color: rgba(255,255,255,0.4); }
        .stay-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .pending-badge { padding: 5px 12px; background: rgba(255,200,50,0.15); border: 1px solid rgba(255,200,50,0.25); color: rgba(255,200,50,0.8); font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
        .live-badge { padding: 5px 12px; background: rgba(100,255,150,0.12); border: 1px solid rgba(100,255,150,0.2); color: rgba(100,255,180,0.8); font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
        .remove-btn { padding: 6px 14px; background: transparent; border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.4); font-size: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .remove-btn:hover { border-color: rgba(255,80,80,0.4); color: rgba(255,120,120,0.8); background: rgba(255,80,80,0.1); }

        /* MODAL */
        .modal-overlay { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); }
        .modal { background: rgb(0,86,99); border: 1px solid rgba(255,255,255,0.15); width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; position: relative; border-radius: 20px; }
        .modal-header { padding: 32px 36px 20px; position: sticky; top: 0; background: rgb(0,86,99); z-index: 1; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .modal-eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 6px; }
        .modal-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 300; color: white; }
        .modal-title em { font-style: italic; }
        .modal-close { position: absolute; top: 28px; right: 28px; width: 32px; height: 32px; background: rgba(255,255,255,0.1); border: none; cursor: pointer; color: white; font-size: 14px; display: flex; align-items: center; justify-content: center; }
        .modal-body { padding: 28px 36px 36px; display: flex; flex-direction: column; gap: 18px; }

        .field-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 7px; display: block; }
        .field-input { width: 100%; padding: 13px 16px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: white; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
        .field-input:focus { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.12); }
        textarea.field-input { resize: vertical; min-height: 90px; }

        .autocomplete-drop { position: absolute; top: 100%; left: 0; right: 0; z-index: 100; background: rgb(0,70,82); border: 1px solid rgba(255,255,255,0.15); margin-top: 2px; max-height: 240px; overflow-y: auto; }
        .autocomplete-item { padding: 12px 16px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.15s; }
        .autocomplete-item:hover { background: rgba(255,255,255,0.08); }
        .autocomplete-item:last-child { border-bottom: none; }
        .autocomplete-name { font-size: 14px; color: white; font-weight: 500; margin-bottom: 2px; }
        .autocomplete-sub { font-size: 12px; color: rgba(255,255,255,0.35); }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .coord-box { padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
        .coord-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 8px; }
        .coord-hint { font-size: 12px; color: rgba(255,255,255,0.3); margin-bottom: 12px; line-height: 1.5; }
        .coord-hint a { color: rgba(255,255,255,0.5); }

        .rating-row { display: flex; gap: 6px; }
        .rating-btn { flex: 1; padding: 11px 0; font-size: 14px; font-weight: 700; cursor: pointer; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
        .rating-btn.active { background: white; color: rgb(0,86,99); border-color: white; }
        .rating-sub { display: flex; justify-content: space-between; margin-top: 5px; }
        .rating-sub span { font-size: 11px; color: rgba(255,255,255,0.25); }

        .tip-box { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 14px 16px; font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.6; }
        .tip-box strong { color: rgba(255,255,255,0.6); }

        .submit-btn { width: 100%; padding: 16px; background: white; color: rgb(0,86,99); font-size: 14px; font-weight: 700; font-family: 'Playfair Display', serif; border: none; cursor: pointer; transition: all 0.2s; }
        .submit-btn:hover { background: rgba(255,255,255,0.92); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .confirm-overlay { position: fixed; inset: 0; z-index: 300; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); }
        .confirm-box { background: rgb(0,86,99); border: 1px solid rgba(255,255,255,0.15); padding: 40px; max-width: 360px; width: 100%; text-align: center; border-radius: 20px; }
        .confirm-icon { font-size: 40px; margin-bottom: 16px; }
        .confirm-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 300; color: white; margin-bottom: 8px; }
        .confirm-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 28px; }
        .confirm-btns { display: flex; gap: 10px; }
        .confirm-cancel { flex: 1; padding: 13px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); color: white; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .confirm-delete { flex: 1; padding: 13px; background: rgba(255,80,80,0.25); border: 1px solid rgba(255,80,80,0.3); color: white; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }

        @media (max-width: 600px) {
          .dash-topbar { flex-direction: column; }
          .stats-row { grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .grid-2 { grid-template-columns: 1fr; }
          .modal-header { padding: 24px 24px 16px; }
          .modal-body { padding: 20px 24px 28px; }
        }
      `}</style>

      <Nav />

      <div className="wrap">
        <div className="dash-top">

          {/* TOP BAR */}
          <div className="dash-topbar">
            <div>
              <h1 className="dash-greeting">
                Hey {profile?.full_name?.split(' ')[0] || 'there'}
              </h1>
              <div className="link-row">
                <span className="link-label">Your link:</span>
                <span className="link-url">gotherenow.app/{influencer?.handle}</span>
                <button className="copy-btn" onClick={copyLink}>{copied ? '✓ Copied!' : 'Copy link'}</button>
              </div>
              <button className="sign-out-btn" onClick={async () => { await supabase.auth.signOut(); router.push('/') }}>
                Sign out
              </button>
            </div>
            <button className="add-btn" onClick={() => setShowAddModal(true)}>+ Add a Stay</button>
          </div>

          {/* HOW IT WORKS */}
          <div className="how-box">
            <div className="how-icon">💡</div>
            <div>
              <div className="how-title">How GoThereNow works for you</div>
              <div className="how-text">You add the hotels you've stayed at. The GoThereNow team handles all booking links and affiliate setup. When your followers book, you earn — we'll handle the payouts monthly. Simple!</div>
            </div>
          </div>

          {/* STAT BUBBLES */}
          <div className="stats-row">
            {[
              { icon: '🏨', num: recommendations.length, label: 'Stays Added' },
              { icon: '🌍', num: countries, label: 'Countries' },
              { icon: '🔗', num: bookable, label: 'Bookable' },
            ].map((s, i) => (
              <div className="stat-bubble" key={i}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* STAYS LIST */}
          <div className="section-title">Your Stays</div>

          {recommendations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗺️</div>
              <div className="empty-title">No stays yet</div>
              <div className="empty-sub">Add your first hotel recommendation and share it with your followers.</div>
              <button className="add-btn" onClick={() => setShowAddModal(true)}>+ Add your first stay</button>
            </div>
          ) : (
            <div>
              {recommendations.map((rec) => (
                <div className="stay-row" key={rec.id}>
                  <div className="stay-thumb">
                    {rec.photo_url
                      ? <img src={rec.photo_url} alt={rec.hotel_name} />
                      : '🏨'}
                  </div>
                  <div className="stay-info">
                    <div className="stay-name">{rec.hotel_name}</div>
                    <div className="stay-loc">{[rec.city, rec.country].filter(Boolean).join(', ')}</div>
                  </div>
                  <div className="stay-actions">
                    {rec.booking_links?.length > 0
                      ? <span className="live-badge">Live</span>
                      : <span className="pending-badge">Pending links</span>}
                    <button className="remove-btn" onClick={() => setDeleteId(rec.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false) }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-eyebrow">New recommendation</div>
              <h2 className="modal-title">Add a <em>stay</em></h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddRecommendation} className="modal-body">

              <div>
                <label className="field-label">Hotel name *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text" required
                    value={form.hotel_name}
                    onChange={e => handleHotelNameChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Start typing a hotel name..."
                    autoComplete="off"
                    className="field-input"
                  />
                  {searching && (
                    <div style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>
                      searching...
                    </div>
                  )}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="autocomplete-drop">
                      {suggestions.map((feature, i) => {
                        const name = feature.text || feature.place_name.split(',')[0]
                        const subtitle = feature.place_name.split(',').slice(1).join(',').trim()
                        return (
                          <div key={i} className="autocomplete-item" onMouseDown={() => handleSelectSuggestion(feature)}>
                            <div className="autocomplete-name">{name}</div>
                            <div className="autocomplete-sub">{subtitle}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label className="field-label">City</label>
                  <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Auto-filled" className="field-input" />
                </div>
                <div>
                  <label className="field-label">Country *</label>
                  <input type="text" required value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Auto-filled" className="field-input" />
                </div>
              </div>

              <div className="coord-box">
                <div className="coord-label">📍 Map Location</div>
                <div className="coord-hint">
                  Auto-filled when you select a hotel above. Or find on <a href="https://maps.google.com" target="_blank">Google Maps</a>: right-click → copy coordinates.
                </div>
                <div className="grid-2">
                  <div>
                    <label className="field-label">Latitude</label>
                    <input type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="e.g. 35.0116" className="field-input" />
                  </div>
                  <div>
                    <label className="field-label">Longitude</label>
                    <input type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="e.g. 135.768" className="field-input" />
                  </div>
                </div>
              </div>

              <div>
                <label className="field-label">Your personal quote</label>
                <textarea value={form.influencer_quote} onChange={e => setForm({ ...form, influencer_quote: e.target.value })} placeholder="What made this place special? Your followers trust your voice." className="field-input" />
              </div>

              <div>
                <label className="field-label">Your rating</label>
                <div className="rating-row">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button"
                      className={`rating-btn${parseInt(form.personal_rating) === n ? ' active' : ''}`}
                      onClick={() => setForm({ ...form, personal_rating: String(n) })}>
                      {n}★
                    </button>
                  ))}
                </div>
                <div className="rating-sub">
                  <span>It was ok</span>
                  <span>Absolutely loved it</span>
                </div>
              </div>

              <div>
                <label className="field-label">Photo URL (optional)</label>
                <input type="url" value={form.photo_url} onChange={e => setForm({ ...form, photo_url: e.target.value })} placeholder="Paste a photo link from Google, hotel website, etc." className="field-input" />
              </div>

              <div className="tip-box">
                💡 <strong>That's it!</strong> The GoThereNow team will add booking links to your hotel within 24 hours.
              </div>

              <button type="submit" disabled={saving} className="submit-btn">
                {saving ? 'Saving...' : 'Save stay →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteId && (
        <div className="confirm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteId(null) }}>
          <div className="confirm-box">
            <div className="confirm-icon">🗑️</div>
            <div className="confirm-title">Remove this stay?</div>
            <div className="confirm-sub">This will remove it from your map page permanently.</div>
            <div className="confirm-btns">
              <button className="confirm-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="confirm-delete" onClick={() => handleDelete(deleteId)}>Remove</button>
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
