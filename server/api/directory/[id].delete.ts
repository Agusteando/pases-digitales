import { useDB } from '~/server/utils/db'
import { defineEventHandler, getRouterParam, readBody, createError } from '#imports'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  let body: any = {}
  try { body = await readBody(event) || {} } catch (e) {}
  const replacement_id = body.replacement_id

  const db = useDB()
  
  try {
    const [contactRows]: any = await db.execute('SELECT * FROM hr_directory WHERE id = ?', [id])
    if (!contactRows.length) return { success: true }
    
    const contact = contactRows[0]
    
    if (['Director', 'Administrador'].includes(contact.role)) {
      const [countRows]: any = await db.execute(
        'SELECT COUNT(*) as count FROM hr_directory WHERE plantel = ? AND role = ?', 
        [contact.plantel, contact.role]
      )
      
      if (countRows[0].count <= 1) {
        if (!replacement_id) {
           throw createError({ 
             statusCode: 400, 
             message: `Acción denegada. El plantel debe mantener al menos un contacto con el rol ${contact.role}.` 
           })
        }
        // Secure transaction behavior: Swap the replacement contact to the required hierarchy role
        await db.execute('UPDATE hr_directory SET role = ? WHERE id = ?', [contact.role, replacement_id])
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