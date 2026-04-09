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

/**
 * Prevents cross-employee leakage by filtering out invalid, short, or generic public identities.
 */
function isGenericIdentity(val: any): boolean {
  if (!val) return true;
  const clean = String(val).trim().toUpperCase();
  if (clean.length < 10) return true;
  if (/^0+$/.test(clean) || /^1+$/.test(clean) || /^X+$/.test(clean)) return true;
  if (clean === 'XAXX010101000' || clean === 'XEXX010101000') return true;
  return false;
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
  // We use arrays per key to handle duplicates without overwriting, preventing typeahead leakage
  const signiaMap = new Map<string, any[]>()
  
  const addToMap = (key: string, emp: any) => {
    if (!key) return;
    const list = signiaMap.get(key) || [];
    list.push(emp);
    signiaMap.set(key, list);
  }

  for (const s of signiaData) {
    const sName = normalizeName(s.name || `${s.nombres || ''} ${s.apellidoPaterno || ''} ${s.apellidoMaterno || ''}`)
    
    const curpValid = !isGenericIdentity(s.curp);
    const rfcValid = !isGenericIdentity(s.rfc);

    if (curpValid) addToMap(String(s.curp).toLowerCase(), s)
    if (rfcValid) addToMap(String(s.rfc).toLowerCase(), s)
    
    addToMap(sName, s)
  }

  // Cross-reference fast SOAP typeahead results with real PlantelNames to completely kill indexed regressions
  let finalData = (soapData || []).map(emp => {
     const normName = normalizeName(emp.name);
     const cKey = emp.curp && !isGenericIdentity(emp.curp) ? String(emp.curp).toLowerCase() : null;
     const rKey = emp.rfc && !isGenericIdentity(emp.rfc) ? String(emp.rfc).toLowerCase() : null;

     let bestMatch = null;

     // 1. Strict CURP Match Priority
     if (cKey && signiaMap.has(cKey)) {
         const list = signiaMap.get(cKey)!;
         bestMatch = list.length === 1 ? list[0] : (list.find(e => normalizeName(e.name || `${e.nombres || ''} ${e.apellidoPaterno || ''} ${e.apellidoMaterno || ''}`) === normName) || list[0]);
     }
     // 2. Strict RFC Match Priority (Only if CURP didn't exist)
     else if (rKey && signiaMap.has(rKey)) {
         const list = signiaMap.get(rKey)!;
         bestMatch = list.length === 1 ? list[0] : (list.find(e => normalizeName(e.name || `${e.nombres || ''} ${e.apellidoPaterno || ''} ${e.apellidoMaterno || ''}`) === normName) || list[0]);
     }
     // 3. Exact Name Match (ONLY if no valid CURP/RFC was provided by the source dataset)
     else if (!cKey && !rKey && signiaMap.has(normName)) {
         const list = [...signiaMap.get(normName)!];
         if (list.length === 1) {
             bestMatch = list[0];
         } else {
             // Duplicate records in Signia (e.g., ID 784 and 787). Resolve securely:
             // Order by ID descending (newest first) and prefer active records to avoid old contracts.
             list.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
             const active = list.filter(e => e.isActive !== false);
             bestMatch = active.length > 0 ? active[0] : list[0];
         }
     }

     return {
        ...emp,
        // Enforce SOAP Plantel priority for routing alignment while retaining fallback
        plantel: cleanPlantelName(emp.plantel) || cleanPlantelName(bestMatch?.plantel?.name),
        puesto: bestMatch?.puesto || emp.puesto,
        email: bestMatch?.email || emp.email,
        picture: bestMatch?.picture || null
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
  const validRfc = isGenericIdentity(rfc) ? null : String(rfc).trim().toLowerCase()
  const validCurp = isGenericIdentity(curp) ? null : String(curp).trim().toLowerCase()

  let match = null;

  // RULE 1: Prioritize CURP/RFC strictly
  if (validCurp || validRfc) {
    const matches = signia.filter(e =>
      (validCurp && e.curp && String(e.curp).toLowerCase() === validCurp) ||
      (validRfc && e.rfc && String(e.rfc).toLowerCase() === validRfc)
    )

    if (matches.length === 1) {
      match = matches[0];
    } else if (matches.length > 1) {
      // Tie-break identical CURPs by exact name match
      match = matches.find(e => {
        const sName = normalizeName(e.name || `${e.nombres || ''} ${e.apellidoPaterno || ''} ${e.apellidoMaterno || ''}`);
        return sName === normName;
      }) || matches[0];
    }
    
    // CRITICAL: If a valid CURP was provided, but 'match' is null (Signia doesn't have it),
    // NEVER fall back to name-based matching. This intentionally returns empty to prevent data leakage.
  } 
  // RULE 2: Fallback to exact name matching ONLY if no valid CURP/RFC was provided initially
  else {
    const matches = signia.filter(e => {
      const sName = normalizeName(e.name || `${e.nombres || ''} ${e.apellidoPaterno || ''} ${e.apellidoMaterno || ''}`)
      return sName === normName && sName !== ''
    })

    if (matches.length === 1) {
      match = matches[0];
    } else if (matches.length > 1) {
      // Duplicate exact names found without CURP (e.g. Employee ID 784 vs 787).
      // Safely resolve by prioritizing the newest record (ID Descending) that remains active.
      matches.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
      const activeMatches = matches.filter(e => e.isActive !== false);
      match = activeMatches.length > 0 ? activeMatches[0] : matches[0];
    }
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