<template>
  <div class="p-6 md:p-10 max-w-6xl mx-auto h-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
    
    <div class="mb-8 shrink-0 flex items-center justify-between">
      <button @click="$router.push('/history')" class="text-slate-500 hover:text-brand-600 font-black text-sm flex items-center gap-2 transition-colors outline-none px-4 py-2.5 sm:-ml-4 rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-slate-200">
        <ArrowLeft class="w-4 h-4" /> Volver al Historial
      </button>
    </div>

    <div v-if="pending" class="flex-1 flex items-center justify-center">
      <Loader2 class="w-12 h-12 animate-spin text-brand-600" />
    </div>

    <div v-else-if="error || !pass" class="flex-1 flex flex-col items-center justify-center text-center">
      <div class="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
        <AlertTriangle class="w-12 h-12 text-red-500" />
      </div>
      <h2 class="text-3xl font-black text-slate-900 mb-2 tracking-tight">Folio Inaccesible</h2>
      <p class="text-slate-500 font-bold max-w-md mx-auto">El registro que intentas visualizar no existe en la base de datos o fue eliminado.</p>
      <button @click="$router.push('/history')" class="mt-6 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl transition-colors shadow-md outline-none">Regresar al Historial</button>
    </div>

    <div v-else class="space-y-8 flex-1">
      
      <!-- Header Premium Card -->
      <div class="glass-card bg-white p-8 md:p-10 rounded-[2.5rem] border border-white/80 shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none transform rotate-12 scale-150">
          <component :is="getCategoryIcon(pass.category_id)" class="w-64 h-64" />
        </div>
        
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-8 relative z-10">
          <div class="flex items-start gap-6">
            <div class="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg shrink-0 border-4 border-white" :class="getCategoryColorBox(pass.category_id)">
              <component :is="getCategoryIcon(pass.category_id)" class="w-10 h-10" />
            </div>
            <div class="pt-1">
              <div class="flex items-center gap-4 mb-2">
                <h1 class="text-4xl font-black text-slate-900 tracking-tighter font-mono">#{{ String(pass.id).padStart(5, '0') }}</h1>
                <span class="text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg border shadow-sm"
                      :class="{'bg-amber-50 text-amber-700 border-amber-200': pass.status === 'pendiente',
                               'bg-emerald-50 text-emerald-700 border-emerald-200': pass.status === 'autorizado',
                               'bg-red-50 text-red-700 border-red-200': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                  {{ pass.status }}
                </span>
              </div>
              <p class="text-xl font-black text-slate-700">{{ getCategoryName(pass.category_id) }}</p>
              <p class="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-2">
                <Clock class="w-3.5 h-3.5" /> Generado el {{ formatDateLong(pass.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left Column: Details -->
        <div class="lg:col-span-2 space-y-8">
          
          <!-- Operative Data -->
          <div class="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <User class="w-4 h-4 text-brand-500" /> Identidad del Colaborador
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nombre Completo</span>
                <span class="text-lg font-black text-slate-900 leading-tight">{{ pass.employee_name }}</span>
              </div>
              <div class="bg-slate-50/50 p-4 rounded-2xl border border-slate-100" v-if="pass.plantel">
                <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Plantel Asignado</span>
                <span class="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-slate-800 text-sm font-black rounded-xl border border-slate-200/80 shadow-sm">
                  <Building2 class="w-4 h-4 text-brand-500" />
                  {{ pass.plantel }}
                </span>
              </div>
            </div>
          </div>

          <!-- Event Details -->
          <div class="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Calendar class="w-4 h-4 text-brand-500" /> Parámetros del Evento
            </h3>
            
            <div class="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              <div class="border-l-2 border-brand-200 pl-4">
                <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fecha Inicial</span>
                <span class="text-base font-black text-slate-800">{{ formatDateOnly(pass.date) }}</span>
              </div>
              <div class="border-l-2 border-brand-200 pl-4" v-if="[3, 5].includes(pass.category_id)">
                <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fecha Final</span>
                <span class="text-base font-black text-slate-800">{{ pass.fecha_fin ? formatDateOnly(pass.fecha_fin) : 'N/A' }}</span>
              </div>
              <div class="border-l-2 border-brand-200 pl-4" v-if="![3].includes(pass.category_id)">
                <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hora Evento</span>
                <span class="text-base font-black text-slate-800 font-mono">{{ formatTime(pass.time) }}</span>
              </div>
              <div class="border-l-2 border-indigo-200 pl-4 bg-indigo-50/30 rounded-r-xl py-2" v-if="pass.regreso">
                <span class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Retorno Programado</span>
                <span class="text-base font-black text-indigo-700 font-mono">{{ formatTime(pass.hora_regreso) }}</span>
              </div>
            </div>

            <!-- Medical Data -->
            <div v-if="pass.category_id === 5" class="mb-8 p-6 bg-teal-50 rounded-2xl border border-teal-100 grid grid-cols-2 gap-6 shadow-sm">
              <div>
                <span class="block text-[10px] font-black text-teal-600/70 uppercase tracking-widest mb-1.5">Folio IMSS</span>
                <span class="text-base font-black text-teal-900 font-mono">{{ pass.IMSS || 'No Registrado' }}</span>
              </div>
              <div>
                <span class="block text-[10px] font-black text-teal-600/70 uppercase tracking-widest mb-1.5">Clasificación</span>
                <span class="text-base font-black text-teal-900">{{ pass.tipo_incapacidad || 'N/A' }}</span>
              </div>
            </div>

            <div v-if="pass.comentarios" class="bg-slate-50/80 p-6 rounded-2xl border border-slate-200/60">
              <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Justificación Redactada</span>
              <p class="text-sm font-medium text-slate-800 leading-relaxed italic">
                "{{ pass.comentarios }}"
              </p>
            </div>
          </div>
        </div>

        <!-- Right Column: Status & System -->
        <div class="space-y-8">
          
          <!-- Acciones Operativas -->
          <div v-if="pass && canManage" class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Zap class="w-4 h-4 text-brand-500" /> Acciones Operativas
            </h3>

            <div v-if="pass.status !== 'pendiente'" class="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-4 flex items-start gap-3">
               <Lock class="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
               <div>
                 <p class="text-sm font-black text-slate-700">Folio Inalterable</p>
                 <p class="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">
                   El registro ya ha sido resuelto ({{pass.status}}). Por reglas de auditoría y seguridad, no es posible modificar, anular ni reenviar notificaciones en este estado.
                 </p>
               </div>
            </div>

            <div class="space-y-3">
              <button @click="handleResend" :disabled="pass.status !== 'pendiente' || isResending" class="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:bg-brand-600 disabled:shadow-none outline-none">
                <Loader2 v-if="isResending" class="w-4 h-4 animate-spin" />
                <Send v-else class="w-4 h-4" />
                <span>Reenviar Notificación</span>
              </button>
              
              <button @click="showEditModal = true" :disabled="pass.status !== 'pendiente' || isExpired" class="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:hover:bg-white outline-none">
                <Edit2 class="w-4 h-4 text-slate-400" />
                <span>Editar Datos</span>
              </button>
              <p v-if="pass.status === 'pendiente' && isExpired" class="text-[10px] font-bold text-amber-600 mt-1 mb-2 px-1 text-center">Edición bloqueada: Han transcurrido más de 48 horas desde la fecha del evento.</p>

              <button @click="handleCancel" :disabled="pass.status !== 'pendiente' || isCancelling" class="w-full py-3 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-red-600 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-slate-200 outline-none">
                <Loader2 v-if="isCancelling" class="w-4 h-4 animate-spin" />
                <Trash2 v-else class="w-4 h-4 text-red-400" />
                <span>Anular Folio</span>
              </button>
            </div>
          </div>

          <!-- Estado y Trazabilidad -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-brand-500" /> Estado del Folio
            </h3>

            <div class="relative pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              <!-- Step 1: Emission -->
              <div class="relative">
                <div class="absolute -left-[39px] w-6 h-6 rounded-full border-4 border-white bg-slate-200 shadow-sm flex items-center justify-center z-10">
                  <div class="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                </div>
                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p class="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Registro Creado</p>
                  <p class="text-xs font-bold text-slate-500">Por: <span class="text-slate-700">{{ pass.user }}</span></p>
                  <p class="text-[10px] font-bold text-slate-400 mt-2">{{ formatDateLong(pass.created_at) }}</p>
                </div>
              </div>

              <!-- Step 2: Resolution -->
              <div class="relative">
                <div class="absolute -left-[39px] w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10"
                     :class="{'bg-amber-100': pass.status === 'pendiente', 'bg-emerald-100': pass.status === 'autorizado', 'bg-red-100': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                  <div class="w-1.5 h-1.5 rounded-full" :class="{'bg-amber-500': pass.status === 'pendiente', 'bg-emerald-500': pass.status === 'autorizado', 'bg-red-500': pass.status === 'rechazado' || pass.status === 'cancelado'}"></div>
                </div>
                <div class="p-4 rounded-2xl border" :class="{'bg-amber-50/50 border-amber-100': pass.status === 'pendiente', 'bg-emerald-50/50 border-emerald-100': pass.status === 'autorizado', 'bg-red-50/50 border-red-100': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                  <p class="text-xs font-black uppercase tracking-widest mb-1"
                     :class="{'text-amber-700': pass.status === 'pendiente', 'text-emerald-700': pass.status === 'autorizado', 'text-red-700': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                    {{ pass.status === 'pendiente' ? 'Pendiente de Autorización' : `Estado: ${pass.status}` }}
                  </p>
                  <p v-if="pass.authorized_by" class="text-xs font-bold text-slate-600 mt-1">Por: <span class="text-slate-800">{{ pass.authorized_by }}</span></p>
                  <p v-if="pass.authorized_at" class="text-[10px] font-bold text-slate-500 mt-2 opacity-80">{{ formatDateLong(pass.authorized_at) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Notification Delivery Log -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Bell class="w-4 h-4 text-brand-500" /> Envíos de Notificación
            </h3>

            <div v-if="!pass.notifications || !pass.notifications.length" class="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
              <p class="text-sm font-bold text-slate-400">Sin registros de distribución.</p>
            </div>
            <div v-else class="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
              <div v-for="(log, idx) in pass.notifications" :key="idx" class="p-4 rounded-2xl border flex items-start justify-between gap-4 transition-colors"
                   :class="isSystemLog(log.error_text) ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-sm'">
                <div class="flex items-center gap-3 w-full min-w-0">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm" :class="getChannelColor(log.error_text)">
                    <component :is="getChannelIcon(log.error_text)" class="w-4 h-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-black tracking-tight truncate" :class="isSystemLog(log.error_text) ? 'text-white' : 'text-slate-800'">
                      {{ extractTargetName(log.error_text) }}
                    </p>
                    <p class="text-[10px] font-bold mt-0.5 truncate" :class="isSystemLog(log.error_text) ? 'text-slate-400' : 'text-slate-500'" :title="getDeliveryDetail(log)">
                      {{ getDeliveryDetail(log) }}
                    </p>
                    <p class="text-[9px] font-bold mt-1.5 uppercase tracking-widest" :class="isSystemLog(log.error_text) ? 'text-slate-500' : 'text-slate-400'">
                      {{ formatDateLong(log.created_at) }}
                    </p>
                  </div>
                </div>
                <span class="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm shrink-0"
                      :class="isSystemLog(log.error_text) && log.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                             isSystemLog(log.error_text) && log.status !== 'sent' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                             log.status === 'sent' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'">
                  {{ log.status === 'sent' ? 'OK' : 'Fail' }}
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
import { ArrowLeft, Loader2, Edit2, AlertTriangle, User, Building2, Calendar, ShieldCheck, Bell, MessageCircle, Mail, Server, LogIn, LogOut, UserX, Clock, Stethoscope, Send, Trash2, Zap, Lock } from 'lucide-vue-next'
import PassEditModal from '~/components/PassEditModal.vue'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

const route = useRoute()
const passId = computed(() => route.params.id)
const { user } = useAuth()

const { data: pass, pending, error, refresh } = useFetch(() => `/api/passes/${passId.value}`)

const showEditModal = ref(false)
const isResending = ref(false)
const isCancelling = ref(false)

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
    await $fetch(`/api/passes/${passId.value}/notify`, { method: 'POST' })
    refresh()
  } catch (err) {
    console.error('Resend error', err)
    alert(err.data?.message || 'Ocurrió un error al intentar reenviar la notificación.')
  } finally {
    isResending.value = false
  }
}

const handleCancel = async () => {
  if (isCancelling.value || !pass.value) return
  if (!confirm('¿Estás seguro de que deseas anular permanentemente este pase? Esta acción no se puede deshacer.')) return
  
  isCancelling.value = true
  try {
    await $fetch(`/api/passes/${passId.value}/action`, { 
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

const getCategoryIcon = (id) => {
  const map = { 1: LogIn, 2: LogOut, 3: UserX, 4: Clock, 5: Stethoscope }
  return map[id] || Clock
}

const getCategoryColorBox = (id) => {
  const map = { 
    1: 'bg-orange-50 text-orange-600 border-orange-200', 
    2: 'bg-blue-50 text-blue-600 border-blue-200', 
    3: 'bg-rose-50 text-rose-600 border-rose-200', 
    4: 'bg-purple-50 text-purple-600 border-purple-200', 
    5: 'bg-teal-50 text-teal-600 border-teal-200' 
  }
  return map[id] || 'bg-slate-50 text-slate-600 border-slate-200'
}

const getCategoryName = (id) => {
  const map = { 1: 'Llegada Tarde', 2: 'Salida Anticipada', 3: 'Ausencia', 4: 'Cambio de Horario', 5: 'Incapacidad' }
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
  if (isSystemLog(text)) return 'Auditoría Global (Sistema)'
  const match = text.match(/Destinatario:\s*([^|]+)/)
  return match ? match[1].trim() : 'Sistema'
}

const getChannelColor = (text) => {
  if (!text) return 'bg-slate-100 text-slate-500 border-slate-200'
  if (text.includes('Telegram') || isSystemLog(text)) return 'bg-slate-800 text-slate-300 border-slate-700'
  if (text.includes('WhatsApp')) return 'bg-emerald-100 text-emerald-600 border-emerald-200'
  if (text.includes('Email')) return 'bg-brand-100 text-brand-600 border-brand-200'
  return 'bg-slate-100 text-slate-500 border-slate-200'
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