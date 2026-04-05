import { useDB } from '~/server/utils/db'
import { defineEventHandler, getRouterParam, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = useDB()
  
  try {
    const [contactRows]: any = await db.execute('SELECT * FROM hr_directory WHERE id = ?', [id])
    if (!contactRows.length) return { success: true }
    
    const contact = contactRows[0]
    
    // Safeguard: Do not allow deletion of the last PRINCIPAL or ADMON of a given plantel
    if (contact.role === 'PRINCIPAL' || contact.role === 'ADMON') {
      const [countRows]: any = await db.execute(
        'SELECT COUNT(*) as count FROM hr_directory WHERE plantel = ? AND role = ?', 
        [contact.plantel, contact.role]
      )
      
      if (countRows[0].count <= 1) {
        throw createError({ 
          statusCode: 400, 
          message: `Acción denegada. El plantel debe mantener al menos un contacto con el rol ${contact.role}.` 
        })
      }
    }

    await db.execute('DELETE FROM hr_directory WHERE id = ?', [id])
    return { success: true }
  } catch (error: any) {
    console.error('Directory delete error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'No se pudo eliminar el contacto.' })
  }
})