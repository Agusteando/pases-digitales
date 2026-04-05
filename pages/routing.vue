<template>
  <div class="p-6 md:p-10 max-w-[1600px] mx-auto h-full flex flex-col relative z-10">
    
    <header class="mb-8 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Mapa Operativo</h1>
        <p class="text-slate-500 mt-2 text-sm font-bold">Directorio y reglas de enrutamiento organizados por Plantel.</p>
      </div>
    </header>

    <div v-if="pendingContacts || pendingRules" class="flex-1 flex items-center justify-center">
      <Loader2 class="w-12 h-12 animate-spin text-brand-600" />
    </div>

    <div v-else class="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
      
      <!-- Left Sidebar: Planteles List -->
      <aside class="w-full lg:w-72 xl:w-80 flex flex-col shrink-0 min-h-0 bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div class="p-5 border-b border-slate-200/60 bg-white">
          <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Building2 class="w-4 h-4 text-brand-500" /> Planteles
          </h2>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          <button 
            @click="selectedPlantel = 'GLOBAL'"
            class="w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all outline-none flex items-center justify-between group"
            :class="selectedPlantel === 'GLOBAL' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'"
          >
            <div class="flex items-center gap-3">
              <Globe class="w-4 h-4" :class="selectedPlantel === 'GLOBAL' ? 'text-brand-200' : 'text-slate-400 group-hover:text-brand-500'" />
              Reglas Globales
            </div>
          </button>
          
          <div class="my-2 border-t border-slate-200/60 mx-4"></div>
          
          <button 
            v-for="plantel in uniquePlanteles" :key="plantel"
            @click="selectedPlantel = plantel"
            class="w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all outline-none flex items-center justify-between group"
            :class="selectedPlantel === plantel ? 'bg-brand-50 border-brand-200 text-brand-800 shadow-sm border' : 'text-slate-600 hover:bg-slate-100 border border-transparent'"
          >
            <span class="truncate">{{ plantel }}</span>
            <ChevronRight class="w-4 h-4" :class="selectedPlantel === plantel ? 'text-brand-500' : 'text-transparent group-hover:text-slate-300'" />
          </button>
        </div>
      </aside>

      <!-- Right Main Panel: Detail View for Selected Plantel -->
      <main class="flex-1 flex flex-col min-h-0 custom-scrollbar overflow-y-auto pb-10">
        
        <div class="mb-8">
          <h2 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span v-if="selectedPlantel === 'GLOBAL'">Configuración Global</span>
            <span v-else>Plantel {{ selectedPlantel }}</span>
          </h2>
          <p class="text-sm font-medium text-slate-500 mt-1">
            {{ selectedPlantel === 'GLOBAL' ? 'Reglas de enrutamiento que aplican para cualquier plantel.' : 'Organigrama y reglas específicas para este origen.' }}
          </p>
        </div>

        <!-- Section: Directorio (Hide if GLOBAL) -->
        <section v-if="selectedPlantel !== 'GLOBAL'" class="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users class="w-4 h-4" /> Directorio Operativo
            </h3>
            <button @click="openAddModal" class="px-4 py-2 bg-white border border-slate-200 text-brand-600 text-xs font-black rounded-xl shadow-sm hover:border-brand-300 hover:bg-brand-50 transition-all flex items-center gap-2 outline-none">
              <Plus class="w-3.5 h-3.5" /> Vincular Contacto
            </button>
          </div>

          <div v-if="!currentContacts.length" class="bg-white/60 border border-slate-200/80 border-dashed rounded-3xl p-10 flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <UserX class="w-6 h-6 text-slate-400" />
            </div>
            <p class="text-base font-black text-slate-700">Sin responsables asignados</p>
            <p class="text-sm font-medium text-slate-500 mt-1 max-w-sm">Vincula cuentas de Workspace para definir quiénes reciben notificaciones en este plantel si no hay reglas específicas.</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <div v-for="contact in currentContacts" :key="contact.id" class="glass-card p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative group">
              <div class="flex items-start gap-4">
                <div class="relative shrink-0">
                  <img v-if="contact.gw?.photoUrl" :src="contact.gw.photoUrl" class="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm bg-white" />
                  <div v-else class="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-400 text-lg">
                    {{ getInitials(contact.gw?.name || contact.email) }}
                  </div>
                </div>
                
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-black text-slate-900 truncate tracking-tight">{{ contact.gw?.name || 'Sincronizando...' }}</p>
                  <p class="text-[10px] font-bold text-slate-500 truncate mt-0.5" :title="contact.email">{{ contact.email }}</p>
                  <div class="mt-2 inline-block px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase border bg-slate-50 border-slate-200 text-slate-600">
                    Rol: {{ contact.role }}
                  </div>
                </div>
              </div>

              <!-- Phone Sync -->
              <div class="flex items-center gap-3 mt-5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                <Smartphone class="w-4 h-4 text-brand-500 shrink-0" />
                <input 
                  type="text" 
                  v-model="contact.gw.phone"
                  @focus="contact._isEditing = true"
                  placeholder="Añadir número (Workspace)"
                  class="flex-1 bg-transparent text-xs font-bold text-slate-700 placeholder:text-slate-400 outline-none transition-all w-full focus:bg-white focus:px-3 focus:py-1.5 focus:-ml-3 focus:ring-2 focus:ring-brand-100 focus:rounded-xl focus:border-brand-300 border border-transparent"
                />
                
                <button v-if="contact._isEditing" @click="syncPhone(contact)" :disabled="contact._isSyncing" class="shrink-0 p-2 bg-brand-600 text-white hover:bg-brand-700 rounded-xl transition-all shadow-sm focus:outline-none" title="Guardar">
                  <Loader2 v-if="contact._isSyncing" class="w-3 h-3 animate-spin" />
                  <Save v-else class="w-3 h-3" />
                </button>
              </div>

              <button v-if="canEdit" @click="deleteContact(contact.id)" class="absolute top-4 right-4 text-slate-300 hover:text-red-600 bg-white p-2 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-slate-100 focus:outline-none" title="Desvincular">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        <!-- Section: Reglas de Enrutamiento -->
        <section class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Network class="w-4 h-4" /> Flujos de Enrutamiento
            </h3>
          </div>

          <!-- Add Rule Form Inline -->
          <form @submit.prevent="saveRule" class="glass-card bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 items-end relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-900"></div>
            
            <div class="w-full lg:flex-1 space-y-2">
              <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Si el Puesto es</label>
              <select v-model="ruleForm.condition_puesto" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none text-sm font-bold shadow-sm transition-all bg-slate-50/50">
                <option value="ALL">CUALQUIER PUESTO (Fallback)</option>
                <option v-for="p in catalogPuestos" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>

            <div class="hidden lg:flex pb-3 px-2">
              <ArrowRight class="w-5 h-5 text-slate-300" />
            </div>

            <div class="w-full lg:flex-1 space-y-2">
              <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Notificar a Workspace</label>
              <select v-model="ruleForm.target_val" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none text-sm font-bold shadow-sm bg-slate-50/50">
                <option value="" disabled>Seleccionar Contacto...</option>
                <option v-for="c in contacts" :key="c.id" :value="c.email">{{ c.gw?.name || c.email }} ({{ c.plantel }})</option>
              </select>
            </div>

            <button type="submit" :disabled="isSavingRule || !ruleForm.target_val" class="w-full lg:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-sm transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2 outline-none">
              <Loader2 v-if="isSavingRule" class="w-4 h-4 animate-spin" />
              <Plus v-else class="w-4 h-4" />
              <span>Añadir Regla</span>
            </button>
          </form>

          <div v-if="!currentRules.length" class="bg-white/60 border border-slate-200/80 border-dashed rounded-3xl p-10 flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <GitMerge class="w-6 h-6 text-slate-400" />
            </div>
            <p class="text-base font-black text-slate-700">Sin reglas específicas</p>
            <p class="text-sm font-medium text-slate-500 mt-1 max-w-sm">Si no hay reglas, las notificaciones se enviarán a los contactos del directorio de este plantel.</p>
          </div>

          <div v-else class="space-y-4">
            <div v-for="rule in currentRules" :key="rule.id" class="glass-card p-5 rounded-3xl border border-slate-200/80 shadow-sm bg-white flex flex-col sm:flex-row items-center gap-5 group relative">
              
              <!-- Logical Flow -->
              <div class="flex-1 flex flex-col sm:flex-row items-center gap-4 w-full">
                <!-- Condition Box -->
                <div class="flex items-center gap-3 px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 flex-1 w-full sm:w-auto relative overflow-hidden">
                  <div class="absolute left-0 top-0 bottom-0 w-1 bg-slate-300"></div>
                  <Filter class="w-5 h-5 text-slate-400 shrink-0" />
                  <div class="flex flex-col min-w-0">
                    <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest">Condición</span>
                    <span class="text-sm font-black text-slate-800 truncate mt-0.5" :class="rule.condition_puesto === 'ALL' ? 'text-brand-600' : ''">
                      {{ rule.condition_puesto === 'ALL' ? 'CUALQUIER PUESTO' : rule.condition_puesto }}
                    </span>
                  </div>
                </div>
                
                <ArrowRight class="hidden sm:block w-6 h-6 text-slate-300 shrink-0" />
                <ArrowDown class="sm:hidden w-6 h-6 text-slate-300 shrink-0" />

                <!-- Action Box -->
                <div class="flex items-center gap-4 px-5 py-4 bg-brand-50/50 rounded-2xl border border-brand-100 flex-1 w-full sm:w-auto relative overflow-hidden">
                  <div class="absolute left-0 top-0 bottom-0 w-1 bg-brand-500"></div>
                  <div v-if="rule.gw_photo" class="w-10 h-10 rounded-xl border-2 border-white shadow-sm shrink-0 overflow-hidden bg-white">
                    <img :src="rule.gw_photo" class="w-full h-full object-cover" />
                  </div>
                  <div v-else class="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-black text-sm shrink-0 border border-brand-200">
                    <User class="w-5 h-5" />
                  </div>
                  
                  <div class="flex flex-col min-w-0">
                    <span class="text-[9px] font-black uppercase text-brand-500 tracking-widest">Destinatario</span>
                    <p class="text-sm font-black text-brand-900 truncate mt-0.5" :title="rule.gw_name || rule.target_val">
                      {{ rule.gw_name || rule.target_val }}
                    </p>
                  </div>
                </div>
              </div>

              <button @click="deleteRule(rule.id)" class="text-slate-300 hover:text-red-600 p-3 rounded-2xl hover:bg-red-50 transition-colors focus:outline-none opacity-100 sm:opacity-0 group-hover:opacity-100 shrink-0 absolute top-4 right-4 sm:static sm:top-auto sm:right-auto" title="Eliminar regla">
                <Trash2 class="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>

    <!-- Modal: Vincular Contacto -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
        <header class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white relative">
          <div>
            <h3 class="text-xl font-black text-slate-900 tracking-tight">Vincular Contacto</h3>
            <p class="text-xs font-bold text-slate-500 mt-1">Para el Plantel: <span class="text-brand-600">{{ form.plantel }}</span></p>
          </div>
          <button @click="showAddModal = false" class="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors focus:outline-none">
            <X class="w-5 h-5" />
          </button>
        </header>

        <form @submit.prevent="saveContact" id="addContactForm" class="p-8 space-y-6 bg-slate-50/30">
          
          <div class="space-y-2 relative">
            <label class="block text-[11px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
              <Search class="w-3 h-3" /> Búsqueda en Google Workspace
            </label>
            <input v-model="gwSearchQuery" @input="searchGw" placeholder="Nombre o correo institucional..." class="w-full px-4 py-3 rounded-xl border border-brand-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold shadow-sm transition-all bg-white" autocomplete="off" />
            
            <div v-if="gwResults.length" class="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar py-2">
              <button type="button" v-for="res in gwResults" :key="res.email" @click="selectGw(res)" class="w-full text-left px-5 py-3 hover:bg-brand-50 border-b border-slate-100 flex items-center gap-4 last:border-0 transition-colors group">
                 <img v-if="res.photoUrl" :src="res.photoUrl" class="w-10 h-10 rounded-full border border-slate-200 object-cover" />
                 <div v-else class="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-400 text-sm group-hover:bg-brand-100 group-hover:text-brand-600">{{ res.name.slice(0,2).toUpperCase() }}</div>
                 <div class="flex-1 min-w-0">
                   <p class="text-sm font-black text-slate-900 truncate">{{ res.name }}</p>
                   <p class="text-[10px] font-bold text-slate-500 truncate">{{ res.email }}</p>
                 </div>
              </button>
            </div>
            
            <div v-if="form.email" class="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4 shadow-sm animate-in zoom-in-95">
              <div class="w-12 h-12 rounded-xl bg-white border border-emerald-200 overflow-hidden shrink-0 shadow-sm">
                <img v-if="selectedGwPhoto" :src="selectedGwPhoto" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center font-black text-emerald-500 text-lg">{{ selectedGwName.slice(0,2).toUpperCase() }}</div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-black text-emerald-900 truncate">{{ selectedGwName }}</p>
                <p class="text-xs font-bold text-emerald-700 truncate mt-0.5">{{ form.email }}</p>
              </div>
              <button type="button" @click="clearGw" class="text-emerald-500 hover:text-red-600 hover:bg-white p-2 rounded-full transition-colors focus:outline-none shadow-sm">
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div class="space-y-2">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Nivel de Autoridad</label>
            <select v-model="form.role" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold bg-white shadow-sm transition-all">
              <option value="PRINCIPAL">Principal</option>
              <option value="ADMON">Administrador</option>
              <option value="OTRO">Soporte / Otro</option>
            </select>
          </div>
        </form>

        <footer class="px-8 py-5 bg-white border-t border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2 text-slate-400">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div class="flex gap-3">
            <button type="button" @click="showAddModal = false" class="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none border border-transparent hover:border-slate-200">Cancelar</button>
            <button type="submit" form="addContactForm" :disabled="isSaving || !form.email" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-black rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 outline-none disabled:opacity-70">
              <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
              <span>Vincular</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Users, Plus, Building2, Trash2, X, Loader2, Smartphone, Save, ShieldCheck, GitMerge, ArrowRight, ArrowDown, User, Network, Globe, ChevronRight, UserX, Search, Filter } from 'lucide-vue-next'

