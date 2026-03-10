export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

const PLATFORM_CONFIG = [
  // Direct platforms
  {
    group: 'Direct Platforms',
    desc: 'You manage these affiliate accounts directly — no middleman, full commission.',
    color: '#7A9E87',
    platforms: [
      { name: 'Booking.com', type: 'direct', labelParam: 'label', hint: 'Your Booking.com affiliate URL. Sub-ID appended as ?label=SUBID', placeholder: 'https://www.booking.com?aid=YOUR_AID' },
      { name: 'Expedia', type: 'direct', labelParam: 'affcid', hint: 'Expedia + Hotels.com share one affiliate account (both owned by Expedia Group)', placeholder: 'https://www.expedia.com?affcid=YOUR_ID' },
      { name: 'Hotels.com', type: 'direct', labelParam: 'ref', hint: 'Same affiliate account as Expedia', placeholder: 'https://www.hotels.com?ref=YOUR_ID' },
      { name: 'Airbnb', type: 'direct', labelParam: 'af_id', hint: 'Airbnb direct affiliate program. Apply at airbnb.com/associates', placeholder: 'https://www.airbnb.com?af_id=YOUR_ID' },
    ]
  },
  // Travelpayouts
  {
    group: 'Travelpayouts',
    desc: 'Covers 100+ travel platforms (Hostelworld, Vrbo, GetYourGuide, Viator, etc.) through one account. They take 30% — worth it for the long tail.',
    color: '#D4A853',
    platforms: [
      { name: 'Travelpayouts', type: 'travelpayouts', hint: 'Enter your Travelpayouts Marker ID and Partner ID from your dashboard at travelpayouts.com', placeholder: '' },
    ]
  },
  // Restaurants
  {
    group: 'Restaurants (Coming Soon)',
    desc: 'Ready for when you expand to restaurant recommendations.',
    color: '#C4622D',
    platforms: [
      { name: 'OpenTable', type: 'restaurant', labelParam: 'ref', hint: 'OpenTable affiliate program. Apply at partners.opentable.com', placeholder: 'https://www.opentable.com?ref=YOUR_ID' },
    ]
  },
]

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState('platforms')
  const [influencers, setInfluencers] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [clicks, setClicks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // Platform settings state
  const [platformData, setPlatformData] = useState({
    'Booking.com': { base_url: '', label_param: 'label' },
    'Expedia': { base_url: '', label_param: 'affcid' },
    'Hotels.com': { base_url: '', label_param: 'ref' },
    'Airbnb': { base_url: '', label_param: 'af_id' },
    'Travelpayouts': { travelpayouts_marker: '', travelpayouts_partner_id: '' },
    'OpenTable': { base_url: '', label_param: 'ref' },
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) { router.push('/'); return }

      const [{ data: infs }, { data: recs }, { data: plats }, { data: clks }] = await Promise.all([
        supabase.from('influencers').select('*, profiles(full_name, email)').order('created_at', { ascending: false }),
        supabase.from('recommendations').select('*, influencers(handle, profiles(full_name))').order('created_at', { ascending: false }),
        supabase.from('platform_settings').select('*'),
        supabase.from('clicks').select('*').order('created_at', { ascending: false }),
      ])

      setInfluencers(infs || [])
      setRecommendations(recs || [])
      setClicks(clks || [])

      if (plats?.length > 0) {
        setPlatformData(prev => {
          const updated = { ...prev }
          plats.forEach(p => { if (updated[p.platform]) updated[p.platform] = { ...updated[p.platform], ...p } })
          return updated
        })
      }
      setLoading(false)
    }
    load()
  }, [])

 const savePlatforms = async () => {
  setSaving(true)
  const entries = Object.entries(platformData)
  await Promise.all(
    entries
      .filter(([_, data]) => data.base_url || data.travelpayouts_marker)
      .map(([platform, data]) =>
        supabase.from('platform_settings').upsert({ platform, ...data }, { onConflict: 'platform' })
      )
  )
  setSaving(false)
  setSavedMsg('Saved! ✓')
  setTimeout(() => setSavedMsg(''), 2500)
}

  const updateField = (platform, field, value) => {
    setPlatformData(prev => ({ ...prev, [platform]: { ...prev[platform], [field]: value } }))
  }

  const updateSubId = async (id, subId) => {
    await supabase.from('influencers').update({ sub_id: subId }).eq('id', id)
    setInfluencers(prev => prev.map(i => i.id === id ? { ...i, sub_id: subId } : i))
  }

  const updateCommission = async (id, rate) => {
    await supabase.from('influencers').update({ commission_rate: parseFloat(rate) }).eq('id', id)
    setInfluencers(prev => prev.map(i => i.id === id ? { ...i, commission_rate: rate } : i))
  }

  const approveInfluencer = async (id, approved) => {
    await supabase.from('influencers').update({ approved }).eq('id', id)
    setInfluencers(prev => prev.map(i => i.id === id ? { ...i, approved } : i))
  }

  // Payout data
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyClicks = clicks.filter(c => c.created_at?.startsWith(currentMonth))

  const payoutData = influencers.map(inf => {
    const infClicks = monthlyClicks.filter(c => c.influencer_id === inf.id)
    const byPlatform = {}
    const byType = { direct: 0, travelpayouts: 0, restaurant: 0 }
    infClicks.forEach(c => {
      byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1
      if (c.content_type === 'restaurant') byType.restaurant++
      else if (c.is_direct) byType.direct++
      else byType.travelpayouts++
    })
    return { ...inf, totalClicks: infClicks.length, byPlatform, byType }
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
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4" style={{ background: '#1C1410' }}>
        <Link href="/" className="font-display text-xl text-white">
          Go<span style={{ color: '#E8845A' }}>There</span>Now
          <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: 'rgba(196,98,45,0.3)', color: '#E8845A', fontFamily: 'DM Sans, sans-serif' }}>Admin</span>
        </Link>
        <div className="flex gap-4">
          <a href="/" target="_blank" className="text-xs text-white opacity-40 hover:opacity-100">View site →</a>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            className="text-xs text-white opacity-40 hover:opacity-100"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Sign out</button>
        </div>
      </nav>

      {/* STATS */}
      <div style={{ background: '#FAF7F2', borderBottom: '1px solid rgba(28,20,16,0.08)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex gap-8 flex-wrap">
          {[
            { num: influencers.length, label: 'Creators', icon: '✈️' },
            { num: recommendations.length, label: 'Hotels', icon: '🏨' },
            { num: monthlyClicks.length, label: 'Clicks This Month', icon: '👆' },
            { num: monthlyClicks.filter(c => c.is_direct).length, label: 'Direct Clicks', icon: '💰' },
            { num: monthlyClicks.filter(c => !c.is_direct).length, label: 'Travelpayouts Clicks', icon: '🔗' },
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
        <div className="max-w-6xl mx-auto px-6 flex overflow-x-auto">
          {[
            { id: 'platforms', label: '🔗 Affiliate Setup' },
            { id: 'creators', label: '✈️ Creators & Sub-IDs' },
            { id: 'payouts', label: '💰 Payouts' },
            { id: 'hotels', label: '🏨 Hotels' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-5 py-4 text-xs font-semibold uppercase tracking-widest whitespace-nowrap transition-all"
              style={{
                color: tab === t.id ? '#C4622D' : '#8B7D72',
                borderBottom: tab === t.id ? '2px solid #C4622D' : '2px solid transparent',
                background: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* PLATFORMS TAB */}
        {tab === 'platforms' && (
          <div>
            <div className="mb-6">
              <h2 className="font-display text-2xl text-espresso">Affiliate Setup</h2>
              <p className="text-sm text-muted mt-1">Configure your hybrid affiliate system. Enter URLs once — sub-IDs are appended automatically per influencer.</p>
            </div>

            {PLATFORM_CONFIG.map(group => (
              <div key={group.group} className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: group.color }} />
                  <h3 className="font-semibold text-espresso text-lg">{group.group}</h3>
                </div>
                <p className="text-xs text-muted mb-4 ml-6">{group.desc}</p>

                <div className="flex flex-col gap-4 ml-6">
                  {group.platforms.map(p => (
                    <div key={p.name} className="p-5 rounded-2xl" style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="font-semibold text-espresso">{p.name}</div>
                        {platformData[p.name]?.base_url || platformData[p.name]?.travelpayouts_marker ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#EEF5F1', color: '#7A9E87' }}>✓ Configured</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#FFF0E8', color: '#C4622D' }}>Not set up</span>
                        )}
                      </div>
                      <p className="text-xs text-muted mb-3">{p.hint}</p>

                      {p.type === 'travelpayouts' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">Marker ID</label>
                            <input value={platformData['Travelpayouts']?.travelpayouts_marker || ''}
                              onChange={e => updateField('Travelpayouts', 'travelpayouts_marker', e.target.value)}
                              placeholder="Your Travelpayouts Marker ID"
                              className="w-full px-3 py-2.5 rounded-xl text-sm"
                              style={{ border: '1.5px solid rgba(28,20,16,0.12)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                          </div>
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">Partner ID</label>
                            <input value={platformData['Travelpayouts']?.travelpayouts_partner_id || ''}
                              onChange={e => updateField('Travelpayouts', 'travelpayouts_partner_id', e.target.value)}
                              placeholder="Your Travelpayouts Partner ID"
                              className="w-full px-3 py-2.5 rounded-xl text-sm"
                              style={{ border: '1.5px solid rgba(28,20,16,0.12)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                          </div>
                        </div>
                      ) : (
                        <input value={platformData[p.name]?.base_url || ''}
                          onChange={e => updateField(p.name, 'base_url', e.target.value)}
                          placeholder={p.placeholder}
                          className="w-full px-3 py-2.5 rounded-xl text-sm"
                          style={{ border: '1.5px solid rgba(28,20,16,0.12)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={savePlatforms} disabled={saving}
              className="px-8 py-4 rounded-full font-semibold text-white transition-all hover:scale-105"
              style={{ background: '#C4622D', fontFamily: 'DM Sans, sans-serif', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : savedMsg || 'Save All Platform Settings →'}
            </button>
          </div>
        )}

        {/* CREATORS TAB */}
        {tab === 'creators' && (
          <div>
            <div className="mb-6">
              <h2 className="font-display text-2xl text-espresso">Creators & Sub-IDs</h2>
              <p className="text-sm text-muted mt-1">One sub-ID per creator. Automatically appended to every booking link across all platforms.</p>
            </div>

            {influencers.length === 0 ? (
              <div className="text-center py-16 text-muted">No creators yet.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {influencers.map(inf => (
                  <div key={inf.id} className="p-5 rounded-2xl" style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #C4622D, #D4A853)' }}>✈️</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-espresso">{inf.profiles?.full_name || inf.handle}</div>
                        <div className="text-xs text-muted">@{inf.handle} · {inf.profiles?.email}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-muted uppercase tracking-wider">Sub-ID:</label>
                        <input defaultValue={inf.sub_id || inf.handle}
                          onBlur={e => updateSubId(inf.id, e.target.value)}
                          className="w-28 text-center text-sm font-semibold rounded-lg px-3 py-2"
                          style={{ border: '1.5px solid rgba(28,20,16,0.12)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-muted uppercase tracking-wider">Commission:</label>
                        <input type="number" min="0" max="100" step="5"
                          defaultValue={inf.commission_rate || 70}
                          onBlur={e => updateCommission(inf.id, e.target.value)}
                          className="w-14 text-center text-sm font-semibold rounded-lg px-2 py-2"
                          style={{ border: '1.5px solid rgba(28,20,16,0.12)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                        <span className="text-sm text-muted">%</span>
                      </div>

                      <button onClick={() => approveInfluencer(inf.id, !inf.approved)}
                        className="text-xs font-semibold px-4 py-2 rounded-full"
                        style={{
                          background: inf.approved !== false ? '#EEF5F1' : '#FFF0E8',
                          color: inf.approved !== false ? '#7A9E87' : '#C4622D',
                          border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
                        }}>
                        {inf.approved !== false ? '✓ Approved' : 'Approve'}
                      </button>

                      <a href={`/${inf.handle}`} target="_blank" className="text-xs text-muted hover:text-terracotta">View →</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PAYOUTS TAB */}
        {tab === 'payouts' && (
          <div>
            <div className="mb-6">
              <h2 className="font-display text-2xl text-espresso">Monthly Payouts</h2>
              <p className="text-sm text-muted mt-1">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} · Cross-reference Direct clicks with Booking.com/Expedia/Airbnb dashboards using sub-IDs. Cross-reference Travelpayouts clicks with your Travelpayouts dashboard.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Direct Platform Clicks', num: monthlyClicks.filter(c => c.is_direct).length, color: '#7A9E87', note: 'Check Booking.com, Expedia, Airbnb dashboards' },
                { label: 'Travelpayouts Clicks', num: monthlyClicks.filter(c => !c.is_direct && c.content_type !== 'restaurant').length, color: '#D4A853', note: 'Check Travelpayouts dashboard' },
                { label: 'Restaurant Clicks', num: monthlyClicks.filter(c => c.content_type === 'restaurant').length, color: '#C4622D', note: 'Check OpenTable dashboard' },
              ].map((s, i) => (
                <div key={i} className="p-5 rounded-2xl" style={{ background: 'white', border: `1px solid ${s.color}33` }}>
                  <div className="font-display text-3xl mb-1" style={{ color: s.color }}>{s.num}</div>
                  <div className="font-semibold text-sm text-espresso mb-1">{s.label}</div>
                  <div className="text-xs text-muted">{s.note}</div>
                </div>
              ))}
            </div>

            {payoutData.filter(i => i.totalClicks > 0).length === 0 ? (
              <div className="text-center py-16 rounded-2xl text-muted" style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                No clicks recorded yet this month.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {payoutData.filter(i => i.totalClicks > 0).map(inf => (
                  <div key={inf.id} className="p-5 rounded-2xl" style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="font-semibold text-espresso">{inf.profiles?.full_name || inf.handle}</div>
                        <div className="text-xs text-muted">Sub-ID: <code className="text-espresso font-semibold">{inf.sub_id || inf.handle}</code></div>
                      </div>
                      <div className="flex gap-4 flex-wrap">
                        <div className="text-center px-3">
                          <div className="font-display text-xl text-espresso">{inf.totalClicks}</div>
                          <div className="text-xs text-muted">Total</div>
                        </div>
                        <div className="text-center px-3">
                          <div className="font-display text-xl" style={{ color: '#7A9E87' }}>{inf.byType.direct}</div>
                          <div className="text-xs text-muted">Direct</div>
                        </div>
                        <div className="text-center px-3">
                          <div className="font-display text-xl" style={{ color: '#D4A853' }}>{inf.byType.travelpayouts}</div>
                          <div className="text-xs text-muted">Travelpayouts</div>
                        </div>
                        <div className="text-center px-3">
                          <div className="font-display text-xl text-terracotta">{inf.commission_rate || 70}%</div>
                          <div className="text-xs text-muted">Their cut</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HOTELS TAB */}
        {tab === 'hotels' && (
          <div>
            <div className="mb-6">
              <h2 className="font-display text-2xl text-espresso">All Hotels</h2>
              <p className="text-sm text-muted mt-1">All recommendations. Booking links are auto-generated with each influencer's sub-ID — no manual work needed.</p>
            </div>
            {recommendations.length === 0 ? (
              <div className="text-center py-16 text-muted">No recommendations yet.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {recommendations.map(rec => (
                  <div key={rec.id} className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-espresso">{rec.hotel_name}</div>
                      <div className="text-xs text-muted">{rec.city}, {rec.country} · by @{rec.influencers?.handle}</div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: '#EEF5F1', color: '#7A9E87' }}>✓ Auto-tracked</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  )
}
