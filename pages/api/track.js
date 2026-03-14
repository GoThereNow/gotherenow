import { supabase } from '../../lib/supabase'

export const config = { api: { bodyParser: true } }

const BOOKING_REGIONAL = {
  US: 'https://www.booking.com', CA: 'https://www.booking.com',
  GB: 'https://www.booking.com', AU: 'https://www.booking.com',
  NZ: 'https://www.booking.com', DE: 'https://www.booking.com',
  FR: 'https://www.booking.com', IT: 'https://www.booking.com',
  ES: 'https://www.booking.com', NL: 'https://www.booking.com',
  BE: 'https://www.booking.com', CH: 'https://www.booking.com',
  AT: 'https://www.booking.com', SE: 'https://www.booking.com',
  NO: 'https://www.booking.com', DK: 'https://www.booking.com',
  FI: 'https://www.booking.com', PL: 'https://www.booking.com',
  IE: 'https://www.booking.com', GR: 'https://www.booking.com',
  JP: 'https://www.booking.com', SG: 'https://www.booking.com',
  HK: 'https://www.booking.com', IN: 'https://www.booking.com',
  TH: 'https://www.booking.com', MY: 'https://www.booking.com',
  AE: 'https://www.booking.com', SA: 'https://www.booking.com',
  ZA: 'https://www.booking.com', BR: 'https://www.booking.com',
  MX: 'https://www.booking.com', AR: 'https://www.booking.com',
  DEFAULT: 'https://www.booking.com',
}

const EXPEDIA_REGIONAL = {
  US: 'https://www.expedia.com', CA: 'https://www.expedia.ca',
  GB: 'https://www.expedia.co.uk', AU: 'https://www.expedia.com.au',
  NZ: 'https://www.expedia.co.nz', DE: 'https://www.expedia.de',
  FR: 'https://www.expedia.fr', IT: 'https://www.expedia.it',
  ES: 'https://www.expedia.es', SE: 'https://www.expedia.se',
  NO: 'https://www.expedia.no', DK: 'https://www.expedia.dk',
  NL: 'https://www.expedia.nl', BE: 'https://www.expedia.be',
  IE: 'https://www.expedia.ie', AT: 'https://www.expedia.at',
  CH: 'https://www.expedia.ch', JP: 'https://www.expedia.co.jp',
  SG: 'https://www.expedia.com.sg', HK: 'https://www.expedia.com.hk',
  MY: 'https://www.expedia.com.my', IN: 'https://www.expedia.co.in',
  MX: 'https://www.expedia.mx', BR: 'https://www.expedia.com.br',
  AR: 'https://www.expedia.com.ar', CO: 'https://www.expedia.com.co',
  DEFAULT: 'https://www.expedia.com',
}

const HOTELSCOM_REGIONAL = {
  US: 'https://www.hotels.com', CA: 'https://www.hotels.com',
  GB: 'https://www.hotels.com', AU: 'https://www.hotels.com',
  DEFAULT: 'https://www.hotels.com',
}

const AIRBNB_REGIONAL = {
  US: 'https://www.airbnb.com', CA: 'https://www.airbnb.ca',
  GB: 'https://www.airbnb.co.uk', AU: 'https://www.airbnb.com.au',
  FR: 'https://www.airbnb.fr', DE: 'https://www.airbnb.de',
  IT: 'https://www.airbnb.it', ES: 'https://www.airbnb.es',
  JP: 'https://www.airbnb.jp', BR: 'https://www.airbnb.com.br',
  MX: 'https://www.airbnb.mx', IN: 'https://www.airbnb.co.in',
  DEFAULT: 'https://www.airbnb.com',
}

const COUNTRY_CURRENCY = {
  US: 'USD', CA: 'CAD', GB: 'GBP', AU: 'AUD', NZ: 'NZD',
  JP: 'JPY', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  IN: 'INR', BR: 'BRL', MX: 'MXN', SG: 'SGD', HK: 'HKD',
  ZA: 'ZAR', AE: 'AED', SA: 'SAR', FR: 'EUR', DE: 'EUR',
  IT: 'EUR', ES: 'EUR', NL: 'EUR', PT: 'EUR', BE: 'EUR',
  AT: 'EUR', GR: 'EUR', FI: 'EUR', IE: 'EUR',
}

const DIRECT_PLATFORMS = ['Booking.com', 'Expedia', 'Hotels.com', 'Airbnb']
const RESTAURANT_PLATFORMS = ['OpenTable', 'Resy', 'TheFork']

function getCountryCode(req) {
  return (
    req.headers['x-vercel-ip-country'] ||
    req.headers['cf-ipcountry'] ||
    'US'
  ).toUpperCase()
}

