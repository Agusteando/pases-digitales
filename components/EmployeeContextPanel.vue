<template>
  <div class="glass-card p-5 md:p-6 rounded-2xl flex flex-col gap-6 relative overflow-hidden">
    <!-- Header: Employee Info -->
    <div class="flex items-center gap-4 relative z-10">
      <div class="relative shrink-0">
        <div v-if="pendingEnrich" class="w-16 h-16 rounded-xl bg-slate-200 animate-pulse border border-slate-100"></div>
        <img v-else :src="displayPic" @error="handleImageError" class="w-16 h-16 rounded-xl object-cover bg-white shadow-sm border border-slate-200" alt="Fotografía del Colaborador" />
      </div>

      <div class="flex-1 min-w-0">
        <h2 class="text-lg font-extrabold text-slate-900 truncate tracking-tight">{{ employee.name }}</h2>
        <div v-if="pendingEnrich" class="mt-1 space-y-2 w-1/2">
          <div class="h-2.5 bg-slate-200 rounded animate-pulse w-full"></div>
          <div class="h-2.5 bg-slate-200 rounded animate-pulse w-2/3"></div>
        </div>
        <div v-else class="mt-1">
          <p class="text-slate-500 text-xs font-medium truncate">{{ displayRole }} • Plantel {{ displayPlantel }}</p>
          <p v-if="displayEmail" class="text-slate-400 text-xs truncate mt-0.5">{{ displayEmail }}</p>
        </div>
      </div>
    </div>

    <!-- Active Warning: Duplicate Prevention -->
    <transition name="fade">
      <div v-if="todayPasses.length > 0" class="bg-amber-50 rounded-xl p-3 flex gap-3 border border-amber-200 shadow-sm relative z-10 items-center">
        <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle class="w-4 h-4 text-amber-600" />
        </div>
        <div class="flex-1">
          <h4 class="text-sm font-bold text-amber-900">Pase previo detectado</h4>
          <p class="text-xs text-amber-800 mt-0.5 font-medium">
            El colaborador ya tiene un pase registrado hoy. Verifique el historial antes de duplicar la operación.
          </p>
        </div>
      </div>
    </transition>

    <!-- History Timeline -->
    <div class="relative z-10">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-bold text-slate-800">Historial de Pases</h3>
        <button @click="refreshHistory" class="text-slate-400 hover:text-brand-600 transition-colors focus:outline-none">
          <RefreshCcw :class="{'animate-spin': pendingHistory}" class="w-4 h-4" />
        </button>
      </div>

      <div v-if="pendingHistory && !history" class="py-6 flex justify-center">
        <Loader2 class="w-5 h-5 animate-spin text-slate-300" />
      </div>
      
      <div v-else-if="!history || history.length === 0" class="py-6 text-center bg-slate-50/50 rounded-xl border border-slate-100">
        <p class="text-xs text-slate-500 font-medium">No hay pases recientes para este colaborador.</p>
      </div>

      <div v-else class="relative pl-10 space-y-4 before:absolute before:left-[1.125rem] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 max-h-[260px] overflow-y-auto custom-scrollbar pr-2">
        <div v-for="pass in history" :key="pass.id" class="relative group">
          
          <div class="absolute -left-10 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10" :class="getCategoryColor(pass.category_id)">
            <component :is="getCategoryIcon(pass.category_id)" class="w-4 h-4 text-white" />
          </div>
          
          <div class="bg-white/60 hover:bg-white p-3 rounded-xl border border-transparent hover:border-slate-200 transition-colors shadow-sm">
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2">
                <span class="font-mono text-sm font-black tracking-tight" :class="isToday(pass.date) ? 'text-brand-600' : 'text-slate-700'">
                  #{{ String(pass.id).padStart(5, '0') }}
                </span>
                <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md border"
                      :class="pass.status === 'autorizado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                             (pass.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200')">
                  {{ pass.status }}
                </span>
              </div>
              <div class="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button @click="doAction(pass.id, 'resend')" class="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Reenviar Notificación">
                  <Send class="w-4 h-4" />
                </button>
                <button v-if="pass.status !== 'cancelado'" @click="doAction(pass.id, 'cancel')" class="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Anular Pase">
                  <Ban class="w-4 h-4" />
                </button>
              </div>
            </div>
            <p class="text-xs text-slate-500 font-medium">
              {{ getCategoryName(pass.category_id) }} • {{ formatDate(pass.date) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { AlertTriangle, RefreshCcw, Loader2, Send, Ban, LogIn, LogOut, UserX, Clock, Stethoscope } from 'lucide-vue-next'
import dayjs from 'dayjs'

const props = defineProps({ 
  employee: { type: Object, required: true } 
})

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

const useFallbackImage = ref(false)
function getFallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=eef2ff&color=4f46e5&bold=true`
}

function handleImageError(event) {
  useFallbackImage.value = true
  event.target.src = getFallbackAvatar(props.employee.name)
}

const { data: enrichment, pending: pendingEnrich } = useFetch('/api/employees/enrich', {
  query: { id: props.employee.id, name: props.employee.name }
})

const { data: history, pending: pendingHistory, refresh: refreshHistory } = useFetch('/api/passes/context', {
  query: { employeeName: props.employee.name },
  lazy: true
})

const displayPic = computed(() => {
  if (useFallbackImage.value || !enrichment.value?.picture) {
    return getFallbackAvatar(props.employee.name)
  }
  return enrichment.value.picture
})
const displayRole = computed(() => enrichment.value?.puesto || 'Puesto no especificado')
const displayEmail = computed(() => enrichment.value?.email)
const displayPlantel = computed(() => enrichment.value?.plantelId || props.employee.plantel)

const isToday = (dateStr) => {
  if (!dateStr) return false
  const today = dayjs().format('YYYY-MM-DD')
  return String(dateStr).startsWith(today)
}

const todayPasses = computed(() => {
  if (!history.value) return []
  return history.value.filter(p => isToday(p.date) && p.status !== 'cancelado')
})

const formatDate = (dateStr) => {
  return dayjs(dateStr).format('DD MMM YYYY, HH:mm')
}

async function doAction(id, actionStr) {
  try {
    await $fetch(`/api/passes/${id}/action`, { method: 'POST', body: { action: actionStr } })
    refreshHistory()
  } catch (error) {
    console.error(error)
  }
}
</script>