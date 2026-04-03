<template>
  <div class="relative w-full">
    <div class="relative flex items-center">
      <Search class="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
      <input 
        v-model="query" 
        @input="onInput"
        @focus="isFocused = true"
        @blur="onBlur"
        placeholder="Nombre o apellido del colaborador..."
        class="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-shadow shadow-sm"
        autocomplete="off"
        spellcheck="false"
      />
      <div class="absolute right-3 flex items-center">
        <Loader2 v-if="isSearching" class="w-4 h-4 animate-spin text-slate-400" />
        <button v-else-if="query" @click="clear" class="text-slate-400 hover:text-slate-600 focus:outline-none">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div v-if="showResults" class="absolute top-full mt-1 w-full bg-white rounded-lg shadow-dropdown border border-slate-200 overflow-hidden z-50">
      <div v-if="results.length > 0" class="max-h-[280px] overflow-y-auto py-1 custom-scrollbar">
        <div v-for="emp in results" :key="emp.id" @mousedown.prevent="selectEmployee(emp)" class="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-900 truncate">{{ emp.name }}</p>
            <p class="text-xs text-slate-500 truncate">Plantel {{ emp.plantel }}</p>
          </div>
        </div>
      </div>
      <div v-else-if="!isSearching" class="px-4 py-6 text-center text-sm text-slate-500">
        No se encontraron coincidencias en la plantilla.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, X, Loader2 } from 'lucide-vue-next'

const emit = defineEmits(['select'])

const query = ref('')
const results = ref([])
const isSearching = ref(false)
const isFocused = ref(false)
let searchTimeout = null

const showResults = computed(() => {
  return isFocused.value && query.value.trim().length >= 2
})

function onInput() {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (query.value.trim().length < 2) {
    results.value = []
    isSearching.value = false
    return
  }

  isSearching.value = true
  searchTimeout = setTimeout(async () => {
    try {
      const data = await $fetch('/api/employees/search', { params: { q: query.value.trim() } })
      results.value = data || []
    } catch (e) {
      results.value = []
    } finally {
      isSearching.value = false
    }
  }, 250)
}

function onBlur() {
  setTimeout(() => {
    isFocused.value = false
  }, 150)
}

function selectEmployee(emp) {
  emit('select', emp)
  clear()
}

function clear() {
  query.value = ''
  results.value = []
  isSearching.value = false
  isFocused.value = false
  if (searchTimeout) clearTimeout(searchTimeout)
}
</script>