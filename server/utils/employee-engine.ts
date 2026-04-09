import { LRUCache } from 'lru-cache'

// Caché en memoria (RAM) para las funciones Serverless mientras estén "calientes".
// Reduce enormemente el tiempo de procesamiento si Vercel reutiliza la instancia.
const cache = new LRUCache<string, any[]>({ max: 5, ttl: 1000 * 60 * 30 }) 

// Set global para rastrear parcheos en curso y evitar condiciones de carrera
// si múltiples requests concurrentes intentan arreglar al mismo empleado.
const inFlightPatches = new Set<string>();

export function normalizeName(name: any) {
  if (!name) return ''
  return String(name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, ' ').trim();
}

export function cleanPlantelName(raw: any): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const cleaned = String(raw).trim();
  return cleaned === '' ? null : cleaned;
}

/**
 * Filtro de seguridad: ignora identidades de relleno genéricas (ej. XAXX010101000) 
 * para prevenir colisiones masivas entre empleados sin datos completos.
 */
function isGenericIdentity(val: any): boolean {
  if (!val) return true;
  const clean = String(val).trim().toUpperCase();
  if (clean.length < 10) return true;
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
      plantel: getTag('ClaveArea'), 
      email: getTag('Correo'),
      ingressioId: getTag('ClaveNomina') 
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
     
     // Block name-based matching if ANY authoritative key is present but failed
     const hasAuthKey = cKey || iKey || rKey;
     if (!bestMatch && !hasAuthKey && signiaMap.has(normName)) {
       bestMatch = findBestInList(signiaMap.get(normName)!);
     }

     return {
        ...emp,
        plantel: cleanPlantelName(emp.plantel) || cleanPlantelName(bestMatch?.plantel?.name),
        puesto: bestMatch?.puesto || emp.puesto,
        email: bestMatch?.email || emp.email,
        picture: bestMatch?.picture || null
     }
  })

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
  let hasAuthority = false;

  // Prioridad 1: Match Exacto y Seguro por CURP
  if (validCurp) {
    const matchedCurp = findBestInList(signia.filter(e => e.curp && String(e.curp).toLowerCase() === validCurp));
    if (matchedCurp) {
      match = matchedCurp;
      hasAuthority = true;
    }
  }
  
  // Prioridad 2: ClaveNomina de Ingressio
  if (!match && validIngressio) {
    const matchedIngressio = findBestInList(signia.filter(e => e.ingressioId && String(e.ingressioId).trim() === validIngressio));
    if (matchedIngressio) {
      match = matchedIngressio;
      hasAuthority = true;
    }
  }
  
  // Prioridad 3: RFC
  if (!match && validRfc) {
    const matchedRfc = findBestInList(signia.filter(e => e.rfc && String(e.rfc).toLowerCase() === validRfc));
    if (matchedRfc) {
      match = matchedRfc;
      hasAuthority = true;
    }
  }

  // Prioridad 4 (Fallback Seguro): Solo busca por nombre si NO teníamos NINGÚN identificador autoritativo válido.
  if (!match && !hasAuthority) {
    match = findBestInList(signia.filter(e => {
      const sName = normalizeName(e.name || `${e.nombres || ''} ${e.apellidoPaterno || ''} ${e.apellidoMaterno || ''}`)
      return sName === normName && sName !== ''
    }));
  }

  if (match) {
    // ---------------------------------------------------------------------------------
    // LÓGICA DE SINCRONIZACIÓN Y PARCHEO (AUTO-HEALING): VERCEL OPTIMIZED
    // ---------------------------------------------------------------------------------
    if (hasAuthority && validIngressio && String(match.ingressioId).trim() !== validIngressio) {
      const patchKey = `${match.id}-${validIngressio}`;
      
      // La validación en inFlightPatches previene que peticiones concurrentes lancen múltiples PATCHes idénticos.
      if (!inFlightPatches.has(patchKey)) {
        inFlightPatches.add(patchKey);
        
        try {
          // El await previene que Vercel congele la lambda, asegurando la ejecución.
          // El timeout de 3000ms garantiza que el "hot-path" del usuario nunca se congele si Signia falla.
          await $fetch(`https://signia.casitaapps.com/api/employees/${match.id}`, {
            method: 'PATCH',
            body: { ingressioId: validIngressio },
            timeout: 3000 
          });
          
          // La mutación optimista aquí actualiza la referencia de 'match' que reside directamente en 'cache'.
          // Gracias a esto, el sistema se auto-corrige en memoria en milisegundos. Todas las peticiones
          // subsiguientes (hasta que la caché LRU caduque) verán el ID correcto y no volverán a disparar el PATCH,
          // resultando en costo $0 de cómputo adicional tras la primera reparación exitosa.
          match.ingressioId = validIngressio;
        } catch (e) {
          console.warn(`[Auto-Healing] Fallo al parchear ingressioId para el empleado ${match.id} en Signia.`, e);
        } finally {
          // Liberar el candado
          inFlightPatches.delete(patchKey);
        }
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