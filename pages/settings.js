export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'

export default function Settings() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [influencer, setInfluencer] = useState(null)

  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    avatar_url: '',
    instagram_url: '',
    tiktok_url: '',
    handle: '',
  })

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setCurrentUser(session.user)

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      // Get influencer
      const { data: inf } = await supabase
        .from('influencers')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      setInfluencer(inf)
      setForm({
        full_name: profile?.full_name || '',
        bio: profile?.bio || '',
        avatar_url: profile?.avatar_url || '',
        instagram_url: inf?.instagram_url || '',
        tiktok_url: inf?.tiktok_url || '',
        handle: inf?.handle || '',
      })
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filename = `avatar-${currentUser.id}.${ext}`
    const { error } = await supabase.storage
      .from('avatars')
      .upload(filename, file, { contentType: file.type, upsert: true })
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename)
    setForm(f => ({ ...f, avatar_url: urlData.publicUrl }))
    setUploading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: currentUser.id,
        full_name: form.full_name,
        bio: form.bio,
        avatar_url: form.avatar_url,
        email: currentUser.email,
      })

    if (profileError) { setError(profileError.message); setSaving(false); return }

    // Update influencer table
    if (influencer) {
      const { error: infError } = await supabase
        .from('influencers')
        .update({
          instagram_url: form.instagram_url || null,
          tiktok_url: form.tiktok_url || null,
        })
        .eq('user_id', currentUser.id)

      if (infError) { setError(infError.message); setSaving(false); return }
    }

    setSuccess(true)
    setSaving(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f7f5f2' }}>
      <div style={{ textAlign:'center', color:'#1a6b7a' }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ background:'#f7f5f2', minHeight:'100vh', fontFamily:'DM Sans, sans-serif' }}>
      <Head>
        <title>Settings — GoThereNow</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f7f5f2; font-family: 'DM Sans', sans-serif; }
        .wrap { max-width: 600px; margin: 0 auto; padding: 100px 24px 60px; }
        .page-eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 8px; }
        .page-title { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: #1a6b7a; margin-bottom: 32px; }
        .card { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 20px rgba(26,107,122,0.08); border: 1px solid rgba(26,107,122,0.08); margin-bottom: 20px; }
        .card-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #1a6b7a; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid rgba(26,107,122,0.08); }
        .field { margin-bottom: 16px; }
        .label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.5); font-weight: 700; margin-bottom: 7px; display: block; }
        .input { width: 100%; padding: 12px 16px; background: #f7f5f2; border: 1px solid rgba(26,107,122,0.15); color: #1a6b7a; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; border-radius: 10px; }
        .input:focus { border-color: rgba(26,107,122,0.4); background: white; }
        .input::placeholder { color: rgba(26,107,122,0.3); }
        .input:disabled { opacity: 0.5; cursor: not-allowed; }
        textarea.input { resize: vertical; min-height: 90px; }
        .input-hint { font-size: 11px; color: rgba(26,107,122,0.4); margin-top: 5px; }

        .avatar-section { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
        .avatar-preview { width: 72px; height: 72px; border-radius: 50%; border: 2px solid #1a6b7a; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 28px; background: rgba(26,107,122,0.08); flex-shrink: 0; }
        .avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-upload-btn { padding: 9px 18px; background: white; border: 1px solid rgba(26,107,122,0.2); color: #1a6b7a; font-size: 13px; font-weight: 600; cursor: pointer; border-radius: 100px; font-family: 'DM Sans', sans-serif; }

        .save-btn { background: #b5654a; color: white; padding: 14px 32px; border-radius: 100px; font-size: 14px; font-weight: 700; border: none; cursor: pointer; font-family: 'Playfair Display', serif; transition: all 0.2s; }
        .save-btn:hover { background: #a05540; }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .success-msg { display: inline-flex; align-items: center; gap: 8px; color: #1a6b7a; font-size: 14px; font-weight: 600; margin-left: 16px; }
        .error-msg { background: rgba(255,80,80,0.1); border: 1px solid rgba(255,80,80,0.2); color: rgb(180,40,40); padding: 12px 16px; border-radius: 10px; font-size: 13px; margin-bottom: 16px; }

        .danger-card { background: white; border-radius: 20px; padding: 28px; border: 1px solid rgba(200,50,50,0.1); margin-bottom: 20px; }
        .danger-title { font-size: 16px; font-weight: 700; color: rgba(180,40,40,0.8); margin-bottom: 8px; }
        .danger-sub { font-size: 13px; color: rgba(26,107,122,0.5); margin-bottom: 16px; }
        .danger-btn { padding: 10px 22px; background: rgba(220,50,50,0.06); border: 1px solid rgba(220,50,50,0.2); color: rgb(180,40,40); font-size: 13px; font-weight: 600; cursor: pointer; border-radius: 100px; font-family: 'DM Sans', sans-serif; }
        .danger-btn:hover { background: rgba(220,50,50,0.1); }

        .profile-link { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(26,107,122,0.5); text-decoration: none; margin-bottom: 28px; }
        .profile-link:hover { color: #1a6b7a; }
      `}</style>

      <Nav />

      <div className="wrap">
        <div className="page-eyebrow">account</div>
        <h1 className="page-title">Settings</h1>

        {influencer && (
          <Link href={`/${influencer.handle}`} className="profile-link">
            ← View my profile
          </Link>
        )}

        <form onSubmit={handleSave}>
          {error && <div className="error-msg">{error}</div>}

          {/* PROFILE */}
          <div className="card">
            <div className="card-title">Profile</div>

            <div className="avatar-section">
              <div className="avatar-preview">
                {form.avatar_url ? <img src={form.avatar_url} alt="Avatar" /> : '✈️'}
              </div>
              <div>
                <label style={{cursor:'pointer'}}>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{display:'none'}} />
                  <span className="avatar-upload-btn">{uploading ? '⏳ Uploading...' : '📷 Change photo'}</span>
                </label>
                <div style={{fontSize:'11px', color:'rgba(26,107,122,0.4)', marginTop:'6px'}}>JPG, PNG or GIF. Max 5MB.</div>
              </div>
            </div>

            <div className="field">
              <label className="label">Full name</label>
              <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="Your name" className="input" />
            </div>

            <div className="field">
              <label className="label">Your handle</label>
              <input type="text" value={form.handle} className="input" disabled />
              <div className="input-hint">gotherenow.app/{form.handle} — handle cannot be changed</div>
            </div>

            <div className="field">
              <label className="label">Bio</label>
              <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} placeholder="Tell people about yourself and your travel style..." className="input" />
            </div>
          </div>

          {/* SOCIAL */}
          <div className="card">
            <div className="card-title">Social links</div>
            <div className="field">
              <label className="label">Instagram</label>
              <input type="url" value={form.instagram_url} onChange={e => setForm({...form, instagram_url: e.target.value})} placeholder="https://instagram.com/yourhandle" className="input" />
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label className="label">TikTok</label>
              <input type="url" value={form.tiktok_url} onChange={e => setForm({...form, tiktok_url: e.target.value})} placeholder="https://tiktok.com/@yourhandle" className="input" />
            </div>
          </div>

          {/* ACCOUNT */}
          <div className="card">
            <div className="card-title">Account</div>
            <div className="field" style={{marginBottom:0}}>
              <label className="label">Email</label>
              <input type="email" value={currentUser?.email || ''} className="input" disabled />
              <div className="input-hint">Email cannot be changed here. Contact support to update.</div>
            </div>
          </div>

          <div style={{display:'flex', alignItems:'center'}}>
            <button type="submit" disabled={saving} className="save-btn">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            {success && <span className="success-msg">✓ Saved!</span>}
          </div>
        </form>

        {/* SIGN OUT */}
        <div className="danger-card" style={{marginTop:'32px'}}>
          <div className="danger-title">Sign out</div>
          <div className="danger-sub">You'll need to sign back in to access your account.</div>
          <button className="danger-btn" onClick={handleSignOut}>Sign out</button>
        </div>

      </div>
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
