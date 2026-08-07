<template>
  <div class="min-h-screen bg-slate-50/60">
    <div class="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">Autorizaciones</h1>
        </div>
        <button
          v-if="activeView === 'AUTHORIZER'"
          type="button"
          class="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-[#007F92] hover:bg-[#006575] text-white text-xs font-black shadow-sm transition-colors"
          @click="openNewAuthorizer"
        >
          <Plus class="w-4 h-4" /> Autorizador
        </button>
      </header>

      <div class="inline-flex p-1 rounded-xl bg-white border border-slate-200 shadow-sm mb-5">
        <button
          type="button"
          class="px-4 py-2.5 rounded-lg text-xs font-black transition-all"
          :class="activeView === 'AUTHORIZER' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'"
          @click="switchToAuthorizer"
        >Por autorizador</button>
        <button
          type="button"
          class="px-4 py-2.5 rounded-lg text-xs font-black transition-all"
          :class="activeView === 'GROUP' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'"
          @click="switchToGroup"
        >Por grupo</button>
      </div>

      <section v-if="activeView === 'AUTHORIZER'" class="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-4 min-h-[650px]">
        <aside class="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[520px]">
          <div class="p-4 border-b border-slate-100">
            <div class="relative">
              <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input v-model="authorizerSearch" type="text" placeholder="Buscar" class="w-full h-10 pl-10 pr-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-[#007F92]/40 focus:ring-2 focus:ring-[#007F92]/10 text-sm font-bold" />
            </div>
          </div>

          <div v-if="authorizersLoading" class="flex-1 flex items-center justify-center">
            <Loader2 class="w-6 h-6 animate-spin text-slate-300" />
          </div>
          <div v-else-if="!filteredAuthorizers.length" class="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <UserCheck class="w-7 h-7 text-slate-300" />
            <p class="text-sm font-black text-slate-500 mt-3">Sin autorizadores</p>
          </div>
          <div v-else class="p-2 overflow-y-auto custom-scrollbar">
            <button
              v-for="authorizer in filteredAuthorizers"
              :key="authorizer.email"
              type="button"
              class="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all mb-1"
              :class="selectedAuthorizerEmail === authorizer.email ? 'bg-[#007F92]/10 ring-1 ring-[#007F92]/15' : 'hover:bg-slate-50'"
              @click="selectedAuthorizerEmail = authorizer.email"
            >
              <PremiumAvatar :src="authorizer.photoUrl" :name="authorizer.name" size="sm" class="shrink-0 ring-2 ring-white shadow-sm" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-black text-slate-900 truncate">{{ authorizer.name }}</p>
                <p class="text-[10px] font-bold text-slate-400 mt-0.5">{{ authorizer.scopes.length }} alcance{{ authorizer.scopes.length === 1 ? '' : 's' }}</p>
              </div>
              <ChevronRight class="w-4 h-4 shrink-0" :class="selectedAuthorizerEmail === authorizer.email ? 'text-[#007F92]' : 'text-slate-300'" />
            </button>
          </div>
        </aside>

        <main class="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm min-h-[520px] overflow-hidden">
          <div v-if="selectedAuthorizer" class="h-full flex flex-col">
            <div class="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3 min-w-0">
                <PremiumAvatar :src="selectedAuthorizer.photoUrl" :name="selectedAuthorizer.name" size="lg" class="shrink-0 ring-4 ring-slate-50 shadow-sm" />
                <div class="min-w-0">
                  <h2 class="text-xl font-black text-slate-950 truncate">{{ selectedAuthorizer.name }}</h2>
                  <div class="flex items-center gap-2 mt-1.5">
                    <Mail v-if="authorizerChannels.includes('EMAIL')" class="w-3.5 h-3.5 text-slate-400" />
                    <MessageCircle v-if="authorizerChannels.includes('WHATSAPP')" class="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>
              <button type="button" class="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-950 text-white text-xs font-black hover:bg-slate-800" @click="openScope(selectedAuthorizer)">
                <Plus class="w-4 h-4" /> Alcance
              </button>
            </div>

            <div class="p-5 sm:p-6 overflow-y-auto custom-scrollbar">
              <div v-if="!selectedAuthorizer.scopes.length" class="min-h-[340px] flex items-center justify-center">
                <button type="button" class="px-4 py-3 rounded-xl border border-dashed border-slate-300 text-xs font-black text-slate-500 hover:border-[#007F92]/40 hover:text-[#007F92]" @click="openScope(selectedAuthorizer)">
                  <Plus class="w-4 h-4 inline-block mr-1.5 -mt-0.5" /> Alcance
                </button>
              </div>

              <div v-else class="space-y-6">
                <div v-for="group in selectedScopeGroups" :key="group.type" v-show="group.items.length">
                  <div class="flex items-center gap-2 mb-2.5 px-1">
                    <component :is="group.icon" class="w-4 h-4 text-slate-400" />
                    <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ group.label }}</h3>
                    <span class="text-[10px] font-black text-slate-300">{{ group.items.length }}</span>
                  </div>
                  <div class="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                    <div v-for="scope in group.items" :key="scope.key" class="flex items-center gap-3 px-4 py-3.5 group/scope hover:bg-slate-50/70 transition-colors">
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-black text-slate-800 truncate">{{ scope.label }}</p>
                        <p v-if="scope.context" class="text-[10px] font-bold text-slate-400 mt-0.5 truncate">{{ scope.context }}</p>
                      </div>
                      <div class="flex items-center gap-1.5 text-slate-300">
                        <Mail v-if="scope.channels.includes('EMAIL')" class="w-3.5 h-3.5" />
                        <MessageCircle v-if="scope.channels.includes('WHATSAPP')" class="w-3.5 h-3.5" />
                      </div>
                      <button type="button" class="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/scope:opacity-100 transition-all" @click="removeScope(scope)">
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="h-full min-h-[520px] flex items-center justify-center">
            <ShieldCheck class="w-8 h-8 text-slate-200" />
          </div>
        </main>
      </section>

      <AuthorizationGroupView v-else @changed="loadAuthorizers" />
    </div>

    <!-- Workspace person picker -->
    <div v-if="newAuthorizerOpen" class="fixed inset-0 z-[160] flex items-end sm:items-center justify-center sm:p-6">
      <button class="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" aria-label="Cerrar" @click="newAuthorizerOpen = false"></button>
      <section class="relative w-full sm:max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-white overflow-hidden">
        <header class="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 class="text-base font-black text-slate-900">Autorizador</h2>
          <button class="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500" @click="newAuthorizerOpen = false"><X class="w-4 h-4" /></button>
        </header>
        <div class="p-5 space-y-3">
          <div class="relative">
            <Search class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input v-model="newAuthorizerQuery" autofocus type="text" placeholder="Buscar por nombre" class="w-full h-12 pl-11 pr-10 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#007F92]/40 text-sm font-bold" />
            <Loader2 v-if="newAuthorizerSearching" class="w-4 h-4 animate-spin absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <div v-if="newAuthorizerResults.length" class="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            <button v-for="person in newAuthorizerResults" :key="person.email" type="button" class="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left" @click="chooseNewAuthorizer(person)">
              <PremiumAvatar :src="person.photoUrl" :name="person.name" size="sm" />
              <span class="text-sm font-black text-slate-800 truncate">{{ person.name }}</span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Add scope -->
    <div v-if="scopeOpen" class="fixed inset-0 z-[170] flex items-end sm:items-center justify-center sm:p-6">
      <button class="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]" aria-label="Cerrar" @click="closeScope"></button>
      <section class="relative w-full sm:max-w-xl max-h-[90dvh] bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-white overflow-hidden flex flex-col">
        <header class="p-5 border-b border-slate-100 flex items-center gap-3">
          <PremiumAvatar :src="scopeAuthorizer?.photoUrl" :name="scopeAuthorizer?.name" size="sm" />
          <h2 class="text-base font-black text-slate-900 truncate flex-1">{{ scopeAuthorizer?.name }}</h2>
          <button class="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500" @click="closeScope"><X class="w-4 h-4" /></button>
        </header>
        <div class="p-5 overflow-y-auto custom-scrollbar space-y-5">
          <div class="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
            <button v-for="option in scopeTypes" :key="option.value" type="button" class="py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all" :class="scopeType === option.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'" @click="setScopeType(option.value)">{{ option.label }}</button>
          </div>

          <div v-if="scopeType === 'PERSON'" class="space-y-3">
            <div v-if="scopePerson" class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <PremiumAvatar :src="scopePerson.picture" :name="scopePerson.name" size="sm" />
              <span class="text-sm font-black text-slate-800 truncate flex-1">{{ scopePerson.name }}</span>
              <button type="button" class="w-8 h-8 rounded-lg hover:bg-white text-slate-400 flex items-center justify-center" @click="scopePerson = null"><X class="w-4 h-4" /></button>
            </div>
            <template v-else>
              <div class="relative">
                <Search class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input v-model="scopePersonQuery" type="text" placeholder="Buscar colaborador" class="w-full h-12 pl-11 pr-10 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#007F92]/40 text-sm font-bold" />
                <Loader2 v-if="scopePersonSearching" class="w-4 h-4 animate-spin absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <div v-if="scopePersonResults.length" class="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                <button v-for="person in scopePersonResults" :key="person.curp || person.name" type="button" class="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left" @click="scopePerson = person">
                  <div class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"><UserCheck class="w-4 h-4 text-slate-400" /></div>
                  <div class="min-w-0"><p class="text-sm font-black text-slate-800 truncate">{{ person.name }}</p><p class="text-[10px] font-bold text-slate-400 truncate">{{ person.plantel }}</p></div>
                </button>
              </div>
            </template>
          </div>

          <div v-else-if="scopeType === 'PLANTEL'" class="space-y-2">
            <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Plantel</label>
            <select v-model="scopePlantel" class="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#007F92]/40 text-sm font-black text-slate-800">
              <option value="">Seleccionar</option>
              <option v-for="plantel in catalogs.planteles" :key="plantel" :value="plantel">{{ plantel }}</option>
            </select>
          </div>

          <div v-else class="grid sm:grid-cols-2 gap-3">
            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Plantel</label>
              <select v-model="scopePlantel" class="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#007F92]/40 text-sm font-black text-slate-800">
                <option value="ALL">Todos</option>
                <option v-for="plantel in catalogs.planteles" :key="plantel" :value="plantel">{{ plantel }}</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Puesto</label>
              <select v-model="scopePuesto" class="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-[#007F92]/40 text-sm font-black text-slate-800">
                <option value="">Seleccionar</option>
                <option v-for="puesto in catalogs.puestos" :key="puesto" :value="puesto">{{ puesto }}</option>
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Avisos</label>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="h-11 rounded-xl border text-xs font-black flex items-center justify-center gap-2" :class="scopeChannels.includes('EMAIL') ? 'bg-[#007F92]/10 border-[#007F92]/25 text-[#007F92]' : 'bg-white border-slate-200 text-slate-400'" @click="toggleScopeChannel('EMAIL')"><Mail class="w-4 h-4" /> Email</button>
              <button type="button" class="h-11 rounded-xl border text-xs font-black flex items-center justify-center gap-2" :class="scopeChannels.includes('WHATSAPP') ? 'bg-[#007F92]/10 border-[#007F92]/25 text-[#007F92]' : 'bg-white border-slate-200 text-slate-400'" @click="toggleScopeChannel('WHATSAPP')"><MessageCircle class="w-4 h-4" /> WhatsApp</button>
            </div>
            <input v-if="scopeChannels.includes('WHATSAPP') && !scopeAuthorizerPhone" v-model="scopePhone" @input="scopePhone = scopePhone.replace(/\D/g, '').slice(0,10)" maxlength="10" type="tel" placeholder="10 dígitos" class="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm font-bold" />
          </div>
        </div>
        <footer class="p-5 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" class="px-4 py-3 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-100" @click="closeScope">Cancelar</button>
          <button type="button" :disabled="saving || !scopeValid" class="px-5 py-3 rounded-xl bg-[#007F92] text-white text-xs font-black disabled:opacity-50 flex items-center gap-2" @click="saveScope"><Loader2 v-if="saving" class="w-4 h-4 animate-spin" /> Guardar</button>
        </footer>
      </section>
    </div>


  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ShieldCheck, Plus, Search, Loader2, UserCheck, Building2, Briefcase, Mail, MessageCircle, X, Trash2, ChevronRight } from 'lucide-vue-next'
