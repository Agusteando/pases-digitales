import { useDB } from '~/server/utils/db'
import dayjs from 'dayjs'
import { defineEventHandler, getRouterParam, readBody, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  if (!id) throw createError({ statusCode: 400, message: 'ID no proporcionado.' })

  const db = useDB()

  try {
    const [rows]: any = await db.execute('SELECT date, status FROM hr_entries WHERE id = ?', [id])
    if (!rows.length) throw createError({ statusCode: 404, message: 'Pase no encontrado.' })

    const pass = rows[0]
    
    if (pass.status === 'cancelado') {
      throw createError({ statusCode: 403, message: 'No se permite modificar un pase anulado.' })
    }

    const hoursDiff = dayjs().diff(dayjs(pass.date), 'hour')
    if (hoursDiff > 48) {
      throw createError({ statusCode: 403, message: 'El tiempo permitido para edición ha concluido.' })
    }

    const mysqlDate = body.date ? dayjs(body.date).format('YYYY-MM-DD 00:00:00') : dayjs().format('YYYY-MM-DD 00:00:00')
    const mysqlEndDate = body.endDate ? dayjs(body.endDate).format('YYYY-MM-DD 23:59:59') : mysqlDate

    const sql = `
      UPDATE hr_entries
      SET date = ?, fecha_fin = ?, time = ?, comentarios = ?, category_id = ?, plantel = ?, regreso = ?, hora_regreso = ?, IMSS = ?, tipo_incapacidad = ?
      WHERE id = ?
    `
    await db.execute(sql, [
       mysqlDate,
       mysqlEndDate,
       body.time || null,
       body.comentarios || '',
       body.categoryId,
       body.plantel || '',
       body.regreso ? 1 : 0,
       body.horaRegreso || null,
       body.imss || null,
       body.tipoIncapacidad || null,
       id
    ])

    return { success: true }
  } catch (error: any) {
    console.error('Update pass error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Fallo al procesar la actualización en base de datos.' })
  }
})