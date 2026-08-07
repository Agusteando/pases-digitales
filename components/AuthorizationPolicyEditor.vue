<template>
  <div class="mt-3 pt-3 border-t border-slate-100/80">
    <button
      type="button"
      class="w-full flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-slate-50 transition-colors outline-none"
      :disabled="loading || !ready || unavailable"
      @click="openEditor"
    >
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <ShieldCheck class="w-3.5 h-3.5 text-[#007F92] shrink-0" />
          <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Quién puede autorizar</span>
          <span v-if="sourceLabel" class="text-[8px] font-black uppercase tracking-widest text-[#007F92] bg-[#007F92]/10 rounded px-1.5 py-0.5">{{ sourceLabel }}</span>
        </div>
        <div v-if="loading" class="h-4 w-28 bg-slate-100 animate-pulse rounded mt-1.5"></div>
        <div v-else class="flex items-center gap-2 mt-1 min-w-0">
          <div v-if="effective?.isExclusive" class="flex -space-x-1.5 shrink-0">
            <PremiumAvatar
              v-for="target in (effective.targets || []).slice(0, 3)"
              :key="target.email"
              :src="target.photoUrl"
              :name="target.name"
              size="xs"
              class="ring-2 ring-white bg-white"
            />
          </div>
          <span class="text-xs font-black text-slate-700 truncate">{{ policyText }}</span>
        </div>
      </div>
      <ChevronRight class="w-4 h-4 text-slate-300 shrink-0" />
    </button>

    <Teleport to="body">
      <div v-if="open" class="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-6">
        <button class="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" aria-label="Cerrar" @click="closeEditor"></button>
        <section class="relative w-full sm:max-w-lg max-h-[88dvh] overflow-hidden bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-white flex flex-col">
          <header class="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-3">
            <PremiumAvatar :src="employee.picture" :name="employee.name" size="sm" class="ring-2 ring-white shadow-sm" />
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Quién puede autorizar</p>
              <h3 class="text-base font-black text-slate-900 truncate mt-0.5">{{ employee.name }}</h3>
            </div>
            <button type="button" class="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200" @click="closeEditor">
              <X class="w-4 h-4" />
            </button>
          </header>

          <div class="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5">
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="rounded-2xl border p-4 text-left transition-all"
                :class="mode === 'FALLBACK' ? 'border-[#007F92]/40 bg-[#007F92]/10 ring-1 ring-[#007F92]/10' : 'border-slate-200 bg-white hover:bg-slate-50'"
                @click="mode = 'FALLBACK'"
              >
                <div class="flex items-center justify-between gap-2">
                  <Users class="w-4 h-4" :class="mode === 'FALLBACK' ? 'text-[#007F92]' : 'text-slate-400'" />
                  <Check v-if="mode === 'FALLBACK'" class="w-4 h-4 text-[#007F92]" />
                </div>
                <p class="text-sm font-black text-slate-800 mt-3">{{ fallbackTitle }}</p>
                <p v-if="group?.isExclusive" class="text-[10px] font-bold text-slate-500 mt-1 truncate">{{ names(group.targets) }}</p>
              </button>

              <button
                type="button"
                class="rounded-2xl border p-4 text-left transition-all"
                :class="mode === 'PERSON' ? 'border-[#007F92]/40 bg-[#007F92]/10 ring-1 ring-[#007F92]/10' : 'border-slate-200 bg-white hover:bg-slate-50'"
                @click="mode = 'PERSON'"
              >
                <div class="flex items-center justify-between gap-2">
                  <UserCheck class="w-4 h-4" :class="mode === 'PERSON' ? 'text-[#007F92]' : 'text-slate-400'" />
                  <Check v-if="mode === 'PERSON'" class="w-4 h-4 text-[#007F92]" />
                </div>
                <p class="text-sm font-black text-slate-800 mt-3">Personas</p>
                <p class="text-[10px] font-bold text-slate-500 mt-1">{{ selected.length ? `${selected.length} seleccionada${selected.length === 1 ? '' : 's'}` : 'Elegir' }}</p>
              </button>
            </div>

            <div v-if="mode === 'PERSON'" class="space-y-3">
              <div v-if="selected.length" class="flex flex-wrap gap-2">
                <button
                  v-for="person in selected"
                  :key="person.email"
                  type="button"
                  class="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 hover:bg-red-50 hover:border-red-100 transition-colors"
                  @click="togglePerson(person)"
                >
                  <PremiumAvatar :src="person.photoUrl" :name="person.name" size="xs" />
                  <span class="text-[11px] font-black text-slate-700 max-w-[180px] truncate">{{ person.name }}</span>
                  <X class="w-3 h-3 text-slate-400" />
                </button>
              </div>

              <div class="relative">
                <Search class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  v-model="query"
                  type="text"
                  autocomplete="off"
                  placeholder="Buscar por nombre"
                  class="w-full h-12 pl-11 pr-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-[#007F92]/50 focus:ring-2 focus:ring-[#007F92]/10 outline-none text-sm font-bold text-slate-800"
                />
                <Loader2 v-if="searching" class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
              </div>

              <div v-if="results.length" class="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                <button
                  v-for="person in results"
                  :key="person.email"
                  type="button"
                  class="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 transition-colors"
                  @click="togglePerson(person)"
                >
                  <PremiumAvatar :src="person.photoUrl" :name="person.name" size="sm" class="shrink-0" />
                  <span class="text-sm font-black text-slate-800 truncate flex-1">{{ person.name }}</span>
                  <Check v-if="isSelected(person)" class="w-4 h-4 text-[#007F92] shrink-0" />
                  <span v-else class="w-5 h-5 rounded-full border border-slate-200 shrink-0"></span>
                </button>
              </div>
            </div>
          </div>

          <footer class="p-5 sm:p-6 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
            <button type="button" class="px-4 py-3 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-100" @click="closeEditor">Cancelar</button>
            <button
              type="button"
              :disabled="saving || (mode === 'PERSON' && !selected.length)"
              class="px-5 py-3 rounded-xl bg-[#007F92] text-white text-xs font-black shadow-sm hover:bg-[#006575] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              @click="save"
            >
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
              Guardar
            </button>
          </footer>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ShieldCheck, Search, X, Check, ChevronRight, UserCheck, Users, Loader2 } from 'lucide-vue-next'