import PremiumAvatar from '~/components/PremiumAvatar.vue'
import AuthorizationGroupView from '~/components/AuthorizationGroupView.vue'

const activeView = ref('AUTHORIZER')
const authorizersLoading = ref(true)
const authorizers = ref([])
const authorizerSearch = ref('')
const selectedAuthorizerEmail = ref('')
const saving = ref(false)


const catalogs = reactive({ planteles: [], puestos: [] })

const filteredAuthorizers = computed(() => {
  const q = authorizerSearch.value.trim().toLowerCase()
  return q ? authorizers.value.filter((item) => item.name.toLowerCase().includes(q)) : authorizers.value
})
const selectedAuthorizer = computed(() => filteredAuthorizers.value.find((item) => item.email === selectedAuthorizerEmail.value) || filteredAuthorizers.value[0] || null)
watch(filteredAuthorizers, (items) => {
  if (!items.some((item) => item.email === selectedAuthorizerEmail.value)) {
    selectedAuthorizerEmail.value = items[0]?.email || ''
  }
})
const authorizerChannels = computed(() => Array.from(new Set((selectedAuthorizer.value?.scopes || []).flatMap((scope) => scope.channels || []))))
const selectedScopeGroups = computed(() => {
  const scopes = selectedAuthorizer.value?.scopes || []
  return [
    { type: 'PERSON', label: 'Personas', icon: UserCheck, items: scopes.filter((scope) => scope.type === 'PERSON') },
    { type: 'PLANTEL', label: 'Planteles', icon: Building2, items: scopes.filter((scope) => scope.type === 'PLANTEL') },
    { type: 'PUESTO', label: 'Puestos', icon: Briefcase, items: scopes.filter((scope) => scope.type === 'PUESTO') }
  ]
})