const { user } = useAuth()
const userPlantel = ref(null)

const { data: contacts, pending: pendingContacts, refresh: refreshContacts } = useFetch('/api/directory', { default: () => [] })
const { data: rules, pending: pendingRules, refresh: refreshRules } = useFetch('/api/routing/rules', { default: () => [] })
const { data: catalogPuestos } = useFetch('/api/catalogs/puestos', { default: () => [] })

const isAdmin = computed(() => user.value?.is_admin || false)
const canEdit = computed(() => isAdmin.value)

// Dynamic Planteles Extraction
const uniquePlanteles = computed(() => {
  const set = new Set()
  contacts.value.forEach(c => c.plantel && set.add(c.plantel))
  rules.value.forEach(r => r.condition_plantel && r.condition_plantel !== 'ALL' && set.add(r.condition_plantel))
  
  // Also add legacy fallbacks if the set is empty, but clean them.
  if (set.size === 0) {
    ['PT', 'PM', 'ST', 'SM', 'CT', 'CM', 'DM', 'CO', 'KT', 'KM'].forEach(p => set.add(p))
  }
  
  return Array.from(set).sort()
})

const selectedPlantel = ref('GLOBAL')

// Derived UI State
const currentContacts = computed(() => {
  if (selectedPlantel.value === 'GLOBAL') return []
  return contacts.value.filter(c => c.plantel === selectedPlantel.value).map(c => ({ ...c, _isEditing: false, _isSyncing: false }))
})