import PremiumAvatar from '~/components/PremiumAvatar.vue'

const props = defineProps({
  employee: { type: Object, required: true }
})

const emit = defineEmits(['updated'])
const loading = ref(false)
const saving = ref(false)
const unavailable = ref(false)
const open = ref(false)
const effective = ref(null)
const group = ref(null)
const mode = ref('FALLBACK')
const selected = ref([])
const query = ref('')
const results = ref([])
const searching = ref(false)
let timer = null

const ready = computed(() => Boolean(props.employee?.curp || props.employee?.name) && !props.employee?._enriching)
const policyText = computed(() => unavailable.value ? 'No disponible' : (effective.value?.isExclusive ? names(effective.value.targets) : 'Cualquiera'))
const sourceLabel = computed(() => {
  if (!effective.value?.isExclusive) return ''
  if (effective.value.source === 'PERSON') return 'Individual'
  if (effective.value.source === 'PLANTEL_DEFAULT') return 'Plantel'
  return 'Puesto'
})
const fallbackTitle = computed(() => {
  if (!group.value?.isExclusive) return 'Cualquiera'
  return group.value.source === 'PLANTEL_DEFAULT' ? 'Regla de plantel' : 'Regla de puesto'
})

function names(targets = []) {
  return targets.map((target) => target.name).filter(Boolean).join(', ') || 'Cualquiera'
}

function employeePayload() {
  return {
    employeeName: props.employee?.name,
    curp: props.employee?.curp,
    plantel: props.employee?.plantelActual || props.employee?.plantelBase || props.employee?.plantel,
    puesto: props.employee?.puesto || ''
  }
}

async function refresh() {
  if (!ready.value) return
  loading.value = true
  unavailable.value = false
  try {
    const data = await $fetch('/api/authorizations/preview', { method: 'POST', body: employeePayload() })
    effective.value = data.effective
    group.value = data.group
  } catch (error) {
    unavailable.value = true
    console.warn('Authorization preview failed', error)
  } finally {
    loading.value = false
  }
}

function openEditor() {
  if (!ready.value) return
  mode.value = effective.value?.source === 'PERSON' ? 'PERSON' : 'FALLBACK'
  selected.value = effective.value?.source === 'PERSON'
    ? (effective.value.targets || []).map((target) => ({ ...target }))
    : []
  query.value = ''
  results.value = []
  open.value = true
}

function closeEditor() {
  if (saving.value) return
  open.value = false
}

function isSelected(person) {
  return selected.value.some((item) => item.email === person.email)
}

function togglePerson(person) {
  if (isSelected(person)) {
    selected.value = selected.value.filter((item) => item.email !== person.email)
  } else {
    selected.value = [...selected.value, {
      email: person.email,
      name: person.name,
      photoUrl: person.photoUrl || null,
      phone: person.phone || '',
      channels: person.channels?.length ? person.channels : ['EMAIL']
    }]
  }
}

watch(query, (value) => {
  if (timer) clearTimeout(timer)
  const q = String(value || '').trim()
  if (q.length < 2) {
    results.value = []
    searching.value = false
    return
  }
  timer = setTimeout(async () => {
    searching.value = true
    try {
      results.value = await $fetch('/api/workspace/search', { query: { q } })
    } catch {
      results.value = []
    } finally {
      searching.value = false
    }
  }, 220)
})

async function save() {
  if (saving.value) return
  saving.value = true
  try {
    await $fetch('/api/authorizations/person', {
      method: 'POST',
      body: {
        mode: 'replace',
        curp: props.employee?.curp,
        employeeName: props.employee?.name,
        authorizers: mode.value === 'PERSON'
          ? selected.value.map((person) => ({
              email: person.email,
              phone: person.phone || '',
              channels: person.channels?.length ? person.channels : ['EMAIL']
            }))
          : []
      }
    })
    await refresh()
    open.value = false
    emit('updated', effective.value)
  } catch (error) {
    alert(error?.data?.message || 'No se pudo actualizar la autorización.')
  } finally {
    saving.value = false
  }
}

watch(() => [props.employee?.curp, props.employee?.name, props.employee?.plantelActual, props.employee?.puesto, props.employee?._enriching], refresh, { immediate: true })
</script>
