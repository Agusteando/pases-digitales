<template>
  <div class="relative w-full">
    <div class="relative flex items-center group">
      <div class="absolute left-5 w-5 h-5 flex items-center justify-center text-slate-400 group-focus-within:text-[#007F92] transition-colors pointer-events-none">
        <Search class="w-full h-full" />
      </div>
      <input 
        ref="searchInput"
        v-model="query" 
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown.down.prevent="navigateResults(1)"
        @keydown.up.prevent="navigateResults(-1)"
        @keydown.enter.prevent="selectHighlighted"
        placeholder="Buscar colaborador..."
        class="w-full pl-14 pr-14 py-4 bg-white/80 backdrop-blur-sm border-2 border-white focus:border-[#007F92]/60 focus:bg-white rounded-[1.5rem] text-base sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-sm"
        autocomplete="off"
        spellcheck="false"
      />
      <div class="absolute right-4 flex items-center">
        <Loader2 v-if="isSearching" class="w-5 h-5 animate-spin text-[#007F92]" />
        <button v-else-if="query" @click="clear(true)" class="text-slate-400 hover:text-red-500 bg-white shadow-sm hover:shadow-md p-1.5 rounded-full transition-all focus:outline-none outline-none">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Search Results Dedicated Block -->
    <transition name="fade">
      <div v-if="showResults" class="mt-3 w-full bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-sm border border-white/60 overflow-hidden relative">
        <div v-if="results.length > 0" class="max-h-[320px] overflow-y-auto py-2 custom-scrollbar">
          <div v-for="(emp, idx) in results" :key="emp.id" 
               @mousedown.prevent="selectEmployee(emp)" 
               @mouseenter="highlightedIndex = idx"
               class="px-5 py-4 cursor-pointer flex items-center gap-4 transition-all relative"
               :class="highlightedIndex === idx ? 'bg-[#007F92]/10' : 'hover:bg-white/80'">
            
            <div class="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full transition-colors" :class="highlightedIndex === idx ? 'bg-[#007F92]' : 'bg-transparent'"></div>

            <PremiumAvatar :src="emp.picture" :name="emp.name" size="sm" class="shrink-0 shadow-sm border border-white" :class="highlightedIndex === idx ? 'ring-2 ring-[#007F92] ring-offset-1 ring-offset-transparent' : ''" />
            
            <div class="flex-1 min-w-0">
              <p class="text-sm font-black text-slate-900 truncate" :class="{'text-[#006575]': highlightedIndex === idx}">{{ emp.name }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span v-if="emp.plantel" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded-md shadow-sm border border-white/60">{{ emp.plantel }}</span>
                <span v-if="emp.puesto" class="text-[11px] text-slate-500 font-medium truncate">{{ emp.puesto }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="!isSearching" class="px-6 py-10 text-center flex flex-col items-center gap-3">
          <div class="w-14 h-14 bg-white/80 rounded-full flex items-center justify-center border border-white shadow-sm">
            <SearchX class="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <p class="text-sm font-black text-slate-700">Sin coincidencias</p>
            <p class="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Verifica la ortografía de los apellidos.</p>
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

const searchInput = ref(null)
const query = ref('')
const results = ref([])
const isSearching = ref(false)
const isFocused = ref(false)
const highlightedIndex = ref(-1)
let searchTimeout = null

const showResults = computed(() => {
  return isFocused.value && query.value.trim().length >= 2
})

function onFocus() {
  isFocused.value = true
  if (query.value.trim().length >= 2) {
    onInput()
  }
}

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
  }, 200)
}

function selectEmployee(emp) {
  emit('select', emp)
  // Pasar true mantiene la sincronización entre el estado de Vue y el navegador
  // logrando la experiencia de adición múltiple continua.
  clear(true)
}

function clear(keepFocus = false) {
  query.value = ''
  results.value = []
  isSearching.value = false
  highlightedIndex.value = -1
  if (searchTimeout) clearTimeout(searchTimeout)
  
  if (keepFocus) {
    isFocused.value = true
    setTimeout(() => {
      searchInput.value?.focus()
    }, 10)
  } else {
    isFocused.value = false
    searchInput.value?.blur()
  }
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