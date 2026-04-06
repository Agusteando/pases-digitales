<template>
  <div class="relative w-full">
    <div class="relative flex items-center group">
      <div class="absolute left-4 w-5 h-5 flex items-center justify-center text-slate-400 group-focus-within:text-brand-600 transition-colors pointer-events-none">
        <Search class="w-full h-full" />
      </div>
      <input 
        ref="searchInput"
        v-model="query" 
        @input="onInput"
        @focus="isFocused = true"
        @blur="onBlur"
        @keydown.down.prevent="navigateResults(1)"
        @keydown.up.prevent="navigateResults(-1)"
        @keydown.enter.prevent="selectHighlighted"
        placeholder="Nombre o apellidos del colaborador..."
        class="w-full pl-12 pr-12 py-4 bg-white/80 backdrop-blur-sm border-2 border-slate-200/80 focus:border-brand-500 focus:bg-white rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium outline-none transition-all shadow-sm"
        autocomplete="off"
        spellcheck="false"
      />
      <div class="absolute right-4 flex items-center">
        <Loader2 v-if="isSearching" class="w-5 h-5 animate-spin text-brand-500" />
        <button v-else-if="query" @click="clear" class="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 focus:outline-none p-1.5 rounded-full transition-colors">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Search Results Popover -->
    <transition name="fade">
      <div v-if="showResults" class="absolute top-full mt-3 w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-dropdown border border-slate-200/80 overflow-hidden z-50">
        <div v-if="results.length > 0" class="max-h-[320px] overflow-y-auto py-2 custom-scrollbar">
          <div v-for="(emp, idx) in results" :key="emp.id" 
               @mousedown.prevent="selectEmployee(emp)" 
               @mouseenter="highlightedIndex = idx"
               class="px-5 py-3 cursor-pointer flex items-center gap-4 transition-all relative"
               :class="highlightedIndex === idx ? 'bg-brand-50/50' : 'hover:bg-slate-50/80'">
            
            <div class="absolute left-0 top-0 bottom-0 w-1 rounded-r-full transition-colors" :class="highlightedIndex === idx ? 'bg-brand-500' : 'bg-transparent'"></div>

            <PremiumAvatar :src="emp.picture" :name="emp.name" size="sm" class="shrink-0 shadow-sm" :class="highlightedIndex === idx ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-brand-50' : ''" />
            
            <div class="flex-1 min-w-0">
              <p class="text-sm font-black text-slate-900 truncate" :class="{'text-brand-700': highlightedIndex === idx}">{{ emp.name }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <span v-if="emp.plantel" class="text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-100 px-1.5 py-0.5 rounded">{{ emp.plantel }}</span>
                <span v-if="emp.puesto" class="text-[11px] text-slate-500 font-medium truncate">{{ emp.puesto }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="!isSearching" class="px-6 py-10 text-center flex flex-col items-center gap-3">
          <div class="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
            <SearchX class="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <p class="text-sm font-black text-slate-700">Sin coincidencias</p>
            <p class="text-xs font-medium text-slate-500 mt-0.5">Intenta buscar por un apellido diferente.</p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, X, Loader2, SearchX } from 'lucide-vue-next'
import PremiumAvatar from '~/components/PremiumAvatar.vue'

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