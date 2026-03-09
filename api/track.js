import { supabase } from '../../lib/supabase'

// This is the magic tracking endpoint
// When a user clicks "Book Now", they go to:
// gotherenow.app/api/track?rec=RECOMMENDATION_ID&platform=booking.com
// We log the click, build the affiliate URL with the influencer's sub-ID, then redirect

export default async function handler(req, res) {
  const { rec: recommendationId, platform } = req.query

  if (!recommendationId) {
    return res.redirect(302, '/')
  }

  try {
    // Get recommendation + influencer sub-ID + platform settings
    const { data: recommendation } = await supabase
      .from('recommendations')
      .select(`
        *,
        influencers (
          id,
          handle,
          sub_id
        )
      `)
      .eq('id', recommendationId)
      .single()

    if (!recommendation) {
      return res.redirect(302, '/')
    }

    // Get platform settings (master affiliate links)
    const { data: platformSettings } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('platform', platform || 'Booking.com')
      .single()

    // Build the affiliate URL with influencer sub-ID
    let affiliateUrl = platformSettings?.base_url || 'https://www.booking.com'
    const subId = recommendation.influencers?.sub_id || recommendation.influencers?.handle

    if (platformSettings && subId) {
      // Append the sub-ID tracking parameter
      const separator = affiliateUrl.includes('?') ? '&' : '?'
      affiliateUrl = `${affiliateUrl}${separator}${platformSettings.label_param}=${subId}`
    }

    // Also append hotel search if we have the hotel name
    if (recommendation.hotel_name && platformSettings?.supports_search) {
      const hotelQuery = encodeURIComponent(recommendation.hotel_name + ' ' + recommendation.city)
      affiliateUrl += `&ss=${hotelQuery}`
    }

    // Log the click
    await supabase.from('clicks').insert({
      recommendation_id: recommendationId,
      influencer_id: recommendation.influencers?.id,
      platform: platform || 'Booking.com',
      sub_id_used: subId,
    })

    // Redirect to affiliate URL
    return res.redirect(302, affiliateUrl)

  } catch (error) {
    console.error('Track error:', error)
    return res.redirect(302, 'https://www.booking.com')
  }
}
