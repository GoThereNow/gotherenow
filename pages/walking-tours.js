export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Nav from '../components/Nav'

const MAPBOX_TOKEN = 'pk.eyJ1IjoiZ290aGVyZW5vdyIsImEiOiJjbWxmYXJpYm0wMzByM2lwcGpzNjl4Ymx5In0.lipvyNXWoQmIDCah_0Ss_w'

const TOURS = [
  {
    id: 1,
    city: 'Paris',
    country: 'France',
    title: 'Le Marais District',
    subtitle: 'Medieval streets & modern art',
    duration: '2h 30min',
    distance: '3.2 km',
    stops: 8,
    difficulty: 'Easy',
    photo: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
    description: 'Wander through one of Paris\'s oldest and most vibrant neighbourhoods, from medieval architecture to cutting-edge galleries.',
    color: '#1a6b7a',
    coordinates: [2.3522, 48.8566],
    available: true,
    route: [
      { name: 'Place des Vosges', lat: 48.8554, lng: 2.3652, audio: true },
      { name: 'Musée Picasso', lat: 48.8596, lng: 2.3622, audio: true },
      { name: 'Centre Pompidou', lat: 48.8607, lng: 2.3526, audio: true },
      { name: 'Rue de Bretagne Market', lat: 48.8639, lng: 2.3607, audio: false },
      { name: 'Hôtel de Ville', lat: 48.8566, lng: 2.3522, audio: true },
    ]
  },
  {
    id: 2,
    city: 'Rome',
    country: 'Italy',
    title: 'Ancient Rome',
    subtitle: 'Forum, Colosseum & Palatine Hill',
    duration: '3h',
    distance: '4.1 km',
    stops: 10,
    difficulty: 'Moderate',
    photo: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
    description: 'Walk in the footsteps of emperors through the heart of the ancient world.',
    color: '#b5654a',
    coordinates: [12.4964, 41.9028],
    available: true,
    route: [
      { name: 'Colosseum', lat: 41.8902, lng: 12.4922, audio: true },
      { name: 'Roman Forum', lat: 41.8925, lng: 12.4853, audio: true },
      { name: 'Palatine Hill', lat: 41.8893, lng: 12.4876, audio: true },
      { name: 'Arch of Constantine', lat: 41.8898, lng: 12.4906, audio: false },
    ]
  },
  {
    id: 3,
    city: 'Tokyo',
    country: 'Japan',
    title: 'Yanaka Old Town',
    subtitle: 'Edo-era temples & craft shops',
    duration: '2h',
    distance: '2.8 km',
    stops: 7,
    difficulty: 'Easy',
    photo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    description: 'One of Tokyo\'s last surviving shitamachi neighbourhoods — traditional crafts, temples, and street food.',
    color: '#1a6b7a',
    coordinates: [139.7671, 35.6762],
    available: false,
    route: []
  },
  {
    id: 4,
    city: 'New York',
    country: 'USA',
    title: 'Lower Manhattan',
    subtitle: 'Wall Street to Brooklyn Bridge',
    duration: '2h 45min',
    distance: '3.8 km',
    stops: 9,
    difficulty: 'Easy',
    photo: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
    description: 'From the oldest streets in America to the most iconic bridge — the story of how a city became the world.',
    color: '#b5654a',
    coordinates: [-74.0060, 40.7128],
    available: false,
    route: []
  },
]

