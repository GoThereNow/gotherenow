import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [influencer, setInfluencer] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const [form, setForm] = useState({
    hotel_name: '', city: '', country: '',
    latitude: '', longitude: '',
    influencer_quote: '', star_rating: 5,
    price_from: '', photo_url: '',
    booking_links: [{ platform: 'Booking.com', affiliate_url: '', note: '' }]
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

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

  const handleAddRecommendation = async (e) => {
    e.preventDefault()
    setSaving(true)

    const { data: rec, error } = await supabase
      .from('recommendations')
      .insert({
        influencer_id: influencer.id,
        hotel_name: form.hotel_name,
        city: form.city,
        country: form.country,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        influencer_quote: form.influencer_quote,
        star_rating: form.star_rating,
        price_from: form.price_from ? parseInt(form.price_from) : null,
        photo_url: form.photo_url || null,
      })
      .select()
      .single()

    if (!error && rec) {
      // Add booking links
      const links = form.booking_links.filter(l => l.affiliate_url)
      if (links.length > 0) {
        await supabase.from('booking_links').insert(
          links.map(l => ({ recommendation_id: rec.id, ...l }))
        )
      }

      // Refresh
      const { data: recs } = await supabase
        .from('recommendations')
        .select('*, booking_links(*)')
        .eq('influencer_id', influencer.id)
        .order('created_at', { ascending: false })
      setRecommendations(recs || [])
    }

    setSaving(false)
    setShowAddModal(false)
    setForm({
      hotel_name: '', city: '', country: '', latitude: '', longitude: '',
      influencer_quote: '', star_rating: 5, price_from: '', photo_url: '',
      booking_links: [{ platform: 'Booking.com', affiliate_url: '', note: '' }]
    })
  }

  const handleDelete = async (id) => {
    await supabase.from('booking_links').delete().eq('recommendation_id', id)
    await supabase.from('recommendations').delete().eq('id', id)
    setRecommendations(prev => prev.filter(r => r.id !== id))
    setDeleteId(null)
  }

  const addBookingLink = () => {
    setForm(prev => ({ ...prev, booking_links: [...prev.booking_links, { platform: '', affiliate_url: '', note: '' }] }))
  }

  const updateBookingLink = (i, field, val) => {
    setForm(prev => {
      const links = [...prev.booking_links]
      links[i] = { ...links[i], [field]: val }
      return { ...prev, booking_links: links }
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#FAF7F2' }}>
      <div className="font-display text-xl text-espresso">Loading dashboard...</div>
    </div>
  )

  const profileUrl = `gotherenow.app/@${influencer?.handle}`

  return (
    <>
      <Head><title>Dashboard — GoThereNow</title></Head>

      {/* NAV */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{ background: 'white', borderBottom: '1px solid rgba(28,20,16,0.08)' }}>
        <Link href="/" className="font-display text-xl text-espresso">Go<span className="text-terracotta">There</span>Now</Link>
        <div className="flex items-center gap-4">
          <a href={`/@${influencer?.handle}`} target="_blank" rel="noopener noreferrer"
            className="text-xs font-semibold text-terracotta hover:underline">
            View my page →
          </a>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            className="text-xs text-muted hover:text-espresso">Sign out</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-3xl text-espresso mb-1">
              Welcome back, {influencer?.profiles?.full_name?.split(' ')[0] || 'Creator'} 👋
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Your page:</span>
              <a href={`/@${influencer?.handle}`} target="_blank"
                className="text-sm font-medium text-terracotta hover:underline">{profileUrl}</a>
              <button onClick={() => { navigator.clipboard.writeText(`https://${profileUrl}`) }}
                className="text-xs px-2 py-1 rounded-md text-muted hover:text-espresso transition-colors"
                style={{ background: '#F5EFE6' }}>Copy link</button>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all hover:scale-105"
            style={{ background: '#C4622D', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
            + Add a Stay
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { num: recommendations.length, label: 'Total Stays', icon: '🏨' },
            { num: new Set(recommendations.map(r => r.country)).size, label: 'Countries', icon: '🌍' },
            { num: recommendations.reduce((a, r) => a + (r.booking_links?.length || 0), 0), label: 'Booking Links', icon: '🔗' },
          ].map((s, i) => (
            <div key={i} className="p-5 rounded-2xl text-center" style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-display text-3xl text-espresso">{s.num}</div>
              <div className="text-xs text-muted uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* RECOMMENDATIONS LIST */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-espresso">Your Recommendations</h2>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: 'white', border: '2px dashed rgba(196,98,45,0.2)' }}>
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="font-display text-xl text-espresso mb-2">No stays yet</h3>
            <p className="text-sm text-muted mb-6">Add your first hotel recommendation to get started.</p>
            <button onClick={() => setShowAddModal(true)}
              className="px-6 py-3 rounded-full font-semibold text-white"
              style={{ background: '#C4622D', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
              + Add your first stay
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:shadow-sm"
                style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-xl overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #C4622D22, #D4A85322)' }}>
                  {rec.photo_url ? <img src={rec.photo_url} className="w-full h-full object-cover" /> : '🏨'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-espresso text-sm truncate">{rec.hotel_name}</div>
                  <div className="text-xs text-muted">{rec.city}, {rec.country}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {rec.price_from && <span className="text-xs font-medium text-muted">${rec.price_from}/night</span>}
                  <span className="text-xs px-2 py-1 rounded-md" style={{ background: '#F5EFE6', color: '#8B7D72' }}>
                    {rec.booking_links?.length || 0} links
                  </span>
                  <button onClick={() => setDeleteId(rec.id)}
                    className="text-xs px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                    style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD STAY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(28,20,16,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-xl my-8 rounded-3xl overflow-hidden" style={{ background: 'white' }}>
            <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: '1px solid rgba(28,20,16,0.08)' }}>
              <h2 className="font-display text-xl text-espresso">Add a Stay</h2>
              <button onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted"
                style={{ background: '#F5EFE6', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleAddRecommendation} className="p-6 flex flex-col gap-4">

              <Field label="Hotel Name" required>
                <input type="text" required value={form.hotel_name}
                  onChange={e => setForm({ ...form, hotel_name: e.target.value })}
                  placeholder="e.g. Aman Kyoto" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="City" required>
                  <input type="text" required value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Kyoto" />
                </Field>
                <Field label="Country" required>
                  <input type="text" required value={form.country}
                    onChange={e => setForm({ ...form, country: e.target.value })}
                    placeholder="e.g. Japan" />
                </Field>
              </div>

              <div className="p-4 rounded-xl" style={{ background: '#F5EFE6' }}>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">📍 Map Coordinates</p>
                <p className="text-xs text-muted mb-3">Find these on <a href="https://maps.google.com" target="_blank" className="text-terracotta underline">Google Maps</a>: right-click on the hotel location and copy the numbers.</p>
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

              <div className="grid grid-cols-2 gap-3">
                <Field label="Price From ($/night)">
                  <input type="number" value={form.price_from}
                    onChange={e => setForm({ ...form, price_from: e.target.value })}
                    placeholder="e.g. 350" />
                </Field>
                <Field label="Star Rating">
                  <select value={form.star_rating} onChange={e => setForm({ ...form, star_rating: e.target.value })}>
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Photo URL (optional)">
                <input type="url" value={form.photo_url}
                  onChange={e => setForm({ ...form, photo_url: e.target.value })}
                  placeholder="https://... (paste a photo link)" />
              </Field>

              {/* Booking Links */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">Booking Links</label>
                  <button type="button" onClick={addBookingLink}
                    className="text-xs font-semibold text-terracotta"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}>+ Add link</button>
                </div>
                {form.booking_links.map((link, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={link.platform} onChange={e => updateBookingLink(i, 'platform', e.target.value)}
                      placeholder="Platform" className="w-1/3"
                      style={{ padding: '10px 12px', borderRadius: '10px', border: '1.5px solid rgba(28,20,16,0.12)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                    <input value={link.affiliate_url} onChange={e => updateBookingLink(i, 'affiliate_url', e.target.value)}
                      placeholder="Your affiliate URL" className="flex-1"
                      style={{ padding: '10px 12px', borderRadius: '10px', border: '1.5px solid rgba(28,20,16,0.12)', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                  </div>
                ))}
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-4 rounded-xl font-semibold text-white mt-2"
                style={{ background: '#C4622D', fontFamily: 'DM Sans, sans-serif', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Recommendation →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(28,20,16,0.6)' }}>
          <div className="p-8 rounded-2xl max-w-sm w-full text-center" style={{ background: 'white' }}>
            <div className="text-3xl mb-4">🗑️</div>
            <h3 className="font-display text-xl text-espresso mb-2">Delete this stay?</h3>
            <p className="text-sm text-muted mb-6">This will remove the recommendation and all its booking links.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-xl font-semibold text-espresso"
                style={{ background: '#F5EFE6', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 py-3 rounded-xl font-semibold text-white"
                style={{ background: '#ef4444', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

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
          ...children.props.style
        }
      })}
    </div>
  )
}

// Need React for cloneElement
import React from 'react'
