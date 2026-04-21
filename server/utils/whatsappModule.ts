

import { cleanPlantelName } from '~/server/utils/employee-engine'

interface SendMessagePayload {
  chatId: string;
  message: string;
  caption?: string;
  filepath?: string;
  mentions?: string[];
  options?: any;
  useDefault?: boolean;
}

interface EditMessagePayload {
  chatId: string;
  messageId: string;
  message: string;
  mentions?: string[];
}

export const sendWhatsAppMessage = async (payload: SendMessagePayload): Promise<any> => {
  try {
    const res = await $fetch('https://wweb.casitaapps.com/whatsapp-manager/api/send', {
      method: 'POST',
      body: payload
    })
    return res
  } catch (error: any) {
    console.error('WhatsApp send execution failed:', error.message)
    throw error
  }
}

export const editWhatsAppMessage = async (payload: EditMessagePayload): Promise<any> => {
  try {
    const res = await $fetch('https://wweb.casitaapps.com/whatsapp-manager/api/edit', {
      method: 'POST',
      body: payload
    })
    return res
  } catch (error: any) {
    console.error('WhatsApp edit execution failed:', error.message)
    throw error
  }
}

export const buildWhatsAppTemplate = (data: any, isCancelled = false): string => {
  const categoryNames: Record<number, string> = {
    1: 'Llegada Tarde', 2: 'Salida Anticipada', 3: 'Ausencia', 4: 'Cambio de Horario', 5: 'Incapacidad Médica'
  }
  const statusMark = isCancelled ? '🚫 *ANULADO*' : '✅ *AUTORIZADO*'
  const categoryStr = categoryNames[data.categoryId] || 'Operación'
  
  const motivoStr = data.comentarios ? `\n✍️ *Nota:* ${data.comentarios}` : ''
  const cleanPlantel = cleanPlantelName(data.plantel)
  const plantelStr = cleanPlantel ? `\n🏢 *Plantel:* ${cleanPlantel}` : ''
  
  const isCambioHorario = data.categoryId === 4;
  const cambioHorarioMsg = isCambioHorario && data.horarioEntrada && data.horarioSalida 
    ? `\n⏰ *Nuevo Horario:* ${data.horarioEntrada} a ${data.horarioSalida}` 
    : '';

  return `🎫 *PASE DIGITAL | #${String(data.id).padStart(5, '0')}*
${statusMark}

👤 *Colaborador:* ${data.employeeName}${plantelStr}
📋 *Movimiento:* ${categoryStr}${cambioHorarioMsg}
⏰ *Fecha:* ${data.date}${data.time && !isCambioHorario ? ' | Hora: ' + data.time : ''}${motivoStr}
🧑‍💻 *Emitido por:* ${data.user}`;
}