<template>
  <div class="flex flex-col xl:h-full min-h-0 relative w-full">
    
    <div class="flex items-center justify-between gap-4 pb-3 border-b border-slate-200/50 shrink-0 relative z-20 mb-4">
      <h2 class="text-xl font-black text-slate-900 tracking-tight">Actividad Reciente</h2>
      <button @click="refresh" class="p-2 text-slate-400 hover:text-brand-600 bg-white border border-white hover:border-brand-200 rounded-xl shadow-sm transition-all outline-none">
        <RefreshCcw :class="{'animate-spin': pending}" class="w-4 h-4 shrink-0" /> 
      </button>
    </div>

    <div class="flex-1 xl:overflow-y-auto overflow-visible custom-scrollbar pr-2 sm:pr-4 relative z-10 pb-12">
      
      <div v-if="pending && !data" class="flex justify-center py-16"><Loader2 class="w-8 h-8 animate-spin text-brand-500" /></div>
      
      <div v-else-if="error" class="flex flex-col items-center justify-center py-12 text-casita-red gap-3 bg-white/40 rounded-[2rem] border border-white shadow-sm">
        <div class="w-12 h-12 bg-casita-red/10 rounded-full flex items-center justify-center border border-casita-red/20 shadow-sm">
          <AlertTriangle class="w-5 h-5 text-casita-red" />
        </div>
        <div class="text-center">
          <span class="text-sm font-black text-casita-red-dark block">Error de conexión</span>
          <span class="text-[10px] font-bold text-casita-red-dark/80 mt-1 block uppercase tracking-widest">No se pudo cargar la actividad.</span>
        </div>
      </div>

      <div v-else-if="!data || data.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-400 gap-3 bg-white/40 rounded-[2rem] border border-white shadow-sm">
        <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-white shadow-sm">
          <FileText class="w-5 h-5 text-slate-300" />
        </div>
        <div class="text-center">
          <span class="text-sm font-black text-slate-700 block">Sin actividad</span>
          <span class="text-[10px] font-bold text-slate-500 mt-1 block uppercase tracking-widest">Aún no se generan incidencias.</span>
        </div>
      </div>

      <div v-else class="relative mt-2">
        <!-- Main Line -->
        <div class="absolute top-4 bottom-0 left-[11px] w-[2px] bg-gradient-to-b from-slate-200 via-slate-200/50 to-transparent z-0"></div>

        <div class="space-y-4">
          <div v-for="(pass, index) in data" :key="pass.id" class="relative pl-10 group/item timeline-item" :style="{ animationDelay: `${index * 0.05}s` }">
            
            <!-- Node Icon -->
            <div class="absolute left-[0px] top-[8px] w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center z-10 ring-4 ring-slate-50 border border-slate-100 transition-transform duration-300 group-hover/item:scale-125" :class="getCategoryColorText(pass.category_id)">
              <component :is="getCategoryIcon(pass.category_id)" class="w-3 h-3" />
            </div>

            <!-- Card Content -->
            <div class="flex flex-col py-2 transition-all duration-300 cursor-default relative overflow-hidden group/card">
              
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[10px] font-black text-slate-400 group-hover/card:text-brand-600 transition-colors">#{{ String(pass.id).padStart(5, '0') }}</span>
                  <div class="w-1 h-1 rounded-full bg-slate-200"></div>
                  <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{{ formatDateTime(pass.date, pass.time) }}</span>
                </div>
                <div class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-slate-100 shadow-sm">
                  <div class="w-1.5 h-1.5 rounded-full animate-pulse" :class="getStatusDotColor(pass.status)"></div>
                  <span class="text-[8px] font-black uppercase tracking-widest" :class="getStatusTextColor(pass.status)">{{ pass.status }}</span>
                </div>
              </div>

              <div class="flex items-start justify-between gap-4">
                <div class="flex flex-col gap-1 min-w-0">
                  <h4 class="text-sm font-black text-slate-900 tracking-tight truncate">{{ pass.employee_name }}</h4>
                  <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span class="text-[10px] font-bold text-slate-600">{{ getCategoryName(pass.category_id) }}</span>
                    <span v-if="pass.plantel" class="text-slate-300">•</span>
                    <span v-if="pass.plantel" class="text-[9px] font-black text-slate-500 flex items-center gap-1 uppercase tracking-widest">
                      <Building2 class="w-2.5 h-2.5 text-slate-400" /> {{ pass.plantel }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 -translate-x-2 group-hover/card:translate-x-0 transition-all">
                  <button @click.prevent="resendTelegram(pass.id)" :disabled="resendingId === pass.id" class="shrink-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 hover:border-brand-200 transition-all outline-none shadow-sm disabled:opacity-50" title="Reenviar a Telegram">
                    <Loader2 v-if="resendingId === pass.id" class="w-3.5 h-3.5 animate-spin" />
                    <Send v-else class="w-3.5 h-3.5 ml-[-1px] mt-[1px]" />
                  </button>
                  <NuxtLink :to="`/pass/${pass.id}`" class="shrink-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 hover:border-brand-200 transition-all outline-none shadow-sm" title="Ver detalle">
                    <ArrowRight class="w-3.5 h-3.5" />
                  </NuxtLink>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Toast Notification -->
    <div v-if="toastMessage" class="fixed bottom-6 right-6 md:right-10 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-5">
      <CheckCircle class="w-5 h-5 text-casita-green" />
      <span class="text-sm font-bold tracking-wide">{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RefreshCcw, Loader2, FileText, LogIn, LogOut, UserX, Clock, Stethoscope, ArrowRight, AlertTriangle, Building2, Send, CheckCircle } from 'lucide-vue-next'
import dayjs from 'dayjs'

const { data, pending, error, refresh } = useFetch('/api/passes/recent')

const resendingId = ref(null)
const toastMessage = ref('')
let toastTimeout = null

const resendTelegram = async (id) => {
  if (resendingId.value) return
  resendingId.value = id
  try {
    await $fetch(`/api/passes/${id}/action`, {
      method: 'POST',
      body: { action: 'resend-telegram' }
    })
    toastMessage.value = 'Notificación reenviada a Telegram.'
    if (toastTimeout) clearTimeout(toastTimeout)
    toastTimeout = setTimeout(() => {
      toastMessage.value = ''
    }, 3500)
  } catch (err) {
    alert(err.data?.message || 'Error al reenviar la notificación a Telegram.')
  } finally {
    resendingId.value = null
  }
}

const getCategoryIcon = (id) => {
  const map = { 1: LogIn, 2: LogOut, 3: UserX, 4: Clock, 5: Stethoscope }
  return map[id] || Clock
}

const getCategoryColorText = (id) => {
  const map = { 1: 'text-casita-peach', 2: 'text-iedis-blue', 3: 'text-casita-red', 4: 'text-casita-gold', 5: 'text-iedis-teal' }
  return map[id] || 'text-slate-400'
}

const getStatusDotColor = (status) => {
  const map = { pendiente: 'bg-casita-gold', autorizado: 'bg-casita-green', rechazado: 'bg-casita-red', cancelado: 'bg-slate-400' }
  return map[status.toLowerCase()] || 'bg-slate-300'
}

const getStatusTextColor = (status) => {
  const map = { pendiente: 'text-casita-gold-dark', autorizado: 'text-casita-green-dark', rechazado: 'text-casita-red-dark', cancelado: 'text-slate-500' }
  return map[status.toLowerCase()] || 'text-slate-500'
}

const getCategoryName = (id) => {
  const map = { 1: 'Llegada tarde', 2: 'Salida anticipada', 3: 'Ausencia justificada', 4: 'Cambio de horario', 5: 'Incapacidad médica' }
  return map[id] || 'Otro'
}

const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr) return 'N/A'
  const dt = dayjs(dateStr)
  const timePart = timeStr ? `, ${timeStr.slice(0, 5)}` : ''
  if (dt.isSame(dayjs(), 'day')) return `Hoy${timePart}`
  if (dt.isSame(dayjs().subtract(1, 'day'), 'day')) return `Ayer${timePart}`
  return `${dt.format('DD MMM')}${timePart}`
}
</script>