function buildDirectUrl({ platform, settings, countryCode, subId, hotelName, city }) {
  const currency = COUNTRY_CURRENCY[countryCode] || 'USD'
  const hotelQuery = hotelName ? encodeURIComponent(`${hotelName} ${city || ''}`.trim()) : null

  if (platform === 'Booking.com') {
    const base = settings?.base_url || BOOKING_REGIONAL[countryCode] || BOOKING_REGIONAL.DEFAULT
    let url = base
    const sep = url.includes('?') ? '&' : '?'
    url += `${sep}label=${subId}`
    url += `&selected_currency=${currency}`
    if (hotelQuery) url += `&ss=${hotelQuery}`
    return url
  }

  if (platform === 'Expedia') {
    const regionalBase = EXPEDIA_REGIONAL[countryCode] || EXPEDIA_REGIONAL.DEFAULT
    let url = settings?.base_url || regionalBase
    if (settings?.base_url) {
      const path = settings.base_url.split(/expedia\.[a-z.]+/)[1] || ''
      url = regionalBase + path
    }
    const sep = url.includes('?') ? '&' : '?'
    url += `${sep}affcid=${subId}`
    return url
  }

  if (platform === 'Hotels.com') {
    const base = settings?.base_url || HOTELSCOM_REGIONAL[countryCode] || HOTELSCOM_REGIONAL.DEFAULT
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}ref=${subId}`
  }

  if (platform === 'Airbnb') {
    const regionalBase = AIRBNB_REGIONAL[countryCode] || AIRBNB_REGIONAL.DEFAULT
    let url = settings?.base_url || regionalBase
    if (settings?.base_url) {
      const path = settings.base_url.split(/airbnb\.[a-z.]+/)[1] || ''
      url = regionalBase + path
    }
    const sep = url.includes('?') ? '&' : '?'
    url += `${sep}af_id=${subId}`
    if (hotelQuery) url += `&c=${hotelQuery}`
    return url
  }

  return 'https://www.booking.com'
}

function buildTravelpayoutsUrl({ settings, countryCode, subId, hotelName, city }) {
  const marker = settings?.travelpayouts_marker || ''
  const partnerId = settings?.travelpayouts_partner_id || ''

  if (!marker) {
    return `https://www.booking.com${hotelName ? `?ss=${encodeURIComponent(hotelName)}` : ''}`
  }

  const hotelQuery = hotelName ? encodeURIComponent(`${hotelName} ${city || ''}`.trim()) : ''
  return `https://tp.media/r?marker=${marker}&sub_id=${subId}&p=${partnerId}&u=${encodeURIComponent(`https://www.booking.com/search.html?ss=${hotelQuery}`)}`
}

function buildOpenTableUrl({ settings, subId, restaurantName, city }) {
  const base = settings?.base_url || 'https://www.opentable.com'
  const rid = settings?.restaurant_id || ''
  const query = restaurantName ? encodeURIComponent(`${restaurantName} ${city || ''}`.trim()) : ''
  let url = rid ? `${base}/r/${rid}` : `${base}/s?term=${query}`
  const sep = url.includes('?') ? '&' : '?'
  url += `${sep}ref=${subId}&corrid=${subId}`
  return url
}

export default async function handler(req, res) {
  const {
    rec: recommendationId,
    platform: requestedPlatform,
    type: contentType
  } = req.query

  if (!recommendationId) return res.redirect(302, '/')

  try {
    const countryCode = getCountryCode(req)
    const platform = requestedPlatform || 'Booking.com'
    const isRestaurant = contentType === 'restaurant' || RESTAURANT_PLATFORMS.includes(platform)
    const isDirect = DIRECT_PLATFORMS.includes(platform)

    const table = isRestaurant ? 'restaurant_recommendations' : 'recommendations'
    const { data: rec } = await supabase
      .from(table)
      .select('id, hotel_name, name, city, country, influencers(id, handle, sub_id)')
      .eq('id', recommendationId)
      .single()

    if (!rec) return res.redirect(302, '/')

    const subId = rec.influencers?.sub_id || rec.influencers?.handle || 'unknown'
    const itemName = rec.hotel_name || rec.name

    const { data: settings } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('platform', platform)
      .single()

    let affiliateUrl

    if (isRestaurant) {
      affiliateUrl = buildOpenTableUrl({ settings, subId, restaurantName: itemName, city: rec.city })
    } else if (isDirect) {
      affiliateUrl = buildDirectUrl({ platform, settings, countryCode, subId, hotelName: itemName, city: rec.city })
    } else {
      affiliateUrl = buildTravelpayoutsUrl({ settings, countryCode, subId, hotelName: itemName, city: rec.city })
    }

    await supabase.from('clicks').insert({
      recommendation_id: recommendationId,
      influencer_id: rec.influencers?.id,
      platform,
      sub_id_used: subId,
      country_code: countryCode,
      content_type: isRestaurant ? 'restaurant' : 'hotel',
      is_direct: isDirect,
    })

    return res.redirect(302, affiliateUrl)

  } catch (error) {
    console.error('Track error:', error)
    return res.redirect(302, 'https://www.booking.com')
  }
}
