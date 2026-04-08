<template>
  <div class="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-transparent relative overflow-hidden font-sans">
    
    <div v-if="pending" class="flex flex-col items-center z-10 glass-panel p-12 rounded-[3rem] shadow-2xl">
      <Loader2 class="w-12 h-12 animate-spin text-iedis-teal mb-5" />
      <p class="text-sm font-black text-slate-800 tracking-tight">Cargando solicitud...</p>
    </div>

    <div v-else-if="errorMsg" class="z-10 w-full max-w-md glass-panel p-12 rounded-[3rem] shadow-2xl text-center border border-white">
      <div class="w-24 h-24 bg-casita-red/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-casita-red/20 shadow-inner">
        <XCircle class="w-12 h-12 text-casita-red" />
      </div>
      <h2 class="text-2xl font-black text-slate-900 mb-3 tracking-tight">Acceso denegado</h2>
      <p class="text-sm font-bold text-slate-600 mb-10 leading-relaxed">{{ errorMsg }}</p>
      <NuxtLink to="/" class="inline-block px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl">
        Ir a plataforma
      </NuxtLink>
    </div>

    <div v-else-if="pass" class="z-10 w-full max-w-[540px] glass-panel p-10 md:p-12 rounded-[3rem] shadow-2xl border border-white/80 relative">
      <div class="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <ShieldCheck class="w-40 h-40" />
      </div>

      <header class="mb-10 relative z-10 text-center flex flex-col items-center">
        <div class="w-20 h-20 rounded-[1.5rem] bg-white/80 backdrop-blur-sm flex items-center justify-center mb-6 border border-white shadow-md relative group">
          <div class="absolute inset-0 bg-gradient-to-tr from-casita-green-light/20 to-iedis-teal/20 rounded-[1.5rem] opacity-50 blur-sm"></div>
          <component :is="getCategoryIcon(pass.category_id)" class="w-10 h-10 text-iedis-teal-dark relative z-10" />
        </div>
        <h1 class="text-4xl font-black text-slate-900 tracking-tighter font-mono mb-2">#{{ String(pass.id).padStart(5, '0') }}</h1>
        <p class="text-sm font-black text-casita-green-dark uppercase tracking-widest">{{ getCategoryName(pass.category_id) }}</p>
      </header>

      <div class="space-y-8 relative z-10 mb-12">
        <div class="bg-white/80 backdrop-blur-md rounded-[2rem] p-8 border border-white shadow-sm grid grid-cols-1 gap-6">
          <div class="pb-6 border-b border-slate-100">
            <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Colaborador</span>
            <span class="text-xl font-black text-slate-900 leading-tight flex flex-col sm:flex-row sm:items-center gap-3">
              {{ pass.employee_name }}
              <span v-if="pass.employee_name === pass.user" class="px-3 py-1 bg-white text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-200/60 shadow-sm w-max">
                Registro propio
              </span>
            </span>
          </div>
          <div class="grid grid-cols-2 gap-6 pb-6 border-b border-slate-100">
            <div>
              <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Plantel</span>
              <span class="text-sm font-bold text-slate-800">{{ pass.plantel }}</span>
            </div>
            <div>
              <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha</span>
              <span class="text-sm font-bold text-slate-800">{{ formatDate(pass.date) }} {{ pass.time ? '• ' + pass.time : '' }}</span>
            </div>
          </div>
          <div v-if="pass.comentarios">
            <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Justificación</span>
            <span class="text-sm font-medium text-slate-700 italic block bg-white/60 p-5 rounded-2xl border border-white shadow-sm">"{{ pass.comentarios }}"</span>
          </div>
        </div>

        <div v-if="pass.status !== 'pendiente'" class="mt-10 p-8 rounded-[2rem] border text-center shadow-md backdrop-blur-md" :class="pass.status === 'autorizado' ? 'bg-casita-green/10 border-casita-green/30' : (pass.status === 'rechazado' ? 'bg-casita-red/10 border-casita-red/20' : 'bg-slate-50 border-white')">
          <div class="w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 border shadow-sm" :class="pass.status === 'autorizado' ? 'bg-white border-casita-green/30 text-casita-green-dark' : (pass.status === 'rechazado' ? 'bg-white border-casita-red/30 text-casita-red' : 'bg-white border-slate-200 text-slate-500')">
            <component :is="pass.status === 'autorizado' ? CheckCircle2 : (pass.status === 'rechazado' ? XCircle : AlertTriangle)" class="w-8 h-8" />
          </div>
          <h3 class="text-xl font-black tracking-tight mb-2" :class="pass.status === 'autorizado' ? 'text-casita-green-dark' : (pass.status === 'rechazado' ? 'text-casita-red-dark' : 'text-slate-700')">
            {{ pass.status === 'autorizado' ? 'Solicitud Autorizada' : (pass.status === 'rechazado' ? 'Solicitud Rechazada' : 'Pase Anulado') }}
          </h3>
          <p class="text-sm font-medium mb-6" :class="pass.status === 'autorizado' ? 'text-casita-green-dark/80' : (pass.status === 'rechazado' ? 'text-casita-red-dark/80' : 'text-slate-500')">
            Esta solicitud ya fue resuelta y no requiere acciones adicionales.
          </p>
          <div class="inline-block bg-white px-6 py-4 rounded-2xl border shadow-sm" :class="pass.status === 'autorizado' ? 'border-casita-green/20' : (pass.status === 'rechazado' ? 'border-casita-red/20' : 'border-slate-200')">
            <p class="text-[10px] font-black uppercase tracking-widest mb-1" :class="pass.status === 'autorizado' ? 'text-casita-green' : (pass.status === 'rechazado' ? 'text-casita-red' : 'text-slate-400')">
              Resuelta por
            </p>
            <p class="text-base font-black text-slate-900">{{ pass.authorized_by }}</p>
            <p v-if="pass.authorized_at" class="text-[10px] font-bold text-slate-500 mt-1.5">{{ formatDateLong(pass.authorized_at) }}</p>
          </div>
        </div>
      </div>

      <footer v-if="pass.status === 'pendiente'" class="flex flex-col sm:flex-row gap-4 relative z-10">
        <button @click="doAction('reject')" :disabled="isProcessing" class="flex-1 py-4 bg-white/80 backdrop-blur-sm text-casita-red-dark font-black rounded-2xl hover:bg-white transition-all border border-white hover:border-casita-red/30 shadow-sm hover:shadow-md disabled:opacity-50 outline-none flex justify-center items-center gap-2">
          <X class="w-5 h-5" /> Rechazar
        </button>
        <button @click="doAction('authorize')" :disabled="isProcessing" class="flex-1 py-4 bg-gradient-to-r from-casita-green to-casita-green-light text-white font-black rounded-2xl hover:from-casita-green-dark hover:to-casita-green transition-all shadow-lg hover:shadow-xl disabled:opacity-50 outline-none flex justify-center items-center gap-2">
          <Check class="w-5 h-5" /> Autorizar
        </button>
      </footer>

      <div class="mt-10 text-center relative z-10 flex flex-col items-center gap-4">
         <img src="/id.png" alt="Identidad Institucional" class="h-6 opacity-50 hover:opacity-100 transition-opacity mix-blend-multiply" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import { Loader2, ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Check, X, LogIn, LogOut as LogOutIcon, UserX, Clock, Stethoscope } from 'lucide-vue-next'

