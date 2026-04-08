import { defineEventHandler, getRouterParam, readBody, createError } from '#imports'
import { useDB } from '~/server/utils/db'
import { updateWorkspaceUserPhone } from '~/server/utils/googleWorkspace'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { email, channel, phone, role, replacement_id } = body
  
  if (!id || !email) {
    throw createError({ statusCode: 400, message: 'Faltan parámetros requeridos.' })
  }

  const db = useDB()
  
  const [currentRows]: any = await db.execute('SELECT role, plantel FROM hr_directory WHERE id = ?', [id])
  if (!currentRows.length) throw createError({ statusCode: 404, message: 'Contacto no encontrado en la base de datos.' })
  
  const currentRole = currentRows[0].role
  const plantel = currentRows[0].plantel

  // Reassignment Logic Evaluation for Restricted Hierarchy Constraints
  if (role && role !== currentRole && ['Director', 'Administrador'].includes(currentRole)) {
     const [countRows]: any = await db.execute('SELECT COUNT(*) as count FROM hr_directory WHERE plantel = ? AND role = ?', [plantel, currentRole])
     if (countRows[0].count <= 1) {
        if (!replacement_id) {
           throw createError({ statusCode: 400, message: `Reasignación obligatoria. Debe asignar un reemplazo para mantener la jerarquía de ${currentRole} en el plantel.` })
        }
        // Direct execution of the swap process allowing the current update to succeed seamlessly
        await db.execute('UPDATE hr_directory SET role = ? WHERE id = ?', [currentRole, replacement_id])
     }
  }

  const resolvedChannel = channel || 'EMAIL'

  let finalPhone = ''
  if (phone) {
    let digits = phone.replace(/\D/g, '')
    if (digits.length >= 10) {
      digits = digits.slice(-10)
      finalPhone = `521${digits}@c.us`
    }
  }

  try {
    if (finalPhone) {
      await updateWorkspaceUserPhone(email, finalPhone)
    }
    
    // Process main target modification, assigning the target role natively or holding the current string
    await db.execute('UPDATE hr_directory SET channel = ?, role = ? WHERE id = ?', [resolvedChannel, role || currentRole, id])

    return { success: true }
  } catch (error) {
    console.error('Update directory error:', error)
    throw createError({ statusCode: 500, message: 'Fallo al actualizar el contacto en la red.' })
  }
})