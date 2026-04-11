

<template>
  <div class="p-6 md:p-10 max-w-6xl mx-auto h-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
    
    <div class="mb-8 shrink-0 flex items-center justify-between">
      <button @click="$router.push('/history')" class="text-slate-500 hover:text-brand-600 font-black text-sm flex items-center gap-2 transition-colors outline-none px-4 py-2.5 sm:-ml-4 rounded-xl hover:bg-white/60 shadow-sm border border-transparent hover:border-white/80">
        <ArrowLeft class="w-4 h-4" /> Regresar al historial
      </button>
    </div>

    <div v-if="pending" class="flex-1 flex items-center justify-center">
      <Loader2 class="w-12 h-12 animate-spin text-brand-600" />
    </div>

    <div v-else-if="error || !pass" class="flex-1 flex flex-col items-center justify-center text-center">
      <div class="w-24 h-24 bg-casita-red/10 rounded-full flex items-center justify-center mb-6 border border-casita-red/20 shadow-sm">
        <AlertTriangle class="w-12 h-12 text-casita-red" />
      </div>
      <h2 class="text-3xl font-black text-slate-900 mb-2 tracking-tight">Folio no encontrado</h2>
      <p class="text-slate-500 font-bold max-w-md mx-auto">El pase que buscas no existe o fue eliminado.</p>
      <button @click="$router.push('/history')" class="mt-8 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all shadow-md hover:shadow-lg outline-none">Regresar al historial</button>
    </div>

    <div v-else class="space-y-8 flex-1">
      
      <!-- Header Premium Card -->
      <div class="glass-panel p-8 md:p-12 rounded-[3rem] border border-white/80 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none transform rotate-12 scale-150">
          <component :is="getCategoryIcon(pass.category_id)" class="w-64 h-64" />
        </div>
        
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-8 relative z-10">
          <div class="flex items-start gap-6">
            <div class="w-20 h-20 rounded-[1.5rem] flex items-center justify-center shadow-md shrink-0 border border-white bg-white" :class="getCategoryColorBox(pass.category_id)">
              <component :is="getCategoryIcon(pass.category_id)" class="w-10 h-10" />
            </div>
            <div class="pt-1">
              <div class="flex items-center gap-4 mb-2">
                <h1 class="text-4xl font-black text-slate-900 tracking-tighter font-mono">#{{ String(pass.id).padStart(5, '0') }}</h1>
                <span class="text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg border shadow-sm bg-white/60"
                      :class="{'text-casita-gold-dark border-casita-gold/30': pass.status === 'pendiente',
                               'text-casita-green border-casita-green/30': pass.status === 'autorizado',
                               'text-casita-red border-casita-red/30': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                  {{ pass.status }}
                </span>
              </div>
              <p class="text-xl font-black text-slate-700">{{ getCategoryName(pass.category_id) }}</p>
              <p class="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-2">
                <Clock class="w-3.5 h-3.5" /> Creado el {{ formatDateLong(pass.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left Column: Details -->
        <div class="lg:col-span-2 space-y-8">
          
          <!-- Colaborador Block con Fotografía -->
          <div class="glass-panel p-8 rounded-[2.5rem] border border-white/80 shadow-sm">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <User class="w-4 h-4 text-brand-500" /> Colaborador
            </h3>
            
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <PremiumAvatar :src="enrichment?.picture || null" :name="pass.employee_name" size="lg" class="shrink-0 ring-4 ring-white shadow-md bg-white" />
              
              <div class="flex-1 w-full text-center sm:text-left">
                <h4 class="text-2xl font-black text-slate-900 tracking-tight flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  {{ pass.employee_name }}
                  <span v-if="pass.employee_name === pass.user" class="inline-block px-3 py-1 bg-white text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-slate-200/60 shadow-sm w-max mx-auto sm:mx-0">
                    Registro propio
                  </span>
                </h4>
                <div class="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                  <span v-if="pass.plantel" class="px-3.5 py-1.5 bg-white text-slate-700 text-xs font-bold rounded-xl border border-white shadow-sm flex items-center gap-1.5">
                    <Building2 class="w-3.5 h-3.5 text-casita-green" />
                    {{ pass.plantel }}
                  </span>
                  <span v-if="enrichment?.puesto" class="px-3.5 py-1.5 bg-white text-slate-700 text-xs font-bold rounded-xl border border-white shadow-sm flex items-center gap-1.5">
                    <Briefcase class="w-3.5 h-3.5 text-iedis-blue" />
                    {{ enrichment.puesto }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Detalles del Pase -->
          <div class="glass-panel p-8 rounded-[2.5rem] border border-white/80 shadow-sm">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Calendar class="w-4 h-4 text-brand-500" /> Detalles
            </h3>
            
            <div class="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              <div class="border-l-[3px] border-casita-green-light/50 pl-4 bg-white/40 py-2 rounded-r-xl">
                <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Desde</span>
                <span class="text-base font-black text-slate-800">{{ formatDateOnly(pass.date) }}</span>
              </div>
              <div class="border-l-[3px] border-casita-peach/50 pl-4 bg-white/40 py-2 rounded-r-xl" v-if="[3, 5].includes(pass.category_id)">
                <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hasta</span>
                <span class="text-base font-black text-slate-800">{{ pass.fecha_fin ? formatDateOnly(pass.fecha_fin) : 'N/A' }}</span>
              </div>
              <div class="border-l-[3px] border-iedis-blue/50 pl-4 bg-white/40 py-2 rounded-r-xl" v-if="![3].includes(pass.category_id)">
                <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hora</span>
                <span class="text-base font-black text-slate-800 font-mono">{{ formatTime(pass.time) }}</span>
              </div>
              <div class="border-l-[3px] border-iedis-teal/50 pl-4 bg-iedis-teal/10 py-2 rounded-r-xl" v-if="pass.regreso">
                <span class="block text-[10px] font-black text-iedis-teal-dark uppercase tracking-widest mb-1.5">Hora de retorno</span>
                <span class="text-base font-black text-iedis-teal-dark font-mono">{{ formatTime(pass.hora_regreso) }}</span>
              </div>
            </div>

            <div v-if="pass.category_id === 5" class="mb-8 p-6 bg-iedis-teal/10 rounded-2xl border border-iedis-teal/20 grid grid-cols-2 gap-6 shadow-sm">
              <div>
                <span class="block text-[10px] font-black text-iedis-teal-dark/70 uppercase tracking-widest mb-1.5">Folio IMSS</span>
                <span class="text-base font-black text-iedis-teal-dark font-mono">{{ pass.IMSS || 'No registrado' }}</span>
              </div>
              <div>
                <span class="block text-[10px] font-black text-iedis-teal-dark/70 uppercase tracking-widest mb-1.5">Tipo de incapacidad</span>
                <span class="text-base font-black text-iedis-teal-dark">{{ pass.tipo_incapacidad || 'N/A' }}</span>
              </div>
            </div>

            <div v-if="pass.tipo_permiso" class="bg-white/60 p-6 rounded-[1.5rem] border border-white shadow-sm mb-6">
              <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clasificación / Permiso</span>
              <p class="text-sm font-black text-slate-800">{{ pass.tipo_permiso }}</p>
            </div>

            <div v-if="pass.comentarios" class="bg-white/60 p-6 rounded-[1.5rem] border border-white shadow-sm">
              <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Justificación</span>
              <p class="text-sm font-medium text-slate-800 leading-relaxed italic">
                "{{ pass.comentarios }}"
              </p>
            </div>

            <div v-if="pass.evidence" class="bg-white/60 p-6 rounded-[1.5rem] border border-white shadow-sm mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100 shadow-sm">
                  <Paperclip class="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Evidencia Adjunta</span>
                  <p class="text-sm font-black text-slate-800">Justificante o documento</p>
                </div>
              </div>
              <a :href="pass.evidence" target="_blank" rel="noopener noreferrer" class="shrink-0 w-full sm:w-auto px-5 py-3 bg-white hover:bg-brand-50 text-brand-600 text-xs font-black rounded-xl border border-slate-200/60 shadow-sm transition-all flex items-center justify-center gap-2 outline-none">
                <ExternalLink class="w-4 h-4" /> Abrir archivo
              </a>
            </div>

          </div>
        </div>

        <!-- Right Column: Status & System -->
        <div class="space-y-8">

          <!-- Autorización Directa -->
          <div v-if="pass.status === 'pendiente' && canManage" class="glass-panel bg-casita-green-light/10 p-8 rounded-[2.5rem] border border-casita-green/30 shadow-lg">
            <h3 class="text-xs font-black text-casita-green-dark uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-casita-green" /> Resolver solicitud
            </h3>
            <p class="text-xs text-casita-green-dark/70 font-bold mb-6 leading-relaxed">
              El aviso de autorización ya fue enviado. Como administrador o creador, puedes resolver la solicitud directamente desde aquí.
            </p>
            <div class="flex flex-col gap-3">
              <button @click="handleInAppAuth('authorize')" :disabled="isResolving" class="w-full relative group overflow-hidden bg-gradient-to-b from-casita-green to-casita-green-dark text-white text-sm font-black rounded-[1.25rem] transition-all shadow-[0_4px_20px_-4px_rgba(97,139,47,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_24px_-4px_rgba(97,139,47,0.6),inset_0_1px_0_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed h-14 outline-none border border-casita-green-dark/50">
                <div class="absolute inset-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                <div class="absolute inset-0 flex items-center justify-center gap-2.5 transition-transform duration-300 group-hover:scale-[1.02] z-10">
                  <Loader2 v-if="isResolving" class="w-4 h-4 animate-spin text-white/80" />
                  <Check v-else class="w-4 h-4 text-white/90 group-hover:text-white transition-colors" /> 
                  <span class="tracking-wide">Autorizar</span>
                </div>
              </button>
              
              <button @click="handleInAppAuth('reject')" :disabled="isResolving" class="w-full relative group overflow-hidden bg-white hover:bg-slate-50 text-casita-red-dark font-black text-sm rounded-[1.25rem] transition-all border-2 border-casita-red/20 hover:border-casita-red/40 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed h-14 outline-none">
                <div class="absolute inset-0 flex items-center justify-center gap-2.5 transition-transform duration-300 group-hover:scale-[1.02]">
                  <Loader2 v-if="isResolving" class="w-4 h-4 animate-spin text-casita-red/50" />
                  <X v-else class="w-4 h-4 text-casita-red/70 group-hover:text-casita-red transition-colors" /> 
                  <span>Rechazar</span>
                </div>
              </button>
            </div>
          </div>
          
          <!-- Acciones -->
          <div v-if="pass && canManage" class="glass-panel p-8 rounded-[2.5rem] border border-white/80 shadow-sm">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Zap class="w-4 h-4 text-brand-500" /> Opciones
            </h3>

            <div v-if="pass.status !== 'pendiente'" class="p-5 bg-white/60 rounded-2xl border border-white mb-5 flex items-start gap-4 shadow-sm">
               <Lock class="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
               <div>
                 <p class="text-sm font-black text-slate-700">Edición bloqueada</p>
                 <p class="text-[11px] font-medium text-slate-500 mt-1.5 leading-relaxed">
                   No es posible alterar o notificar un pase que ya ha sido resuelto.
                 </p>
               </div>
            </div>

            <div class="space-y-4">
              <button @click="handleResend" :disabled="pass.status !== 'pendiente' || isResending" class="w-full py-3.5 bg-gradient-to-r from-iedis-teal to-iedis-teal-dark text-white text-sm font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none outline-none">
                <Loader2 v-if="isResending" class="w-4 h-4 animate-spin" />
                <Send v-else class="w-4 h-4" />
                <span>Reenviar aviso</span>
              </button>
              
              <button @click="showEditModal = true" :disabled="pass.status !== 'pendiente' || isExpired" class="w-full py-3.5 bg-white/80 hover:bg-white border border-white text-slate-700 text-sm font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 outline-none">
                <Edit2 class="w-4 h-4 text-slate-400" />
                <span>Editar pase</span>
              </button>
              <p v-if="pass.status === 'pendiente' && isExpired" class="text-[10px] font-bold text-casita-gold-dark mt-1 px-1 text-center">Edición no disponible (límite de 48 hrs excedido).</p>

              <button @click="handleCancel" :disabled="pass.status !== 'pendiente' || isCancelling" class="w-full py-3.5 bg-white/80 hover:bg-white border border-white text-casita-red text-sm font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 outline-none">
                <Loader2 v-if="isCancelling" class="w-4 h-4 animate-spin" />
                <Trash2 v-else class="w-4 h-4 text-casita-red/70" />
                <span>Anular pase</span>
              </button>
            </div>
          </div>

          <!-- Status Timeline -->
          <div class="glass-panel p-8 rounded-[2.5rem] border border-white/80 shadow-sm">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-brand-500" /> Historial de Estado
            </h3>

            <div class="relative pl-8 space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-casita-green-light/40 before:via-iedis-teal/40 before:to-transparent">
              <!-- Step 1: Emission -->
              <div class="relative timeline-item" style="animation-delay: 0s;">
                <div class="absolute -left-[39px] w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center z-10 border border-white/60">
                  <div class="w-3.5 h-3.5 bg-slate-300 rounded-full"></div>
                </div>
                <div class="bg-white/60 p-5 rounded-2xl border border-white shadow-sm">
                  <p class="text-xs font-black text-slate-800 uppercase tracking-widest mb-1.5">Generado</p>
                  <p class="text-[11px] font-bold text-slate-500">Por: <span class="text-slate-700">{{ pass.user }}</span></p>
                  <p class="text-[10px] font-bold text-slate-400 mt-2.5">{{ formatDateLong(pass.created_at) }}</p>
                </div>
              </div>

              <!-- Step 2: Resolution -->
              <div class="relative timeline-item" style="animation-delay: 0.15s;">
                <div class="absolute -left-[39px] w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center z-10 border border-white/60"
                     :class="{'bg-white': pass.status === 'pendiente'}">
                  <div class="w-3.5 h-3.5 rounded-full" :class="{'bg-casita-gold': pass.status === 'pendiente', 'bg-casita-green': pass.status === 'autorizado', 'bg-casita-red': pass.status === 'rechazado' || pass.status === 'cancelado'}"></div>
                </div>
                <div class="p-5 rounded-2xl border shadow-sm" :class="{'bg-casita-gold/10 border-casita-gold/20': pass.status === 'pendiente', 'bg-casita-green/10 border-casita-green/20': pass.status === 'autorizado', 'bg-casita-red/10 border-casita-red/20': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                  <p class="text-xs font-black uppercase tracking-widest mb-1.5"
                     :class="{'text-casita-gold-dark': pass.status === 'pendiente', 'text-casita-green-dark': pass.status === 'autorizado', 'text-casita-red-dark': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                    {{ pass.status === 'pendiente' ? 'Pendiente' : `Estado: ${pass.status}` }}
                  </p>
                  <p v-if="pass.authorized_by" class="text-[11px] font-bold text-slate-600 mt-1">Por: <span class="text-slate-800">{{ pass.authorized_by }}</span></p>
                  <p v-if="pass.authorized_at" class="text-[10px] font-bold text-slate-500 mt-2.5 opacity-80">{{ formatDateLong(pass.authorized_at) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Notification Delivery Log -->
          <div class="glass-panel p-8 rounded-[2.5rem] border border-white/80 shadow-sm">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Bell class="w-4 h-4 text-brand-500" /> Registro de envíos
            </h3>

            <div v-if="!pass.notifications || !pass.notifications.length" class="text-center py-8 bg-white/60 rounded-[2rem] border border-white border-dashed shadow-sm">
              <p class="text-sm font-bold text-slate-400">No hay registros de envío.</p>
            </div>
            <div v-else class="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
              <div v-for="(log, idx) in pass.notifications" :key="idx" class="p-5 rounded-2xl border flex items-start justify-between gap-4 transition-colors"
                   :class="isSystemLog(log.error_text) ? 'bg-slate-900 border-slate-800 text-white shadow-md' : 'bg-white/80 border-white hover:bg-white hover:shadow-sm shadow-sm'">
                <div class="flex items-center gap-4 w-full min-w-0">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-white shadow-sm" :class="getChannelColor(log.error_text)">
                    <component :is="getChannelIcon(log.error_text)" class="w-4 h-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-black tracking-tight truncate" :class="isSystemLog(log.error_text) ? 'text-white' : 'text-slate-800'">
                      {{ extractTargetName(log.error_text) }}
                    </p>
                    <p class="text-[10px] font-bold mt-1.5 truncate" :class="isSystemLog(log.error_text) ? 'text-slate-400' : 'text-slate-500'" :title="getDeliveryDetail(log)">
                      {{ getDeliveryDetail(log) }}
                    </p>
                    <p class="text-[9px] font-black mt-2 uppercase tracking-widest" :class="isSystemLog(log.error_text) ? 'text-slate-500' : 'text-slate-400'">
                      {{ formatDateLong(log.created_at) }}
                    </p>
                  </div>
                </div>
                <span class="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm shrink-0"
                      :class="isSystemLog(log.error_text) && log.status === 'sent' ? 'bg-casita-green/20 text-casita-green-light border-casita-green/30' :
                             isSystemLog(log.error_text) && log.status !== 'sent' ? 'bg-casita-red/20 text-casita-red-light border-casita-red/30' :
                             log.status === 'sent' ? 'text-casita-green bg-casita-green/10 border-casita-green/20' : 'text-casita-red bg-casita-red/10 border-casita-red/20'">
                  {{ log.status === 'sent' ? 'OK' : 'Error' }}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <PassEditModal v-if="pass && showEditModal" :isOpen="showEditModal" :pass="pass" @close="showEditModal = false" @updated="refreshPass" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Loader2, Edit2, AlertTriangle, User, Building2, Calendar, ShieldCheck, Bell, MessageCircle, Mail, Server, LogIn, LogOut, UserX, Clock, Stethoscope, Send, Trash2, Zap, Lock, Briefcase, CheckCircle2, X, Check, Paperclip, ExternalLink } from 'lucide-vue-next'
import PassEditModal from '~/components/PassEditModal.vue'
import PremiumAvatar from '~/components/PremiumAvatar.vue'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

const route = useRoute()

const passId = route.params.id
const { data: pass, pending, error, refresh } = useFetch(`/api/passes/${passId}`)

const { data: enrichment } = useAsyncData(`enrich-pass-${passId}`, async () => {
  if (!pass.value?.curp) return {}
  const res = await $fetch('/api/employees/enrich', { query: { curp: pass.value.curp } })
  return res || {}
}, { watch: [pass] })

const { user } = useAuth()
const showEditModal = ref(false)
const isResending = ref(false)
const isCancelling = ref(false)
const isResolving = ref(false)

const isAdmin = computed(() => user.value?.is_admin || false)
const isOwner = computed(() => user.value && pass.value && user.value.name === pass.value.user)
const canManage = computed(() => isOwner.value || isAdmin.value)

const isExpired = computed(() => {
  if (!pass.value) return true
  return dayjs().diff(dayjs(pass.value.date), 'hour') > 48
})

const handleResend = async () => {
  if (isResending.value || !pass.value) return
  isResending.value = true
  try {
    await $fetch(`/api/passes/${passId}/notify`, { method: 'POST' })
    refresh()
  } catch (err) {
    console.error('Resend error', err)
    alert(err.data?.message || 'Ocurrió un error al intentar reenviar el aviso.')
  } finally {
    isResending.value = false
  }
}

const handleCancel = async () => {
  if (isCancelling.value || !pass.value) return
  if (!confirm('¿Estás seguro de que deseas anular permanentemente este pase? Esta acción no se puede deshacer.')) return
  
  isCancelling.value = true
  try {
    await $fetch(`/api/passes/${passId}/action`, { 
      method: 'POST', 
      body: { action: 'cancel' } 
    })
    refresh()
  } catch (err) {
    console.error('Cancel error', err)
    alert(err.data?.message || 'Error al intentar anular el registro.')
  } finally {
    isCancelling.value = false
  }
}

const handleInAppAuth = async (action) => {
  if (!confirm(`¿Estás seguro de que deseas ${action === 'authorize' ? 'aprobar' : 'rechazar'} este pase digital?`)) return;
  isResolving.value = true;
  try {
     await $fetch(`/api/passes/${passId}/action`, {
       method: 'POST',
       body: { action }
     });
     refresh();
  } catch(err) {
     console.error('Direct auth error', err)
     alert(err.data?.message || 'Ocurrió un error al procesar la resolución de la solicitud.');
  } finally {
     isResolving.value = false;
  }
}

const getCategoryIcon = (id) => {
  const map = { 1: LogIn, 2: LogOut, 3: UserX, 4: Clock, 5: Stethoscope }
  return map[id] || Clock
}

const getCategoryColorBox = (id) => {
  const map = { 
    1: 'text-casita-peach border-casita-peach/20 bg-casita-peach/10', 
    2: 'text-iedis-blue border-iedis-blue/20 bg-iedis-blue/10', 
    3: 'text-casita-red border-casita-red/20 bg-casita-red/10', 
    4: 'text-casita-gold border-casita-gold/20 bg-casita-gold/10', 
    5: 'text-iedis-teal border-iedis-teal/20 bg-iedis-teal/10' 
  }
  return map[id] || 'bg-white text-slate-600 border-white'
}

const getCategoryName = (id) => {
  const map = { 1: 'Llegada tarde', 2: 'Salida anticipada', 3: 'Ausencia justificada', 4: 'Cambio de horario', 5: 'Incapacidad médica' }
  return map[id] || 'Otro'
}

const formatDateOnly = (dateStr) => dateStr ? dayjs(dateStr).format('DD MMMM YYYY') : 'N/A'
const formatDateLong = (dateStr) => dateStr ? dayjs(dateStr).format('DD MMM YYYY, HH:mm') : 'N/A'
const formatTime = (timeStr) => timeStr ? timeStr.slice(0, 5) : 'N/A'

const isSystemLog = (text) => {
  return text && text.includes('Auditoría Global')
}

const extractTargetName = (text) => {
  if (!text) return 'Desconocido'
  if (isSystemLog(text)) return 'Registro general (Sistema)'
  const match = text.match(/Destinatario:\s*([^|]+)/)
  return match ? match[1].trim() : 'Sistema'
}

const getChannelColor = (text) => {
  if (!text) return 'text-slate-500 border-white bg-white'
  if (text.includes('Telegram') || isSystemLog(text)) return 'text-slate-300 border-slate-700 bg-slate-800'
  if (text.includes('WhatsApp')) return 'text-casita-green-dark border-casita-green/30 bg-casita-green/10'
  if (text.includes('Email')) return 'text-iedis-blue-dark border-iedis-blue/30 bg-iedis-blue/10'
  return 'text-slate-500 border-white bg-white'
}

const getChannelIcon = (text) => {
  if (!text) return Bell
  if (text.includes('Telegram') || isSystemLog(text)) return Server
  if (text.includes('WhatsApp')) return MessageCircle
  if (text.includes('Email')) return Mail
  return Bell
}

const getDeliveryDetail = (log) => {
  const text = log.error_text || ''
  const isOk = log.status === 'sent'
  const isSystem = isSystemLog(text)
  
  let methodStr = 'Canal Desconocido'
  if (text.includes('WhatsApp')) methodStr = 'WhatsApp'
  else if (text.includes('Email')) methodStr = 'Correo Electrónico'
  else if (text.includes('Telegram') || isSystem) methodStr = 'Red Interna (Telegram)'

  if (isOk) return isSystem ? `Confirmación de respaldo en ${methodStr}` : `Entregado vía ${methodStr} a ${log.chat_id}`
  
  const errMatch = text.split('| Error:')[1]
  return `Fallo en ${methodStr}: ${errMatch ? errMatch.trim() : 'Destino inalcanzable'}`
}

const refreshPass = () => {
  refresh()
}
</script>