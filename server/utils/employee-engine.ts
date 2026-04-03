import { LRUCache } from 'lru-cache'

// Cache dataset for 1 hour to prevent hammering the external API
const cache = new LRUCache<string, any[]>({ max: 1, ttl: 1000 * 60 * 60 })

export async function getActiveEmployees() {
  if (cache.has('active_employees')) {
    return cache.get('active_employees')!
  }

  // Use only what we need from the source of truth
  const data: any[] = await $fetch('https://signia.casitaapps.com/api/export/employees')
  
  const active = data
    .filter(emp => emp.isActive)
    .map(emp => ({
      id: emp.id,
      name: emp.name || `${emp.nombres} ${emp.apellidoPaterno} ${emp.apellidoMaterno}`.trim(),
      email: emp.email,
      picture: emp.picture,
      puesto: emp.puesto,
      role: emp.role,
      plantelId: emp.plantelId,
      rfc: emp.rfc,
      curp: emp.curp
    }))

  cache.set('active_employees', active)
  return active
}

export async function searchEmployees(query: string, plantelId?: string) {
  const dataset = await getActiveEmployees()
  if (!query) return []

  const q = query.toLowerCase()
  
  return dataset.filter(emp => {
    if (plantelId && emp.plantelId !== plantelId) return false
    
    // Exact lookups
    if (emp.email?.toLowerCase() === q || emp.rfc?.toLowerCase() === q || emp.curp?.toLowerCase() === q) {
      return true
    }
    // Fuzzy name matching
    return emp.name.toLowerCase().includes(q)
  }).slice(0, 10) // Return top 10 for UI speed
}