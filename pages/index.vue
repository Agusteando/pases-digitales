<template>
  <div class="flex flex-col xl:flex-row h-full w-full">
    
    <!-- Left Column: Step-by-Step Creation Flow -->
    <section class="w-full xl:w-[48%] flex flex-col bg-white/80 backdrop-blur-md border-r border-slate-200/60 z-20 xl:h-screen xl:sticky xl:top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      
      <header class="px-6 md:px-8 py-6 border-b border-slate-200/60 bg-white/50 shrink-0">
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">Registro de pases</h1>
        <p class="text-slate-500 mt-1 text-sm font-medium">Justificación de incidencias del personal.</p>
      </header>

      <div class="flex-1 overflow-y-auto px-6 py-8 md:px-8 custom-scrollbar relative flex flex-col gap-10">
        
        <!-- Step 1: Seleccionar Colaborador -->
        <div class="relative">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-black shrink-0">1</div>
            <h2 class="text-base font-black text-slate-900">Seleccionar colaborador</h2>
          </div>
          
          <EmployeeSearch @select="addEmployee" />
          
          <div v-if="selectedEmployees.length > 0" class="flex flex-col gap-3 mt-5">
            <div v-for="emp in selectedEmployees" :key="emp.id" class="flex flex-col w-full bg-white border border-slate-200 p-4 rounded-2xl group shadow-sm transition-all hover:border-brand-300 relative overflow-hidden">
              <div class="flex items-center justify-between mb-2 relative z-10">
                <div class="flex items-center gap-3">
                   <PremiumAvatar :src="emp.picture || null" :name="emp.name" size="sm" class="shrink-0 shadow-sm border border-slate-100" />
                   <div class="flex flex-col">
                     <span class="text-base font-black text-slate-800">{{ emp.name }}</span>
                     <span v-if="myProfile && emp.name === myProfile.name" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Registro propio</span>
                   </div>
                </div>
                <button type="button" @click="removeEmployee(emp.id)" class="text-slate-400 hover:text-white bg-slate-50 hover:bg-red-500 w-8 h-8 flex items-center justify-center rounded-full transition-colors focus:outline-none border border-slate-100 shrink-0">
                  <XIcon class="w-4 h-4" />
                </button>
              </div>
              
              <div v-if="emp._enriching" class="flex gap-2 mt-2">
                <div class="h-6 w-24 bg-slate-100 animate-pulse rounded-lg"></div>
                <div class="h-6 w-32 bg-slate-100 animate-pulse rounded-lg"></div>
              </div>
              <div v-else class="flex flex-col gap-3 w-full mt-1 relative z-10">
                <div class="flex flex-wrap items-center gap-2">
                  <span v-if="emp.puesto" class="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200/60">
                    {{ emp.puesto }}
                  </span>
                  <span v-if="emp.plantelBase" class="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200/60 flex items-center gap-1.5" :class="{'opacity-60': emp.plantelActual && emp.plantelActual !== emp.plantelBase}">
                    <Building2 class="w-3.5 h-3.5 text-slate-400" />
                    {{ emp.plantelBase }}
                  </span>
                  <template v-if="emp.plantelActual && emp.plantelActual !== emp.plantelBase">
                    <span class="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200/80 shadow-sm flex items-center gap-1.5 animate-in fade-in duration-300">
                      <MapPin class="w-3.5 h-3.5 text-blue-500" />
                      Ubicación actual: {{ emp.plantelActual }}
                      <button type="button" @click.stop="resetPlantelActual(emp)" class="ml-1 hover:text-blue-900 bg-blue-100/50 p-0.5 rounded-md transition-colors outline-none"><XIcon class="w-3 h-3"/></button>
                    </span>
                  </template>
                  <button v-else-if="!emp._editingActual" type="button" @click.stop="emp._editingActual = true" class="text-[10px] font-bold text-slate-500 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1 border border-transparent hover:border-blue-200 outline-none">
                    <MapPin class="w-3 h-3" /> Registrar desde otra ubicación
                  </button>
                </div>

                <div v-if="emp._editingActual" class="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                   <div class="flex-1">
                      <select v-model="emp.plantelActual" @change="onPlantelActualSelected(emp)" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none shadow-sm cursor-pointer transition-all">
                         <option v-for="p in plantelesList" :key="p" :value="p">{{ p }}</option>
                      </select>
                   </div>
                   <button type="button" @click="emp._editingActual = false" class="p-2 text-slate-400 hover:text-slate-600 bg-slate-200/50 hover:bg-slate-200 rounded-lg transition-colors border border-transparent outline-none">
                      <XIcon class="w-4 h-4" />
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Directory Coverage Loading State -->
        <div v-if="checkingCoverage" class="py-10 flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border border-slate-100 animate-pulse">
           <Loader2 class="w-8 h-8 animate-spin text-brand-400 mb-3" />
           <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Verificando responsables...</p>
        </div>
        
        <!-- Step 2: Motivo del pase -->
        <div v-else-if="!currentCoverageTask && selectedEmployees.length > 0" class="relative animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-black shrink-0">2</div>
            <h2 class="text-base font-black text-slate-900">Motivo de la incidencia</h2>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <ScenarioCard 
              v-for="scenario in predefinedScenarios" 
              :key="scenario.id" 
              :title="scenario.title" 
              :iconName="scenario.icon" 
              :active="activeScenario?.id === scenario.id" 
              @click="selectScenario(scenario)"
            />
          </div>
        </div>

        <!-- Step 3: Detalles y Generación -->
        <div v-if="activeScenario" class="relative animate-in slide-in-from-bottom-4 fade-in duration-500 pb-10">
          <div class="flex items-center gap-3 mb-4 mt-2">
            <div class="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-black shrink-0">3</div>
            <h2 class="text-base font-black text-slate-900">Detalles de la solicitud</h2>
          </div>

          <form @submit.prevent class="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-card relative overflow-hidden flex flex-col gap-6">
            <div class="absolute top-0 left-0 w-full h-1.5 bg-brand-500"></div>
            
            <!-- Quick Context Presets inside the form -->
            <div v-if="activeScenario.categoryId === 2" class="flex flex-wrap items-center gap-2 pb-5 border-b border-slate-100">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest w-full mb-1">Atajos contextuales:</span>
              <button type="button" @click="applyPreset('now')" class="px-3 py-1.5 bg-slate-50 hover:bg-brand-50 text-slate-600 hover:text-brand-700 text-xs font-bold rounded-lg border border-slate-200 hover:border-brand-200 transition-colors flex items-center gap-1.5 outline-none">
                <Clock class="w-3.5 h-3.5" /> Asignar hora actual
              </button>
              <button type="button" @click="applyPreset('transfer')" class="px-3 py-1.5 bg-slate-50 hover:bg-brand-50 text-slate-600 hover:text-brand-700 text-xs font-bold rounded-lg border border-slate-200 hover:border-brand-200 transition-colors flex items-center gap-1.5 outline-none">
                <MapPin class="w-3.5 h-3.5" /> Traslado a plantel
              </button>
              <button v-if="hasBirthday()" type="button" @click="applyPreset('birthday')" class="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-lg border border-orange-200 transition-colors flex items-center gap-1.5 outline-none shadow-sm">
                <Cake class="w-3.5 h-3.5" /> Cumpleaños
              </button>
            </div>

            <!-- Core Form Grid -->
            <div class="grid grid-cols-2 gap-5">
              <div class="space-y-2 col-span-2 md:col-span-1">
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha de inicio</label>
                <input type="date" v-model="form.date" :min="todayDate" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-slate-50/50" />
              </div>
              <div v-if="activeScenario.needsEndDate" class="space-y-2 col-span-2 md:col-span-1">
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha de término</label>
                <input type="date" v-model="form.endDate" :min="todayDate" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-slate-50/50" />
              </div>
              <div v-if="activeScenario.needsTime" class="space-y-2 col-span-2 md:col-span-1">
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora</label>
                <input type="time" v-model="form.time" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-slate-50/50" />
              </div>
            </div>

            <div v-if="activeScenario.canReturn" class="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <input type="checkbox" id="regreso" v-model="form.regreso" class="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300 transition-colors cursor-pointer" />
              <label for="regreso" class="text-sm font-black text-slate-700 cursor-pointer select-none">Retorna en la misma jornada</label>
            </div>

            <div v-if="form.regreso" class="space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora de retorno</label>
              <input type="time" v-model="form.horaRegreso" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-slate-50/50" />
            </div>

            <!-- Medical specifics -->
            <div v-if="activeScenario.isMedical" class="space-y-5 p-6 bg-teal-50/50 rounded-3xl border border-teal-100">
              <div class="space-y-2">
                <label class="block text-[10px] font-black text-teal-700 uppercase tracking-widest">Folio IMSS</label>
                <input type="text" v-model="form.imss" placeholder="Ej. 12345678" class="w-full px-4 py-3 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm font-bold text-teal-900 transition-all bg-white shadow-sm" />
              </div>
              <div class="space-y-2">
                <label class="block text-[10px] font-black text-teal-700 uppercase tracking-widest">Clasificación Médica</label>
                <select v-model="form.tipoIncapacidad" class="w-full px-4 py-3 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm font-bold text-teal-900 transition-all bg-white shadow-sm">
                  <option value="Enfermedad general">Enfermedad general</option>
                  <option value="Riesgo de trabajo">Riesgo de trabajo</option>
                  <option value="Maternidad">Maternidad</option>
                </select>
              </div>
            </div>

            <!-- Destino Option -->
            <div class="space-y-3 pt-2">
              <div v-if="!showDestino" class="flex">
                <button type="button" @click="showDestino = true" class="text-xs font-bold text-slate-500 hover:text-brand-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors">
                  <Plus class="w-3.5 h-3.5" /> Añadir destino a otro plantel
                </button>
              </div>
              <div v-else class="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 relative animate-in fade-in zoom-in-95 duration-200">
                <button type="button" @click="showDestino = false" class="absolute top-3 right-3 text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-200 outline-none">
                   <XIcon class="w-4 h-4" />
                </button>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Plantel de destino</label>
                <select v-model="form.destino" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 bg-white shadow-sm cursor-pointer">
                  <option value="">Seleccione un plantel...</option>
                  <option v-for="p in plantelesList" :key="p" :value="p">{{ p }}</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Justificación</label>
              <textarea v-model="form.comentarios" rows="3" placeholder="Describe el motivo de forma clara..." required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-medium text-slate-900 resize-none transition-all bg-slate-50/50"></textarea>
            </div>

            <div v-if="!isAuthorizerForCurrent && selectedEmployees.length > 0" class="p-4 bg-slate-50 rounded-xl border border-slate-200/60 mt-2 mb-2 transition-all">
              <div class="flex items-start gap-3">
                <input type="checkbox" id="optInAuth" v-model="form.optInAuthorizer" class="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer" />
                <label for="optInAuth" class="cursor-pointer select-none">
                  <p class="text-sm font-bold text-slate-800">Recibir notificaciones de este plantel</p>
                  <p class="text-xs text-slate-500 mt-0.5">Asignarme como responsable para revisar y autorizar futuros pases.</p>
                </label>
              </div>
              <div v-if="form.optInAuthorizer && !myProfile?.phone" class="mt-4 pt-4 border-t border-slate-200/60 animate-in fade-in slide-in-from-top-2">
                <label class="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Número de celular (WhatsApp)</label>
                <div class="flex items-center shadow-sm rounded-xl">
                   <div class="bg-slate-100 border border-slate-200 border-r-0 px-4 py-3 rounded-l-xl text-slate-600 font-black text-sm">+52 1</div>
                   <input v-model="form.authorizerPhone" type="tel" maxlength="10" placeholder="10 dígitos" @input="form.authorizerPhone = form.authorizerPhone.replace(/\D/g, '').substring(0, 10)" class="flex-1 px-4 py-3 rounded-r-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-black text-slate-900 bg-white" />
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-slate-100 flex flex-col gap-4">
              <div class="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Bell class="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p class="text-[11px] font-medium text-slate-600 leading-relaxed">
                  El sistema enviará el enlace de autorización a los responsables asignados. Puedes delegar la revisión o resolver el pase directamente en este momento.
                </p>
              </div>
              <div class="flex flex-col sm:flex-row gap-3">
                <button type="button" @click="submitPass(false)" :disabled="isSubmitting" class="flex-1 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-black text-sm rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-2 outline-none shadow-sm">
                  <Send class="w-4 h-4 text-slate-400" /> Solicitar autorización
                </button>
                <button type="button" @click="submitPass(true)" :disabled="isSubmitting" class="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 outline-none">
                  <CheckCircle class="w-4 h-4" /> Autorizar directamente
                </button>
              </div>
              <p v-if="hasSelfPass" class="text-[10px] font-bold text-slate-400 text-center px-4">
                Estás generando una solicitud a tu propio nombre. La resolución quedará documentada bajo tu usuario.
              </p>
            </div>
            
          </form>
        </div>

      </div>
    </section>

    <!-- Right Column: Operational Context -->
    <section class="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar relative xl:h-screen bg-transparent z-10">
      <div class="max-w-3xl mx-auto flex flex-col gap-8">
        <template v-if="selectedEmployees.length > 0">
          <div class="flex items-center justify-between pb-4 border-b border-slate-200/60">
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">Expediente</h2>
          </div>
          <EmployeeContextPanel v-for="emp in selectedEmployees" :key="emp.id" :employee="emp" class="animate-in fade-in slide-in-from-right-8 duration-500" />
        </template>
        <template v-else>
          <RecentActivityPanel class="animate-in fade-in duration-700" />
        </template>
      </div>
    </section>

    <!-- Context Check Setup Modal -->
    <PlantelSetupModal 
      v-if="currentCoverageTask"
      :is-open="!!currentCoverageTask"
      :plantel="currentCoverageTask.plantel"
      :employee-name="currentCoverageTask.employeeName"
      :coverage-data="currentCoverageTask"
      @cancel="onSetupCancelled"
      @completed="onSetupCompleted"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import dayjs from 'dayjs'
