const GOOGLE_API_KEY = 'AIzaSyApckzVwdewschovsR-ck65vg0ERR8Ycmc'

export default async function handler(req, res) {
  const { action, query, place_id } = req.query

  if (action === 'search') {
    // Search for hotels by name
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

  if (action === 'photo') {
    // Fetch photo for a place
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${place_id}&key=${GOOGLE_API_KEY}`
    const response = await fetch(url)
    // Google redirects to the actual image — return the final URL
    return res.json({ photo_url: response.url })
  }

  if (action === 'details') {
    // Get full details including photos
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=name,formatted_address,geometry,photos,address_components&key=${GOOGLE_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()
    const result = data.result || {}

    // Extract city and country from address components
    let city = '', country = ''
    const components = result.address_components || []
    for (const c of components) {
      if (c.types.includes('locality') || c.types.includes('postal_town')) city = c.long_name
      if (c.types.includes('country')) country = c.long_name
    }

    const photoRef = result.photos?.[0]?.photo_reference
    let photo_url = null
    if (photoRef) {
      const photoResp = await fetch(`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`)
      photo_url = photoResp.url
    }

    return res.json({
      name: result.name,
      city,
      country,
      lat: result.geometry?.location?.lat,
      lng: result.geometry?.location?.lng,
      photo_url,
    })
  }

  return res.status(400).json({ error: 'Invalid action' })
}