const currentRules = computed(() => {
  const condition = selectedPlantel.value === 'GLOBAL' ? 'ALL' : selectedPlantel.value
  return rules.value.filter(r => r.condition_plantel === condition)
})

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

// Modals & Add Logic
const showAddModal = ref(false)
const isSaving = ref(false)
const form = ref({ plantel: '', email: '', role: 'PRINCIPAL' })

const gwSearchQuery = ref('')
const gwResults = ref([])
const selectedGwName = ref('')
const selectedGwPhoto = ref('')
let gwTimeout = null

const searchGw = () => {
  if (gwTimeout) clearTimeout(gwTimeout)
  if (gwSearchQuery.value.length < 2) {
    gwResults.value = []
    return
  }
  gwTimeout = setTimeout(async () => {
    try {
      const data = await $fetch('/api/workspace/search', { params: { q: gwSearchQuery.value } })
      gwResults.value = data || []
    } catch(e) {
      gwResults.value = []
    }
  }, 300)
}

const selectGw = (res) => {
  form.value.email = res.email
  selectedGwName.value = res.name
  selectedGwPhoto.value = res.photoUrl
  gwSearchQuery.value = ''
  gwResults.value = []
}

const clearGw = () => {
  form.value.email = ''
  selectedGwName.value = ''
  selectedGwPhoto.value = ''
}

