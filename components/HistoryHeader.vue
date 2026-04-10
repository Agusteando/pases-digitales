<template>
  <div class="flex flex-col gap-6 shrink-0 relative z-20 mb-8">
    <!-- Top Row: Title & Export -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Historial</h1>
        <p class="text-slate-500 mt-2 text-sm font-bold">Consulta y exportación de registros operativos.</p>
      </div>
      <button @click="$emit('export')" class="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-black rounded-xl shadow-sm hover:border-brand-300 hover:text-brand-600 hover:shadow transition-all flex items-center justify-center gap-2 outline-none">
        <Download class="w-4 h-4" />
        <span>Exportar reporte</span>
      </button>
    </div>

    <!-- Bottom Row: Unified Toolbar -->
    <div class="bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row gap-2 items-stretch">
      
      <!-- Search Input -->
      <div class="flex-1 relative flex items-center bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-colors border border-transparent focus-within:border-brand-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-50">
        <Search class="absolute left-3.5 w-4 h-4 text-slate-400" />
        <input 
          :value="filters.q"
          @input="updateField('q', $event.target.value)"
          type="text" 
          placeholder="Buscar por folio o colaborador..." 
          class="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 placeholder:font-medium"
        />
      </div>

      <div class="hidden lg:block w-px bg-slate-200 my-2"></div>

      <!-- Plantel Select -->
      <div class="w-full lg:w-64 relative flex items-center bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-colors border border-transparent focus-within:border-brand-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-50">
        <Building2 class="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        <select 
          :value="filters.plantel"
          @change="updateField('plantel', $event.target.value)"
          class="w-full pl-10 pr-10 py-2.5 bg-transparent text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer"
        >
          <option value="">Toda la institución</option>
          <option v-for="p in planteles" :key="p" :value="p">{{ p }}</option>
        </select>
        <ChevronDown class="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>

      <div class="hidden lg:block w-px bg-slate-200 my-2"></div>

      <!-- Dates -->
      <div class="flex items-center gap-2 w-full lg:w-auto bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-colors border border-transparent px-3 focus-within:border-brand-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-50">
        <Calendar class="w-4 h-4 text-slate-400 shrink-0" />
        <input 
          :value="filters.startDate"
          @change="updateField('startDate', $event.target.value)"
          type="date" 
          class="w-full lg:w-auto py-2.5 bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer" 
        />
        <span class="text-slate-300 font-bold px-1">a</span>
        <input 
          :value="filters.endDate"
          @change="updateField('endDate', $event.target.value)"
          type="date" 
          class="w-full lg:w-auto py-2.5 bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer" 
        />
      </div>

    </div>
  </div>
</template>

<script setup>
import { Download, Search, Building2, Calendar, ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  filters: { type: Object, required: true },
  planteles: { type: Array, required: true }
})

const emit = defineEmits(['update:filters', 'search', 'export'])

function updateField(key, value) {
  const newFilters = { ...props.filters, [key]: value }
  emit('update:filters', newFilters)
  if (key !== 'q') {
    emit('search')
  }
}
</script>