import { Loader2, X as XIcon, Cake, Send, Building2, Briefcase, MapPin, Plus, Clock, Bell, CheckCircle } from 'lucide-vue-next'
import EmployeeSearch from '~/components/EmployeeSearch.vue'
import ScenarioCard from '~/components/ScenarioCard.vue'
import EmployeeContextPanel from '~/components/EmployeeContextPanel.vue'
import RecentActivityPanel from '~/components/RecentActivityPanel.vue'
import PlantelSetupModal from '~/components/PlantelSetupModal.vue'
import PremiumAvatar from '~/components/PremiumAvatar.vue'

const { data: plantelesList } = useFetch('/api/catalogs/planteles', { default: () => [] })
const { data: myProfile, refresh: refreshProfile } = useFetch('/api/auth/profile')
const todayDate = dayjs().format('YYYY-MM-DD')

const selectedEmployees = ref([])
const activeScenario = ref(null)
const isSubmitting = ref(false)
const showDestino = ref(false)

// Directory Completion Setup Logic for multiple planteles
const checkingCoverage = ref(false)
const coverageQueue = ref([])
const verifiedPlanteles = ref(new Set())

const currentCoverageTask = computed(() => coverageQueue.value[0] || null)

const isAuthorizerForCurrent = computed(() => {
  if (!myProfile.value || selectedEmployees.value.length === 0) return true;
  const targetPlantel = selectedEmployees.value[0]?.plantelActual || selectedEmployees.value[0]?.plantelBase;
  return myProfile.value.authorizedPlanteles.includes(targetPlantel);
})

