<template>
  <div class="relative">
    <div class="relative flex items-center">
      <Search class="absolute left-3 w-5 h-5 text-slate-400" />
      <input 
        v-model="query"
        @input="debouncedSearch"
        placeholder="Buscar y agregar por nombre, email, RFC..."
        class="w-full pl-10 pr-10 py-3 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-slate-800 font-medium transition-all shadow-sm"
      />
      <button v-if="query" @click="clear" class="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors">
        <XCircle class="w-5 h-5" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isSearching" class="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 p-4 flex justify-center z-50">
      <Loader2 class="w-6 h-6 animate-spin text-blue-500" />
    </div>

    <!-- Dropdown Results -->
    <div v-else-if="results.length > 0" class="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
      <ul class="max-h-64 overflow-y-auto py-2">
        <li 
          v-for="emp in results" 
          :key="emp.id || emp.name"
          @click="selectEmployee(emp)"
          class="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-4 transition-colors"
        >
          <img 
            :src="emp.picture || getFallbackAvatar(emp.name)" 
            @error="$event.target.src = getFallbackAvatar(emp.name)"
            class="w-10 h-10 rounded-full object-cover border border-slate-200 bg-slate-100" 
            alt="Avatar" 
          />
          <div>
            <p class="text-sm font-semibold text-slate-800">{{ emp.name }}</p>
            <p class="text-xs text-slate-500">{{ emp.puesto || 'Sin puesto' }} &bull; {{ emp.plantelId || 'Sin plantel' }}</p>
          </div>
        </li>
      </ul>
    </div>
    
    <!-- No Results -->
    <div v-else-if="query.length >= 2 && results.length === 0 && !isSearching" class="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 p-4 text-center z-50">
      <p class="text-sm text-slate-500">No se encontraron empleados activos con ese criterio.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search, XCircle, Loader2 } from 'lucide-vue-next'

const emit = defineEmits(['select'])

const query = ref('')
const results = ref([])
const isSearching = ref(false)
let timeout = null

function getFallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f1f5f9&color=64748b`
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