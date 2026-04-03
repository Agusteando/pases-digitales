<template>
  <div class="bg-white p-5 md:p-6 rounded-xl shadow-card border border-slate-200 flex flex-col h-full min-h-[300px]">
    <div class="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
      <h2 class="text-base font-bold text-slate-900">Bitácora Operativa</h2>
      <button @click="refresh" class="text-slate-400 hover:text-slate-900 transition-colors focus:outline-none">
        <RefreshCcw :class="{'animate-spin': pending}" class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto space-y-2 mt-4 custom-scrollbar">
      <div v-if="pending && !data" class="flex justify-center py-8"><Loader2 class="w-5 h-5 animate-spin text-slate-300" /></div>
      
      <div v-else-if="!data || data.length === 0" class="flex justify-center py-8 text-slate-400 text-sm">
        El registro está vacío.
      </div>

      <div v-else v-for="pass in data" :key="pass.id" class="p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50 flex items-center justify-between group transition-colors">
        <div class="flex-1 min-w-0 pr-4">
          <div class="flex items-center gap-2 mb-0.5">
            <h4 class="text-sm font-semibold text-slate-900 truncate">{{ pass.employee_name }}</h4>
            <span class="text-[10px] px-1.5 py-0.5 rounded border capitalize font-medium"
                  :class="pass.status === 'autorizado' ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-white text-slate-500 border-slate-200'">
              {{ pass.status }}
            </span>
          </div>
          <div class="text-xs text-slate-500">
            Folio #{{ String(pass.id).padStart(5, '0') }} • Plantel {{ pass.plantel || 'N/A' }}
          </div>
        </div>

        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button @click="doAction(pass.id, 'resend')" class="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors" title="Reenviar Notificación">
            <Send class="w-3.5 h-3.5" />
          </button>
          <button v-if="pass.status !== 'cancelado'" @click="doAction(pass.id, 'cancel')" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Anular Registro">
            <Ban class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RefreshCcw, Loader2, Send, Ban } from 'lucide-vue-next'

const { data, pending, refresh } = useFetch('/api/passes/recent')

async function doAction(id, actionStr) {
  try {
    await $fetch(`/api/passes/${id}/action`, { method: 'POST', body: { action: actionStr } })
    refresh()
  } catch (error) {
    console.error(error)
  }
}
</script>