const hasSelfPass = computed(() => {
  return myProfile.value && selectedEmployees.value.some(e => e.name === myProfile.value.name)
})

async function checkCoverageQueue(emp) {
  const plantel = emp.plantelActual || emp.plantelBase
  if (!plantel || plantel === 'N/A') return
  
  if (verifiedPlanteles.value.has(plantel)) return
  if (coverageQueue.value.find(c => c.plantel === plantel)) return

  checkingCoverage.value = true
  try {
    const res = await $fetch('/api/directory/coverage', { params: { plantel } })
    if (!res.isComplete) {
      coverageQueue.value.push({
        plantel,
        employeeName: emp.name,
        ...res
      })
    } else {
      verifiedPlanteles.value.add(plantel)
    }
  } catch(e) {
    verifiedPlanteles.value.add(plantel)
  } finally {
    checkingCoverage.value = false
  }
}

function onSetupCompleted() {
  if (currentCoverageTask.value) {
    verifiedPlanteles.value.add(currentCoverageTask.value.plantel)
    coverageQueue.value.shift()
  }
}

function onSetupCancelled() {
  if (currentCoverageTask.value) {
    const plantel = currentCoverageTask.value.plantel
    coverageQueue.value.shift()
    
    selectedEmployees.value = selectedEmployees.value.filter(e => {
       if (e.plantelActual === plantel && e.plantelBase !== plantel) {
          e.plantelActual = e.plantelBase; 
          return true;
       }
       return e.plantelActual !== plantel;
    })
    
    if (selectedEmployees.value.length === 0) {
      activeScenario.value = null
    }
  }
}