export default function WalkingTours() {
  const [mounted, setMounted] = useState(false)
  const [selectedTour, setSelectedTour] = useState(null)
  const [activeStop, setActiveStop] = useState(0)
  const [playing, setPlaying] = useState(false)
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef([])

  useEffect(() => { setMounted(true) }, [])

  // Init map when tour selected
  useEffect(() => {
    if (!selectedTour || !mapContainer.current) return
    if (map.current) {
      map.current.remove()
      map.current = null
    }
    setTimeout(() => {
      import('mapbox-gl').then(mod => {
        const mapboxgl = mod.default || mod
        mapboxgl.accessToken = MAPBOX_TOKEN
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: selectedTour.coordinates,
          zoom: 14,
          attributionControl: false,
        })
        map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
        map.current.on('load', () => {
          markersRef.current.forEach(m => m.remove())
          markersRef.current = []

          // Draw route line
          if (selectedTour.route.length > 1) {
            map.current.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: selectedTour.route.map(s => [s.lng, s.lat])
                }
              }
            })
            map.current.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              paint: { 'line-color': selectedTour.color, 'line-width': 3, 'line-dasharray': [2, 2] }
            })
          }

          // Add stop markers
          selectedTour.route.forEach((stop, i) => {
            const el = document.createElement('div')
            el.style.cssText = `width:32px;height:32px;background:${selectedTour.color};border:3px solid white;border-radius:50%;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;font-family:DM Sans,sans-serif;`
            el.textContent = String(i + 1)
            el.addEventListener('click', () => setActiveStop(i))
            const marker = new mapboxgl.Marker(el).setLngLat([stop.lng, stop.lat]).addTo(map.current)
            markersRef.current.push(marker)
          })
        })
      })
    }, 100)
  }, [selectedTour])

  // Fly to active stop
  useEffect(() => {
    if (!map.current || !selectedTour?.route[activeStop]) return
    const stop = selectedTour.route[activeStop]
    map.current.flyTo({ center: [stop.lng, stop.lat], zoom: 16, duration: 800 })
  }, [activeStop])

  return (
    <div style={{ background: '#f7f5f2', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', opacity: mounted ? 1 : 0 }}>
      <Head>
        <title>Walking Tours — GoThereNow</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f7f5f2; font-family: 'DM Sans', sans-serif; }

        .hero { padding: 100px 56px 48px; background: #1a6b7a; }
        .hero-eyebrow { font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: rgba(255,255,255,0.5); font-weight: 700; margin-bottom: 12px; }
        .hero-title { font-family: 'Playfair Display', serif; font-size: clamp(36px, 5vw, 64px); font-weight: 700; color: white; line-height: 1.05; margin-bottom: 14px; }
        .hero-sub { font-size: 16px; color: rgba(255,255,255,0.6); max-width: 480px; line-height: 1.7; }

        .tours-section { padding: 56px; }
        .section-eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 8px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: #1a6b7a; margin-bottom: 32px; }
        .tours-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }

        .tour-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(26,107,122,0.08); border: 1px solid rgba(26,107,122,0.08); cursor: pointer; transition: all 0.25s; }
        .tour-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(26,107,122,0.15); }
        .tour-card.unavailable { opacity: 0.6; cursor: default; }
        .tour-photo { position: relative; height: 200px; overflow: hidden; }
        .tour-photo img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .tour-card:hover .tour-photo img { transform: scale(1.05); }
        .tour-photo-gradient { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,40,50,0.8) 0%, transparent 50%); }
        .tour-photo-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 16px 20px; }
        .tour-city { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 3px; }
        .tour-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: white; margin-bottom: 2px; }
        .tour-subtitle { font-size: 12px; color: rgba(255,255,255,0.65); }
        .tour-body { padding: 20px; }
        .tour-meta { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
        .tour-meta-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: rgba(26,107,122,0.6); font-weight: 500; }
        .tour-desc { font-size: 13px; color: rgba(26,107,122,0.6); line-height: 1.6; margin-bottom: 16px; }
        .tour-btn { display: inline-flex; align-items: center; gap: 8px; background: #1a6b7a; color: white; padding: 10px 20px; border-radius: 100px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .tour-btn:hover { background: #155a68; }
        .tour-btn.coming-soon { background: rgba(26,107,122,0.1); color: rgba(26,107,122,0.4); cursor: default; }

        /* Tour Modal */
        .modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: stretch; }
        .tour-modal { background: #f7f5f2; width: 100%; max-width: 1100px; margin: auto; border-radius: 24px; overflow: hidden; display: flex; max-height: 90vh; box-shadow: 0 24px 80px rgba(0,0,0,0.2); }
        .modal-map { width: 55%; flex-shrink: 0; position: relative; }
        .modal-map-container { width: 100%; height: 100%; min-height: 500px; }
        .modal-panel { flex: 1; overflow-y: auto; padding: 32px; }
        .modal-close { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; background: white; border: none; cursor: pointer; border-radius: 50%; font-size: 16px; display: flex; align-items: center; justify-content: center; z-index: 10; box-shadow: 0 2px 8px rgba(0,0,0,0.2); color: #1a6b7a; }
        .modal-eyebrow { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #b5654a; font-weight: 700; margin-bottom: 6px; }
        .modal-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: #1a6b7a; margin-bottom: 6px; }
        .modal-subtitle { font-size: 13px; color: rgba(26,107,122,0.5); margin-bottom: 20px; }
        .modal-meta { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(26,107,122,0.1); }
        .modal-meta-item { text-align: center; }
        .modal-meta-num { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #1a6b7a; }
        .modal-meta-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: rgba(26,107,122,0.45); margin-top: 2px; }
        .stops-list { display: flex; flex-direction: column; gap: 0; }
        .stop-item { display: flex; gap: 14px; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid rgba(26,107,122,0.06); cursor: pointer; transition: all 0.15s; border-radius: 8px; padding: 12px; margin: 0 -12px; }
        .stop-item:hover { background: rgba(26,107,122,0.04); }
        .stop-item.active { background: rgba(26,107,122,0.08); }
        .stop-num { width: 32px; height: 32px; border-radius: 50%; background: #1a6b7a; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
        .stop-num.active { background: #b5654a; }
        .stop-info { flex: 1; }
        .stop-name { font-size: 14px; font-weight: 700; color: #1a6b7a; margin-bottom: 2px; }
        .stop-audio { font-size: 11px; color: rgba(26,107,122,0.45); display: flex; align-items: center; gap: 4px; }
        .audio-badge { background: rgba(26,107,122,0.1); color: #1a6b7a; padding: 2px 8px; border-radius: 100px; font-size: 10px; font-weight: 700; }
        .play-btn { width: 36px; height: 36px; border-radius: 50%; background: #b5654a; border: none; cursor: pointer; color: white; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
        .play-btn:hover { background: #a05540; transform: scale(1.05); }
        .play-btn.no-audio { background: rgba(26,107,122,0.1); cursor: default; }
        .audio-player { background: #1a6b7a; border-radius: 16px; padding: 16px 20px; margin-top: 20px; color: white; }
        .audio-title { font-size: 13px; font-weight: 700; margin-bottom: 10px; }
        .audio-bar { height: 4px; background: rgba(255,255,255,0.2); border-radius: 100px; margin-bottom: 10px; cursor: pointer; }
        .audio-bar-fill { height: 100%; background: white; border-radius: 100px; width: 0%; transition: width 0.1s; }
        .audio-controls { display: flex; align-items: center; gap: 12px; }
        .audio-play { width: 40px; height: 40px; border-radius: 50%; background: white; border: none; cursor: pointer; color: #1a6b7a; font-size: 16px; display: flex; align-items: center; justify-content: center; }
        .audio-time { font-size: 11px; color: rgba(255,255,255,0.6); }

        .coming-soon-banner { background: rgba(26,107,122,0.06); border: 1px dashed rgba(26,107,122,0.2); border-radius: 12px; padding: 20px; text-align: center; margin-top: 24px; }
        .coming-soon-text { font-size: 13px; color: rgba(26,107,122,0.5); line-height: 1.6; }

        @media (max-width: 768px) {
          .hero { padding: 80px 24px 40px; }
          .tours-section { padding: 40px 24px; }
          .tours-grid { grid-template-columns: 1fr; }
          .tour-modal { flex-direction: column; max-height: 95vh; border-radius: 16px; }
          .modal-map { width: 100%; height: 240px; }
          .modal-map-container { min-height: 240px; }
          .modal-panel { padding: 20px; }
        }
      `}</style>

      <Nav />

      {/* HERO */}
      <div className="hero">
        <div className="hero-eyebrow">explore on foot</div>
        <h1 className="hero-title">Walking Tours</h1>
        <p className="hero-sub">Audio-guided walks through the world's most interesting neighbourhoods. Maps, stops, and stories — all in one place.</p>
      </div>

      {/* TOURS GRID */}
      <div className="tours-section">
        <div className="section-eyebrow">available tours</div>
        <h2 className="section-title">Choose your walk</h2>
        <div className="tours-grid">
          {TOURS.map(tour => (
            <div key={tour.id} className={`tour-card${!tour.available ? ' unavailable' : ''}`}
              onClick={() => tour.available && setSelectedTour(tour)}>
              <div className="tour-photo">
                <img src={tour.photo} alt={tour.title} />
                <div className="tour-photo-gradient" />
                <div className="tour-photo-info">
                  <div className="tour-city">📍 {tour.city}, {tour.country}</div>
                  <div className="tour-title">{tour.title}</div>
                  <div className="tour-subtitle">{tour.subtitle}</div>
                </div>
              </div>
              <div className="tour-body">
                <div className="tour-meta">
                  <div className="tour-meta-item">🕐 {tour.duration}</div>
                  <div className="tour-meta-item">📏 {tour.distance}</div>
                  <div className="tour-meta-item">📍 {tour.stops} stops</div>
                  <div className="tour-meta-item">🥾 {tour.difficulty}</div>
                </div>
                <p className="tour-desc">{tour.description}</p>
                {tour.available ? (
                  <button className="tour-btn" onClick={() => setSelectedTour(tour)}>
                    🎧 Start tour →
                  </button>
                ) : (
                  <button className="tour-btn coming-soon">Coming soon</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="coming-soon-banner" style={{marginTop:'40px'}}>
          <div style={{fontSize:'32px', marginBottom:'10px'}}>🗺️</div>
          <div style={{fontFamily:'Playfair Display, serif', fontSize:'20px', fontWeight:700, color:'#1a6b7a', marginBottom:'8px'}}>More cities coming soon</div>
          <p className="coming-soon-text">We're building walking tours for Barcelona, Amsterdam, Kyoto, Istanbul, and more.<br />Know a neighbourhood worth exploring? <a href="mailto:support@gotherenow.app" style={{color:'#1a6b7a'}}>Let us know.</a></p>
        </div>
      </div>

      {/* TOUR MODAL */}
      {selectedTour && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setSelectedTour(null); setActiveStop(0) } }}>
          <div className="tour-modal">
            {/* MAP */}
            <div className="modal-map">
              <div className="modal-map-container" ref={mapContainer} />
              <button className="modal-close" onClick={() => { setSelectedTour(null); setActiveStop(0) }}>✕</button>
            </div>

            {/* PANEL */}
            <div className="modal-panel">
              <div className="modal-eyebrow">📍 {selectedTour.city}, {selectedTour.country}</div>
              <div className="modal-title">{selectedTour.title}</div>
              <div className="modal-subtitle">{selectedTour.subtitle}</div>

              <div className="modal-meta">
                <div className="modal-meta-item">
                  <div className="modal-meta-num">{selectedTour.duration}</div>
                  <div className="modal-meta-label">Duration</div>
                </div>
                <div className="modal-meta-item">
                  <div className="modal-meta-num">{selectedTour.distance}</div>
                  <div className="modal-meta-label">Distance</div>
                </div>
                <div className="modal-meta-item">
                  <div className="modal-meta-num">{selectedTour.stops}</div>
                  <div className="modal-meta-label">Stops</div>
                </div>
                <div className="modal-meta-item">
                  <div className="modal-meta-num">{selectedTour.difficulty}</div>
                  <div className="modal-meta-label">Difficulty</div>
                </div>
              </div>

              {/* STOPS */}
              <div style={{marginBottom:'8px'}}>
                <div className="section-eyebrow">stops</div>
              </div>
              <div className="stops-list">
                {selectedTour.route.map((stop, i) => (
                  <div key={i} className={`stop-item${activeStop === i ? ' active' : ''}`}
                    onClick={() => setActiveStop(i)}>
                    <div className={`stop-num${activeStop === i ? ' active' : ''}`}>{i + 1}</div>
                    <div className="stop-info">
                      <div className="stop-name">{stop.name}</div>
                      <div className="stop-audio">
                        {stop.audio
                          ? <span className="audio-badge">🎧 Audio guide</span>
                          : <span style={{color:'rgba(26,107,122,0.3)'}}>No audio</span>
                        }
                      </div>
                    </div>
                    <button className={`play-btn${!stop.audio ? ' no-audio' : ''}`}
                      onClick={e => { e.stopPropagation(); if (stop.audio) { setActiveStop(i); setPlaying(p => !p) } }}>
                      {playing && activeStop === i ? '⏸' : '▶'}
                    </button>
                  </div>
                ))}
              </div>

              {/* AUDIO PLAYER */}
              {selectedTour.route[activeStop]?.audio && (
                <div className="audio-player">
                  <div className="audio-title">Now playing: {selectedTour.route[activeStop].name}</div>
                  <div className="audio-bar">
                    <div className="audio-bar-fill" style={{width: playing ? '35%' : '0%'}} />
                  </div>
                  <div className="audio-controls">
                    <button className="audio-play" onClick={() => setPlaying(p => !p)}>
                      {playing ? '⏸' : '▶'}
                    </button>
                    <span className="audio-time">{playing ? '1:12' : '0:00'} / 3:24</span>
                    <span style={{fontSize:'11px', color:'rgba(255,255,255,0.4)', marginLeft:'auto'}}>Audio coming soon</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{padding:'32px 56px', borderTop:'1px solid rgba(26,107,122,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <Link href="/" style={{fontFamily:'Playfair Display, serif', fontSize:'18px', fontWeight:700, color:'#1a6b7a', textDecoration:'none'}}>GoThereNow</Link>
        <div style={{display:'flex', gap:'20px'}}>
          {[['Explore', '/explore'], ['For creators', '/for-creators'], ['Terms', '/terms'], ['Privacy', '/privacy']].map(([label, href]) => (
            <Link key={href} href={href} style={{fontSize:'13px', color:'rgba(26,107,122,0.45)', textDecoration:'none'}}>{label}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
