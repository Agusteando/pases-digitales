<template>
  <div class="h-full flex flex-col space-y-6">
    <!-- ID Card -->
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
      <img :src="employee.picture || '/img/default-avatar.png'" class="w-24 h-24 rounded-full object-cover shadow-sm border-2 border-slate-50" />
      <div>
        <h2 class="text-2xl font-bold text-slate-800">{{ employee.name }}</h2>
        <p class="text-slate-500 font-medium">{{ employee.puesto }} &bull; Plantel {{ employee.plantelId }}</p>
        <div class="mt-3 flex gap-2">
          <span class="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">Activo</span>
          <span v-if="employee.role === 'coordinator'" class="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100">Coordinador</span>
        </div>
      </div>
    </div>

    <!-- Historical Context -->
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1">
      <h3 class="text-lg font-bold text-slate-800 mb-4">Actividad Reciente</h3>
      
      <div v-if="pending" class="flex justify-center p-8"><Loader2Icon class="w-6 h-6 animate-spin text-slate-400" /></div>
      <ul v-else-if="history.length" class="space-y-4">
        <li v-for="pass in history" :key="pass.id" class="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarIcon class="w-5 h-5" />
          </div>
          <div>
            <p class="text-sm font-bold text-slate-800">{{ getCategoryText(pass.category_id) }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ formatDate(pass.date) }} &bull; {{ pass.time || 'Todo el día' }}</p>
            <p v-if="pass.comentarios" class="text-sm text-slate-600 mt-2 italic">"{{ pass.comentarios }}"</p>
          </div>
        </li>
      </ul>
      <div v-else class="text-slate-500 text-center py-8">
        No hay pases registrados en el ciclo escolar actual.
      </div>
    </div>
  </div>
</template>

<script setup>
import { CalendarIcon, Loader2Icon } from 'lucide-vue-next'
import dayjs from 'dayjs'

const props = defineProps(['employee'])
const { data: history, pending } = useFetch(() => `/api/passes/context?employeeName=${encodeURIComponent(props.employee.name)}`)

function formatDate(date) {
  return dayjs(date).format('DD MMM YYYY')
}

function getCategoryText(id) {
  const map = { 1: 'Pase de Entrada', 2: 'Pase de Salida', 3: 'Falta Justificada', 4: 'Cambio de Horario', 5: 'Incapacidad' }
  return map[id] || 'Otro'
}
</script>