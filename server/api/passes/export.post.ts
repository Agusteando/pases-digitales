import { defineEventHandler, readBody, createError } from '#imports'
import { useDB } from '~/server/utils/db'
import ExcelJS from 'exceljs'

const categoryMapping: Record<number, string> = {
  1: 'Pase de entrada',
  2: 'Pase de salida',
  3: 'Pase para faltar',
  4: 'Pase cambio de horario',
  5: 'Incapacidad'
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body.plantel || !body.startDate || !body.endDate) {
    throw createError({ statusCode: 400, message: 'Faltan parámetros requeridos para la exportación.' })
  }

  try {
    const db = useDB()

    const sql = `
      SELECT 
          h.id, 
          h.category_id, 
          h.employee_name, 
          h.date,
          h.fecha_fin,
          h.time, 
          h.status, 
          h.plantel as sistemas_plantel,
          h.comentarios, 
          h.tipo_permiso,
          h.user, 
          h.autoriza, 
          e.position,
          e.plantel as nomina_plantel
      FROM 
          Sistemas.hr_entries h
      LEFT JOIN 
          nomina.employees e
      ON 
          TRIM(CONCAT(e.first_name, ' ', e.last_name, ' ', IFNULL(e.middle_name, ''))) = h.employee_name
      WHERE 
          (h.plantel LIKE ? OR e.plantel LIKE ?) AND
          h.date BETWEEN ? AND ?
    `

    const start = `${body.startDate} 00:00:00`
    const end = `${body.endDate} 23:59:59`
    const plantelParam = `%${body.plantel}%`

    const [queryResult]: any = await db.execute(sql, [
      plantelParam,
      plantelParam,
      start, 
      end
    ])

    if (!queryResult || queryResult.length === 0) {
      throw createError({ 
        statusCode: 404, 
        message: 'No hay pases registrados en este plantel durante las fechas seleccionadas.' 
      })
    }

    const dataWithCategoryName = queryResult.map((entry: any) => ({
      id: entry.id,
      category_name: categoryMapping[entry.category_id] || 'Otro',
      employee_name: entry.employee_name,
      date: entry.date,
      fin: entry.fecha_fin,
      time: entry.time,
      status: entry.status,
      sistemas_plantel: entry.sistemas_plantel,
      comentarios: entry.comentarios,
      tipo_permiso: entry.tipo_permiso,
      user: entry.user,
      autoriza: entry.autoriza,
      position: entry.position,
      nomina_plantel: entry.nomina_plantel
    }))

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Data')

    worksheet.columns = Object.keys(dataWithCategoryName[0]).map(key => ({
      header: key.toUpperCase(),
      key: key,
      width: 22
    }))

    worksheet.addRows(dataWithCategoryName)

    const buffer = await workbook.xlsx.writeBuffer()
    const base64Excel = Buffer.from(buffer).toString('base64')

    return { base64: base64Excel }
    
  } catch (error: any) {
    if (error.statusCode === 404) {
      throw error 
    }
    console.error('Export DB error:', error)
    throw createError({ statusCode: 500, message: 'Fallo al procesar y construir la exportación del reporte.' })
  }
})