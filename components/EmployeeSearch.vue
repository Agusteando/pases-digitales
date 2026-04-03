<template>
  <div class="relative">
    <div class="relative flex items-center">
      <SearchIcon class="absolute left-3 w-5 h-5 text-slate-400" />
      <input 
        v-model="query"
        @input="debouncedSearch"
        placeholder="Buscar por nombre, email, RFC..."
        class="w-full pl-10 pr-4 py-3 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-blue-500 rounded-xl text-slate-800 font-medium transition-colors"
      />
      <button v-if="modelValue" @click="clear" class="absolute right-3 text-slate-400 hover:text-slate-600">
        <XCircleIcon class="w-5 h-5" />
      </button>
    </div>

    <!-- Dropdown -->
    <div v-if="results.length > 0 && !modelValue" class="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
      <ul class="max-h-64 overflow-y-auto py-2">
        <li 
          v-for="emp in results" 
          :key="emp.id"
          @click="selectEmployee(emp)"
          class="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-4 transition-colors"
        >
          <img :src="emp.picture || '/img/default-avatar.png'" class="w-10 h-10 rounded-full object-cover border border-slate-200" />
          <div>
            <p class="text-sm font-semibold text-slate-800">{{ emp.name }}</p>
            <p class="text-xs text-slate-500">{{ emp.puesto }} &bull; {{ emp.plantelId }}</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { SearchIcon, XCircleIcon } from 'lucide-vue-next'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const query = ref('')
const results = ref([])
let timeout = null

function debouncedSearch() {
  if (timeout) clearTimeout(timeout)
  timeout = setTimeout(async () => {
    if (query.value.length < 2) {
      results.value = []
      return
    }
    results.value = await $fetch('/api/employees/search', { params: { q: query.value } })
  }, 200)
}

function selectEmployee(emp) {
  emit('update:modelValue', emp)
  query.value = emp.name
  results.value = []
}

function clear() {
  emit('update:modelValue', null)
  query.value = ''
}
</script>