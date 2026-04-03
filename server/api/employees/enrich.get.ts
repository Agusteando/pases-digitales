import { useDB } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string
  const name = query.name as string

  if (!id && !name) return {}

  const db = useDB()
  let localCurp: string | undefined
  let localRfc: string | undefined

  // Retrieve sensitive keys securely on the server
  try {
    const [rows]: any = await db.execute(
      `SELECT curp, rfc FROM empleados WHERE id = ? OR nombre = ? LIMIT 1`, 
      [id, name]
    )
    if (rows && rows.length > 0) {
      localCurp = rows[0].curp
      localRfc = rows[0].rfc
    }
  } catch(e) {
    // Graceful fallback to pure fuzzy matching if table fails
  }

  const enriched = await getSigniaEnrichment(name, localRfc, localCurp)

  // STRICT RULE: Remove RFC/CURP before responding.
  return {
    picture: enriched.picture || null,
    puesto: enriched.puesto || null,
    email: enriched.email || null,
    plantelId: enriched.plantelId || null,
    isActive: enriched.isActive !== false
  }
})