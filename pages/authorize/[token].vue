<template>
  <div class="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden font-sans">
    <!-- Decorative Blurs -->
    <div class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-200/40 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[100px] pointer-events-none"></div>

    <div v-if="pending" class="flex flex-col items-center z-10 bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-xl border border-white">
      <Loader2 class="w-12 h-12 animate-spin text-brand-600 mb-5" />
      <p class="text-sm font-black text-slate-800 tracking-tight">Cargando solicitud...</p>
    </div>

    <div v-else-if="errorMsg" class="z-10 w-full max-w-md glass-card bg-white/90 p-10 rounded-[2.5rem] shadow-2xl text-center border border-red-100">
      <div class="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-100">
        <XCircle class="w-10 h-10 text-red-500" />
      </div>
      <h2 class="text-2xl font-black text-slate-900 mb-2 tracking-tight">Acceso denegado</h2>
      <p class="text-sm font-bold text-slate-600 mb-8 leading-relaxed">{{ errorMsg }}</p>
      <NuxtLink to="/" class="inline-block px-6 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-colors shadow-md">
        Ir a plataforma
      </NuxtLink>
    </div>

    <div v-else-if="pass" class="z-10 w-full max-w-[500px] glass-card p-10 rounded-[2.5rem] shadow-2xl border border-white/80 relative">
      <div class="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <ShieldCheck class="w-40 h-40" />
      </div>

      <header class="mb-10 relative z-10 text-center flex flex-col items-center">
        <div class="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-5 border border-brand-100 shadow-sm">
          <component :is="getCategoryIcon(pass.category_id)" class="w-8 h-8 text-brand-600" />
        </div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight font-mono mb-1">#{{ String(pass.id).padStart(5, '0') }}</h1>
        <p class="text-sm font-black text-brand-600 uppercase tracking-widest">{{ getCategoryName(pass.category_id) }}</p>
      </header>

      <div class="space-y-8 relative z-10 mb-10">
        <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm grid grid-cols-1 gap-5">
          <div class="pb-5 border-b border-slate-100">
            <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Colaborador</span>
            <span class="text-lg font-black text-slate-900 leading-tight flex flex-col sm:flex-row sm:items-center gap-2">
              {{ pass.employee_name }}
              <span v-if="pass.employee_name === pass.user" class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-widest rounded-md border border-slate-200/60 shadow-sm w-max">
                Registro propio
              </span>
            </span>
          </div>
          <div class="grid grid-cols-2 gap-4 pb-5 border-b border-slate-100">
            <div>
              <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Plantel</span>
              <span class="text-sm font-bold text-slate-800">{{ pass.plantel }}</span>
            </div>
            <div>
              <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fecha</span>
              <span class="text-sm font-bold text-slate-800">{{ formatDate(pass.date) }} {{ pass.time ? '• ' + pass.time : '' }}</span>
            </div>
          </div>
          <div v-if="pass.comentarios">
            <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Justificación</span>
            <span class="text-sm font-medium text-slate-700 italic block bg-slate-50 p-4 rounded-2xl border border-slate-100">"{{ pass.comentarios }}"</span>
          </div>
        </div>

        <div v-if="pass.status !== 'pendiente'" class="p-5 rounded-2xl flex items-start gap-4 shadow-sm" :class="pass.status === 'autorizado' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'">
          <component :is="pass.status === 'autorizado' ? CheckCircle2 : XCircle" class="w-8 h-8 shrink-0" :class="pass.status === 'autorizado' ? 'text-emerald-500' : 'text-red-500'" />
          <div class="pt-1">
            <p class="text-base font-black tracking-tight" :class="pass.status === 'autorizado' ? 'text-emerald-900' : 'text-red-900'">
              Registro {{ pass.status }}
            </p>
            <p class="text-xs font-bold mt-1" :class="pass.status === 'autorizado' ? 'text-emerald-700' : 'text-red-700'">
              Por: {{ pass.authorized_by }} <br/>
              <span class="opacity-70 font-medium">{{ new Date(pass.authorized_at).toLocaleString() }}</span>
            </p>
          </div>
        </div>
      </div>

      <footer v-if="pass.status === 'pendiente'" class="flex gap-4 relative z-10">
        <button @click="doAction('reject')" :disabled="isProcessing" class="flex-1 py-4 bg-white text-red-600 font-black rounded-2xl hover:bg-red-50 transition-all border border-red-200 hover:border-red-300 disabled:opacity-50 outline-none flex justify-center items-center gap-2 shadow-sm">
          <X class="w-5 h-5" /> Rechazar
        </button>
        <button @click="doAction('authorize')" :disabled="isProcessing" class="flex-1 py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 outline-none flex justify-center items-center gap-2">
          <Check class="w-5 h-5" /> Autorizar
        </button>
      </footer>

      <div class="mt-8 text-center relative z-10">
         <NuxtLink to="/" class="text-xs font-bold text-slate-400 hover:text-brand-600 transition-colors">Volver a plataforma</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import { Loader2, ShieldCheck, CheckCircle2, XCircle, Check, X, LogIn, LogOut as LogOutIcon, UserX, Clock, Stethoscope } from 'lucide-vue-next'

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

fetchPass()
</script>