const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY

async function resolvePhotoUrl(photoRef) {
  if (!photoRef) return null
  // Fetch the photo URL server-side to follow the redirect and get the final image URL
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`
  try {
    const response = await fetch(url, { redirect: 'follow' })
    // Return the final redirected URL
    return response.url
  } catch (e) {
    return null
  }
}

export default async function handler(req, res) {
  const { action, query, place_id } = req.query

  if (action === 'search') {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' hotel')}&type=lodging&key=${GOOGLE_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    const results = (data.results || []).slice(0, 6).map(place => ({
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      photo_reference: place.photos?.[0]?.photo_reference || null,
    }))

    return res.json({ results })
  }

  if (action === 'details') {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=name,formatted_address,geometry,photos,address_components&key=${GOOGLE_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()
    const result = data.result || {}

    let city = '', country = ''
    const components = result.address_components || []
    for (const c of components) {
      if (c.types.includes('locality') || c.types.includes('postal_town')) city = c.long_name
      if (c.types.includes('country')) country = c.long_name
    }

    const photoRef = result.photos?.[0]?.photo_reference
    const photo_url = await resolvePhotoUrl(photoRef)

    return res.json({
      name: result.name,
      city,
      country,
      lat: result.geometry?.location?.lat,
      lng: result.geometry?.location?.lng,
      photo_url,
    })
  }

  // Proxy the photo to avoid CORS issues
  if (action === 'photo') {
    const { ref } = req.query
    if (!ref) return res.status(400).json({ error: 'No ref' })
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${GOOGLE_API_KEY}`
    const response = await fetch(url, { redirect: 'follow' })
    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    return res.send(Buffer.from(buffer))
  }

  if (action === 'nearby') {
    const { lat, lng } = req.query
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=2000&type=lodging&key=${GOOGLE_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()
    const results = (data.results || []).slice(0, 10).map(place => ({
      place_id: place.place_id,
      name: place.name,
      address: place.vicinity,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
    }))
    return res.json({ results })
  }

  return res.status(400).json({ error: 'Invalid action' })
}

export const config = { api: { bodyParser: false } }
