export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

const PLATFORM_CONFIG = [
  {
    group: 'Direct Platforms',
    desc: 'You manage these affiliate accounts directly — no middleman, full commission.',
    color: '#7A9E87',
    platforms: [
      { name: 'Booking.com', type: 'direct', hint: 'Your Booking.com/Awin affiliate URL. Sub-ID appended as ?label=SUBID', placeholder: 'https://www.booking.com?aid=YOUR_AID' },
      { name: 'Expedia', type: 'direct', hint: 'Expedia affiliate URL. Regional domains handled automatically.', placeholder: 'https://expedia.com/affiliates/gotherenow/gtn' },
      { name: 'Hotels.com', type: 'direct', hint: 'Same affiliate account as Expedia (both owned by Expedia Group)', placeholder: 'https://www.hotels.com/affiliate/YOUR_ID' },
      { name: 'Airbnb', type: 'direct', hint: 'Airbnb direct affiliate program. Apply at airbnb.com/associates', placeholder: 'https://www.airbnb.com?af_id=YOUR_ID' },
    ]
  },
  {
    group: 'Travelpayouts',
    desc: 'Covers 100+ travel platforms through one account. They take 30% — worth it for the long tail.',
    color: '#D4A853',
    platforms: [
      { name: 'Travelpayouts', type: 'travelpayouts', hint: 'Enter your Marker ID and Partner ID from travelpayouts.com dashboard', placeholder: '' },
    ]
  },
  {
    group: 'Restaurants (Coming Soon)',
    desc: 'Ready for when you expand to restaurant recommendations.',
    color: '#C4622D',
    platforms: [
      { name: 'OpenTable', type: 'restaurant', hint: 'OpenTable affiliate program. Apply at partners.opentable.com', placeholder: 'https://www.opentable.com?ref=YOUR_ID' },
    ]
  },
]

