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
          Sistemas.hr_entries.id, 
          Sistemas.hr_entries.category_id, 
          Sistemas.hr_entries.employee_name, 
          Sistemas.hr_entries.date,
          Sistemas.hr_entries.fecha_fin,
          Sistemas.hr_entries.time, 
          Sistemas.hr_entries.status, 
          Sistemas.hr_entries.plantel as sistemas_plantel,
          Sistemas.hr_entries.comentarios, 
          Sistemas.hr_entries.user, 
          Sistemas.hr_entries.autoriza, 
          nomina.employees.position,
          nomina.employees.plantel as nomina_plantel
      FROM 
          Sistemas.hr_entries 
      LEFT JOIN 
          nomina.employees 
      ON 
          TRIM(CONCAT(nomina.employees.first_name, ' ', nomina.employees.last_name, ' ', IFNULL(nomina.employees.middle_name, ''))) = Sistemas.hr_entries.employee_name
      WHERE 
          nomina.employees.plantel LIKE ? AND
          Sistemas.hr_entries.date BETWEEN ? AND ?
    `

    const start = `${body.startDate} 00:00:00`
    const end = `${body.endDate} 23:59:59`

    const [queryResult]: any = await db.execute(sql, [
      `%${body.plantel}%`, 
      start, 
      end
    ])

    if (!queryResult || queryResult.length === 0) {
      throw createError({ statusCode: 404, message: 'No se encontraron datos para la búsqueda.' })
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
      user: entry.user,
      autoriza: entry.autoriza,
      position: entry.position,
      nomina_plantel: entry.nomina_plantel
    }))

    // Inicializar el libro de trabajo usando ExcelJS
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Data')

    // Definir las columnas automáticamente basándose en las llaves del primer objeto
    worksheet.columns = Object.keys(dataWithCategoryName[0]).map(key => ({
      header: key.toUpperCase(),
      key: key,
      width: 22
    }))

    // Insertar los datos
    worksheet.addRows(dataWithCategoryName)

    // Escribir a un Buffer en memoria y convertirlo a Base64
    const buffer = await workbook.xlsx.writeBuffer()
    const base64Excel = Buffer.from(buffer).toString('base64')

    return { base64: base64Excel }
    
  } catch (error: any) {
    console.error('Export DB error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Fallo al procesar y construir la exportación del reporte.' })
  }
})