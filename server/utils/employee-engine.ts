import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, any[]>({ max: 5, ttl: 1000 * 60 * 30 }) 

export function normalizeName(name: any) {
  if (!name) return ''
  return String(name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, ' ').trim();
}

export function cleanPlantelName(raw: any): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const cleaned = String(raw).trim();
  return cleaned === '' ? null : cleaned;
}

export function isGenericIdentity(val: any): boolean {
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
      ClaveUnica: getTag('ClaveUnica') 
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

// Mantained purely for API endpoints that require the entire flat list of positions (puestos)
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

// STRICTLY SOAP. No Signia fetching or array merging here anymore.
// Ensures `picture` is absolutely never injected at the search dataset level.
export async function getFastSoapEmployees() {
  if (cache.has('soap_list')) return cache.get('soap_list')!

  const soapData = await fetchSoapEmployees()
  
  if (soapData && soapData.length > 0) {
    const finalData = soapData.map(emp => ({
       id: emp.id,
       name: emp.name,
       rfc: emp.rfc,
       curp: emp.curp,
       plantel: cleanPlantelName(emp.plantel),
       email: emp.email,
       puesto: null, // Puesto is deferred to the Signia Enrichment lookup
       ClaveUnica: emp.ClaveUnica
       // Intentionally no picture field here
    }))
    cache.set('soap_list', finalData)
    return finalData
  }
  
  return []
}