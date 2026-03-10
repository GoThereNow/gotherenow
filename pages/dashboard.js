export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

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
    if (value.length < 5) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    setSearching(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const query = encodeURIComponent(value)
        const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(query + ' hotel') + '.json?access_token=' + MAPBOX_TOKEN + '&types=poi&limit=6&language=en'
        const res = await fetch(url)
        const data = await res.json()
        if (data.features) {
          setSuggestions(data.features)
          setShowSuggestions(true)
        }
      } catch (err) {
        console.error('Autocomplete error:', err)
      }
      setSearching(false)
    }, 600)
  }

  const handleSelectSuggestion = (feature) => {
    const name = feature.text || feature.place_name.split(',')[0]
    const lng = feature.center[0]
    const lat = feature.center[1]
    let city = ''
    let country = ''
    if (feature.context) {
      feature.context.forEach(function(ctx) {
        if ((ctx.id.startsWith('place') || ctx.id.startsWith('district') || ctx.id.startsWith('locality')) && !city) {
          city = ctx.text
        }
        if (ctx.id.startsWith('country')) {
          country = ctx.text
        }
      })
    }
    if (!city) {
      const parts = feature.place_name.split(',')
      if (parts.length > 1) city = parts[1].trim()
    }
    setForm(prev => ({
      ...prev,
      hotel_name: name,
      city: city,
      country: country,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }))
    setSuggestions([])
    setShowSuggestions(false)
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
        .from('recommendations')
        .select('*, booking_links(*)')
        .eq('influencer_id', influencer.id)
        .order('created_at', { ascending: false })
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
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#FAF7F2' }}>
      <div className="font-display text-xl text-espresso">Loading...</div>
    </div>
  )

  const profile = influencer?.profiles

  return (
    <>
      <Head><title>Dashboard — GoThereNow</title></Head>

      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{ background: 'white', borderBottom: '1px solid rgba(28,20,16,0.08)' }}>
        <Link href="/" className="font-display text-xl text-espresso">Go<span className="text-terracotta">There</span>Now</Link>
        <div className="flex items-center gap-4">
          <a href={'/' + influencer?.handle} target="_blank" className="text-xs font-semibold text-terracotta hover:underline">View my page →</a>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            className="text-xs text-muted hover:text-espresso" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-3xl text-espresso mb-1">
              Hey {profile?.full_name?.split(' ')[0] || 'there'} 👋
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted">Your link:</span>
              <span className="text-sm font-medium text-espresso">gotherenow.app/{influencer?.handle}</span>
              <button onClick={copyLink}
                className="text-xs px-3 py-1 rounded-full font-semibold transition-all"
                style={{ background: copied ? '#EEF5F1' : '#F5EFE6', color: copied ? '#7A9E87' : '#8B7D72', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                {copied ? '✓ Copied!' : 'Copy link'}
              </button>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all hover:scale-105 flex-shrink-0"
            style={{ background: '#C4622D', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
            + Add a Stay
          </button>
        </div>

        <div className="p-5 rounded-2xl mb-8 flex gap-4 items-start"
          style={{ background: '#FFF8F2', border: '1px solid rgba(196,98,45,0.15)' }}>
          <div className="text-2xl">💡</div>
          <div>
            <div className="font-semibold text-espresso text-sm mb-1">How GoThereNow works for you</div>
            <div className="text-xs text-muted leading-relaxed">
              You add the hotels you've stayed at. The GoThereNow team handles all booking links and affiliate setup. When your followers book, you earn — we'll handle the payouts monthly. Simple!
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { num: recommendations.length, label: 'Stays Added', icon: '🏨' },
            { num: new Set(recommendations.map(r => r.country)).size || 0, label: 'Countries', icon: '🌍' },
            { num: recommendations.filter(r => r.booking_links?.length > 0).length, label: 'Bookable', icon: '🔗' },
          ].map((s, i) => (
            <div key={i} className="p-5 rounded-2xl text-center" style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-display text-3xl text-espresso">{s.num}</div>
              <div className="text-xs text-muted uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <h2 className="font-display text-xl text-espresso mb-4">Your Stays</h2>

        {recommendations.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: 'white', border: '2px dashed rgba(196,98,45,0.2)' }}>
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="font-display text-xl text-espresso mb-2">No stays yet</h3>
            <p className="text-sm text-muted mb-6 max-w-xs mx-auto">Add a hotel you've personally stayed at and loved. Your followers will be able to book it directly.</p>
            <button onClick={() => setShowAddModal(true)}
              className="px-6 py-3 rounded-full font-semibold text-white"
              style={{ background: '#C4622D', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
              + Add your first stay
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recommendations.map(rec => (
              <div key={rec.id} className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #C4622D22, #D4A85322)' }}>
                  {rec.photo_url ? <img src={rec.photo_url} className="w-full h-full object-cover rounded-xl" /> : '🏨'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-espresso text-sm truncate">{rec.hotel_name}</div>
                  <div className="text-xs text-muted">{[rec.city, rec.country].filter(Boolean).join(', ')}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {rec.booking_links?.length > 0 ? (
                    <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: '#EEF5F1', color: '#7A9E87' }}>✓ Bookable</span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: '#FFF0E8', color: '#C4622D' }}>Pending links</span>
                  )}
                  <button onClick={() => setDeleteId(rec.id)}
                    className="text-xs px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                    style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(28,20,16,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg my-8 rounded-3xl overflow-hidden" style={{ background: 'white' }}>
            <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: '1px solid rgba(28,20,16,0.08)' }}>
              <h2 className="font-display text-xl text-espresso">Add a Stay</h2>
              <button onClick={() => { setShowAddModal(false); setSuggestions([]); setShowSuggestions(false) }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted"
                style={{ background: '#F5EFE6', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleAddRecommendation} className="p-6 flex flex-col gap-4">

              <div style={{ position: 'relative' }}>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">
                  Hotel Name<span className="text-terracotta ml-0.5">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    value={form.hotel_name}
                    onChange={e => handleHotelNameChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Start typing a hotel name..."
                    autoComplete="off"
                    style={{
                      width: '100%', padding: '10px 14px',
                      borderRadius: '12px', border: '1.5px solid rgba(28,20,16,0.12)',
                      fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
                      outline: 'none', background: 'white', boxSizing: 'border-box'
                    }}
                  />
                  {searching && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#8B7D72' }}>
                      searching...
                    </div>
                  )}
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: 'white', borderRadius: '12px', marginTop: '4px',
                    border: '1.5px solid rgba(28,20,16,0.12)',
                    boxShadow: '0 8px 24px rgba(28,20,16,0.12)', overflow: 'hidden'
                  }}>
                    {suggestions.map((feature, i) => {
                      const name = feature.text || feature.place_name.split(',')[0]
                      const subtitle = feature.place_name.split(',').slice(1).join(',').trim()
                      return (
                        <div key={i}
                          onMouseDown={() => handleSelectSuggestion(feature)}
                          style={{
                            padding: '10px 14px', cursor: 'pointer',
                            borderBottom: i < suggestions.length - 1 ? '1px solid rgba(28,20,16,0.06)' : 'none',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAF7F2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1C1410' }}>{name}</div>
                          <div style={{ fontSize: '12px', color: '#8B7D72', marginTop: '2px' }}>{subtitle}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="City">
                  <input type="text" value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="Auto-filled or type" />
                </Field>
                <Field label="Country" required>
                  <input type="text" required value={form.country}
                    onChange={e => setForm({ ...form, country: e.target.value })}
                    placeholder="Auto-filled or type" />
                </Field>
              </div>

              <div className="p-4 rounded-xl" style={{ background: '#F5EFE6' }}>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">📍 Map Location</p>
                <p className="text-xs text-muted mb-3">
                  Auto-filled when you select a hotel above. Or find on <a href="https://maps.google.com" target="_blank" className="text-terracotta underline">Google Maps</a>: right-click the location → copy coordinates.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Latitude">
                    <input type="number" step="any" value={form.latitude}
                      onChange={e => setForm({ ...form, latitude: e.target.value })}
                      placeholder="e.g. 35.0116" />
                  </Field>
                  <Field label="Longitude">
                    <input type="number" step="any" value={form.longitude}
                      onChange={e => setForm({ ...form, longitude: e.target.value })}
                      placeholder="e.g. 135.768" />
                  </Field>
                </div>
              </div>

              <Field label="Your Personal Quote">
                <textarea value={form.influencer_quote}
                  onChange={e => setForm({ ...form, influencer_quote: e.target.value })}
                  placeholder="What made this place special? Your followers trust your voice."
                  rows={3} style={{ resize: 'vertical' }} />
              </Field>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-2">
                  Your Personal Rating
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button"
                      onClick={() => setForm({ ...form, personal_rating: String(n) })}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: '12px',
                        fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                        border: '1.5px solid',
                        borderColor: parseInt(form.personal_rating) === n ? '#C4622D' : 'rgba(28,20,16,0.12)',
                        background: parseInt(form.personal_rating) === n ? '#FFF0E8' : 'white',
                        color: parseInt(form.personal_rating) === n ? '#C4622D' : '#8B7D72',
                        fontFamily: 'DM Sans, sans-serif'
                      }}>
                      {n}★
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#8B7D72' }}>It was ok</span>
                  <span style={{ fontSize: '11px', color: '#8B7D72' }}>Absolutely loved it</span>
                </div>
              </div>

              <Field label="Photo URL (optional)">
                <input type="url" value={form.photo_url}
                  onChange={e => setForm({ ...form, photo_url: e.target.value })}
                  placeholder="Paste a photo link (from Google, hotel website, etc.)" />
              </Field>

              <div className="p-3 rounded-xl text-xs text-muted" style={{ background: '#F5EFE6' }}>
                💡 <strong>That's it!</strong> The GoThereNow team will add booking links to your hotel within 24 hours.
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-4 rounded-xl font-semibold text-white mt-1"
                style={{ background: '#C4622D', fontFamily: 'DM Sans, sans-serif', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Stay →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(28,20,16,0.6)' }}>
          <div className="p-8 rounded-2xl max-w-sm w-full text-center" style={{ background: 'white' }}>
            <div className="text-3xl mb-4">🗑️</div>
            <h3 className="font-display text-xl mb-2">Remove this stay?</h3>
            <p className="text-sm text-muted mb-6">This will remove it from your map page.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ background: '#F5EFE6', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 py-3 rounded-xl font-semibold text-white"
                style={{ background: '#ef4444', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import React from 'react'

function Field({ label, children, required }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">
        {label}{required && <span className="text-terracotta ml-0.5">*</span>}
      </label>
      {React.cloneElement(children, {
        style: {
          width: '100%', padding: '10px 14px',
          borderRadius: '12px', border: '1.5px solid rgba(28,20,16,0.12)',
          fontSize: '14px', fontFamily: 'DM Sans, sans-serif',
          outline: 'none', background: 'white',
          boxSizing: 'border-box',
          ...children.props.style
        }
      })}
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
