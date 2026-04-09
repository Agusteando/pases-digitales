import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export default defineEventHandler(async () => {
  const db = useDB()
  
  // CRITICAL FIX: Entorno Vercel Serverless opera en UTC de forma estricta.
  // Forzamos el reloj del servidor a la hora de México para garantizar que 
  // las estadísticas evalúen la jornada correcta independientemente de la hora UTC.
  const todayDate = dayjs().tz('America/Mexico_City').format('YYYY-MM-DD')

  try {
    const [rows]: any = await db.execute(`
      SELECT category_id, plantel, COUNT(*) as count 
      FROM hr_entries 
      WHERE DATE(date) = ? AND status != 'cancelado'
      GROUP BY category_id, plantel
    `, [todayDate])

    let totalToday = 0
    const catMap: Record<number, number> = {}
    const plantelMap: Record<string, number> = {}

    rows.forEach((row: any) => {
      const count = Number(row.count)
      totalToday += count
      catMap[row.category_id] = (catMap[row.category_id] || 0) + count
      const p = cleanPlantelName(row.plantel) || 'Sin Plantel'
      plantelMap[p] = (plantelMap[p] || 0) + count
    })

    const categoryNames: Record<number, string> = {
      1: 'Llegada tarde',
      2: 'Salida anticipada',
      3: 'Ausencia justificada',
      4: 'Cambio de horario',
      5: 'Incapacidad médica'
    }

    const byCategory = Object.keys(catMap).map(k => ({
      name: categoryNames[Number(k)] || 'Otro',
      count: catMap[Number(k)]
    })).sort((a, b) => b.count - a.count)

    const byPlantel = Object.keys(plantelMap).map(k => ({
      name: k,
      count: plantelMap[k]
    })).sort((a, b) => b.count - a.count)

    return { totalToday, byCategory, byPlantel }

  } catch (error) {
    console.error("Stats Error:", error)
    return { totalToday: 0, byCategory: [], byPlantel: [] }
  }
})