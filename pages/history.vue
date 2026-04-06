<template>
  <div class="p-6 md:p-10 max-w-[1400px] mx-auto h-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
    <header class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Historial de Pases</h1>
        <p class="text-slate-500 mt-2 text-sm font-bold">Consulta, inspecciona y exporta los registros generados en la plataforma.</p>
      </div>
      <button @click="showExportModal = true" class="px-5 py-3 bg-white border border-slate-200/80 text-slate-700 font-black rounded-2xl shadow-sm hover:border-brand-500 hover:text-brand-600 hover:shadow-md transition-all flex items-center justify-center gap-2 outline-none">
        <Download class="w-5 h-5" />
        <span>Exportar Reporte</span>
      </button>
    </header>

    <!-- Search & Filter Bar -->
    <div class="glass-card p-5 rounded-3xl mb-8 flex flex-col lg:flex-row gap-5 items-center shrink-0">
      <div class="relative w-full lg:flex-1">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          v-model="filters.q" 
          @input="debounceSearch"
          type="text" 
          placeholder="Buscar por folio o nombre del colaborador..." 
          class="w-full pl-12 pr-4 py-3 bg-white border border-slate-200/80 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-2xl text-sm font-bold outline-none transition-all shadow-sm"
        />
      </div>
      
      <div class="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
        <div class="w-full sm:w-56">
          <select v-model="filters.plantel" @change="search" class="w-full px-4 py-3 bg-white border border-slate-200/80 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-2xl text-sm font-bold outline-none transition-all shadow-sm appearance-none">
            <option value="">Todos los planteles</option>
            <option v-for="p in planteles" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        
        <div class="flex items-center gap-2 w-full sm:w-auto bg-white p-1 rounded-2xl border border-slate-200/80 shadow-sm">
          <input v-model="filters.startDate" @change="search" type="date" class="w-full sm:w-auto px-3 py-2 bg-transparent focus:bg-slate-50 rounded-xl text-sm font-bold outline-none" />
          <span class="text-slate-400 font-bold px-1">a</span>
          <input v-model="filters.endDate" @change="search" type="date" class="w-full sm:w-auto px-3 py-2 bg-transparent focus:bg-slate-50 rounded-xl text-sm font-bold outline-none" />
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="glass-card rounded-3xl flex-1 flex flex-col overflow-hidden min-h-[400px]">
      <div class="overflow-x-auto custom-scrollbar flex-1">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[10px] uppercase tracking-widest font-black">
              <th class="px-6 py-5 rounded-tl-3xl">Folio</th>
              <th class="px-6 py-5">Colaborador</th>
              <th class="px-6 py-5">Categoría</th>
              <th class="px-6 py-5">Fecha</th>
              <th class="px-6 py-5">Plantel</th>
              <th class="px-6 py-5">Estado</th>
              <th class="px-6 py-5 text-right rounded-tr-3xl">Acciones Rápidas</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="pending" class="bg-white/50">
              <td colspan="7" class="px-6 py-20 text-center">
                <Loader2 class="w-10 h-10 animate-spin text-brand-500 mx-auto" />
              </td>
            </tr>
            <tr v-else-if="!passes.length" class="bg-white/50">
              <td colspan="7" class="px-6 py-20 text-center">
                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                  <Search class="w-6 h-6 text-slate-400" />
                </div>
                <p class="text-slate-600 font-bold">No se encontraron registros</p>
                <p class="text-slate-400 text-sm mt-1">Ajusta los filtros o intenta con otra búsqueda.</p>
              </td>
            </tr>
            <tr v-else v-for="pass in passes" :key="pass.id" class="bg-white/80 hover:bg-white transition-colors group">
              <td class="px-6 py-5">
                <div class="flex items-center gap-2">
                  <NuxtLink :to="`/pass/${pass.id}`" class="font-mono text-sm font-black text-brand-600 hover:text-brand-900 tracking-tight transition-colors">
                    #{{ String(pass.id).padStart(5, '0') }}
                  </NuxtLink>
                  <span v-if="pass.processed" title="Sincronizado" class="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100">
                    <Check class="w-3 h-3 text-emerald-600" />
                  </span>
                </div>
              </td>
              <td class="px-6 py-5">
                <span class="text-sm font-black text-slate-800">{{ pass.employee_name }}</span>
              </td>
              <td class="px-6 py-5">
                <span class="text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{{ getCategoryName(pass.category_id) }}</span>
              </td>
              <td class="px-6 py-5">
                <span class="text-sm font-bold text-slate-600">{{ formatDate(pass.date) }}</span>
              </td>
              <td class="px-6 py-5">
                <span v-if="pass.plantel" class="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">{{ pass.plantel }}</span>
              </td>
              <td class="px-6 py-5">
                <span class="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md border shadow-sm"
                      :class="pass.status === 'autorizado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                             (pass.status === 'cancelado' || pass.status === 'rechazado' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200')">
                  {{ pass.status }}
                </span>
              </td>
              <td class="px-6 py-5 text-right">
                <div class="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <NuxtLink :to="`/pass/${pass.id}`" class="p-2 text-slate-500 hover:text-brand-600 bg-white hover:bg-brand-50 rounded-xl transition-all border border-slate-200 hover:border-brand-200 shadow-sm" title="Abrir Folio">
                    <Eye class="w-4 h-4" />
                  </NuxtLink>
                  <template v-if="user?.name === pass.user || user?.is_admin">
                    <button v-if="pass.status === 'pendiente'" @click="quickResend(pass.id)" :disabled="actionLoading === pass.id" class="p-2 text-slate-500 hover:text-brand-600 bg-white hover:bg-brand-50 rounded-xl transition-all border border-slate-200 hover:border-brand-200 shadow-sm disabled:opacity-50" title="Reenviar Notificación">
                      <Loader2 v-if="actionLoading === pass.id && actionType === 'resend'" class="w-4 h-4 animate-spin" />
                      <Send v-else class="w-4 h-4" />
                    </button>
                    <button v-if="isEditable(pass)" @click="openEditModal(pass)" class="p-2 text-slate-500 hover:text-brand-600 bg-white hover:bg-brand-50 rounded-xl transition-all border border-slate-200 hover:border-brand-200 shadow-sm" title="Editar Datos">
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button v-if="pass.status === 'pendiente'" @click="quickCancel(pass.id)" :disabled="actionLoading === pass.id" class="p-2 text-slate-500 hover:text-red-600 bg-white hover:bg-red-50 rounded-xl transition-all border border-slate-200 hover:border-red-200 shadow-sm disabled:opacity-50" title="Anular Folio">
                      <Loader2 v-if="actionLoading === pass.id && actionType === 'cancel'" class="w-4 h-4 animate-spin" />
                      <Trash2 v-else class="w-4 h-4" />
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <PassExportModal :isOpen="showExportModal" @close="showExportModal = false" />
    <PassEditModal v-if="selectedPass" :isOpen="!!selectedPass" :pass="selectedPass" @close="selectedPass = null" @updated="search" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search, Download, Edit2, Check, Loader2, Eye, Send, Trash2 } from 'lucide-vue-next'
