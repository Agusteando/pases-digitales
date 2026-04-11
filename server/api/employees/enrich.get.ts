import { defineCachedEventHandler, getQuery, createError, useRuntimeConfig } from '#imports'

export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event)
  const curp = query.curp as string

  if (!curp || curp === 'undefined' || curp === 'null') {
    throw createError({ statusCode: 400, message: 'CURP is required for deterministic enrichment' })
  }

  const config = useRuntimeConfig()
  let enrichedData: any = null

  try {
    // Pure Signia Export API fetch using ONLY the exact CURP.
    // Zero SOAP/local data is loaded, merged, or referenced here.
    const response: any = await $fetch(config.signiaApiUrl, {
      query: { curp: curp.trim() },
      timeout: 8000
    })

    if (Array.isArray(response) && response.length > 0) {
      enrichedData = response.find((e: any) => e.curp && String(e.curp).toLowerCase() === curp.trim().toLowerCase()) || response[0]
    } else if (response && !Array.isArray(response) && response.curp) {
      enrichedData = response
    }
  } catch (err) {
    console.error('Direct Signia Export API enrichment error:', err)
  }

  // Explicit fail / miss response:
  // If Signia has no record of this CURP, return a strict miss payload.
  // NO fallback to local DB or SOAP fields is allowed.
  if (!enrichedData) {
    return {
      picture: null,
      puesto: null,
      email: null,
      plantel: null,
      isActive: false,
      curp: curp,
      numero_nomina: null
    }
  }

  let pictureUrl = enrichedData.picture || null
  if (pictureUrl && !pictureUrl.startsWith('http')) {
    pictureUrl = `https://signia.casitaapps.com/${pictureUrl.replace(/^\//, '')}`
  }

  let plantelName = null
  if (enrichedData.plantel && typeof enrichedData.plantel === 'object' && enrichedData.plantel.name) {
    plantelName = String(enrichedData.plantel.name).trim()
  } else if (enrichedData.plantelName) {
    plantelName = String(enrichedData.plantelName).trim()
  }

  // Returns ONLY fields sourced from the Signia response.
  return {
    picture: pictureUrl,
    puesto: enrichedData.puesto || null,
    email: enrichedData.email || null,
    plantel: plantelName || null,
    isActive: enrichedData.isActive !== false,
    curp: enrichedData.curp || curp,
    numero_nomina: enrichedData.ingressioId || null
  }
}, {
  maxAge: 60 * 60 * 12,
  swr: true,
  name: 'signia-export-curp-pure',
  getKey: (event) => `curp-pure-${getQuery(event).curp || 'missing'}`
})