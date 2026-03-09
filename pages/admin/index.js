import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('hotels')
  const [influencers, setInfluencers] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingLinks, setEditingLinks] = useState(null) // recommendation being edited
  const [linkForm, setLinkForm] = useState([
    { platform: 'Booking.com', affiliate_url: '', note: 'Best price guarantee' },
    { platform: 'Expedia', affiliate_url: '', note: 'Bundle with flights' },
    { platform: 'Direct', affiliate_url: '', note: 'Official hotel website' },
  ])
  const [saving, setSaving] = useState(false)
  const [clicks, setClicks] = useState([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/')
        return
      }
      setUser(user)

      const [{ data: infs }, { data: recs }, { data: clks }] = await Promise.all([
        supabase.from('influencers').select('*, profiles(full_name, email, avatar_url)').order('created_at', { ascending: false }),
        supabase.from('recommendations').select('*, booking_links(*), influencers(handle, profiles(full_name))').order('created_at', { ascending: false }),
        supabase.from('clicks').select('*').order('created_at', { ascending: false }).limit(500),
      ])

      setInfluencers(infs || [])
      setRecommendations(recs || [])
      setClicks(clks || [])
      setLoading(false)
    }
    load()
  }, [])

  const openLinkEditor = (rec) => {
    setEditingLinks(rec)
    setLinkForm(
      rec.booking_links?.length > 0
        ? rec.booking_links.map(l => ({ platform: l.platform, affiliate_url: l.affiliate_url, note: l.note || '' }))
        : [
            { platform: 'Booking.com', affiliate_url: '', note: 'Best price guarantee' },
            { platform: 'Expedia', affiliate_url: '', note: 'Bundle with flights' },
            { platform: 'Direct', affiliate_url: '', note: 'Official hotel website' },
          ]
    )
  }

  const saveLinks = async () => {
    setSaving(true)
    // Delete existing links
    await supabase.from('booking_links').delete().eq('recommendation_id', editingLinks.id)
    // Insert new ones
    const toInsert = linkForm.filter(l => l.affiliate_url).map(l => ({
      recommendation_id: editingLinks.id,
      platform: l.platform,
      affiliate_url: l.affiliate_url,
      note: l.note,
    }))
    if (toInsert.length > 0) {
      await supabase.from('booking_links').insert(toInsert)
    }
    // Refresh
    const { data: recs } = await supabase
      .from('recommendations')
      .select('*, booking_links(*), influencers(handle, profiles(full_name))')
      .order('created_at', { ascending: false })
    setRecommendations(recs || [])
    setSaving(false)
    setEditingLinks(null)
  }

  const updateInfluencerRate = async (id, rate) => {
    await supabase.from('influencers').update({ commission_rate: parseFloat(rate) }).eq('id', id)
    setInfluencers(prev => prev.map(i => i.id === id ? { ...i, commission_rate: rate } : i))
  }

  const approveInfluencer = async (id, approved) => {
    await supabase.from('influencers').update({ approved }).eq('id', id)
    setInfluencers(prev => prev.map(i => i.id === id ? { ...i, approved } : i))
  }

  // Clicks per influencer
  const clicksByInfluencer = influencers.map(inf => {
    const infRecs = recommendations.filter(r => r.influencers?.handle === inf.handle).map(r => r.id)
    const infClicks = clicks.filter(c => infRecs.includes(c.recommendation_id)).length
    return { ...inf, clicks: infClicks }
  })

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#FAF7F2' }}>
      <div className="font-display text-xl">Loading admin...</div>
    </div>
  )

  return (
    <>
      <Head><title>Admin — GoThereNow</title></Head>

      {/* NAV */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{ background: '#1C1410', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link href="/" className="font-display text-xl text-white">Go<span style={{ color: '#E8845A' }}>There</span>Now <span className="text-xs font-body ml-2 px-2 py-0.5 rounded-full" style={{ background: 'rgba(196,98,45,0.3)', color: '#E8845A' }}>Admin</span></Link>
        <div className="flex items-center gap-4">
          <a href="/" target="_blank" className="text-xs text-white opacity-50 hover:opacity-100">View site →</a>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            className="text-xs text-white opacity-50 hover:opacity-100" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Sign out</button>
        </div>
      </nav>

      {/* STATS BAR */}
      <div style={{ background: '#FAF7F2', borderBottom: '1px solid rgba(28,20,16,0.08)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex gap-8">
          {[
            { num: influencers.length, label: 'Creators', icon: '✈️' },
            { num: recommendations.length, label: 'Hotels', icon: '🏨' },
            { num: recommendations.filter(r => r.booking_links?.length > 0).length, label: 'With Links', icon: '🔗' },
            { num: clicks.length, label: 'Total Clicks', icon: '👆' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xl">{s.icon}</span>
              <div>
                <div className="font-display text-2xl text-espresso leading-none">{s.num}</div>
                <div className="text-xs text-muted uppercase tracking-wider">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: 'white', borderBottom: '1px solid rgba(28,20,16,0.08)' }}>
        <div className="max-w-6xl mx-auto px-6 flex gap-0">
          {[
            { id: 'hotels', label: '🏨 Manage Hotels & Links' },
            { id: 'creators', label: '✈️ Creators & Payouts' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-6 py-4 text-xs font-semibold uppercase tracking-widest transition-all"
              style={{
                color: tab === t.id ? '#C4622D' : '#8B7D72',
                borderBottom: tab === t.id ? '2px solid #C4622D' : '2px solid transparent',
                background: 'none', border_bottom: tab === t.id ? '2px solid #C4622D' : 'none',
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* HOTELS TAB */}
        {tab === 'hotels' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl text-espresso">Hotel Recommendations</h2>
                <p className="text-sm text-muted mt-1">Add your affiliate links to each hotel. Influencers only add the hotel details.</p>
              </div>
            </div>

            {recommendations.length === 0 ? (
              <div className="text-center py-16 text-muted">No recommendations yet. Influencers will add hotels from their dashboards.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {recommendations.map(rec => (
                  <div key={rec.id} className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-espresso">{rec.hotel_name}</div>
                      <div className="text-xs text-muted">{rec.city}, {rec.country} · by @{rec.influencers?.handle}</div>
                    </div>

                    {/* Link status */}
                    <div className="flex items-center gap-2">
                      {rec.booking_links?.length > 0 ? (
                        <div className="flex gap-1">
                          {rec.booking_links.map((l, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-md font-medium"
                              style={{ background: '#EEF5F1', color: '#7A9E87' }}>{l.platform}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs px-3 py-1 rounded-full font-semibold"
                          style={{ background: '#FFF0E8', color: '#C4622D' }}>⚠ No links yet</span>
                      )}
                      <button onClick={() => openLinkEditor(rec)}
                        className="text-xs font-semibold px-4 py-2 rounded-full text-white transition-colors"
                        style={{ background: '#1C1410', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                        {rec.booking_links?.length > 0 ? 'Edit Links' : '+ Add Links'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATORS TAB */}
        {tab === 'creators' && (
          <div>
            <div className="mb-6">
              <h2 className="font-display text-2xl text-espresso">Creators & Payouts</h2>
              <p className="text-sm text-muted mt-1">Manage creator approval, commission rates, and track clicks for payout calculations.</p>
            </div>

            {influencers.length === 0 ? (
              <div className="text-center py-16 text-muted">No creators signed up yet.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {clicksByInfluencer.map(inf => (
                  <div key={inf.id} className="p-5 rounded-2xl" style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #C4622D, #D4A853)' }}>
                        {inf.profiles?.avatar_url
                          ? <img src={inf.profiles.avatar_url} className="w-full h-full rounded-full object-cover" />
                          : '✈️'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-espresso">{inf.profiles?.full_name || inf.handle}</div>
                        <div className="text-xs text-muted">@{inf.handle} · {inf.profiles?.email}</div>
                      </div>

                      {/* Clicks */}
                      <div className="text-center px-4">
                        <div className="font-display text-xl text-espresso">{inf.clicks}</div>
                        <div className="text-xs text-muted uppercase tracking-wider">Clicks</div>
                      </div>

                      {/* Commission rate */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted">Commission:</label>
                        <div className="flex items-center gap-1">
                          <input type="number" min="0" max="100" step="5"
                            defaultValue={inf.commission_rate || 70}
                            onBlur={e => updateInfluencerRate(inf.id, e.target.value)}
                            className="w-16 text-center text-sm font-semibold rounded-lg px-2 py-1.5"
                            style={{ border: '1.5px solid rgba(28,20,16,0.12)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                          <span className="text-sm text-muted">%</span>
                        </div>
                      </div>

                      {/* Approve toggle */}
                      <button onClick={() => approveInfluencer(inf.id, !inf.approved)}
                        className="text-xs font-semibold px-4 py-2 rounded-full transition-all"
                        style={{
                          background: inf.approved ? '#EEF5F1' : '#FFF0E8',
                          color: inf.approved ? '#7A9E87' : '#C4622D',
                          border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
                        }}>
                        {inf.approved ? '✓ Approved' : 'Approve'}
                      </button>

                      {/* View page */}
                      <a href={`/${inf.handle}`} target="_blank"
                        className="text-xs text-muted hover:text-terracotta transition-colors">
                        View page →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* LINK EDITOR MODAL */}
      {editingLinks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(28,20,16,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setEditingLinks(null) }}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: 'white' }}>
            <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: '1px solid rgba(28,20,16,0.08)' }}>
              <div>
                <h2 className="font-display text-xl text-espresso">{editingLinks.hotel_name}</h2>
                <p className="text-xs text-muted mt-0.5">{editingLinks.city}, {editingLinks.country}</p>
              </div>
              <button onClick={() => setEditingLinks(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted"
                style={{ background: '#F5EFE6', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <div className="p-6">
              <p className="text-xs text-muted mb-4 uppercase tracking-wider font-semibold">Your Affiliate Links</p>

              <div className="flex flex-col gap-3 mb-4">
                {linkForm.map((link, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ background: '#FAF7F2', border: '1px solid rgba(28,20,16,0.08)' }}>
                    <div className="flex gap-2 mb-2">
                      <input value={link.platform}
                        onChange={e => { const f = [...linkForm]; f[i].platform = e.target.value; setLinkForm(f) }}
                        placeholder="Platform name"
                        className="w-1/3 px-3 py-2 rounded-lg text-sm"
                        style={{ border: '1.5px solid rgba(28,20,16,0.12)', fontFamily: 'DM Sans, sans-serif', outline: 'none', background: 'white' }} />
                      <input value={link.note}
                        onChange={e => { const f = [...linkForm]; f[i].note = e.target.value; setLinkForm(f) }}
                        placeholder="Note (e.g. Best price guarantee)"
                        className="flex-1 px-3 py-2 rounded-lg text-sm"
                        style={{ border: '1.5px solid rgba(28,20,16,0.12)', fontFamily: 'DM Sans, sans-serif', outline: 'none', background: 'white' }} />
                    </div>
                    <input value={link.affiliate_url}
                      onChange={e => { const f = [...linkForm]; f[i].affiliate_url = e.target.value; setLinkForm(f) }}
                      placeholder="Paste your affiliate URL here"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ border: '1.5px solid rgba(28,20,16,0.12)', fontFamily: 'DM Sans, sans-serif', outline: 'none', background: 'white' }} />
                  </div>
                ))}
              </div>

              <button onClick={() => setLinkForm([...linkForm, { platform: '', affiliate_url: '', note: '' }])}
                className="text-xs font-semibold text-terracotta mb-4 block"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>+ Add another platform</button>

              <button onClick={saveLinks} disabled={saving}
                className="w-full py-3.5 rounded-xl font-semibold text-white"
                style={{ background: '#C4622D', fontFamily: 'DM Sans, sans-serif', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Affiliate Links →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
