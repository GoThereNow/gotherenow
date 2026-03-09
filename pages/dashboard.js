import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [influencer, setInfluencer] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    hotel_name: '', city: '', country: '',
    latitude: '', longitude: '',
    influencer_quote: '', star_rating: '5',
    price_from: '', photo_url: '',
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

  const handleAddRecommendation = async (e) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase.from('recommendations').insert({
      influencer_id: influencer.id,
      hotel_name: form.hotel_name,
      city: form.city,
      country: form.country,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      influencer_quote: form.influencer_quote,
      star_rating: parseInt(form.star_rating),
      price_from: form.price_from ? parseInt(form.price_from) : null,
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
      setForm({ hotel_name: '', city: '', country: '', latitude: '', longitude: '', influencer_quote: '', star_rating: '5', price_from: '', photo_url: '' })
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
    navigator.clipboard.writeText(`https://gotherenow.app/${influencer.handle}`)
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

      {/* NAV */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{ background: 'white', borderBottom: '1px solid rgba(28,20,16,0.08)' }}>
        <Link href="/" className="font-display text-xl text-espresso">Go<span className="text-terracotta">There</span>Now</Link>
        <div className="flex items-center gap-4">
          <a href={`/${influencer?.handle}`} target="_blank"
            className="text-xs font-semibold text-terracotta hover:underline">View my page →</a>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            className="text-xs text-muted hover:text-espresso" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* WELCOME */}
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

        {/* HOW IT WORKS BANNER */}
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

        {/* STATS */}
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

        {/* RECOMMENDATIONS */}
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
                  <div className="text-xs text-muted">{rec.city}, {rec.country}</div>
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

      {/* ADD STAY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(28,20,16,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg my-8 rounded-3xl overflow-hidden" style={{ background: 'white' }}>
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
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">📍 Map Location</p>
                <p className="text-xs text-muted mb-3">
                  Find on <a href="https://maps.google.com" target="_blank" className="text-terracotta underline">Google Maps</a>: search the hotel → right-click → copy the two numbers shown.
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

              <div className="grid grid-cols-2 gap-3">
                <Field label="Price From ($/night)">
                  <input type="number" value={form.price_from}
                    onChange={e => setForm({ ...form, price_from: e.target.value })}
                    placeholder="e.g. 350" />
                </Field>
                <Field label="Star Rating">
                  <select value={form.star_rating} onChange={e => setForm({ ...form, star_rating: e.target.value })}>
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                </Field>
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

      {/* DELETE CONFIRM */}
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
          ...children.props.style
        }
      })}
    </div>
  )
}