async function addEmployee(emp) {
  if (!selectedEmployees.value.find(e => e.id === emp.id)) {
    const tempEmp = { ...emp, _enriching: true, _editingActual: false }
    selectedEmployees.value.push(tempEmp)

    const enriched = await $fetch('/api/employees/enrich', { query: { name: emp.name, id: emp.id } }).catch(() => ({}))
    
    const actualEmp = selectedEmployees.value.find(e => e.id === emp.id)
    if (actualEmp) {
      actualEmp.curp = enriched.curp || emp.curp || null
      actualEmp.plantelBase = enriched.plantel || emp.plantel || null
      actualEmp.plantelActual = actualEmp.plantelBase
      actualEmp.puesto = enriched.puesto || emp.puesto || null
      actualEmp.picture = enriched.picture || emp.picture || null
      actualEmp._editingActual = false
      actualEmp._enriching = false

      await checkCoverageQueue(actualEmp)
    }
  }
}

function removeEmployee(id) {
  selectedEmployees.value = selectedEmployees.value.filter(e => e.id !== id)
  if (selectedEmployees.value.length === 0) {
    activeScenario.value = null
    coverageQueue.value = []
  }
}

async function onPlantelActualSelected(emp) {
  emp._editingActual = false
  await checkCoverageQueue(emp)
}

