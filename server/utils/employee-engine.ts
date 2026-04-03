import { LRUCache } from 'lru-cache'

// Local in-memory caching to prevent external API rate-limiting and ensure 0ms lookup latency
const cache = new LRUCache<string, any[]>({ max: 1, ttl: 1000 * 60 * 60 })

function normalizeName(name: string) {
  // Removes accents and extra spaces for accurate deduplication
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, ' ').trim();
}

export async function getActiveEmployees() {
  if (cache.has('active_employees')) {
    return cache.get('active_employees')!
  }

  try {
    const data: any[] = await $fetch('https://signia.casitaapps.com/api/export/employees')
    
    const byName = new Map()

    data.filter(emp => emp.isActive).forEach(emp => {
      const rawName = emp.name || `${emp.nombres || ''} ${emp.apellidoPaterno || ''} ${emp.apellidoMaterno || ''}`.trim()
      const normName = normalizeName(rawName)
      
      if (!normName) return

      // Fix image paths: if it's a relative storage path, point it to the external domain
      let pictureUrl = emp.picture
      if (pictureUrl && !pictureUrl.startsWith('http')) {
        pictureUrl = `https://signia.casitaapps.com/${pictureUrl.replace(/^\//, '')}`
      }

      const parsedEmp = {
        id: emp.id,
        name: rawName,
        email: emp.email,
        picture: pictureUrl,
        puesto: emp.puesto,
        role: emp.role,
        plantelId: emp.plantelId,
        rfc: emp.rfc,
        curp: emp.curp
      }

      // Deduplication Logic: Keep the record with the most metadata
      if (!byName.has(normName)) {
        byName.set(normName, parsedEmp)
      } else {
        const existing = byName.get(normName)
        // If the new record has a puesto/plantel and the old one doesn't, overwrite it
        if (!existing.puesto && parsedEmp.puesto) {
          byName.set(normName, parsedEmp)
        } else if (!existing.plantelId && parsedEmp.plantelId) {
          byName.set(normName, parsedEmp)
        }
      }
    })

    const active = Array.from(byName.values())
    cache.set('active_employees', active)
    return active

  } catch (error) {
    console.error("Failed to fetch employees from Signia API:", error)
    return [] 
  }
}

export async function searchEmployees(query: string, plantelId?: string) {
  const dataset = await getActiveEmployees()
  if (!query) return []

  const q = normalizeName(query)
  
  return dataset.filter(emp => {
    if (plantelId && emp.plantelId !== plantelId) return false
    
    // High-priority exact lookups
    if (emp.email?.toLowerCase() === q || emp.rfc?.toLowerCase() === q || emp.curp?.toLowerCase() === q) {
      return true
    }
    // Fuzzy name matching fallback
    return normalizeName(emp.name).includes(q)
  }).slice(0, 15) // Limit payload to keep UI snappy
}