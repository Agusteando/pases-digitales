<template>
  <div class="p-6 md:p-10 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
    <header class="mb-8 shrink-0 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Registro de Envíos</h1>
        <p class="text-slate-500 mt-2 text-sm font-medium">Monitorea el historial de entrega de notificaciones de la plataforma.</p>
      </div>
      <button @click="refreshLogs" class="text-sm font-bold text-slate-500 hover:text-brand-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-2 outline-none">
        <RefreshCcw :class="{'animate-spin': pendingLogs}" class="w-4 h-4"/>
        <span>Actualizar Logs</span>
      </button>
    </header>

    <div class="glass-card rounded-2xl flex-1 flex flex-col overflow-hidden min-h-[500px]">
      <div class="overflow-y-auto custom-scrollbar p-0">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead class="bg-slate-50 sticky top-0 z-10">
            <tr class="border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <th class="px-6 py-4">ID Pase</th>
              <th class="px-6 py-4">Destino (Chat ID)</th>
              <th class="px-6 py-4">Estado</th>
              <th class="px-6 py-4">Fecha/Hora</th>
              <th class="px-6 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100/80">
            <tr v-if="pendingLogs" class="bg-white/50"><td colspan="5" class="py-12 text-center"><Loader2 class="w-6 h-6 animate-spin mx-auto text-slate-300"/></td></tr>
            <tr v-else-if="!logs.length" class="bg-white/50"><td colspan="5" class="py-12 text-center text-slate-500 text-sm font-medium">No hay registros de notificación recientes.</td></tr>
            <tr v-else v-for="log in logs" :key="log.id" class="bg-white hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4"><span class="font-mono text-sm font-black text-slate-700 tracking-tight">#{{ String(log.pass_id).padStart(5,'0') }}</span></td>
              <td class="px-6 py-4 text-sm font-mono text-slate-500">{{ log.chat_id }}</td>
              <td class="px-6 py-4">
                <span class="text-[10px] uppercase font-black tracking-wide px-2 py-1 rounded border"
                      :class="log.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'">
                  {{ log.status === 'sent' ? 'Enviado' : 'Fallido' }}
                </span>
                <p v-if="log.error_text" class="text-xs text-red-500 mt-1.5 max-w-[200px] truncate font-medium" :title="log.error_text">{{ log.error_text }}</p>
              </td>
              <td class="px-6 py-4 text-xs font-medium text-slate-500">{{ new Date(log.created_at).toLocaleString() }}</td>
              <td class="px-6 py-4 text-right">
                <button v-if="log.status !== 'sent'" @click="retryNotification(log.id)" class="text-brand-600 hover:text-brand-800 hover:bg-brand-50 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-brand-200">
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
import { RefreshCcw, Loader2 } from 'lucide-vue-next'

const { data: logs, pending: pendingLogs, refresh: refreshLogs } = useFetch('/api/notifications', { default: () => [] })

async function retryNotification(id) {
  try {
    await $fetch('/api/notifications/retry', { method: 'POST', body: { log_id: id } })
    refreshLogs()
  } catch (e) {
    alert("Fallo al reintentar envío.")
  }
}
</script>