const openAddModal = () => {
  if (selectedPlantel.value === 'GLOBAL') return
  form.value.plantel = selectedPlantel.value
  form.value.email = ''
  form.value.role = 'PRINCIPAL'
  clearGw()
  showAddModal.value = true
}

const saveContact = async () => {
  if (isSaving.value || !form.value.email) return
  isSaving.value = true
  try {
    await $fetch('/api/directory', { method: 'POST', body: form.value })
    showAddModal.value = false
    refreshContacts()
  } catch (error) {
    alert(error?.data?.message || 'Error al vincular el contacto.')
  } finally {
    isSaving.value = false
  }
}

const deleteContact = async (id) => {
  if (!confirm('¿Desvincular permanentemente este contacto del directorio de este plantel?')) return
  try {
    await $fetch(`/api/directory/${id}`, { method: 'DELETE' })
    refreshContacts()
  } catch (error) {
    alert(error?.data?.message || 'Error al desvincular.')
  }
}

const syncPhone = async (contact) => {
  if (contact._isSyncing) return
  contact._isSyncing = true
  try {
    await $fetch(`/api/directory/${contact.id}/phone`, {
      method: 'PUT',
      body: { email: contact.email, phone: contact.gw.phone }
    })
    contact._isEditing = false
  } catch (error) {
    alert('Fallo al sincronizar el teléfono con Google Workspace.')
  } finally {
    contact._isSyncing = false
  }
}

