<template>
  <div class="glass-card p-5 md:p-6 rounded-2xl flex flex-col h-full min-h-[400px]">
    <div class="flex items-center justify-between pb-4 border-b border-slate-100/50 shrink-0">
      <div>
        <h2 class="text-lg font-extrabold text-slate-900 tracking-tight">Pases Recientes</h2>
        <p class="text-xs font-medium text-slate-500 mt-0.5">Historial general de planteles</p>
      </div>
      <button @click="refresh" class="p-2 text-slate-400 hover:text-brand-600 bg-white hover:bg-brand-50 rounded-full shadow-sm transition-all focus:outline-none border border-slate-100">
        <RefreshCcw :class="{'animate-spin': pending}" class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto mt-5 custom-scrollbar pr-2 relative before:absolute before:inset-0 before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
      <div v-if="pending && !data" class="flex justify-center py-12"><Loader2 class="w-6 h-6 animate-spin text-slate-300" /></div>
      
      <div v-else-if="!data || data.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
        <FileText class="w-8 h-8 text-slate-200" />
        <span class="text-sm font-medium">No hay pases recientes.</span>
      </div>

      <div v-else class="relative pl-12 space-y-4">
        <div v-for="pass in data" :key="pass.id" class="relative group">
          
          <div class="absolute -left-12 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10" :class="getCategoryColor(pass.category_id)">
            <component :is="getCategoryIcon(pass.category_id)" class="w-4 h-4 text-white" />
          </div>

          <div class="bg-white/60 hover:bg-white p-3 rounded-xl border border-transparent hover:border-slate-200 transition-colors shadow-sm">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <div class="flex items-center gap-2">
                <span class="font-mono text-base font-black text-brand-700 tracking-tight">#{{ String(pass.id).padStart(5, '0') }}</span>
                <span class="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded border"
                      :class="pass.status === 'autorizado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                             (pass.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200')">
                  {{ pass.status }}
                </span>
              </div>
              <div class="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button @click="printPass(pass)" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Imprimir Formato">
                  <Printer class="w-4 h-4" />
                </button>
                <button @click="sharePass(pass)" class="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Compartir">
                  <Share2 class="w-4 h-4" />
                </button>
                <button v-if="pass.status !== 'cancelado'" @click="doAction(pass.id, 'cancel')" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Anular Pase">
                  <Ban class="w-4 h-4" />
                </button>
              </div>
            </div>
            <h4 class="text-sm font-bold text-slate-800 truncate mb-0.5">{{ pass.employee_name }}</h4>
            <p class="text-xs font-medium text-slate-500 truncate flex items-center gap-1.5">
              <span>{{ getCategoryName(pass.category_id) }}</span>
              <span>•</span>
              <span>Plantel {{ pass.plantel || 'N/A' }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RefreshCcw, Loader2, Send, Ban, Share2, FileText, LogIn, LogOut, UserX, Clock, Stethoscope, Printer } from 'lucide-vue-next'

const { data, pending, refresh } = useFetch('/api/passes/recent')

const getCategoryIcon = (id) => {
  const map = { 1: LogIn, 2: LogOut, 3: UserX, 4: Clock, 5: Stethoscope }
  return map[id] || Clock
}

const getCategoryColor = (id) => {
  const map = { 1: 'bg-orange-500', 2: 'bg-blue-500', 3: 'bg-rose-500', 4: 'bg-purple-500', 5: 'bg-teal-500' }
  return map[id] || 'bg-slate-500'
}

const getCategoryName = (id) => {
  const map = { 1: 'Llegada Tarde', 2: 'Salida Anticipada', 3: 'Ausencia', 4: 'Cambio de Horario', 5: 'Incapacidad' }
  return map[id] || 'Otro'
}

async function doAction(id, actionStr) {
  try {
    await $fetch(`/api/passes/${id}/action`, { method: 'POST', body: { action: actionStr } })
    refresh()
  } catch (error) {
    console.error(error)
  }
}

function sharePass(pass) {
  const text = `*Pase Digital - Folio #${String(pass.id).padStart(5, '0')}*\nColaborador: ${pass.employee_name}\nEstado: ${pass.status.toUpperCase()}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}

const printPass = async (pass) => {
  try {
    const blob = await $fetch(`/api/passes/${pass.id}/print`, {
      method: 'POST',
      responseType: 'blob'
    })
    const url = URL.createObjectURL(blob)
    const newWindow = window.open(url, '_blank')
    if (newWindow) {
      newWindow.onload = () => newWindow.print()
    }
  } catch (error) {
    console.error('Error printing pass:', error)
    alert('Ocurrió un error al generar el PDF del pase.')
  }
}
</script>