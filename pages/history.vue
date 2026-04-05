<template>
  <div class="p-6 md:p-10 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
    <header class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Historial de Pases</h1>
        <p class="text-slate-500 mt-2 text-sm font-medium">Busca, inspecciona y exporta pases generados en la plataforma.</p>
      </div>
      <button @click="showExportModal = true" class="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:border-brand-500 hover:text-brand-600 transition-colors flex items-center justify-center gap-2 outline-none">
        <Download class="w-4 h-4" />
        <span>Exportar Reporte</span>
      </button>
    </header>

    <!-- Search & Filter Bar -->
    <div class="glass-card p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 items-center shrink-0">
      <div class="relative w-full md:flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          v-model="filters.q" 
          @input="debounceSearch"
          type="text" 
          placeholder="Buscar por folio o nombre del colaborador..." 
          class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-lg text-sm font-medium outline-none transition-all shadow-sm"
        />
      </div>
      
      <div class="flex items-center gap-4 w-full md:w-auto">
        <div class="w-full md:w-48">
          <select v-model="filters.plantel" @change="search" class="w-full px-3 py-2 bg-white border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-lg text-sm font-medium outline-none transition-all shadow-sm appearance-none">
            <option value="">Todos los planteles</option>
            <option v-for="p in planteles" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        
        <div class="flex items-center gap-2 w-full md:w-auto">
          <input v-model="filters.startDate" @change="search" type="date" class="w-full md:w-auto px-3 py-2 bg-white border border-slate-200 focus:border-brand-500 rounded-lg text-sm font-medium outline-none shadow-sm" />
          <span class="text-slate-400 text-sm">a</span>
          <input v-model="filters.endDate" @change="search" type="date" class="w-full md:w-auto px-3 py-2 bg-white border border-slate-200 focus:border-brand-500 rounded-lg text-sm font-medium outline-none shadow-sm" />
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="glass-card rounded-2xl flex-1 flex flex-col overflow-hidden min-h-[400px]">
      <div class="overflow-x-auto custom-scrollbar flex-1">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <th class="px-6 py-4 rounded-tl-2xl">Folio</th>
              <th class="px-6 py-4">Colaborador</th>
              <th class="px-6 py-4">Categoría</th>
              <th class="px-6 py-4">Fecha</th>
              <th class="px-6 py-4">Plantel</th>
              <th class="px-6 py-4">Estado</th>
              <th class="px-6 py-4 text-right rounded-tr-2xl">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100/80">
            <tr v-if="pending" class="bg-white/50">
              <td colspan="7" class="px-6 py-12 text-center">
                <Loader2 class="w-8 h-8 animate-spin text-slate-300 mx-auto" />
              </td>
            </tr>
            <tr v-else-if="!passes.length" class="bg-white/50">
              <td colspan="7" class="px-6 py-12 text-center">
                <p class="text-slate-500 font-medium">No se encontraron registros que coincidan con la búsqueda.</p>
              </td>
            </tr>
            <tr v-else v-for="pass in passes" :key="pass.id" class="bg-white/60 hover:bg-white transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <NuxtLink :to="`/pass/${pass.id}`" class="font-mono text-sm font-black text-brand-700 hover:text-brand-900 tracking-tight transition-colors">
                    #{{ String(pass.id).padStart(5, '0') }}
                  </NuxtLink>
                  <span v-if="pass.processed" title="Sincronizado" class="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100">
                    <Check class="w-2.5 h-2.5 text-emerald-600" />
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm font-bold text-slate-800">{{ pass.employee_name }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-xs font-medium text-slate-600">{{ getCategoryName(pass.category_id) }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-600">{{ formatDate(pass.date) }}</span>
              </td>
              <td class="px-6 py-4">
                <span v-if="pass.plantel" class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">PL {{ pass.plantel }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-[10px] uppercase font-bold px-2 py-1 rounded border"
                      :class="pass.status === 'autorizado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                             (pass.status === 'cancelado' || pass.status === 'rechazado' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200')">
                  {{ pass.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <NuxtLink :to="`/pass/${pass.id}`" class="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Ver Detalles">
                    <Eye class="w-4 h-4" />
                  </NuxtLink>
                  <button v-if="user?.name === pass.user" @click="openEditModal(pass)" class="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Editar Rápidamente">
                    <Edit2 class="w-4 h-4" />
                  </button>
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
import { Search, Download, Edit2, Check, Loader2, Eye } from 'lucide-vue-next'
import PassExportModal from '~/components/PassExportModal.vue'
import PassEditModal from '~/components/PassEditModal.vue'
import dayjs from 'dayjs'

const { user } = useAuth()
const showExportModal = ref(false)
const selectedPass = ref(null)

const planteles = [
  'PT', 'PM', 'ST', 'SM', 'CT', 'CM', 'DM', 'CO', 'KT', 'KM',
  '4 - CT Fiscal', '3 - ST Fiscal', '8 - DM Fiscal', '2 - PT Fiscal', 
  '7 - CM Fiscal', '5 - PM Fiscal', '14 - CM Asimilados', '16 - ISM'
]

const filters = ref({
  q: '',
  plantel: '',
  startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD')
})

const passes = ref([])
const pending = ref(false)
let searchTimeout = null

const getCategoryName = (id) => {
  const map = { 1: 'Llegada Tarde', 2: 'Salida Anticipada', 3: 'Ausencia', 4: 'Cambio de Horario', 5: 'Incapacidad' }
  return map[id] || 'Otro'
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return dayjs(dateStr).format('DD/MM/YYYY')
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

onMounted(() => {
  search()
})
</script>