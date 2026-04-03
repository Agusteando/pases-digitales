<template>
  <div class="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">Actividad Reciente</h2>
        <p class="text-sm font-medium text-slate-500 mt-1">Monitorea y gestiona los últimos pases generados.</p>
      </div>
      <button @click="refresh" class="p-2 bg-white rounded-full border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all" title="Actualizar">
        <RefreshCcw :class="{'animate-spin': pending}" class="w-5 h-5" />
      </button>
    </div>

    <!-- Quick Filters -->
    <div class="flex gap-2 bg-white/60 p-1.5 rounded-xl border border-slate-200/50 w-fit backdrop-blur-md shadow-sm">
      <button 
        @click="filter = 'all'"
        :class="filter === 'all' ? 'bg-white shadow-sm text-slate-800 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'"
        class="px-4 py-1.5 rounded-lg text-sm transition-all"
      >
        Todos
      </button>
      <button 
        @click="filter = 'mine'"
        :class="filter === 'mine' ? 'bg-white shadow-sm text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'"
        class="px-4 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5"
      >
        <User class="w-4 h-4" /> Mis Pases
      </button>
      <button 
        @click="filter = 'plantel'"
        :class="filter === 'plantel' ? 'bg-white shadow-sm text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'"
        class="px-4 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5"
      >
        <Building class="w-4 h-4" /> Plantel
      </button>
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto pr-2 pb-10 space-y-3 custom-scrollbar">
      <div v-if="pending && !data" class="flex items-center justify-center py-12">
        <Loader2 class="w-8 h-8 animate-spin text-blue-500" />
      </div>
      
      <div v-else-if="filteredData.length === 0" class="flex flex-col items-center justify-center py-16 text-slate-400 bg-white/50 rounded-3xl border border-slate-200 border-dashed">
        <FileSearch class="w-12 h-12 opacity-20 mb-3" />
        <p class="text-sm font-bold text-slate-600">No hay actividad reciente</p>
      </div>

      <div 
        v-else 
        v-for="pass in filteredData" 
        :key="pass.id"
        class="glass-card p-4 rounded-2xl flex items-center gap-4 group transition-all hover:shadow-md border border-white/60 hover:border-blue-200/50"
      >
        <!-- Icon -->
        <div class="w-12 h-12 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-105 transition-transform" :class="getCategoryBg(pass.category_id)">
          <component :is="getCategoryIcon(pass.category_id)" class="w-6 h-6" :class="getCategoryTextColor(pass.category_id)" />
        </div>
        
        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h4 class="text-sm font-extrabold text-slate-800 truncate">{{ pass.employee_name }}</h4>
            <span v-if="isMine(pass.user)" class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 shrink-0">Yo</span>
            <span v-else class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 shrink-0">Plantel</span>
            
            <span :class="[
              'text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border shrink-0',
              pass.status === 'autorizado' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
              pass.status === 'pendiente' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'
            ]">
              {{ pass.status }}
            </span>
          </div>
          <p class="text-xs text-slate-500 font-medium truncate flex items-center gap-2">
            <span class="font-bold text-slate-600">{{ getCategoryText(pass.category_id) }}</span>
            <span class="text-slate-300">&bull;</span>
            {{ formatDate(pass.date) }} {{ pass.time ? `a las ${formatTime(pass.time)}` : '' }}
          </p>
        </div>

        <!-- Frictionless Actions (Hover Reveal) -->
        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-white/90 p-1.5 rounded-xl shadow-sm border border-slate-100">
          <button @click="doAction(pass.id, 'resend')" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group/btn relative" title="Reenviar Notificación">
            <Send class="w-4 h-4" />
            <span class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Reenviar</span>
          </button>
          <button v-if="pass.status === 'pendiente'" @click="doAction(pass.id, 'authorize')" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors group/btn relative" title="Autorizar">
            <CheckCircle class="w-4 h-4" />
            <span class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Autorizar</span>
          </button>
          <button @click="doAction(pass.id, 'cancel')" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group/btn relative" title="Cancelar">
            <Ban class="w-4 h-4" />
            <span class="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Cancelar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { RefreshCcw, Loader2, User, Building, Send, CheckCircle, Ban, LogIn, LogOut, UserX, Clock, Stethoscope, FileQuestion, FileSearch } from 'lucide-vue-next'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

const filter = ref('all') // all, mine, plantel
const { data, pending, refresh } = useFetch('/api/passes/recent')

const isMine = (userStr) => userStr === 'Admin/Sistema' || userStr?.toLowerCase().includes('admin')

const filteredData = computed(() => {
  if (!data.value) return []
  if (filter.value === 'mine') return data.value.filter(p => isMine(p.user))
  if (filter.value === 'plantel') return data.value.filter(p => !isMine(p.user))
  return data.value
})

async function doAction(id, actionStr) {
  try {
    await $fetch(`/api/passes/${id}/action`, {
      method: 'POST',
      body: { action: actionStr }
    })
    // Optimistic UI feedback can go here (e.g. toast)
    refresh()
  } catch (error) {
    console.error(`Failed to ${actionStr} pass ${id}`, error)
  }
}

// Utility formatting
function formatDate(date) {
  if (!date) return ''
  return dayjs(date).format('DD MMM')
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':')
    return `${parts[0]}:${parts[1]}`
  }
  return timeStr
}

function getCategoryText(id) {
  const map = { 1: 'Llegada Tarde', 2: 'Salida Temprano', 3: 'Falta Justificada', 4: 'Cambio de Horario', 5: 'Incapacidad Médica' }
  return map[id] || 'Otro Movimiento'
}

function getCategoryIcon(id) {
  const map = { 1: LogIn, 2: LogOut, 3: UserX, 4: Clock, 5: Stethoscope }
  return map[id] || FileQuestion
}

function getCategoryBg(id) {
  const map = { 1: 'bg-amber-50', 2: 'bg-indigo-50', 3: 'bg-red-50', 4: 'bg-blue-50', 5: 'bg-teal-50' }
  return map[id] || 'bg-slate-50'
}

function getCategoryTextColor(id) {
  const map = { 1: 'text-amber-500', 2: 'text-indigo-500', 3: 'text-red-500', 4: 'text-blue-500', 5: 'text-teal-500' }
  return map[id] || 'text-slate-500'
}
</script>