definePageMeta({ layout: false })

const route = useRoute()
const token = route.params.token
const rToken = route.query.r

const pass = ref(null)
const errorMsg = ref('')
const pending = ref(true)
const isProcessing = ref(false)

const fetchPass = async () => {
  try {
    const data = await $fetch(`/api/passes/authorize/${token}`, { query: { r: rToken } })
    pass.value = data
  } catch (err) {
    errorMsg.value = err.data?.message || 'Error al cargar la solicitud.'
  } finally {
    pending.value = false
  }
}

const doAction = async (actionStr) => {
  if (isProcessing.value) return
  isProcessing.value = true
  try {
    const res = await $fetch(`/api/passes/authorize/${token}`, { method: 'POST', body: { action: actionStr, rToken } })
    pass.value.status = res.status
    pass.value.authorized_by = pass.value._viewer || 'Responsable'
    pass.value.authorized_at = new Date().toISOString()
  } catch (err) {
    alert(err.data?.message || 'Error al procesar la solicitud.')
  } finally {
    isProcessing.value = false
  }
}

const getCategoryIcon = (id) => {
  const map = { 1: LogIn, 2: LogOutIcon, 3: UserX, 4: Clock, 5: Stethoscope }
  return map[id] || Clock
}

const getCategoryName = (id) => {
  const map = { 1: 'Llegada tarde', 2: 'Salida anticipada', 3: 'Ausencia justificada', 4: 'Cambio de horario', 5: 'Incapacidad médica' }
  return map[id] || 'Otro'
}

const formatDate = (dateStr) => dayjs(dateStr).format('DD MMMM YYYY')
const formatDateLong = (dateStr) => dateStr ? dayjs(dateStr).format('DD MMM YYYY, HH:mm') : 'N/A'

fetchPass()
</script>