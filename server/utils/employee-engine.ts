import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, any[]>({ max: 5, ttl: 1000 * 60 * 30 }) 

export function normalizeName(name: any) {
  if (!name) return ''
  return String(name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Assumes the authoritative API source provides clean names.
 * Ensures the value is trimmed and safe for database entry.
 */
export function cleanPlantelName(raw: any): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const cleaned = String(raw).trim();
  return cleaned === '' ? null : cleaned;
}

function parseSoapXML(xmlString: string) {
  const employees = []
  const blocks = xmlString.match(/<T_Empleado[^>]*>([\s\S]*?)<\/T_Empleado>/g) || []
  
  for (const block of blocks) {
    const getTag = (tag: string) => {
      const match = block.match(new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`))
      return match ? match[1].trim() : ''
    }

    if (getTag('EsActivo') !== 'true') continue

    employees.push({
      id: getTag('ID_Empleado'),
      name: getTag('NombreCompleto'),
      rfc: getTag('RFC'),
      curp: getTag('CURP'),
      plantel: getTag('ClaveArea'), // Base SOAP value that drives truth downstream
      email: getTag('Correo')
    })
  }
  return employees
}

async function fetchSoapEmployees() {
  try {
    const soapBody = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"> <soap:Body> <EnviaTablaEmpleadosALL xmlns="http://tempuri.org/"> <p_Seguridad>375</p_Seguridad> </EnviaTablaEmpleadosALL> </soap:Body></soap:Envelope>`
    
    const response: string = await $fetch('http://www.ingressioenlanube.com:5002/ServicioWeb/ServicioW.asmx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"http://tempuri.org/EnviaTablaEmpleadosALL"'
      },
      body: soapBody,
      timeout: 5000 
    })

    return parseSoapXML(response)
  } catch (error) {
    console.error("SOAP error", error)
    return null
  }
}

export async function getSigniaData() {
  if (cache.has('signia_data')) return cache.get('signia_data')!
  
  try {
    const data: any[] = await $fetch('https://signia.casitaapps.com/api/export/employees', { timeout: 8000 })
    cache.set('signia_data', data)
    return data
  } catch (error) {
    console.error("Signia error", error)
    return []
  }
}

export async function getFastSoapEmployees() {
  if (cache.has('soap_list')) return cache.get('soap_list')!

  const soapData = await fetchSoapEmployees()
  const signiaData = await getSigniaData()

  // Build a fast lookup map from the authoritative Signia API
  const signiaMap = new Map()
  for (const s of signiaData) {
    if (s.curp && s.curp.length > 10) signiaMap.set(s.curp.toLowerCase(), s)
    else if (s.rfc && s.rfc.length > 8) signiaMap.set(s.rfc.toLowerCase(), s)
    else {
       const norm = normalizeName(s.name || `${s.nombres || ''} ${s.apellidoPaterno || ''} ${s.apellidoMaterno || ''}`)
       signiaMap.set(norm, s)
    }
  }

  // Cross-reference fast SOAP typeahead results with real PlantelNames to completely kill indexed regressions
  let finalData = (soapData || []).map(emp => {
     const normName = normalizeName(emp.name);
     const match = (emp.curp && signiaMap.get(emp.curp.toLowerCase())) ||
                   (emp.rfc && signiaMap.get(emp.rfc.toLowerCase())) ||
                   signiaMap.get(normName);

     return {
        ...emp,
        // Enforce SOAP Plantel priority for routing alignment while retaining fallback
        plantel: cleanPlantelName(emp.plantel) || cleanPlantelName(match?.plantel?.name),
        puesto: match?.puesto || emp.puesto,
        email: match?.email || emp.email,
        picture: match?.picture || null
     }
  })

  // Safe fallback if the fast SOAP API breaks completely
  if (!soapData || soapData.length === 0) {
    finalData = signiaData.filter(e => e.isActive !== false).map(e => ({
      id: e.id,
      name: e.name || `${e.nombres || ''} ${e.apellidoPaterno || ''} ${e.apellidoMaterno || ''}`.trim(),
      rfc: e.rfc,
      curp: e.curp,
      plantel: cleanPlantelName(e.plantel?.name),
      email: e.email,
      puesto: e.puesto || null,
      picture: e.picture || null
    }))
  }

  if (finalData && finalData.length > 0) {
    cache.set('soap_list', finalData)
  }
  return finalData || []
}

export async function getSigniaEnrichment(name: string, rfc?: string, curp?: string) {
  const signia = await getSigniaData()
  if (!signia || signia.length === 0) return {}

  const normName = normalizeName(name)
  const normRfc = rfc?.trim().toLowerCase()
  const normCurp = curp?.trim().toLowerCase()

  let match = null;

  if (normCurp || normRfc) {
    match = signia.find(e => 
      (normCurp && e.curp && String(e.curp).toLowerCase() === normCurp) || 
      (normRfc && e.rfc && String(e.rfc).toLowerCase() === normRfc)
    )
  }

  if (!match) {
    match = signia.find(e => {
      const sName = normalizeName(e.name || `${e.nombres || ''} ${e.apellidoPaterno || ''} ${e.apellidoMaterno || ''}`)
      return sName === normName
    })
  }

  if (match) {
    let pictureUrl = match.picture
    if (pictureUrl && !pictureUrl.startsWith('http')) {
      pictureUrl = `https://signia.casitaapps.com/${pictureUrl.replace(/^\//, '')}`
    }
    return { 
      ...match, 
      picture: pictureUrl, 
      plantelName: cleanPlantelName(match.plantel?.name) 
    }
  }

  return {}
}