async function loadAuthorizers() {
  authorizersLoading.value = true
  try {
    authorizers.value = await $fetch('/api/authorizations/authorizers')
    if (!authorizers.value.some((item) => item.email === selectedAuthorizerEmail.value)) {
      selectedAuthorizerEmail.value = authorizers.value[0]?.email || ''
    }
  } catch (error) {
    alert(error?.data?.message || 'No se pudieron cargar las autorizaciones.')
  } finally {
    authorizersLoading.value = false
  }
}

async function loadCatalogs() {
  const [planteles, puestos] = await Promise.all([
    $fetch('/api/catalogs/planteles').catch(() => []),
    $fetch('/api/catalogs/puestos').catch(() => [])
  ])
  catalogs.planteles = Array.isArray(planteles) ? planteles : (planteles?.planteles || [])
  catalogs.puestos = Array.isArray(puestos) ? puestos : (puestos?.puestos || [])
}

function switchToGroup() { activeView.value = 'GROUP' }
function switchToAuthorizer() { activeView.value = 'AUTHORIZER'; loadAuthorizers() }

const newAuthorizerOpen = ref(false)
const newAuthorizerQuery = ref('')
const newAuthorizerResults = ref([])
const newAuthorizerSearching = ref(false)
let newAuthorizerTimer = null

