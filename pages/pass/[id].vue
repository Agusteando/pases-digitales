<template>
  <div class="p-6 md:p-10 max-w-5xl mx-auto h-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
    
    <div class="mb-6 shrink-0 flex items-center justify-between">
      <button @click="$router.back()" class="text-slate-500 hover:text-brand-600 font-bold text-sm flex items-center gap-2 transition-colors outline-none px-3 py-2 -ml-3 rounded-lg hover:bg-white">
        <ArrowLeft class="w-4 h-4" /> Volver
      </button>
      
      <div v-if="pass && isOwnerOrAdmin" class="flex gap-2">
        <button v-if="isEditable" @click="showEditModal = true" class="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl shadow-sm hover:border-brand-500 hover:text-brand-600 transition-colors flex items-center gap-2 outline-none">
          <Edit2 class="w-4 h-4" /> Editar
        </button>
        <button @click="sharePass" class="px-4 py-2 bg-teal-50 border border-teal-100 text-teal-700 text-sm font-bold rounded-xl shadow-sm hover:bg-teal-500 hover:text-white transition-colors flex items-center gap-2 outline-none">
          <Share2 class="w-4 h-4" /> Compartir
        </button>
      </div>
    </div>

    <div v-if="pending" class="flex-1 flex items-center justify-center">
      <Loader2 class="w-10 h-10 animate-spin text-brand-600" />
    </div>

    <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center text-center">
      <div class="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle class="w-10 h-10 text-red-500" />
      </div>
      <h2 class="text-2xl font-black text-slate-900 mb-2">Pase no encontrado</h2>
      <p class="text-slate-500 font-medium">El registro que intentas visualizar no existe o fue eliminado.</p>
    </div>

    <div v-else-if="pass" class="space-y-6 flex-1">
      
      <!-- Header Card -->
      <div class="glass-card bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div class="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <component :is="getCategoryIcon(pass.category_id)" class="w-48 h-48" />
        </div>
        
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm shrink-0 border" :class="getCategoryColorBox(pass.category_id)">
              <component :is="getCategoryIcon(pass.category_id)" class="w-7 h-7" />
            </div>
            <div>
              <div class="flex items-center gap-3 mb-1">
                <h1 class="text-3xl font-black text-slate-900 tracking-tight font-mono">#{{ String(pass.id).padStart(5, '0') }}</h1>
                <span class="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-lg border shadow-sm"
                      :class="{'bg-amber-50 text-amber-700 border-amber-200': pass.status === 'pendiente',
                               'bg-emerald-50 text-emerald-700 border-emerald-200': pass.status === 'autorizado',
                               'bg-red-50 text-red-700 border-red-200': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                  {{ pass.status }}
                </span>
              </div>
              <p class="text-lg font-extrabold text-slate-700">{{ getCategoryName(pass.category_id) }}</p>
              <p class="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Creado el {{ formatDateLong(pass.created_at) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left Column: Details -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Operative Data -->
          <div class="glass-card bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
              <User class="w-4 h-4 text-brand-500" /> Información del Colaborador
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</span>
                <span class="text-base font-extrabold text-slate-900">{{ pass.employee_name }}</span>
              </div>
              <div>
                <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plantel Asignado</span>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
                  <Building2 class="w-3.5 h-3.5 text-slate-500" />
                  {{ pass.plantel || 'No Especificado' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Event Details -->
          <div class="glass-card bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
              <Calendar class="w-4 h-4 text-brand-500" /> Detalles del Evento
            </h3>
            
            <div class="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
              <div>
                <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha Inicial</span>
                <span class="text-sm font-bold text-slate-800">{{ formatDateOnly(pass.date) }}</span>
              </div>
              <div v-if="[3, 5].includes(pass.category_id)">
                <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha Final</span>
                <span class="text-sm font-bold text-slate-800">{{ pass.fecha_fin ? formatDateOnly(pass.fecha_fin) : 'N/A' }}</span>
              </div>
              <div v-if="![3].includes(pass.category_id)">
                <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hora Evento</span>
                <span class="text-sm font-bold text-slate-800">{{ formatTime(pass.time) }}</span>
              </div>
              <div v-if="pass.regreso">
                <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Retorno Programado</span>
                <span class="text-sm font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">{{ formatTime(pass.hora_regreso) }}</span>
              </div>
            </div>

            <!-- Medical Data -->
            <div v-if="pass.category_id === 5" class="mb-6 p-4 bg-teal-50 rounded-2xl border border-teal-100 grid grid-cols-2 gap-4">
              <div>
                <span class="block text-[10px] font-bold text-teal-600/70 uppercase tracking-wider mb-1">Folio IMSS</span>
                <span class="text-sm font-black text-teal-900">{{ pass.IMSS || 'No Registrado' }}</span>
              </div>
              <div>
                <span class="block text-[10px] font-bold text-teal-600/70 uppercase tracking-wider mb-1">Clasificación</span>
                <span class="text-sm font-black text-teal-900">{{ pass.tipo_incapacidad || 'N/A' }}</span>
              </div>
            </div>

            <div>
              <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Motivo / Justificación</span>
              <p class="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                {{ pass.comentarios || 'Sin comentarios adicionales.' }}
              </p>
            </div>
            
            <div v-if="pass.evidence || pass.justificante" class="mt-6">
              <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Evidencia Adjunta</span>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 w-max">
                <FileText class="w-5 h-5 text-slate-400" />
                <span class="text-sm font-bold text-slate-700">Documento de Respaldo</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Status & System -->
        <div class="space-y-6">
          
          <!-- Authorization State -->
          <div class="glass-card bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-brand-500" /> Estado de Autorización
            </h3>

            <div class="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              <!-- Step 1: Emission -->
              <div class="relative">
                <div class="absolute -left-[30px] w-4 h-4 rounded-full border-2 border-white bg-brand-500 shadow-sm"></div>
                <div>
                  <p class="text-xs font-black text-slate-800 uppercase tracking-wide">Pase Emitido</p>
                  <p class="text-[11px] font-medium text-slate-500 mt-0.5">Por {{ pass.user }}</p>
                  <p class="text-[10px] font-bold text-slate-400 mt-1">{{ formatDateLong(pass.created_at) }}</p>
                </div>
              </div>

              <!-- Step 2: Resolution -->
              <div class="relative">
                <div class="absolute -left-[30px] w-4 h-4 rounded-full border-2 border-white shadow-sm"
                     :class="{'bg-amber-400': pass.status === 'pendiente', 'bg-emerald-500': pass.status === 'autorizado', 'bg-red-500': pass.status === 'rechazado' || pass.status === 'cancelado'}"></div>
                <div>
                  <p class="text-xs font-black uppercase tracking-wide"
                     :class="{'text-amber-700': pass.status === 'pendiente', 'text-emerald-700': pass.status === 'autorizado', 'text-red-700': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                    {{ pass.status === 'pendiente' ? 'Esperando Resolución' : `Pase ${pass.status}` }}
                  </p>
                  <p v-if="pass.authorized_by" class="text-[11px] font-medium text-slate-500 mt-0.5">Por {{ pass.authorized_by }}</p>
                  <p v-if="pass.authorized_at" class="text-[10px] font-bold text-slate-400 mt-1">{{ formatDateLong(pass.authorized_at) }}</p>
                </div>
              </div>
            </div>

            <!-- Manual Auth Warning -->
            <div v-if="pass.status === 'pendiente' && !canAuthorize" class="mt-6 p-3 bg-amber-50 rounded-xl border border-amber-200 flex gap-2 items-start">
              <Info class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p class="text-[10px] text-amber-800 font-medium leading-relaxed">
                Este pase ha sido enviado a la ruta correspondiente. Debes esperar la resolución a través de la notificación externa.
              </p>
            </div>
            <div v-else-if="pass.status === 'pendiente' && canAuthorize" class="mt-6 p-3 bg-brand-50 rounded-xl border border-brand-200">
               <p class="text-[10px] text-brand-800 font-bold text-center">Eres elegible para autorizar. Usa el enlace recibido por notificación.</p>
            </div>
          </div>

          <!-- Notification Delivery Log -->
          <div class="glass-card bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 class="text-sm font-black text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
              <Bell class="w-4 h-4 text-brand-500" /> Entregas de Notificación
            </h3>

            <div v-if="!pass.notifications || !pass.notifications.length" class="text-center py-4">
              <p class="text-xs font-medium text-slate-500">No hay registros de envío para este pase.</p>
            </div>
            <div v-else class="space-y-3">
              <div v-for="(log, idx) in pass.notifications" :key="idx" class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="w-2 h-2 rounded-full" :class="log.status === 'sent' ? 'bg-emerald-500' : 'bg-red-500'"></span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-700 truncate">{{ log.chat_id }}</span>
                  </div>
                  <p v-if="log.error_text" class="text-[9px] font-medium text-red-500 truncate" :title="log.error_text">{{ log.error_text }}</p>
                  <p class="text-[9px] font-bold text-slate-400 mt-1">{{ formatDateLong(log.created_at) }}</p>
                </div>
                <span class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border"
                      :class="log.status === 'sent' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'">
                  {{ log.status === 'sent' ? 'Ok' : 'Fail' }}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Reused Modal Component -->
    <PassEditModal v-if="pass && showEditModal" :isOpen="showEditModal" :pass="pass" @close="showEditModal = false" @updated="refreshPass" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Loader2, Edit2, Share2, AlertTriangle, User, Building2, Calendar, ShieldCheck, Bell, Info, FileText, LogIn, LogOut, UserX, Clock, Stethoscope } from 'lucide-vue-next'
import PassEditModal from '~/components/PassEditModal.vue'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

const route = useRoute()
const passId = route.params.id
const { user } = useAuth()

const { data: pass, pending, error, refresh } = useFetch(`/api/passes/${passId}`)
const showEditModal = ref(false)

const isOwnerOrAdmin = computed(() => {
  if (!user.value || !pass.value) return false
  return user.value.is_admin || user.value.name === pass.value.user
})

const canAuthorize = computed(() => {
  if (!user.value || !pass.value) return false
  return user.value.is_admin && user.value.name !== pass.value.employee_name
})

const isEditable = computed(() => {
  if (!isOwnerOrAdmin.value || !pass.value) return false
  if (pass.value.status === 'cancelado' || pass.value.status === 'rechazado') return false
  const passDate = dayjs(pass.value.date)
  const hoursDiff = dayjs().diff(passDate, 'hour')
  return hoursDiff <= 48
})

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

const sharePass = () => {
  if (!pass.value) return
  const text = `*Pase Digital - Folio #${String(pass.value.id).padStart(5, '0')}*\nColaborador: ${pass.value.employee_name}\nEstado: ${pass.value.status.toUpperCase()}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}

const refreshPass = () => {
  refresh()
}
</script>