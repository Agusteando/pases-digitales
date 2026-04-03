export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = query.q as string
  
  if (!q || q.length < 2) {
    return []
  }

  const searchName = normalizeName(q)
  
  // Get from our high-speed SOAP memory cache
  const dataset = await getInternalEmployeeList()

  // Filter and STRICTLY remove sensitive keys (RFC, CURP) before sending to the frontend
  const results = dataset
    .filter(emp => normalizeName(emp.name).includes(searchName))
    .slice(0, 15)
    .map(emp => ({
      id: emp.id,
      name: emp.name,
      plantel: emp.plantel
      // Note: We deliberately exclude RFC and CURP here.
    }))

  return results
})