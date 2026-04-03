<template>
  <div class="relative w-full">
    <div class="relative flex items-center">
      <Search class="absolute left-3 w-5 h-5 text-slate-400 pointer-events-none" />
      <input 
        ref="searchInput"
        v-model="query" 
        @input="onInput"
        @focus="isFocused = true"
        @blur="onBlur"
        @keydown.down.prevent="navigateResults(1)"
        @keydown.up.prevent="navigateResults(-1)"
        @keydown.enter.prevent="selectHighlighted"
        placeholder="Nombre o apellidos..."
        class="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-sm"
        autocomplete="off"
        spellcheck="false"
      />
      <div class="absolute right-3 flex items-center">
        <Loader2 v-if="isSearching" class="w-4 h-4 animate-spin text-brand-500" />
        <button v-else-if="query" @click="clear" class="text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md hover:bg-slate-100 transition-colors">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Search Results Popover -->
    <transition name="fade">
      <div v-if="showResults" class="absolute top-full mt-2 w-full bg-white rounded-xl shadow-dropdown border border-slate-200 overflow-hidden z-50">
        <div v-if="results.length > 0" class="max-h-[300px] overflow-y-auto py-1.5 custom-scrollbar">
          <div v-for="(emp, idx) in results" :key="emp.id" 
               @mousedown.prevent="selectEmployee(emp)" 
               @mouseenter="highlightedIndex = idx"
               class="px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-colors border-l-2"
               :class="highlightedIndex === idx ? 'bg-brand-50 border-brand-500' : 'hover:bg-slate-50 border-transparent'">
            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
              <User class="w-4 h-4 text-slate-500" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-slate-900 truncate" :class="{'text-brand-700': highlightedIndex === idx}">{{ emp.name }}</p>
              <p class="text-xs text-slate-500 font-medium truncate">Plantel {{ emp.plantel }}</p>
            </div>
          </div>
        </div>
        <div v-else-if="!isSearching" class="px-4 py-8 text-center flex flex-col items-center gap-2">
          <SearchX class="w-8 h-8 text-slate-300" />
          <p class="text-sm font-medium text-slate-500">No se encontraron coincidencias.</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, X, Loader2, User, SearchX } from 'lucide-vue-next'

const emit = defineEmits(['select'])

const query = ref('')
const results = ref([])
const isSearching = ref(false)
const isFocused = ref(false)
const highlightedIndex = ref(-1)
let searchTimeout = null

const showResults = computed(() => {
  return isFocused.value && query.value.trim().length >= 2
})

function onInput() {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (query.value.trim().length < 2) {
    results.value = []
    isSearching.value = false
    highlightedIndex.value = -1
    return
  }

  isSearching.value = true
  searchTimeout = setTimeout(async () => {
    try {
      const data = await $fetch('/api/employees/search', { params: { q: query.value.trim() } })
      results.value = data || []
      highlightedIndex.value = results.value.length > 0 ? 0 : -1
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
  highlightedIndex.value = -1
  if (searchTimeout) clearTimeout(searchTimeout)
}

function navigateResults(dir) {
  if (!showResults.value || results.value.length === 0) return
  highlightedIndex.value = (highlightedIndex.value + dir + results.value.length) % results.value.length
}

function selectHighlighted() {
  if (showResults.value && highlightedIndex.value >= 0 && results.value[highlightedIndex.value]) {
    selectEmployee(results.value[highlightedIndex.value])
  }
}
</script>