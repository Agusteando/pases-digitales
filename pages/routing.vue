<template>
  <div class="p-6 md:p-10 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
    
    <header class="mb-6 shrink-0">
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">Rutas y Contactos</h1>
      <p class="text-slate-500 mt-2 text-sm font-medium">Gestiona el directorio base y configura reglas dinámicas para el enrutamiento de notificaciones WhatsApp.</p>
    </header>

    <div class="flex border-b border-slate-200 mb-6 shrink-0">
      <button @click="activeTab = 'rules'" class="px-6 py-3 font-bold text-sm transition-colors border-b-2 outline-none flex items-center gap-2" :class="activeTab === 'rules' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'">
        <GitMerge class="w-4 h-4" /> Reglas de Enrutamiento
      </button>
      <button @click="activeTab = 'directory'" class="px-6 py-3 font-bold text-sm transition-colors border-b-2 outline-none flex items-center gap-2" :class="activeTab === 'directory' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800'">
        <Users class="w-4 h-4" /> Directorio (Workspace)
      </button>
    </div>

    <!-- TABS: Reglas de Enrutamiento -->
    <div v-if="activeTab === 'rules'" class="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div class="glass-card p-5 rounded-2xl mb-6 bg-white border border-slate-200 shadow-sm shrink-0">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-extrabold text-slate-900">Añadir Nueva Regla</h3>
            <p class="text-xs text-slate-500 font-medium mt-0.5">Define condiciones específicas para disparar notificaciones.</p>
          </div>
        </div>
        
        <form @submit.prevent="saveRule" class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div class="space-y-1.5 lg:col-span-3">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Si el Plantel es</label>
            <select v-model="ruleForm.condition_plantel" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium shadow-sm transition-colors bg-white">
              <option value="ALL">CUALQUIER PLANTEL</option>
              <option v-for="p in allowedPlanteles" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div class="space-y-1.5 lg:col-span-3">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Y su puesto es</label>
            <input v-model="ruleForm.condition_puesto" placeholder="Ej. Guardia (Vacío = TODOS)" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium shadow-sm transition-colors" />
          </div>
          <div class="space-y-1.5 lg:col-span-4">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notificar a</label>
            <div class="flex gap-2">
              <select v-model="ruleForm.target_type" class="px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium shadow-sm bg-white shrink-0">
                <option value="CONTACT">Contacto GW</option>
                <option value="CUSTOM">Chat ID</option>
              </select>
              <select v-if="ruleForm.target_type === 'CONTACT'" v-model="ruleForm.target_val" required class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium shadow-sm bg-white">
                <option value="" disabled>Seleccionar Contacto...</option>
                <option v-for="c in flatContacts" :key="c.id" :value="c.email">{{ c.gw?.name || c.email }} (PL {{ c.plantel }})</option>
              </select>
              <input v-else v-model="ruleForm.target_val" required placeholder="521XXXXXXXXXX@c.us" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium shadow-sm" />
            </div>
          </div>
          <div class="lg:col-span-2">
            <button type="submit" :disabled="isSavingRule" class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-70 flex justify-center items-center gap-2 outline-none">
              <Loader2 v-if="isSavingRule" class="w-4 h-4 animate-spin" />
              <Plus v-else class="w-4 h-4" />
              <span>Añadir</span>
            </button>
          </div>
        </form>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <div v-if="pendingRules" class="py-12 flex justify-center"><Loader2 class="w-6 h-6 animate-spin text-slate-300" /></div>
        <div v-else-if="!rules.length" class="text-center py-12 glass-card rounded-2xl border border-slate-200 border-dashed">
          <BookOpen class="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p class="text-sm font-bold text-slate-500">Sin reglas personalizadas.</p>
          <p class="text-xs text-slate-400 mt-1">El sistema usará el enrutamiento base (Notificar al plantel del colaborador) hasta que añadas reglas.</p>
        </div>
        <div v-else class="space-y-3">
          <div v-for="rule in rules" :key="rule.id" class="glass-card p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-brand-300 transition-colors flex flex-col md:flex-row items-center gap-4 group bg-white">
            
            <div class="flex-1 flex flex-col sm:flex-row items-center gap-4 w-full">
              <!-- Condition Block -->
              <div class="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 flex-1 w-full sm:w-auto">
                <Filter class="w-4 h-4 text-slate-400 shrink-0" />
                <div class="flex flex-col min-w-0">
                  <span class="text-[10px] font-bold uppercase text-slate-400 tracking-wide">Condición</span>
                  <div class="text-sm font-extrabold text-slate-800 truncate flex items-center gap-1.5">
                    <span :class="rule.condition_plantel === 'ALL' ? 'text-brand-600' : ''">PL: {{ rule.condition_plantel === 'ALL' ? 'Todos' : rule.condition_plantel }}</span>
                    <span class="text-slate-300">•</span>
                    <span :class="rule.condition_puesto === 'ALL' ? 'text-brand-600' : ''">Puesto: {{ rule.condition_puesto === 'ALL' ? 'Todos' : rule.condition_puesto }}</span>
                  </div>
                </div>
              </div>
              
              <ArrowRight class="hidden sm:block w-5 h-5 text-slate-300 shrink-0" />
              <ArrowDown class="sm:hidden w-5 h-5 text-slate-300 shrink-0" />

              <!-- Target Block -->
              <div class="flex items-center gap-3 px-4 py-2.5 bg-brand-50 rounded-xl border border-brand-100 flex-1 w-full sm:w-auto">
                <div v-if="rule.target_type === 'CONTACT' && rule.gw_photo" class="w-8 h-8 rounded-full border border-brand-200 shadow-sm shrink-0 overflow-hidden">
                  <img :src="rule.gw_photo" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-8 h-8 rounded-full bg-brand-200 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                  <User v-if="rule.target_type === 'CONTACT'" class="w-4 h-4" />
                  <MessageCircle v-else class="w-4 h-4" />
                </div>
                
                <div class="flex flex-col min-w-0">
                  <span class="text-[10px] font-bold uppercase text-brand-500 tracking-wide">Enrutar Notificación a</span>
                  <p class="text-sm font-extrabold text-brand-900 truncate" :title="rule.gw_name || rule.target_val">
                    {{ rule.target_type === 'CONTACT' ? (rule.gw_name || rule.target_val) : rule.target_val }}
                  </p>
                </div>
              </div>
            </div>

            <button @click="deleteRule(rule.id)" class="text-slate-300 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors focus:outline-none opacity-100 md:opacity-0 group-hover:opacity-100 shrink-0 self-end md:self-auto" title="Eliminar regla">
              <Trash2 class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TABS: Directorio Base -->
    <div v-if="activeTab === 'directory'" class="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div class="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 class="text-base font-extrabold text-slate-800">Directorio Sincronizado</h2>
          <p class="text-xs text-slate-500">Contactos disponibles para enrutamiento desde Google Workspace.</p>
        </div>
        <button @click="openAddModal" class="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-brand-700 transition-colors flex items-center gap-2 outline-none">
          <Plus class="w-4 h-4" /> Vincular Contacto
        </button>
      </div>

      <div v-if="pending" class="py-16 flex justify-center flex-1">
        <Loader2 class="w-8 h-8 animate-spin text-brand-600" />
      </div>
      <div v-else-if="!contacts || contacts.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 glass-card rounded-2xl border border-slate-200 border-dashed">
        <Users class="w-12 h-12 mb-3 text-slate-300" />
        <p class="text-base font-bold text-slate-600">Directorio vacío</p>
        <p class="text-sm font-medium text-slate-500 mt-1 text-center max-w-md">Vincula cuentas de Google Workspace por plantel para estructurar los contactos.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 flex-1 items-start content-start overflow-y-auto custom-scrollbar pr-2 pb-4">
        <div v-for="(plantelContacts, plantel) in groupedContacts" :key="plantel" class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-black text-slate-800 flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <Building2 class="w-3.5 h-3.5 text-indigo-600" />
              </div>
              PL {{ plantel }}
            </h2>
            <Lock v-if="!canEditPlantel(plantel)" class="w-4 h-4 text-slate-300" title="Solo lectura" />
          </div>
          
          <div class="space-y-3">
            <div v-for="contact in plantelContacts" :key="contact.id" class="relative group">
              <div class="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 hover:bg-white hover:border-slate-300 transition-all flex flex-col gap-3">
                <div class="flex items-start gap-3">
                  <div class="relative shrink-0">
                    <img v-if="contact.gw?.photoUrl" :src="contact.gw.photoUrl" class="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm bg-white" />
                    <div v-else class="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-600 text-sm">
                      {{ getInitials(contact.gw?.name || contact.email) }}
                    </div>
                  </div>
                  
                  <div class="flex-1 min-w-0 pr-6">
                    <p class="text-sm font-bold text-slate-900 truncate">{{ contact.gw?.name || 'Cargando...' }}</p>
                    <p class="text-[10px] font-medium text-slate-500 truncate mt-0.5" :title="contact.email">{{ contact.email }}</p>
                    <div class="flex flex-wrap gap-1.5 mt-1.5">
                      <span class="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide uppercase border bg-white border-slate-200 text-slate-600">
                        {{ contact.role }}
                      </span>
                      <span v-if="contact.puesto" class="px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500 bg-white border border-slate-200 truncate max-w-[100px]">
                        {{ contact.puesto }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Phone Sync -->
                <div class="flex items-center gap-2 pt-2.5 border-t border-slate-200 mt-1">
                  <Smartphone class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input 
                    type="text" 
                    v-model="contact.gw.phone"
                    @focus="contact._isEditing = true"
                    placeholder="Sin teléfono asignado"
                    class="flex-1 bg-transparent text-xs font-medium text-slate-700 placeholder:text-slate-400 outline-none transition-all w-full focus:bg-white focus:px-2 focus:py-1 focus:-ml-2 focus:ring-2 focus:ring-brand-100 focus:rounded-md focus:border-brand-300 border border-transparent"
                  />
                  
                  <button v-if="contact._isEditing" @click="syncPhone(contact)" :disabled="contact._isSyncing" class="shrink-0 p-1.5 bg-brand-100 text-brand-700 hover:bg-brand-200 rounded-md transition-colors" title="Guardar en Workspace">
                    <Loader2 v-if="contact._isSyncing" class="w-3.5 h-3.5 animate-spin" />
                    <Save v-else class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <button v-if="canEditPlantel(plantel)" @click="deleteContact(contact.id)" class="absolute top-2 right-2 text-slate-300 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors focus:outline-none opacity-0 group-hover:opacity-100 shrink-0" title="Desvincular">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <header class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 class="text-lg font-black text-slate-900 tracking-tight">Vincular Contacto</h3>
            <p class="text-xs font-medium text-slate-500 mt-0.5">Integración con Google Workspace</p>
          </div>
          <button @click="showAddModal = false" class="text-slate-400 hover:text-slate-700 transition-colors focus:outline-none">
            <X class="w-5 h-5" />
          </button>
        </header>

        <form @submit.prevent="saveContact" id="addContactForm" class="p-6 space-y-5">
          <div class="space-y-1.5">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Plantel Asignado</label>
            <select v-model="form.plantel" required class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium bg-white shadow-sm transition-colors">
              <option value="" disabled>Seleccione un plantel...</option>
              <option v-for="p in allowedPlanteles" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          
          <div class="space-y-1.5">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico (Workspace)</label>
            <input v-model="form.email" type="email" required placeholder="ejemplo@tudominio.com" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium shadow-sm transition-colors" />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nivel de Rol</label>
              <select v-model="form.role" required class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium bg-white shadow-sm transition-colors">
                <option value="PRINCIPAL">Principal</option>
                <option value="ADMON">Administrador</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Puesto Funcional</label>
              <input v-model="form.puesto" type="text" placeholder="Ej. Director" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium shadow-sm transition-colors" />
            </div>
          </div>
        </form>

        <footer class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2 text-slate-400">
            <ShieldCheck class="w-4 h-4" />
            <span class="text-[10px] font-bold">Datos sincronizados auto.</span>
          </div>
          <div class="flex gap-2">
            <button type="button" @click="showAddModal = false" class="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors outline-none">Cancelar</button>
            <button type="submit" form="addContactForm" :disabled="isSaving" class="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm flex items-center gap-2 outline-none disabled:opacity-70">
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
import { Users, Plus, Building2, Trash2, X, Loader2, Lock, Smartphone, Save, ShieldCheck, GitMerge, ArrowRight, ArrowDown, User, MessageCircle, BookOpen, Filter } from 'lucide-vue-next'

const activeTab = ref('rules')

const planteles = [
  'PT', 'PM', 'ST', 'SM', 'CT', 'CM', 'DM', 'CO', 'KT', 'KM', 'PREES TOL', 'PREES MET', 'ISSSTE TOL', 'ISSSTE MET', 'U-0837', 'DCA'
]

const { user } = useAuth()
const userPlantel = ref(null)

const { data: contacts, pending, refresh: refreshContacts } = useFetch('/api/directory')
const { data: rules, pending: pendingRules, refresh: refreshRules } = useFetch('/api/routing/rules', { default: () => [] })

const isAdmin = computed(() => user.value?.email?.includes('admon') || user.value?.email?.includes('tecno'))
const allowedPlanteles = computed(() => isAdmin.value ? planteles : (userPlantel.value ? [userPlantel.value] : []))
const canEditPlantel = (plantel) => isAdmin.value || userPlantel.value === plantel

// DIRECTORY LOGIC
const groupedContacts = computed(() => {
  if (!contacts.value) return {}
  return contacts.value.reduce((acc, curr) => {
    if (!acc[curr.plantel]) acc[curr.plantel] = []
    acc[curr.plantel].push({ ...curr, _isEditing: false, _isSyncing: false })
    return acc
  }, {})
})
const flatContacts = computed(() => contacts.value || [])

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

const showAddModal = ref(false)
const isSaving = ref(false)
const form = ref({ plantel: '', email: '', role: 'PRINCIPAL', puesto: '' })

const openAddModal = () => {
  form.value.plantel = !isAdmin.value && userPlantel.value ? userPlantel.value : ''
  form.value.email = ''
  form.value.puesto = ''
  showAddModal.value = true
}

const saveContact = async () => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    await $fetch('/api/directory', { method: 'POST', body: form.value })
    showAddModal.value = false
    refreshContacts()
  } catch (error) {
    alert(error?.data?.message || 'Error al vincular.')
  } finally {
    isSaving.value = false
  }
}

const deleteContact = async (id) => {
  if (!confirm('¿Desvincular este contacto de Google Workspace?')) return
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
    alert('Fallo al sincronizar.')
  } finally {
    contact._isSyncing = false
  }
}

// RULES LOGIC
const isSavingRule = ref(false)
const ruleForm = ref({
  condition_plantel: 'ALL',
  condition_puesto: '',
  target_type: 'CONTACT',
  target_val: ''
})

const saveRule = async () => {
  if (isSavingRule.value) return
  isSavingRule.value = true
  try {
    await $fetch('/api/routing/rules', {
      method: 'POST',
      body: {
        ...ruleForm.value,
        condition_puesto: ruleForm.value.condition_puesto.trim() || 'ALL'
      }
    })
    ruleForm.value = { condition_plantel: 'ALL', condition_puesto: '', target_type: 'CONTACT', target_val: '' }
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
  if (user.value && !isAdmin.value) {
    try {
      const enrichment = await $fetch('/api/employees/enrich', { query: { name: user.value.name } })
      if (enrichment && enrichment.plantelId) userPlantel.value = enrichment.plantelId
    } catch (e) {}
  }
})
</script>