import PassExportModal from '~/components/PassExportModal.vue'
import PassEditModal from '~/components/PassEditModal.vue'
import dayjs from 'dayjs'

const { user } = useAuth()
const showExportModal = ref(false)
const selectedPass = ref(null)

const { data: planteles } = useFetch('/api/catalogs/planteles', { default: () => [] })

const filters = ref({
  q: '',
  plantel: '',
  startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD')
})

const passes = ref([])
const pending = ref(false)
const actionLoading = ref(null)
const actionType = ref(null)
let searchTimeout = null

const getCategoryName = (id) => {
  const map = { 1: 'Llegada Tarde', 2: 'Salida Anticipada', 3: 'Ausencia', 4: 'Cambio de Horario', 5: 'Incapacidad' }
  return map[id] || 'Otro'
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return dayjs(dateStr).format('DD/MM/YYYY')
}

const isEditable = (pass) => {
  if (pass.status !== 'pendiente') return false
  const passDate = dayjs(pass.date)
  const hoursDiff = dayjs().diff(passDate, 'hour')
  return hoursDiff <= 48
}

const search = async () => {
  pending.value = true
  try {
    const data = await $fetch('/api/passes/search', { params: filters.value })
    passes.value = data || []
  } catch (error) {
    console.error('Search error:', error)
  } finally {
    pending.value = false
  }
}

const debounceSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(search, 300)
}

const openEditModal = (pass) => {
  selectedPass.value = pass
}

const quickResend = async (id) => {
  if (actionLoading.value) return
  actionLoading.value = id
  actionType.value = 'resend'
  try {
    await $fetch(`/api/passes/${id}/notify`, { method: 'POST' })
    alert('Notificaciones reenviadas exitosamente.')
  } catch (err) {
    alert(err?.data?.message || 'Error al reenviar notificaciones.')
  } finally {
    actionLoading.value = null
    actionType.value = null
  }
}

const quickCancel = async (id) => {
  if (actionLoading.value) return
  if (!confirm('¿Seguro que deseas anular este pase? Esta acción no se puede deshacer.')) return
  actionLoading.value = id
  actionType.value = 'cancel'
  try {
    await $fetch(`/api/passes/${id}/action`, { method: 'POST', body: { action: 'cancel' } })
    search()
  } catch (err) {
    alert(err?.data?.message || 'Error al anular el pase.')
  } finally {
    actionLoading.value = null
    actionType.value = null
  }
}

onMounted(() => {
  search()
})
</script>