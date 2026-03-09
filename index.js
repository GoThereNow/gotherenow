import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState('platforms')
  const [influencers, setInfluencers] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [clicks, setClicks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // Platform form
  const [platformForm, setPlatformForm] = useState([
    { platform: 'Booking.com', base_url: '', label_param: 'label', supports_search: true },
    { platform: 'Expedia', base_url: '', label_param: 'affcid', supports_search: false },
    { platform: 'Hotels.com', base_url: '', label_param: 'ref', supports_search: false },
  ])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) { router.push('/'); return }

      const [{ data: infs }, { data: recs }, { data: plats }, { data: clks }] = await Promise.all([
        supabase.from('influencers').select('*, profiles(full_name, email, avatar_url)').order('created_at', { ascending: false }),
        supabase.from('recommendations').select('*, influencers(handle, sub_id, profiles(full_name))').order('created_at', { ascending: false }),
        supabase.from('platform_settings').select('*'),
        supabase.from('clicks').select('*').order('created_at', { ascending: false }),
      ])

      setInfluencers(infs || [])
      setRecommendations(recs || [])
      setClicks(clks || [])

      if (plats && plats.length > 0) {
        setPlatformForm(prev => prev.map(p => {
          const existing = plats.find(pl => pl.platform === p.platform)
          return existing ? { ...p, ...existing } : p
        }))
        setPlatforms(plats)
      }
      setLoading(false)
    }
    load()
  }, [])

  // Save platform settings
  const savePlatforms = async () => {
    setSaving(true)
    for (const p of platformForm) {
      if (!p.base_url) continue
      await supabase.from('platform_settings').upsert({
        platform: p.platform,
        base_url: p.base_url,
        label_param: p.label_param,
        supports_search: p.supports_search,
      }, { onConflict: 'platform' })
    }
    setSaving(false)
    setSavedMsg('Saved!')
    setTimeout(() => setSavedMsg(''), 2000)
  }

  // Update influencer sub-ID
  const updateSubId = async (id, subId) => {
    await supabase.from('influencers').update({ sub_id: subId }).eq('id', id)
    setInfluencers(prev => prev.map(i => i.id === id ? { ...i, sub_id: subId } : i))
  }

  // Update commission rate
  const updateCommission = async (id, rate) => {
    await supabase.from('influencers').update({ commission_rate: parseFloat(rate) }).eq('id', id)
    setInfluencers(prev => prev.map(i => i.id === id ? { ...i, commission_rate: rate } : i))
  }

  // Approve influencer
  const approveInfluencer = async (id, approved) => {
    await supabase.from('influencers').update({ approved }).eq('id', id)
    setInfluencers(prev => prev.map(i => i.id === id ? { ...i, approved } : i))
  }

  // Payout calculations
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyClicks = clicks.filter(c => c.created_at?.startsWith(currentMonth))

  const payoutData = influencers.map(inf => {
    const infClicks = monthlyClicks.filter(c => c.influencer_id === inf.id)
    const totalClicks = infClicks.length
    const byPlatform = {}
    infClicks.forEach(c => { byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1 })
    return { ...inf, totalClicks, byPlatform }
  }).filter(i => i.totalClicks > 0)

  // Generate tracked URL preview
  const getTrackedUrl = (inf, platform) => {
    const p = platformForm.find(pl => pl.platform === platform)
    if (!p?.base_url) return 'Platform URL not set'
    const subId = inf.sub_id || inf.handle
    const sep = p.base_url.includes('?') ? '&' : '?'
    return `${p.base_url}${sep}${p.label_param}=${subId}`
  }

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
        style={{ background: '#1C1410' }}>
        <Link href="/" className="font-display text-xl text-white">
          Go<span style={{ color: '#E8845A' }}>There</span>Now
          <span className="text-xs ml-2 px-2 py-0.5 rounded-full font-body"
            style={{ background: 'rgba(196,98,45,0.3)', color: '#E8845A' }}>Admin</span>
        </Link>
        <div className="flex gap-4">
          <a href="/" target="_blank" className="text-xs text-white opacity-40 hover:opacity-100">View site →</a>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            className="text-xs text-white opacity-40 hover:opacity-100"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            Sign out
          </button>
        </div>
      </nav>

      {/* STATS */}
      <div style={{ background: '#FAF7F2', borderBottom: '1px solid rgba(28,20,16,0.08)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex gap-8 flex-wrap">
          {[
            { num: influencers.length, label: 'Creators', icon: '✈️' },
            { num: recommendations.length, label: 'Hotels', icon: '🏨' },
            { num: monthlyClicks.length, label: 'Clicks This Month', icon: '👆' },
            { num: clicks.length, label: 'Total Clicks', icon: '📊' },
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
        <div className="max-w-6xl mx-auto px-6 flex gap-0 overflow-x-auto">
          {[
            { id: 'platforms', label: '🔗 Affiliate Platforms' },
            { id: 'creators', label: '✈️ Creators & Sub-IDs' },
            { id: 'payouts', label: '💰 Payouts' },
            { id: 'hotels', label: '🏨 Hotels' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-5 py-4 text-xs font-semibold uppercase tracking-widest transition-all whitespace-nowrap"
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
              <h2 className="font-display text-2xl text-espresso">Affiliate Platform Settings</h2>
              <p className="text-sm text-muted mt-1">Enter your master affiliate URL for each platform once. The influencer's sub-ID will be appended automatically to every booking link.</p>
            </div>

            <div className="p-5 rounded-2xl mb-6 flex gap-3 items-start"
              style={{ background: '#FFF8F2', border: '1px solid rgba(196,98,45,0.15)' }}>
              <span className="text-xl">💡</span>
              <div className="text-sm text-espresso leading-relaxed">
                <strong>How it works:</strong> You enter your Booking.com affiliate URL once (e.g. <code style={{ background: '#F5EFE6', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>booking.com/hotel/xyz?aid=YOUR_ID</code>). When Sofia's follower clicks Book Now, we automatically append <code style={{ background: '#F5EFE6', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>?label=sofia</code>. Booking.com tracks it and shows you Sofia's commissions separately in their dashboard.
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {platformForm.map((p, i) => (
                <div key={p.platform} className="p-6 rounded-2xl" style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="font-semibold text-espresso text-lg">{p.platform}</div>
                    {p.base_url && <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: '#EEF5F1', color: '#7A9E87' }}>✓ Configured</span>}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Your Master Affiliate URL</label>
                      <input value={p.base_url}
                        onChange={e => { const f = [...platformForm]; f[i].base_url = e.target.value; setPlatformForm(f) }}
                        placeholder={`Paste your ${p.platform} affiliate URL here`}
                        className="w-full px-4 py-3 rounded-xl text-sm"
                        style={{ border: '1.5px solid rgba(28,20,16,0.12)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Tracking Parameter</label>
                        <input value={p.label_param}
                          onChange={e => { const f = [...platformForm]; f[i].label_param = e.target.value; setPlatformForm(f) }}
                          placeholder="e.g. label"
                          className="w-full px-4 py-3 rounded-xl text-sm"
                          style={{ border: '1.5px solid rgba(28,20,16,0.12)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                        <p className="text-xs text-muted mt-1">Booking.com = <code>label</code>, Expedia = <code>affcid</code></p>
                      </div>
                    </div>
                    {p.base_url && influencers.length > 0 && (
                      <div className="p-3 rounded-xl" style={{ background: '#F5EFE6' }}>
                        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Preview — what Sofia's link looks like:</p>
                        <code className="text-xs text-espresso break-all">{getTrackedUrl(influencers[0], p.platform)}</code>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={savePlatforms} disabled={saving}
              className="mt-6 px-8 py-4 rounded-full font-semibold text-white transition-all hover:scale-105"
              style={{ background: '#C4622D', fontFamily: 'DM Sans, sans-serif', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : savedMsg || 'Save Platform Settings →'}
            </button>
          </div>
        )}

        {/* CREATORS TAB */}
        {tab === 'creators' && (
          <div>
            <div className="mb-6">
              <h2 className="font-display text-2xl text-espresso">Creators & Sub-IDs</h2>
              <p className="text-sm text-muted mt-1">Assign a unique sub-ID to each creator. This is appended to every booking link automatically — no manual work needed per hotel.</p>
            </div>

            {influencers.length === 0 ? (
              <div className="text-center py-16 text-muted">No creators yet.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {influencers.map(inf => (
                  <div key={inf.id} className="p-5 rounded-2xl" style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #C4622D, #D4A853)' }}>✈️</div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-espresso">{inf.profiles?.full_name || inf.handle}</div>
                        <div className="text-xs text-muted">@{inf.handle} · {inf.profiles?.email}</div>
                      </div>

                      {/* Sub-ID */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-muted uppercase tracking-wider">Sub-ID:</label>
                        <input
                          defaultValue={inf.sub_id || inf.handle}
                          onBlur={e => updateSubId(inf.id, e.target.value)}
                          placeholder={inf.handle}
                          className="w-28 text-center text-sm font-semibold rounded-lg px-3 py-2"
                          style={{ border: '1.5px solid rgba(28,20,16,0.12)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                      </div>

                      {/* Commission */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-muted uppercase tracking-wider">Commission:</label>
                        <div className="flex items-center gap-1">
                          <input type="number" min="0" max="100" step="5"
                            defaultValue={inf.commission_rate || 70}
                            onBlur={e => updateCommission(inf.id, e.target.value)}
                            className="w-14 text-center text-sm font-semibold rounded-lg px-2 py-2"
                            style={{ border: '1.5px solid rgba(28,20,16,0.12)', fontFamily: 'DM Sans, sans-serif', outline: 'none' }} />
                          <span className="text-sm text-muted">%</span>
                        </div>
                      </div>

                      {/* Approve */}
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

                    {/* Tracked URL preview */}
                    {platformForm[0]?.base_url && (
                      <div className="mt-3 pt-3 flex gap-2 flex-wrap" style={{ borderTop: '1px solid rgba(28,20,16,0.06)' }}>
                        <span className="text-xs text-muted font-semibold">Their Booking.com link:</span>
                        <code className="text-xs text-espresso break-all">{getTrackedUrl(inf, 'Booking.com')}</code>
                      </div>
                    )}
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
              <p className="text-sm text-muted mt-1">
                Click data for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}. Cross-reference with your Booking.com affiliate dashboard using each creator's sub-ID to get exact commission amounts.
              </p>
            </div>

            <div className="p-5 rounded-2xl mb-6 flex gap-3 items-start"
              style={{ background: '#FFF8F2', border: '1px solid rgba(196,98,45,0.15)' }}>
              <span className="text-xl">📊</span>
              <div className="text-sm leading-relaxed">
                <strong>Payout workflow:</strong> Each month, go to your Booking.com affiliate dashboard → filter by sub-ID → note each creator's commission earned → multiply by their commission rate → pay them via PayPal or bank transfer.
              </div>
            </div>

            {payoutData.length === 0 ? (
              <div className="text-center py-16 rounded-2xl text-muted" style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                No clicks recorded yet this month.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {payoutData.map(inf => (
                  <div key={inf.id} className="p-5 rounded-2xl" style={{ background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="font-semibold text-espresso">{inf.profiles?.full_name || inf.handle}</div>
                        <div className="text-xs text-muted">Sub-ID: <code className="text-espresso">{inf.sub_id || inf.handle}</code></div>
                      </div>

                      <div className="flex gap-6">
                        <div className="text-center">
                          <div className="font-display text-2xl text-espresso">{inf.totalClicks}</div>
                          <div className="text-xs text-muted uppercase tracking-wider">Total Clicks</div>
                        </div>
                        {Object.entries(inf.byPlatform).map(([platform, count]) => (
                          <div key={platform} className="text-center">
                            <div className="font-display text-2xl text-espresso">{count}</div>
                            <div className="text-xs text-muted uppercase tracking-wider">{platform}</div>
                          </div>
                        ))}
                        <div className="text-center">
                          <div className="font-display text-2xl text-terracotta">{inf.commission_rate || 70}%</div>
                          <div className="text-xs text-muted uppercase tracking-wider">Their Cut</div>
                        </div>
                      </div>

                      <div className="text-xs px-3 py-1.5 rounded-full font-semibold"
                        style={{ background: '#F5EFE6', color: '#8B7D72' }}>
                        Check Booking.com for $ amount →
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
              <p className="text-sm text-muted mt-1">All recommendations across all creators. Booking links are now auto-generated from your platform settings — no manual links needed per hotel.</p>
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
                    <div className="text-xs px-3 py-1 rounded-full font-semibold"
                      style={{ background: '#EEF5F1', color: '#7A9E87' }}>
                      ✓ Auto-tracked via sub-ID
                    </div>
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
