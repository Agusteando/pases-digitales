<template>
  <div class="relative group">
    <div class="relative flex items-center">
      <Search class="absolute left-4 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
      <input 
        v-model="query" @input="debouncedSearch"
        placeholder="Buscar por nombre o apellido..."
        class="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-2xl text-slate-800 font-bold placeholder:font-medium placeholder:text-slate-400 transition-all outline-none"
      />
      <div class="absolute right-3 flex items-center gap-2">
        <button v-if="query" @click="clear" class="p-1 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Dropdown Results -->
    <transition name="slide-up">
      <div v-if="!isSearching && results.length > 0" class="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
        <ul class="max-h-[300px] overflow-y-auto py-2 custom-scrollbar">
          <li v-for="emp in results" :key="emp.id" @click="selectEmployee(emp)" class="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors border-l-2 border-transparent hover:border-slate-900 group">
            <div class="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0">
              <User class="w-5 h-5" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-slate-800 truncate">{{ emp.name }}</p>
              <p class="text-xs text-slate-500 font-medium truncate">Plantel {{ emp.plantel }}</p>
            </div>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search, X, User } from 'lucide-vue-next'

const emit = defineEmits(['select'])
const query = ref('')
const results = ref([])
const isSearching = ref(false)
let timeout = null

function debouncedSearch() {
  if (timeout) clearTimeout(timeout)
  timeout = setTimeout(async () => {
    if (query.value.length < 2) return clear()
    isSearching.value = true
    try {
      results.value = await $fetch('/api/employees/search', { params: { q: query.value } })
    } finally {
      isSearching.value = false
    }
  }, 200)
}

function selectEmployee(emp) {
  emit('select', emp)
  clear()
}

function clear() { query.value = ''; results.value = [] }
</script>