async function resetPlantelActual(emp) {
  emp.plantelActual = emp.plantelBase
  emp._editingActual = false
  await checkCoverageQueue(emp)
}

const getCurrentTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const form = reactive({
  date: todayDate,
  endDate: todayDate,
  time: '',
  comentarios: '',
  destino: '',
  regreso: false,
  horaRegreso: '',
  imss: '',
  tipoIncapacidad: 'Enfermedad general',
  optInAuthorizer: false,
  authorizerPhone: ''
})

const predefinedScenarios = [
  { id: 'salida', title: 'Salida anticipada', icon: 'LogOut', categoryId: 2, needsTime: true, canReturn: true, isMedical: false },
  { id: 'llegada', title: 'Llegada tarde', icon: 'LogIn', categoryId: 1, needsTime: true, canReturn: false, isMedical: false },
  { id: 'falta', title: 'Ausencia justificada', icon: 'UserX', categoryId: 3, needsTime: false, canReturn: false, needsEndDate: true, isMedical: false },
  { id: 'imss', title: 'Incapacidad médica', icon: 'Stethoscope', categoryId: 5, needsTime: false, canReturn: false, needsEndDate: true, isMedical: true }
]

function selectScenario(scenario) {
  activeScenario.value = scenario
  showDestino.value = false
  Object.assign(form, { 
    date: todayDate, endDate: todayDate, time: '', 
    comentarios: '', destino: '', regreso: false, horaRegreso: '',
    imss: '', tipoIncapacidad: 'Enfermedad general',
    optInAuthorizer: false, authorizerPhone: ''
  })
}

