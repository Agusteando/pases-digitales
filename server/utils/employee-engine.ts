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
 * Prevents cross-employee leakage by filtering out truly invalid or generic public identities.
 * Relaxed to ensure genuine CURP formats provided by SOAP are always evaluated.
 */
function isGenericIdentity(val: any): boolean {
  if (!val) return true;
  const clean = String(val).trim().toUpperCase();
  if (clean.length < 10) return true; // Too short to be a valid RFC or CURP
  if (/^[0]+$/.test(clean) || /^[1]+$/.test(clean) || /^[X]+$/.test(clean)) return true;
  if (clean.startsWith('XAXX010101') || clean.startsWith('XEXX010101')) return true;
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
      email: getTag('Correo'),
      ingressioId: getTag('ClaveNomina') // Extracted to use as a strong fallback
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
  // We use arrays per key to handle duplicates securely.
  const signiaMap = new Map<string, any[]>()
  
  const addToMap = (key: string, emp: any) => {
    if (!key) return;
    const list = signiaMap.get(key) || [];
    list.push(emp);
    signiaMap.set(key, list);
  }

  for (const s of signiaData) {
    const sName = normalizeName(s.name || `${s.nombres || ''} ${s.apellidoPaterno || ''} ${s.apellidoMaterno || ''}`)
    
    if (!isGenericIdentity(s.curp)) addToMap(String(s.curp).toLowerCase(), s)
    if (s.ingressioId) addToMap(String(s.ingressioId).trim(), s)
    if (!isGenericIdentity(s.rfc)) addToMap(String(s.rfc).toLowerCase(), s)
    
    addToMap(sName, s)
  }

  // Cross-reference fast SOAP typeahead results with real PlantelNames and logic priorities
  let finalData = (soapData || []).map(emp => {
     const normName = normalizeName(emp.name);
     const cKey = !isGenericIdentity(emp.curp) ? String(emp.curp).toLowerCase() : null;
     const iKey = emp.ingressioId ? String(emp.ingressioId).trim() : null;
     const rKey = !isGenericIdentity(emp.rfc) ? String(emp.rfc).toLowerCase() : null;

     let bestMatch = null;

     const findBestInList = (list: any[]) => {
       if (!list || list.length === 0) return null;
       if (list.length === 1) return list[0];
       const active = list.filter(e => e.isActive !== false);
       const targetList = active.length > 0 ? active : list;
       const nameMatch = targetList.find(e => normalizeName(e.name || `${e.nombres || ''} ${e.apellidoPaterno || ''} ${e.apellidoMaterno || ''}`) === normName);
       if (nameMatch) return nameMatch;
       targetList.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
       return targetList[0];
     }

     if (cKey && signiaMap.has(cKey)) bestMatch = findBestInList(signiaMap.get(cKey)!);
     if (!bestMatch && iKey && signiaMap.has(iKey)) bestMatch = findBestInList(signiaMap.get(iKey)!);
     if (!bestMatch && rKey && signiaMap.has(rKey)) bestMatch = findBestInList(signiaMap.get(rKey)!);
     if (!bestMatch && signiaMap.has(normName)) bestMatch = findBestInList(signiaMap.get(normName)!);

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
      ingressioId: e.ingressioId || null,
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

export async function getSigniaEnrichment(name: string, rfc?: string, curp?: string, ingressioId?: string) {
  const signia = await getSigniaData()
  if (!signia || signia.length === 0) return {}

  const normName = normalizeName(name)
  const validCurp = isGenericIdentity(curp) ? null : String(curp).trim().toLowerCase()
  const validIngressio = ingressioId ? String(ingressioId).trim() : null
  const validRfc = isGenericIdentity(rfc) ? null : String(rfc).trim().toLowerCase()

  const findBestInList = (list: any[]) => {
    if (!list || list.length === 0) return null;
    if (list.length === 1) return list[0];
    const active = list.filter(e => e.isActive !== false);
    const targetList = active.length > 0 ? active : list;
    const nameMatch = targetList.find(e => normalizeName(e.name || `${e.nombres || ''} ${e.apellidoPaterno || ''} ${e.apellidoMaterno || ''}`) === normName);
    if (nameMatch) return nameMatch;
    targetList.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    return targetList[0];
  }

  let match = null;

  // 1. Strict CURP Priority
  if (validCurp && !match) {
    match = findBestInList(signia.filter(e => e.curp && String(e.curp).toLowerCase() === validCurp));
  }
  // 2. ingressioId (ClaveNomina) Priority
  if (validIngressio && !match) {
    match = findBestInList(signia.filter(e => e.ingressioId && String(e.ingressioId).trim() === validIngressio));
  }
  // 3. RFC Priority
  if (validRfc && !match) {
    match = findBestInList(signia.filter(e => e.rfc && String(e.rfc).toLowerCase() === validRfc));
  }
  // 4. Exact Name Match Fallback
  if (!match) {
    match = findBestInList(signia.filter(e => {
      const sName = normalizeName(e.name || `${e.nombres || ''} ${e.apellidoPaterno || ''} ${e.apellidoMaterno || ''}`)
      return sName === normName && sName !== ''
    }));
  }

  if (match) {
    // Background Auto-Sync Mechanism: 
    // If we confidently matched by CURP, and the local SOAP ingressioId (ClaveNomina) differs from the one in Signia,
    // we fire a background request to the external API to patch the missing/wrong data.
    if (validCurp && validIngressio && match.curp && String(match.curp).toLowerCase() === validCurp) {
       const signiaIngressio = match.ingressioId ? String(match.ingressioId).trim() : null;
       if (signiaIngressio !== validIngressio) {
         $fetch('https://signia.casitaapps.com/api/export/employees/update', {
           method: 'PATCH',
           body: { match: { curp: match.curp }, ingressioId: validIngressio }
         }).catch(err => console.error('[Signia Sync] Fallo al actualizar ingressioId:', err));
       }
    }

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