

import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import { defineEventHandler, getQuery, createError } from '#imports'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const employeeName = query.name as string

  if (!employeeName) return []

  const now = dayjs().tz('America/Mexico_City')
  const currentYear = now.year()
  const currentMonth = now.month()
  
  let startYear = currentYear
  let endYear = currentYear + 1
  if (currentMonth < 7) { 
    startYear = currentYear - 1
    endYear = currentYear
  }
  
  const startDate = `${startYear}-08-01 00:00:00`
  const endDate = `${endYear}-07-31 23:59:59`

  try {
    const db = useDB()
    const [rows]: any = await db.execute(
      `SELECT id, date, fecha_fin, time, comentarios, category_id, status, user, plantel, tipo_permiso, authorized_by, authorized_at, horario_entrada, horario_salida
       FROM hr_entries 
       WHERE employee_name = ? AND date >= ? AND date <= ?
       ORDER BY date DESC, id DESC`,
      [employeeName, startDate, endDate]
    )

    return {
      cycle: `${startYear}-${endYear}`,
      history: rows.map((r: any) => ({ ...r, plantel: cleanPlantelName(r.plantel) }))
    }
  } catch (error) {
    console.error("Database read error:", error)
    throw createError({ statusCode: 500, message: 'Fallo al recuperar el historial del colaborador.' })
  }
})