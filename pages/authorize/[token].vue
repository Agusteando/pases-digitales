<template>
  <div class="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
    <!-- Decorative Blurs -->
    <div class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-200/50 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[100px] pointer-events-none"></div>

    <div v-if="pending" class="flex flex-col items-center z-10">
      <Loader2 class="w-10 h-10 animate-spin text-brand-600 mb-4" />
      <p class="text-sm font-bold text-slate-500">Recuperando detalles del pase...</p>
    </div>

    <div v-else-if="errorMsg" class="z-10 w-full max-w-md bg-white p-8 rounded-3xl shadow-xl text-center border border-red-100">
      <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <XCircle class="w-8 h-8 text-red-500" />
      </div>
      <h2 class="text-xl font-black text-slate-900 mb-2">Acceso Denegado</h2>
      <p class="text-sm font-medium text-slate-600 mb-6">{{ errorMsg }}</p>
      <NuxtLink to="/" class="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
        Volver al Inicio
      </NuxtLink>
    </div>

    <div v-else-if="pass" class="z-10 w-full max-w-lg glass-card p-8 rounded-3xl shadow-xl border border-white relative">
      <div class="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
        <ShieldCheck class="w-32 h-32" />
      </div>

      <header class="mb-8 relative z-10">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
            <component :is="getCategoryIcon(pass.category_id)" class="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">Pase #{{ String(pass.id).padStart(5, '0') }}</h1>
            <p class="text-sm font-bold text-slate-500">{{ getCategoryName(pass.category_id) }}</p>
          </div>
        </div>
      </header>

      <div class="space-y-6 relative z-10 mb-8">
        <div class="bg-slate-50 rounded-2xl p-5 border border-slate-100 grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Colaborador</span>
            <span class="text-base font-extrabold text-slate-900">{{ pass.employee_name }}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plantel</span>
            <span class="text-sm font-bold text-slate-700">PL {{ pass.plantel }}</span>
          </div>
          <div>
            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha Programada</span>
            <span class="text-sm font-bold text-slate-700">{{ formatDate(pass.date) }} {{ pass.time ? '• ' + pass.time : '' }}</span>
          </div>
          <div class="col-span-2" v-if="pass.comentarios">
            <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Motivo / Justificación</span>
            <span class="text-sm font-medium text-slate-600 italic">"{{ pass.comentarios }}"</span>
          </div>
        </div>

        <div v-if="pass.status !== 'pendiente'" class="p-4 rounded-xl flex items-center gap-3" :class="pass.status === 'autorizado' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'">
          <component :is="pass.status === 'autorizado' ? CheckCircle2 : XCircle" class="w-6 h-6" :class="pass.status === 'autorizado' ? 'text-emerald-600' : 'text-red-600'" />
          <div>
            <p class="text-sm font-bold" :class="pass.status === 'autorizado' ? 'text-emerald-900' : 'text-red-900'">
              Este pase ya fue {{ pass.status }}
            </p>
            <p class="text-[11px] font-medium" :class="pass.status === 'autorizado' ? 'text-emerald-700' : 'text-red-700'">
              Por: {{ pass.authorized_by }} • {{ new Date(pass.authorized_at).toLocaleString() }}
            </p>
          </div>
        </div>
      </div>

      <footer v-if="pass.status === 'pendiente'" class="flex gap-3 relative z-10">
        <button @click="doAction('reject')" :disabled="isProcessing || !canAuthorize" class="flex-1 py-3.5 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-50 outline-none flex justify-center items-center gap-2">
          <X class="w-4 h-4" /> Rechazar
        </button>
        <button @click="doAction('authorize')" :disabled="isProcessing || !canAuthorize" class="flex-1 py-3.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50 outline-none flex justify-center items-center gap-2">
          <Check class="w-4 h-4" /> Autorizar
        </button>
      </footer>
      
      <p v-if="!canAuthorize && pass.status === 'pendiente'" class="text-center text-xs font-bold text-amber-600 mt-4 relative z-10">
        No puedes autorizar tu propio pase.
      </p>

      <div class="mt-8 text-center relative z-10">
         <NuxtLink to="/" class="text-xs font-bold text-slate-400 hover:text-brand-600 transition-colors">Volver a Pases Digitales</NuxtLink>
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
const { user } = useAuth()

const pass = ref(null)
const errorMsg = ref('')
const pending = ref(true)
const isProcessing = ref(false)

const canAuthorize = computed(() => {
  return pass.value && user.value && pass.value.employee_name !== user.value.name
})

const fetchPass = async () => {
  try {
    const data = await $fetch(`/api/passes/authorize/${token}`)
    pass.value = data
  } catch (err) {
    errorMsg.value = err.data?.message || 'Error al recuperar el pase.'
  } finally {
    pending.value = false
  }
}

const doAction = async (actionStr) => {
  if (isProcessing.value || !canAuthorize.value) return
  isProcessing.value = true
  try {
    const res = await $fetch(`/api/passes/authorize/${token}`, { method: 'POST', body: { action: actionStr } })
    pass.value.status = res.status
    pass.value.authorized_by = user.value.name
    pass.value.authorized_at = new Date().toISOString()
  } catch (err) {
    alert(err.data?.message || 'Error procesando la solicitud.')
  } finally {
    isProcessing.value = false
  }
}

const getCategoryIcon = (id) => {
  const map = { 1: LogIn, 2: LogOutIcon, 3: UserX, 4: Clock, 5: Stethoscope }
  return map[id] || Clock
}

const getCategoryName = (id) => {
  const map = { 1: 'Llegada Tarde', 2: 'Salida Anticipada', 3: 'Ausencia', 4: 'Cambio de Horario', 5: 'Incapacidad' }
  return map[id] || 'Otro'
}

const formatDate = (dateStr) => dayjs(dateStr).format('DD MMM YYYY')

fetchPass()
</script>