function isBirthday(emp) {
  if (!emp || !emp.curp || emp.curp.length < 10) return false;
  const mm = emp.curp.substring(6, 8);
  const dd = emp.curp.substring(8, 10);
  const today = new Date();
  const bMonth = parseInt(mm) - 1;
  const bDay = parseInt(dd);
  return today.getMonth() === bMonth && (today.getDate() === bDay || today.getDate() + 1 === bDay);
}

function hasBirthday() {
  return selectedEmployees.value.some(emp => isBirthday(emp))
}

function applyPreset(type) {
  if (type === 'now') {
    form.time = getCurrentTime()
    form.comentarios = ''
    showDestino.value = false
    form.destino = ''
    form.regreso = false
  } else if (type === 'transfer') {
    form.time = getCurrentTime()
    showDestino.value = true
    form.regreso = true
  } else if (type === 'birthday') {
    form.date = todayDate
    form.endDate = todayDate
    form.time = '14:00'
    const emp = selectedEmployees.value.find(e => isBirthday(e))
    let birthdayStr = ''
    if (emp && emp.curp && emp.curp.length >= 10) {
      const dd = emp.curp.substring(8, 10)
      const mm = emp.curp.substring(6, 8)
      birthdayStr = ` (Nacimiento: ${dd}/${mm})`
    }
    form.comentarios = `Pase de salida anticipada con motivo de celebración de cumpleaños del colaborador${birthdayStr}.`
    showDestino.value = false
    form.destino = ''
    form.regreso = false
  }
}

watch(() => form.destino, (newDestino) => {
  if (showDestino.value) {
    if (newDestino) {
      const template = `Traslado al plantel ${newDestino} para cubrir requerimientos operativos.`;
      if (!form.comentarios || form.comentarios.startsWith('Traslado al plantel')) {
        form.comentarios = template;
      }
    } else {
      if (form.comentarios.startsWith('Traslado al plantel')) {
        form.comentarios = '';
      }
    }
  }
});

watch(() => showDestino.value, (newVal) => {
  if (!newVal) {
    form.destino = '';
    if (form.comentarios.startsWith('Traslado al plantel')) {
      form.comentarios = '';
    }
  }
});

async function submitPass(autoAuthorize = false) {
  if (isSubmitting.value) return
  if (!form.date || (!form.comentarios && activeScenario.value.categoryId !== 1)) {
    alert('Por favor, completa los campos requeridos.')
    return
  }
  isSubmitting.value = true
  
  try {
    if (form.optInAuthorizer && selectedEmployees.value.length > 0) {
      const targetPlantel = selectedEmployees.value[0].plantelActual || selectedEmployees.value[0].plantelBase;
      if (targetPlantel && myProfile.value?.email) {
        await $fetch('/api/directory', {
          method: 'POST',
          body: {
            plantel: targetPlantel,
            email: myProfile.value.email,
            role: 'Lead/Manager',
            channel: (form.authorizerPhone || myProfile.value.phone) ? 'WHATSAPP' : 'EMAIL',
            phone: form.authorizerPhone || undefined
          }
        }).catch(err => console.warn('Silently ignoring authorizer opt-in fail if it already exists', err));
        
        refreshProfile(); 
      }
    }

    await Promise.all(selectedEmployees.value.map(emp => 
      $fetch('/api/passes', {
        method: 'POST',
        body: { 
          employeeName: emp.name, 
          plantel: emp.plantelActual || emp.plantelBase || 'N/A', 
          categoryId: activeScenario.value.categoryId, 
          date: form.date,
          endDate: form.endDate,
          time: form.time,
          comentarios: form.comentarios,
          regreso: form.regreso,
          horaRegreso: form.horaRegreso,
          imss: form.imss,
          tipoIncapacidad: form.tipoIncapacidad,
          autoAuthorize
        }
      })
    ))
    
    activeScenario.value = null
    selectedEmployees.value = []
    coverageQueue.value = []
    form.optInAuthorizer = false;
    form.authorizerPhone = '';
    
    refreshNuxtData() 
  } catch(e) {
    console.error('Error', e)
    alert('Hubo un problema al registrar el pase.')
  } finally {
    isSubmitting.value = false
  }
}
</script>