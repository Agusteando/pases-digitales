<template>
  <div class="p-6 md:p-10 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
    <header class="mb-10 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Registro de envío</h1>
        <p class="text-slate-500 mt-2 text-sm font-bold">Estado de entrega de los avisos.</p>
      </div>
      <button @click="refreshLogs" class="text-sm font-black text-slate-600 hover:text-brand-600 bg-white/80 backdrop-blur-md border border-white px-5 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 outline-none">
        <RefreshCcw :class="{'animate-spin': pendingLogs}" class="w-4 h-4"/>
        <span>Actualizar logs</span>
      </button>
    </header>

    <div class="glass-panel rounded-[2.5rem] flex-1 flex flex-col overflow-hidden min-h-[500px]">
      <div class="overflow-y-auto custom-scrollbar p-0">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead class="bg-white/40 sticky top-0 z-10 backdrop-blur-xl">
            <tr class="border-b border-white/60 text-slate-500 text-[10px] uppercase tracking-widest font-black">
              <th class="px-6 py-5 rounded-tl-[2.5rem]">Pase Operativo</th>
              <th class="px-6 py-5">Destinatario</th>
              <th class="px-6 py-5">Estado</th>
              <th class="px-6 py-5">Fecha y Hora</th>
              <th class="px-6 py-5 text-right rounded-tr-[2.5rem]">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/50">
            <tr v-if="pendingLogs" class="bg-transparent"><td colspan="5" class="py-20 text-center"><Loader2 class="w-10 h-10 animate-spin mx-auto text-brand-500"/></td></tr>
            <tr v-else-if="!logs.length" class="bg-transparent"><td colspan="5" class="py-20 text-center text-slate-500 text-sm font-bold">No hay registros de envío recientes.</td></tr>
            <tr v-else v-for="log in logs" :key="log.id" class="bg-transparent hover:bg-white/50 transition-colors">
              <td class="px-6 py-5">
                <NuxtLink :to="`/pass/${log.pass_id}`" class="font-mono text-sm font-black text-brand-600 hover:text-brand-900 tracking-tight transition-colors">
                  #{{ String(log.pass_id).padStart(5,'0') }}
                </NuxtLink>
              </td>
              <td class="px-6 py-5">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white shadow-sm" :class="getChannelColor(log.error_text)">
                    <component :is="getChannelIcon(log.error_text)" class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-800 tracking-tight">{{ extractTargetName(log.error_text) }}</p>
                    <p class="text-[10px] font-bold text-slate-500 truncate max-w-[200px]" :title="log.chat_id">{{ isSystemLog(log.error_text) ? 'Registro general (Sistema)' : log.chat_id }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-5">
                <span class="text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg border shadow-sm"
                      :class="log.status === 'sent' ? 'bg-casita-green/10 text-casita-green-dark border-casita-green/30' : 'bg-casita-red/10 text-casita-red border-casita-red/30'">
                  {{ log.status === 'sent' ? 'Entregado' : 'Fallido' }}
                </span>
                <p v-if="log.status !== 'sent'" class="text-xs text-casita-red-dark mt-2 max-w-[250px] truncate font-medium bg-casita-red/10 p-2 rounded-xl border border-casita-red/20 shadow-sm" :title="getDeliveryError(log)">{{ getDeliveryError(log) }}</p>
              </td>
              <td class="px-6 py-5 text-xs font-bold text-slate-500">{{ log.created_at ? dayjs(log.created_at).format('DD/MM/YYYY, HH:mm') : 'N/A' }}</td>
              <td class="px-6 py-5 text-right">
                <button v-if="log.status !== 'sent' && !isSystemLog(log.error_text)" @click="retryNotification(log.id)" class="text-brand-600 hover:text-white bg-white hover:bg-brand-600 text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm outline-none border border-brand-200 hover:border-transparent">
                  Reintentar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RefreshCcw, Loader2, MessageCircle, Mail, Server, Bell } from 'lucide-vue-next'
import dayjs from 'dayjs'

const { data: logs, pending: pendingLogs, refresh: refreshLogs } = useFetch('/api/notifications', { default: () =>[] })

const isSystemLog = (text) => {
  return text && text.includes('Auditoría Global')
}

const extractTargetName = (text) => {
  if (!text) return 'Desconocido'
  if (isSystemLog(text)) return 'Registro general (Sistema)'
  const match = text.match(/Destinatario:\s*([^|]+)/)
  return match ? match[1].trim() : 'Sistema'
}

const getChannelColor = (text) => {
  if (!text) return 'bg-white text-slate-500'
  if (text.includes('WhatsApp')) return 'bg-casita-green/10 text-casita-green-dark'
  if (text.includes('Email')) return 'bg-iedis-blue/10 text-iedis-blue-dark'
  if (text.includes('Telegram') || isSystemLog(text)) return 'bg-white text-slate-700'
  return 'bg-white text-slate-500'
}

const getChannelIcon = (text) => {
  if (!text) return Bell
  if (text.includes('WhatsApp')) return MessageCircle
  if (text.includes('Email')) return Mail
  if (text.includes('Telegram') || isSystemLog(text)) return Server
  return Bell
}

const getDeliveryError = (log) => {
  const match = (log.error_text || '').split('| Error:')[1]
  return match ? match.trim() : 'Destino inalcanzable'
}

async function retryNotification(id) {
  try {
    await $fetch('/api/notifications/retry', { method: 'POST', body: { log_id: id } })
    refreshLogs()
  } catch (e) {
    alert("Fallo al reintentar el envío. Verifica que el destino sea válido.")
  }
}
</script>