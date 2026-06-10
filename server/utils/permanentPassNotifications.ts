import { useDB } from '~/server/utils/db'
import { cleanPlantelName } from '~/server/utils/employee-engine'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

const PERMANENT_SPECIAL_CATEGORY_ID = 6
const TELEGRAM_GLOBAL_ID = '-1003057962499'

const weekdayLabels: Record<string, string> = {
  '1': 'lunes',
  '2': 'martes',
  '3': 'miércoles',
  '4': 'jueves',
  '5': 'viernes',
  '6': 'sábado',
  '7': 'domingo'
}

const formatDateMx = (date: any) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
}

const formatTime = (value: any) => {
  if (!value) return 'N/A'
  return String(value).slice(0, 5)
}

const formatWeekdays = (value: any) => {
  const days = String(value || '')
    .split(',')
    .map((day) => day.trim())
    .filter(Boolean)
  return days.map((day) => weekdayLabels[day] || day).join(', ')
}

const extractTelegramMessageId = (response: any): string | null => {
  if (!response) return null
  if (typeof response === 'string') return response
  if (response.messageId || response.id) return String(response.messageId || response.id)
  if (Array.isArray(response) && response.length) return extractTelegramMessageId(response[0])
  if (Array.isArray(response.results) && response.results.length) return extractTelegramMessageId(response.results[0])
  if (Array.isArray(response.messages) && response.messages.length) return extractTelegramMessageId(response.messages[0])
  return null
}

const buildPermanentReminderMessage = (pass: any, runDayLabel: string) => {
  const paddedId = String(pass.id).padStart(5, '0')
  const plantel = cleanPlantelName(pass.plantel) || pass.plantel || 'N/A'
  const tipoPermiso = pass.tipo_permiso ? `\n🔖 *Tipo:* ${pass.tipo_permiso}` : ''
  const motivo = pass.comentarios ? `\n✍️ *Detalle:* ${pass.comentarios}` : ''
  const weekdays = formatWeekdays(pass.permanent_weekdays)

  return `🔔 *Recordatorio de permiso especial permanente*\n` +
    `👤 *Colaborador:* ${pass.employee_name}\n` +
    `🏢 *Plantel:* ${plantel}${tipoPermiso}\n` +
    `📅 *Vigencia:* ${formatDateMx(pass.date)} al ${formatDateMx(pass.fecha_fin)}\n` +
    `🗓️ *Días configurados:* ${weekdays || 'N/A'}\n` +
    `⏰ *Aviso de hoy:* ${runDayLabel} ${formatTime(pass.time)}${motivo}\n` +
    `🎫 *Folio:* ${paddedId}`
}

export async function dispatchDuePermanentPassNotifications(nowInput?: Date | string) {
  const db = useDB()
  const now = nowInput ? dayjs(nowInput).tz('America/Mexico_City') : dayjs().tz('America/Mexico_City')
  const weekday = String(now.day() === 0 ? 7 : now.day())
  const timeMinute = now.format('HH:mm')
  const runDate = now.format('YYYY-MM-DD')
  const runTime = `${timeMinute}:00`
  const dayStart = `${runDate} 00:00:00`
  const dayEnd = `${runDate} 23:59:59`

  const [rows]: any = await db.execute(
    `SELECT id, employee_name, date, fecha_fin, time, comentarios, category_id, status, plantel, tipo_permiso, permanent_weekdays
     FROM hr_entries
     WHERE category_id = ?
       AND status = 'autorizado'
       AND date <= ?
       AND fecha_fin >= ?
       AND permanent_weekdays IS NOT NULL
       AND FIND_IN_SET(?, permanent_weekdays) > 0
       AND LEFT(CAST(time AS CHAR), 5) = ?
     ORDER BY id ASC`,
    [PERMANENT_SPECIAL_CATEGORY_ID, dayEnd, dayStart, weekday, timeMinute]
  )

  const summary = {
    checkedAt: now.format('YYYY-MM-DD HH:mm:ss'),
    weekday,
    time: timeMinute,
    due: rows.length,
    sent: 0,
    skipped: 0,
    failed: 0
  }

  for (const pass of rows) {
    try {
      await db.execute(
        `INSERT INTO permanent_pass_notification_runs (pass_id, run_date, run_time, status, telegram_chat_id)
         VALUES (?, ?, ?, 'processing', ?)`,
        [pass.id, runDate, runTime, TELEGRAM_GLOBAL_ID]
      )
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') {
        summary.skipped++
        continue
      }
      summary.failed++
      await db.execute(
        'INSERT INTO notification_logs (pass_id, chat_id, status, error_text) VALUES (?, ?, ?, ?)',
        [pass.id, TELEGRAM_GLOBAL_ID, 'failed', `Sistema: Recordatorio Permanente | Error de idempotencia: ${error?.message || 'Fallo de base de datos'}`]
      )
      continue
    }

    const message = buildPermanentReminderMessage(pass, weekdayLabels[weekday] || runDate)

    try {
      const tgResponse = await $fetch('https://tgbot.casitaapps.com/sendMessages', {
        method: 'POST',
        body: {
          chatId: [TELEGRAM_GLOBAL_ID],
          message,
          parse_mode: 'Markdown',
          disable_notification: false
        }
      })
      const messageId = extractTelegramMessageId(tgResponse)
      await db.execute(
        `UPDATE permanent_pass_notification_runs
         SET status = 'sent', message_id = ?, error_text = NULL
         WHERE pass_id = ? AND run_date = ? AND run_time = ?`,
        [messageId, pass.id, runDate, runTime]
      )
      await db.execute(
        'INSERT INTO notification_logs (pass_id, chat_id, status, message_id, error_text) VALUES (?, ?, ?, ?, ?)',
        [pass.id, TELEGRAM_GLOBAL_ID, 'sent', messageId, `Sistema: Recordatorio Permanente | Día: ${weekdayLabels[weekday]} | Hora: ${timeMinute}`]
      )
      summary.sent++
    } catch (error: any) {
      const errorText = error?.message || 'Fallo de red'
      await db.execute(
        `UPDATE permanent_pass_notification_runs
         SET status = 'failed', error_text = ?
         WHERE pass_id = ? AND run_date = ? AND run_time = ?`,
        [errorText, pass.id, runDate, runTime]
      )
      await db.execute(
        'INSERT INTO notification_logs (pass_id, chat_id, status, error_text) VALUES (?, ?, ?, ?)',
        [pass.id, TELEGRAM_GLOBAL_ID, 'failed', `Sistema: Recordatorio Permanente | Error: ${errorText}`]
      )
      summary.failed++
    }
  }

  return summary
}