// RULES LOGIC
const isSavingRule = ref(false)
const ruleForm = ref({
  condition_puesto: 'ALL',
  target_val: ''
})

const saveRule = async () => {
  if (isSavingRule.value) return
  isSavingRule.value = true
  try {
    await $fetch('/api/routing/rules', {
      method: 'POST',
      body: {
        condition_plantel: selectedPlantel.value === 'GLOBAL' ? 'ALL' : selectedPlantel.value,
        condition_puesto: ruleForm.value.condition_puesto || 'ALL',
        target_val: ruleForm.value.target_val
      }
    })
    ruleForm.value = { condition_puesto: 'ALL', target_val: '' }
    refreshRules()
  } catch (error) {
    alert(error?.data?.message || 'Error al guardar regla.')
  } finally {
    isSavingRule.value = false
  }
}

const deleteRule = async (id) => {
  if (!confirm('¿Eliminar esta regla de enrutamiento?')) return
  try {
    await $fetch(`/api/routing/rules/${id}`, { method: 'DELETE' })
    refreshRules()
  } catch (error) {
    alert('Error al eliminar regla.')
  }
}

onMounted(async () => {
  // Try to set initial selection if we know the admin's plantel
  if (uniquePlanteles.value.length > 0) {
     selectedPlantel.value = uniquePlanteles.value[0]
  }
})
</script>