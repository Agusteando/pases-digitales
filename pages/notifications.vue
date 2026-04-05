<template>
  <div class="p-6 md:p-10 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
    <header class="mb-10 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Registro de Envíos</h1>
        <p class="text-slate-500 mt-2 text-sm font-bold">Auditoría y estado de entrega del motor de notificaciones.</p>
      </div>
      <button @click="refreshLogs" class="text-sm font-black text-slate-600 hover:text-brand-600 bg-white border border-slate-200/80 px-5 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 outline-none">
        <RefreshCcw :class="{'animate-spin': pendingLogs}" class="w-4 h-4"/>
        <span>Actualizar Logs</span>
      </button>
    </header>

    <div class="glass-card rounded-3xl flex-1 flex flex-col overflow-hidden min-h-[500px]">
      <div class="overflow-y-auto custom-scrollbar p-0">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead class="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
            <tr class="border-b border-slate-200/80 text-slate-500 text-[10px] uppercase tracking-widest font-black">
              <th class="px-6 py-5 rounded-tl-3xl">ID Pase</th>
              <th class="px-6 py-5">Destino (Chat ID)</th>
              <th class="px-6 py-5">Estado</th>
              <th class="px-6 py-5">Fecha/Hora</th>
              <th class="px-6 py-5 text-right rounded-tr-3xl">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="pendingLogs" class="bg-white/50"><td colspan="5" class="py-20 text-center"><Loader2 class="w-10 h-10 animate-spin mx-auto text-brand-500"/></td></tr>
            <tr v-else-if="!logs.length" class="bg-white/50"><td colspan="5" class="py-20 text-center text-slate-500 text-sm font-bold">No hay registros de notificación recientes.</td></tr>
            <tr v-else v-for="log in logs" :key="log.id" class="bg-white/80 hover:bg-white transition-colors">
              <td class="px-6 py-5"><span class="font-mono text-sm font-black text-brand-600 tracking-tight">#{{ String(log.pass_id).padStart(5,'0') }}</span></td>
              <td class="px-6 py-5 text-sm font-mono font-bold text-slate-600">{{ log.chat_id }}</td>
              <td class="px-6 py-5">
                <span class="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md border shadow-sm"
                      :class="log.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'">
                  {{ log.status === 'sent' ? 'Entregado' : 'Fallido' }}
                </span>
                <p v-if="log.error_text" class="text-xs text-red-500 mt-2 max-w-[250px] truncate font-medium bg-red-50/50 p-1.5 rounded-lg border border-red-100" :title="log.error_text">{{ log.error_text }}</p>
              </td>
              <td class="px-6 py-5 text-xs font-bold text-slate-500">{{ new Date(log.created_at).toLocaleString() }}</td>
              <td class="px-6 py-5 text-right">
                <button v-if="log.status !== 'sent'" @click="retryNotification(log.id)" class="text-brand-600 hover:text-white bg-brand-50 hover:bg-brand-600 text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm">
                  Reintentar Envío
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