const DEFAULT_PLATFORM_DATA = {
  'Booking.com': { base_url: '', label_param: 'label' },
  'Expedia': { base_url: '', label_param: 'affcid' },
  'Hotels.com': { base_url: '', label_param: 'ref' },
  'Airbnb': { base_url: '', label_param: 'af_id' },
  'Travelpayouts': { travelpayouts_marker: '', travelpayouts_partner_id: '' },
  'OpenTable': { base_url: '', label_param: 'ref' },
}

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState('platforms')
  const [influencers, setInfluencers] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [clicks, setClicks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [platformData, setPlatformData] = useState(DEFAULT_PLATFORM_DATA)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.email !== ADMIN_EMAIL) {
          router.push('/')
          return
        }

        const [infsRes, recsRes, platsRes, clksRes] = await Promise.all([
          supabase.from('influencers').select('*, profiles(full_name, email)').order('created_at', { ascending: false }),
          supabase.from('recommendations').select('*, influencers(handle, profiles(full_name))').order('created_at', { ascending: false }),
          supabase.from('platform_settings').select('*'),
          supabase.from('clicks').select('*').order('created_at', { ascending: false }),
        ])

        setInfluencers(infsRes.data || [])
        setRecommendations(recsRes.data || [])
        setClicks(clksRes.data || [])

        if (platsRes.data && platsRes.data.length > 0) {
          const updated = { ...DEFAULT_PLATFORM_DATA }
          platsRes.data.forEach(function(p) {
            if (updated[p.platform]) {
              updated[p.platform] = Object.assign({}, updated[p.platform], p)
            }
          })
          setPlatformData(updated)
        }
      } catch (err) {
        console.error('Load error:', err)
      }
      setLoading(false)
    }
    load()
  }, [])

  function updateField(platform, field, value) {
    setPlatformData(function(prev) {
      const next = Object.assign({}, prev)
      next[platform] = Object.assign({}, prev[platform])
      next[platform][field] = value
      return next
    })
  }

  async function savePlatforms() {
    setSaving(true)
    try {
      const platforms = Object.keys(platformData)
      for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i]
        const data = platformData[platform]
        const hasData = data.base_url || data.travelpayouts_marker
        if (!hasData) continue
        await supabase.from('platform_settings').upsert(
          Object.assign({ platform: platform }, data),
          { onConflict: 'platform' }
        )
      }
      setSavedMsg('Saved! ✓')
      setTimeout(function() { setSavedMsg('') }, 2500)
    } catch (err) {
      console.error('Save error:', err)
    }
    setSaving(false)
  }

  async function updateSubId(id, subId) {
    await supabase.from('influencers').update({ sub_id: subId }).eq('id', id)
    setInfluencers(function(prev) {
      return prev.map(function(i) { return i.id === id ? Object.assign({}, i, { sub_id: subId }) : i })
    })
  }

  async function updateCommission(id, rate) {
    await supabase.from('influencers').update({ commission_rate: parseFloat(rate) }).eq('id', id)
    setInfluencers(function(prev) {
      return prev.map(function(i) { return i.id === id ? Object.assign({}, i, { commission_rate: rate }) : i })
    })
  }

  async function approveInfluencer(id, approved) {
    await supabase.from('influencers').update({ approved: approved }).eq('id', id)
    setInfluencers(function(prev) {
      return prev.map(function(i) { return i.id === id ? Object.assign({}, i, { approved: approved }) : i })
    })
  }

  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyClicks = clicks.filter(function(c) { return c.created_at && c.created_at.startsWith(currentMonth) })

  const payoutData = influencers.map(function(inf) {
    const infClicks = monthlyClicks.filter(function(c) { return c.influencer_id === inf.id })
    const byType = { direct: 0, travelpayouts: 0, restaurant: 0 }
    infClicks.forEach(function(c) {
      if (c.content_type === 'restaurant') byType.restaurant++
      else if (c.is_direct) byType.direct++
      else byType.travelpayouts++
    })
    return Object.assign({}, inf, { totalClicks: infClicks.length, byType: byType })
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FAF7F2' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '20px' }}>Loading admin...</div>
      </div>
    )
  }

  return (
    <>
      <Head><title>Admin — GoThereNow</title></Head>

      <nav style={{ position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#1C1410' }}>
        <Link href="/" style={{ fontFamily: 'Georgia, serif', fontSize: '20px', color: 'white', textDecoration: 'none' }}>
          GoThereNow <span style={{ fontSize: '11px', marginLeft: '8px', padding: '2px 8px', borderRadius: '100px', background: 'rgba(196,98,45,0.3)', color: '#E8845A', fontFamily: 'sans-serif' }}>Admin</span>
        </Link>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="/" target="_blank" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>View site →</a>
          <button onClick={async function() { await supabase.auth.signOut(); router.push('/') }}
            style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'sans-serif' }}>
            Sign out
          </button>
        </div>
      </nav>

      {/* STATS */}
      <div style={{ background: '#FAF7F2', borderBottom: '1px solid rgba(28,20,16,0.08)', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {[
            { num: influencers.length, label: 'Creators', icon: '✈️' },
            { num: recommendations.length, label: 'Hotels', icon: '🏨' },
            { num: monthlyClicks.length, label: 'Clicks This Month', icon: '👆' },
            { num: monthlyClicks.filter(function(c) { return c.is_direct }).length, label: 'Direct Clicks', icon: '💰' },
          ].map(function(s, i) {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>{s.icon}</span>
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '24px', color: '#1C1410', lineHeight: 1 }}>{s.num}</div>
                  <div style={{ fontSize: '11px', color: '#8B7D72', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: 'white', borderBottom: '1px solid rgba(28,20,16,0.08)' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 24px', display: 'flex', overflowX: 'auto' }}>
          {[
            { id: 'platforms', label: '🔗 Affiliate Setup' },
            { id: 'creators', label: '✈️ Creators & Sub-IDs' },
            { id: 'payouts', label: '💰 Payouts' },
            { id: 'hotels', label: '🏨 Hotels' },
          ].map(function(t) {
            return (
              <button key={t.id} onClick={function() { setTab(t.id) }}
                style={{
                  padding: '16px 20px', fontSize: '11px', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '1.2px', whiteSpace: 'nowrap',
                  color: tab === t.id ? '#C4622D' : '#8B7D72',
                  borderBottom: tab === t.id ? '2px solid #C4622D' : '2px solid transparent',
                  background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #C4622D' : '2px solid transparent',
                  cursor: 'pointer', fontFamily: 'sans-serif'
                }}>
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* PLATFORMS TAB */}
        {tab === 'platforms' && (
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', marginBottom: '8px' }}>Affiliate Setup</h2>
            <p style={{ fontSize: '14px', color: '#8B7D72', marginBottom: '32px' }}>Enter your affiliate URLs once — sub-IDs are appended automatically per creator.</p>

            {PLATFORM_CONFIG.map(function(group) {
              return (
                <div key={group.group} style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: group.color, flexShrink: 0 }} />
                    <h3 style={{ fontWeight: 600, fontSize: '17px', color: '#1C1410' }}>{group.group}</h3>
                  </div>
                  <p style={{ fontSize: '12px', color: '#8B7D72', marginBottom: '16px', marginLeft: '20px' }}>{group.desc}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginLeft: '20px' }}>
                    {group.platforms.map(function(p) {
                      const isConfigured = platformData[p.name] && (platformData[p.name].base_url || platformData[p.name].travelpayouts_marker)
                      return (
                        <div key={p.name} style={{ padding: '20px', borderRadius: '16px', background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 600, color: '#1C1410' }}>{p.name}</span>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '100px', fontWeight: 600, background: isConfigured ? '#EEF5F1' : '#FFF0E8', color: isConfigured ? '#7A9E87' : '#C4622D' }}>
                              {isConfigured ? '✓ Configured' : 'Not set up'}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: '#8B7D72', marginBottom: '12px' }}>{p.hint}</p>

                          {p.type === 'travelpayouts' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#8B7D72', display: 'block', marginBottom: '6px' }}>Marker ID</label>
                                <input value={platformData['Travelpayouts'].travelpayouts_marker || ''}
                                  onChange={function(e) { updateField('Travelpayouts', 'travelpayouts_marker', e.target.value) }}
                                  placeholder="Your Travelpayouts Marker ID"
                                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid rgba(28,20,16,0.12)', fontSize: '14px', fontFamily: 'sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                              </div>
                              <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#8B7D72', display: 'block', marginBottom: '6px' }}>Partner ID</label>
                                <input value={platformData['Travelpayouts'].travelpayouts_partner_id || ''}
                                  onChange={function(e) { updateField('Travelpayouts', 'travelpayouts_partner_id', e.target.value) }}
                                  placeholder="Your Travelpayouts Partner ID"
                                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid rgba(28,20,16,0.12)', fontSize: '14px', fontFamily: 'sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                              </div>
                            </div>
                          ) : (
                            <input value={platformData[p.name] ? platformData[p.name].base_url || '' : ''}
                              onChange={function(e) { updateField(p.name, 'base_url', e.target.value) }}
                              placeholder={p.placeholder}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid rgba(28,20,16,0.12)', fontSize: '14px', fontFamily: 'sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <button onClick={savePlatforms} disabled={saving}
              style={{ padding: '14px 32px', borderRadius: '100px', fontWeight: 600, color: 'white', background: '#C4622D', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'sans-serif', fontSize: '15px' }}>
              {saving ? 'Saving...' : savedMsg || 'Save All Platform Settings →'}
            </button>
          </div>
        )}

        {/* CREATORS TAB */}
        {tab === 'creators' && (
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', marginBottom: '8px' }}>Creators & Sub-IDs</h2>
            <p style={{ fontSize: '14px', color: '#8B7D72', marginBottom: '24px' }}>One sub-ID per creator. Automatically appended to every booking link across all platforms.</p>

            {influencers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px', color: '#8B7D72' }}>No creators yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {influencers.map(function(inf) {
                  return (
                    <div key={inf.id} style={{ padding: '20px', borderRadius: '16px', background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #C4622D, #D4A853)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>✈️</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#1C1410' }}>{inf.profiles ? inf.profiles.full_name : inf.handle}</div>
                          <div style={{ fontSize: '12px', color: '#8B7D72' }}>@{inf.handle} · {inf.profiles ? inf.profiles.email : ''}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#8B7D72' }}>Sub-ID:</label>
                          <input defaultValue={inf.sub_id || inf.handle}
                            onBlur={function(e) { updateSubId(inf.id, e.target.value) }}
                            style={{ width: '112px', textAlign: 'center', fontSize: '14px', fontWeight: 600, borderRadius: '8px', padding: '8px 12px', border: '1.5px solid rgba(28,20,16,0.12)', fontFamily: 'sans-serif', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#8B7D72' }}>Commission:</label>
                          <input type="number" min="0" max="100" step="5"
                            defaultValue={inf.commission_rate || 70}
                            onBlur={function(e) { updateCommission(inf.id, e.target.value) }}
                            style={{ width: '56px', textAlign: 'center', fontSize: '14px', fontWeight: 600, borderRadius: '8px', padding: '8px', border: '1.5px solid rgba(28,20,16,0.12)', fontFamily: 'sans-serif', outline: 'none' }} />
                          <span style={{ fontSize: '14px', color: '#8B7D72' }}>%</span>
                        </div>
                        <button onClick={function() { approveInfluencer(inf.id, inf.approved === false) }}
                          style={{ fontSize: '12px', fontWeight: 600, padding: '8px 16px', borderRadius: '100px', background: inf.approved !== false ? '#EEF5F1' : '#FFF0E8', color: inf.approved !== false ? '#7A9E87' : '#C4622D', border: 'none', cursor: 'pointer', fontFamily: 'sans-serif' }}>
                          {inf.approved !== false ? '✓ Approved' : 'Approve'}
                        </button>
                        <a href={'/' + inf.handle} target="_blank" style={{ fontSize: '12px', color: '#8B7D72', textDecoration: 'none' }}>View →</a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* PAYOUTS TAB */}
        {tab === 'payouts' && (
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', marginBottom: '8px' }}>Monthly Payouts</h2>
            <p style={{ fontSize: '14px', color: '#8B7D72', marginBottom: '24px' }}>
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} · Cross-reference with your affiliate dashboards using each creator's sub-ID.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Direct Platform Clicks', num: monthlyClicks.filter(function(c) { return c.is_direct }).length, color: '#7A9E87', note: 'Check Booking.com, Expedia, Airbnb' },
                { label: 'Travelpayouts Clicks', num: monthlyClicks.filter(function(c) { return !c.is_direct && c.content_type !== 'restaurant' }).length, color: '#D4A853', note: 'Check Travelpayouts dashboard' },
                { label: 'Restaurant Clicks', num: monthlyClicks.filter(function(c) { return c.content_type === 'restaurant' }).length, color: '#C4622D', note: 'Check OpenTable dashboard' },
              ].map(function(s, i) {
                return (
                  <div key={i} style={{ padding: '20px', borderRadius: '16px', background: 'white', border: '1px solid ' + s.color + '44' }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '32px', color: s.color, marginBottom: '4px' }}>{s.num}</div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#1C1410', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: '12px', color: '#8B7D72' }}>{s.note}</div>
                  </div>
                )
              })}
            </div>

            {payoutData.filter(function(i) { return i.totalClicks > 0 }).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px', color: '#8B7D72', background: 'white', borderRadius: '16px', border: '1px solid rgba(28,20,16,0.08)' }}>
                No clicks recorded yet this month.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {payoutData.filter(function(i) { return i.totalClicks > 0 }).map(function(inf) {
                  return (
                    <div key={inf.id} style={{ padding: '20px', borderRadius: '16px', background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#1C1410' }}>{inf.profiles ? inf.profiles.full_name : inf.handle}</div>
                          <div style={{ fontSize: '12px', color: '#8B7D72' }}>Sub-ID: <code style={{ color: '#1C1410', fontWeight: 600 }}>{inf.sub_id || inf.handle}</code></div>
                        </div>
                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                          {[
                            { num: inf.totalClicks, label: 'Total', color: '#1C1410' },
                            { num: inf.byType.direct, label: 'Direct', color: '#7A9E87' },
                            { num: inf.byType.travelpayouts, label: 'Travelpayouts', color: '#D4A853' },
                            { num: (inf.commission_rate || 70) + '%', label: 'Their cut', color: '#C4622D' },
                          ].map(function(s, i) {
                            return (
                              <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', color: s.color }}>{s.num}</div>
                                <div style={{ fontSize: '11px', color: '#8B7D72' }}>{s.label}</div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* HOTELS TAB */}
        {tab === 'hotels' && (
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', marginBottom: '8px' }}>All Hotels</h2>
            <p style={{ fontSize: '14px', color: '#8B7D72', marginBottom: '24px' }}>All recommendations. Booking links auto-generated with each creator's sub-ID.</p>

            {recommendations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px', color: '#8B7D72' }}>No recommendations yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recommendations.map(function(rec) {
                  return (
                    <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', background: 'white', border: '1px solid rgba(28,20,16,0.08)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#1C1410' }}>{rec.hotel_name}</div>
                        <div style={{ fontSize: '12px', color: '#8B7D72' }}>{rec.city}, {rec.country} · by @{rec.influencers ? rec.influencers.handle : ''}</div>
                      </div>
                      <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '100px', fontWeight: 600, background: '#EEF5F1', color: '#7A9E87' }}>✓ Auto-tracked</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  )
}
export async function getServerSideProps() {
  return { props: {} }
}

