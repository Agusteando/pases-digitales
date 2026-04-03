import { useDB } from '~/server/utils/db'
import dayjs from 'dayjs'

export default defineEventHandler(async () => {
  const db = useDB()
  const todayDate = dayjs().format('YYYY-MM-DD')

  try {
    // Extract movements for today by category and location
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
      const c = Number(row.count)
      totalToday += c
      
      catMap[row.category_id] = (catMap[row.category_id] || 0) + c
      
      const p = row.plantel || 'Sin Plantel'
      plantelMap[p] = (plantelMap[p] || 0) + c
    })

    const categoryNames: Record<number, string> = {
      1: 'Llegada Tarde',
      2: 'Salida Temprano',
      3: 'Faltas',
      4: 'Cambios',
      5: 'IMSS'
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
    console.error("Stats DB Error:", error)
    return { totalToday: 0, byCategory: [], byPlantel: [] }
  }
})