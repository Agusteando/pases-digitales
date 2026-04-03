<template>
  <div class="relative group">
    <div class="relative flex items-center">
      <Search class="absolute left-4 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
      <input 
        v-model="query"
        @input="debouncedSearch"
        placeholder="Buscar y agregar por nombre, email, RFC..."
        class="w-full pl-12 pr-12 py-3.5 bg-slate-100/80 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-slate-800 font-bold placeholder:font-medium placeholder:text-slate-400 transition-all shadow-sm outline-none"
      />
      <div class="absolute right-3 flex items-center gap-2">
        <button v-if="query" @click="clear" class="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
          <X class="w-4 h-4" />
        </button>
        <div v-else class="hidden md:flex px-2 py-1 bg-white rounded-md border border-slate-200 shadow-sm">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Cmd+K</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isSearching" class="absolute top-full mt-3 w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-6 flex flex-col items-center justify-center z-50">
      <Loader2 class="w-6 h-6 animate-spin text-blue-500 mb-2" />
      <span class="text-xs font-bold text-slate-400">Buscando en directorio...</span>
    </div>

    <!-- Dropdown Results -->
    <transition name="slide-up">
      <div v-if="!isSearching && results.length > 0" class="absolute top-full mt-3 w-full bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50">
        <div class="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <span class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Resultados</span>
          <span class="text-[10px] font-bold text-slate-400">{{ results.length }} encontrados</span>
        </div>
        <ul class="max-h-[300px] overflow-y-auto py-1 custom-scrollbar">
          <li 
            v-for="emp in results" 
            :key="emp.id || emp.name"
            @click="selectEmployee(emp)"
            class="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-4 transition-colors border-l-2 border-transparent hover:border-blue-500"
          >
            <img 
              :src="emp.picture || getFallbackAvatar(emp.name)" 
              @error="$event.target.src = getFallbackAvatar(emp.name)"
              class="w-10 h-10 rounded-full object-cover border border-slate-200 bg-white shadow-sm" 
              alt="Avatar" 
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-slate-800 truncate">{{ emp.name }}</p>
              <p class="text-xs text-slate-500 font-medium truncate">{{ emp.puesto || 'Sin puesto' }} &bull; {{ emp.plantelId || 'Sin plantel' }}</p>
            </div>
            <div class="shrink-0 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <PlusCircle class="w-5 h-5" />
            </div>
          </li>
        </ul>
      </div>
    </transition>
    
    <!-- No Results -->
    <div v-if="query.length >= 2 && results.length === 0 && !isSearching" class="absolute top-full mt-3 w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-6 text-center z-50">
      <UserX class="w-8 h-8 mx-auto text-slate-300 mb-2" />
      <p class="text-sm font-bold text-slate-700">Sin coincidencias</p>
      <p class="text-xs text-slate-500 mt-1">No se encontraron empleados activos con ese criterio.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search, X, Loader2, UserX, PlusCircle } from 'lucide-vue-next'

const emit = defineEmits(['select'])

const query = ref('')
const results = ref([])
const isSearching = ref(false)
let timeout = null

function getFallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f8fafc&color=475569`
}

function debouncedSearch() {
  if (timeout) clearTimeout(timeout)
  timeout = setTimeout(async () => {
    if (query.value.length < 2) {
      results.value = []
      isSearching.value = false
      return
    }
    
    isSearching.value = true
    try {
      results.value = await $fetch('/api/employees/search', { params: { q: query.value } })
    } catch (e) {
      console.error('Error searching employees', e)
      results.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
}

function selectEmployee(emp) {
  emit('select', emp)
  clear()
}

function clear() {
  query.value = ''
  results.value = []
}
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.2s ease-out; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(-10px); }
</style>