function openNewAuthorizer() { newAuthorizerQuery.value = ''; newAuthorizerResults.value = []; newAuthorizerOpen.value = true }
watch(newAuthorizerQuery, (value) => {
  if (newAuthorizerTimer) clearTimeout(newAuthorizerTimer)
  const q = value.trim()
  if (q.length < 2) { newAuthorizerResults.value = []; return }
  newAuthorizerTimer = setTimeout(async () => {
    newAuthorizerSearching.value = true
    try { newAuthorizerResults.value = await $fetch('/api/workspace/search', { query: { q } }) } catch { newAuthorizerResults.value = [] } finally { newAuthorizerSearching.value = false }
  }, 220)
})
function chooseNewAuthorizer(person) { newAuthorizerOpen.value = false; openScope(person) }

const scopeOpen = ref(false)
const scopeAuthorizer = ref(null)
const scopeType = ref('PERSON')
const scopeTypes = [
  { value: 'PERSON', label: 'Persona' },
  { value: 'PLANTEL', label: 'Plantel' },
  { value: 'PUESTO', label: 'Puesto' }
]
const scopePersonQuery = ref('')
const scopePersonResults = ref([])
const scopePersonSearching = ref(false)
const scopePerson = ref(null)
const scopePlantel = ref('')
const scopePuesto = ref('')
const scopeChannels = ref(['EMAIL'])
const scopePhone = ref('')
let personTimer = null

const scopeAuthorizerPhone = computed(() => String(scopeAuthorizer.value?.phone || '').replace(/\D/g, '').slice(-10))
const scopeValid = computed(() => {
  if (!scopeAuthorizer.value?.email || !scopeChannels.value.length) return false
  if (scopeChannels.value.includes('WHATSAPP') && !(scopeAuthorizerPhone.value || scopePhone.value).match(/^\d{10}$/)) return false
  if (scopeType.value === 'PERSON') return Boolean(scopePerson.value?.curp)
  if (scopeType.value === 'PLANTEL') return Boolean(scopePlantel.value)
  return Boolean(scopePuesto.value && scopePlantel.value)
})

function openScope(authorizer) {
  scopeAuthorizer.value = authorizer
  scopeOpen.value = true
  setScopeType('PERSON')
  scopeChannels.value = ['EMAIL']
  scopePhone.value = ''
}
function closeScope() { if (!saving.value) scopeOpen.value = false }
function setScopeType(type) { scopeType.value = type; scopePerson.value = null; scopePersonQuery.value = ''; scopePersonResults.value = []; scopePlantel.value = type === 'PUESTO' ? 'ALL' : ''; scopePuesto.value = '' }
function toggleScopeChannel(channel) { scopeChannels.value = scopeChannels.value.includes(channel) ? scopeChannels.value.filter((item) => item !== channel) : [...scopeChannels.value, channel] }
watch(scopePersonQuery, (value) => {
  if (personTimer) clearTimeout(personTimer)
  const q = value.trim()
  if (q.length < 2) { scopePersonResults.value = []; return }
  personTimer = setTimeout(async () => {
    scopePersonSearching.value = true
    try { scopePersonResults.value = await $fetch('/api/employees/search', { query: { q } }) } catch { scopePersonResults.value = [] } finally { scopePersonSearching.value = false }
  }, 220)
})

async function saveScope() {
  if (saving.value || !scopeValid.value) return
  saving.value = true
  try {
    const phone = scopeAuthorizerPhone.value || scopePhone.value
    if (scopeType.value === 'PERSON') {
      await $fetch('/api/authorizations/person', { method: 'POST', body: { mode: 'add', curp: scopePerson.value.curp, authorizers: [{ email: scopeAuthorizer.value.email, phone, channels: scopeChannels.value }] } })
    } else {
      await $fetch('/api/authorizations/rules', {
        method: 'POST',
        body: {
          plantel: scopePlantel.value,
          puestos: [scopeType.value === 'PLANTEL' ? 'ALL' : scopePuesto.value],
          email: scopeAuthorizer.value.email,
          channels: scopeChannels.value,
          phone,
          replaceExisting: true
        }
      })
    }
    const keepEmail = scopeAuthorizer.value.email
    scopeOpen.value = false
    await loadAuthorizers()
    selectedAuthorizerEmail.value = keepEmail
  } catch (error) {
    alert(error?.data?.message || 'No se pudo guardar la autorización.')
  } finally {
    saving.value = false
  }
}

async function removeScope(scope) {
  if (!selectedAuthorizer.value) return
  const label = `${scope.label}${scope.context ? ` · ${scope.context}` : ''}`
  const question = scope.type === 'PERSON'
    ? `¿Quitar a ${selectedAuthorizer.value.name} como autorizador de ${scope.label}?`
    : `¿Eliminar la regla de ${label}?`
  if (!confirm(question)) return
  try {
    if (scope.type === 'PERSON') {
      await $fetch('/api/authorizations/person', { method: 'POST', body: { mode: 'remove', curp: scope.subjectKey, email: selectedAuthorizer.value.email } })
    } else {
      await $fetch('/api/authorizations/group', { method: 'DELETE', query: { plantel: scope.plantel, puesto: scope.type === 'PLANTEL' ? 'ALL' : scope.puesto } })
    }
    await loadAuthorizers()
  } catch (error) {
    alert(error?.data?.message || 'No se pudo eliminar la autorización.')
  }
}


onMounted(async () => {
  await Promise.all([loadAuthorizers(), loadCatalogs()])
})
</script>
