<template>
  <div class="flex flex-col xl:flex-row h-full w-full">
    
    <!-- Left Column: Search & Action Form -->
    <section class="w-full xl:w-[48%] flex flex-col bg-white/60 backdrop-blur-md border-r border-slate-200/60 z-20 min-h-[50vh] xl:h-screen xl:sticky xl:top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      
      <header class="px-8 py-8 border-b border-slate-200/60 bg-white/50">
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Emisión de Pase</h1>
        <p class="text-slate-500 mt-2 text-sm font-bold">Justificación formal de incidencias del personal.</p>
      </header>

      <div class="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar relative">
        
        <!-- Search Section -->
        <div class="mb-10">
          <label class="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest">Localizar Colaborador</label>
          <EmployeeSearch @select="addEmployee" />
          
          <div v-if="selectedEmployees.length > 0" class="flex flex-col gap-3 mt-5">
            <div v-for="emp in selectedEmployees" :key="emp.id" class="flex flex-col w-full bg-white border border-slate-200 p-4 rounded-2xl group shadow-sm transition-all hover:border-brand-300 hover:shadow-md">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-3">
                   <PremiumAvatar :src="emp.picture || null" :name="emp.name" size="sm" class="shrink-0" />
                   <span class="text-base font-black text-slate-800">{{ emp.name }}</span>
                </div>
                <button type="button" @click="removeEmployee(emp.id)" class="text-slate-400 hover:text-white bg-slate-50 hover:bg-red-500 w-8 h-8 flex items-center justify-center rounded-full transition-colors focus:outline-none border border-slate-100 shrink-0">
                  <XIcon class="w-4 h-4" />
                </button>
              </div>
              
              <div v-if="emp._enriching" class="flex gap-2 mt-2">
                <div class="h-6 w-24 bg-slate-100 animate-pulse rounded-lg"></div>
                <div class="h-6 w-32 bg-slate-100 animate-pulse rounded-lg"></div>
              </div>
              <div v-else class="flex flex-col gap-3 w-full mt-1">
                <div class="flex flex-wrap items-center gap-2">
                  <!-- Role -->
                  <span v-if="emp.puesto" class="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg border border-brand-100/60 flex items-center gap-1.5">
                    <Briefcase class="w-3.5 h-3.5 text-brand-400" />
                    {{ emp.puesto }}
                  </span>

                  <!-- Origin Plantel -->
                  <span v-if="emp.originPlantel" class="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200/60 flex items-center gap-1.5 transition-opacity duration-300" :class="{'opacity-50': emp.operationalPlantel && emp.operationalPlantel !== emp.originPlantel}">
                    <Building2 class="w-3.5 h-3.5 text-slate-400" />
                    {{ emp.originPlantel }}
                  </span>

                  <!-- Destination Transition -->
                  <template v-if="emp.operationalPlantel && emp.operationalPlantel !== emp.originPlantel">
                    <ArrowRight class="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span class="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-black rounded-lg border border-purple-200/80 shadow-sm flex items-center gap-1.5 animate-in slide-in-from-left-2 duration-300">
                      <MapPin class="w-3.5 h-3.5 text-purple-500" />
                      Destino: {{ emp.operationalPlantel }}
                      <button type="button" @click.stop="resetDestino(emp)" class="ml-1 hover:text-purple-900 bg-purple-100/50 p-0.5 rounded-md transition-colors outline-none"><XIcon class="w-3 h-3"/></button>
                    </span>
                  </template>
                  
                  <!-- Trigger for movement -->
                  <button v-else-if="!emp._selectingDestino" type="button" @click.stop="emp._selectingDestino = true" class="text-[10px] font-black text-slate-400 hover:text-purple-600 px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-1 border border-transparent hover:border-purple-200 outline-none">
                    <MapPin class="w-3 h-3" /> Moverse
                  </button>
                </div>

                <!-- Inline Selector for Destination Plantel -->
                <div v-if="emp._selectingDestino" class="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-end gap-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-inner">
                   <div class="flex-1">
                      <label class="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-2 block flex items-center gap-1.5"><MapPin class="w-3 h-3 text-purple-500"/> Base Operativa Destino</label>
                      <select v-model="emp.operationalPlantel" @change="onDestinoSelected(emp)" class="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-800 bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-500 outline-none shadow-sm cursor-pointer transition-all">
                         <option v-for="p in plantelesList" :key="p" :value="p">{{ p }}</option>
                      </select>
                   </div>
                   <button type="button" @click="emp._selectingDestino = false" class="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors border border-transparent outline-none">
                      <XIcon class="w-4 h-4" />
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Directory Coverage Loading State -->
        <div v-if="checkingCoverage" class="mb-10 py-10 flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border border-slate-100 animate-pulse">
           <Loader2 class="w-8 h-8 animate-spin text-brand-400 mb-3" />
           <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Verificando estado operativo...</p>
        </div>
        
        <template v-else-if="!currentCoverageTask && selectedEmployees.length > 0">
          <!-- Intelligent Quick Actions Layer -->
          <div class="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label class="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest">Accesos Rápidos</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Birthday Action -->
              <button v-if="hasBirthday()" @click="triggerBirthdayQuickAction" type="button" class="relative overflow-hidden bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 text-left transition-transform hover:scale-[1.02] hover:shadow-lg outline-none group border border-orange-400/50 flex items-center gap-4">
                <div class="absolute right-0 top-0 bottom-0 w-32 bg-white/20 blur-2xl transform skew-x-12 translate-x-10 group-hover:translate-x-0 transition-transform duration-700"></div>
                <div class="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Cake class="w-5 h-5" />
                </div>
                <div class="relative z-10">
                  <h3 class="text-sm font-black text-white tracking-tight">Pase de Cumpleaños 🎉</h3>
                  <p class="text-[10px] font-bold text-orange-100 mt-0.5">Prellenar salida temprano (2:00 PM)</p>
                </div>
              </button>

              <!-- Early Leave Quick Action -->
              <button @click="triggerEarlyLeaveQuickAction" type="button" class="bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-2xl p-4 text-left transition-all shadow-sm hover:shadow-md outline-none flex items-center gap-4 group">
                <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <LogOut class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="text-sm font-black text-slate-800">Salida Temprano</h4>
                  <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Atajo de uso frecuente</p>
                </div>
              </button>

              <!-- Moverse de Plantel Quick Action -->
              <button @click="triggerMoverseQuickAction" type="button" class="bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 rounded-2xl p-4 text-left transition-all shadow-sm hover:shadow-md outline-none flex items-center gap-4 group" :class="hasBirthday() ? 'sm:col-span-2' : ''">
                <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <ArrowRightLeft class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="text-sm font-black text-slate-800">Moverse de Plantel</h4>
                  <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Asignar nueva base operativa</p>
                </div>
              </button>
            </div>
          </div>

          <!-- Standard Scenarios Section -->
          <div class="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label class="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest">Catálogo Estándar</label>
            <div class="grid grid-cols-2 gap-4">
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

          <!-- Form Section -->
          <form v-if="activeScenario" @submit.prevent="submitPass" class="space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-card animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1.5 bg-brand-500"></div>
            
            <h3 class="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
              <PenTool class="w-5 h-5 text-brand-500" />
              Detalles Operativos
            </h3>

            <div class="grid grid-cols-2 gap-5">
              <div class="space-y-2 col-span-2 md:col-span-1">
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha Inicio</label>
                <input type="date" v-model="form.date" :min="todayDate" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-slate-50/50" />
              </div>
              <div v-if="activeScenario.needsEndDate" class="space-y-2 col-span-2 md:col-span-1">
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha Fin</label>
                <input type="date" v-model="form.endDate" :min="todayDate" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-slate-50/50" />
              </div>
              <div v-if="activeScenario.needsTime" class="space-y-2 col-span-2 md:col-span-1">
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora Evento</label>
                <input type="time" v-model="form.time" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-slate-50/50" />
              </div>
            </div>

            <div v-if="activeScenario.canReturn" class="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <input type="checkbox" id="regreso" v-model="form.regreso" class="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300 transition-colors cursor-pointer" />
              <label for="regreso" class="text-sm font-black text-slate-700 cursor-pointer select-none">El colaborador retorna en la misma jornada</label>
            </div>

            <div v-if="form.regreso" class="space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora Estimada de Retorno</label>
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
                  <option value="Enfermedad en General">Enfermedad en General</option>
                  <option value="Riesgo de Trabajo">Riesgo de Trabajo</option>
                  <option value="Maternidad">Maternidad</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Justificación u Observaciones</label>
              <textarea v-model="form.comentarios" rows="3" placeholder="Redacta el motivo de forma clara..." required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-medium text-slate-900 resize-none transition-all bg-slate-50/50"></textarea>
            </div>

            <div class="pt-4">
              <button type="submit" :disabled="isSubmitting" class="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-black text-base rounded-2xl transition-all shadow-md hover:shadow-xl disabled:opacity-70 disabled:hover:bg-brand-600 flex items-center justify-center gap-3 outline-none transform active:scale-[0.98]">
                <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin" />
                <Send v-else class="w-5 h-5" />
                <span>{{ isSubmitting ? 'Procesando Envío...' : 'Generar y Notificar Pase' }}</span>
              </button>
            </div>
          </form>
        </template>
      </div>
    </section>

    <!-- Right Column: Operational Context -->
    <section class="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar relative xl:h-screen bg-transparent z-10">
      <div class="max-w-3xl mx-auto flex flex-col gap-8">
        <template v-if="selectedEmployees.length > 0">
          <div class="flex items-center justify-between pb-4 border-b border-slate-200/60">
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">Expediente Operativo</h2>
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
import { ref, reactive, computed } from 'vue'
import dayjs from 'dayjs'
import { Loader2, X as XIcon, Cake, ArrowRight, LogOut, PenTool, Send, Building2, Briefcase, MapPin, ArrowRightLeft } from 'lucide-vue-next'
import EmployeeSearch from '~/components/EmployeeSearch.vue'
import ScenarioCard from '~/components/ScenarioCard.vue'
import EmployeeContextPanel from '~/components/EmployeeContextPanel.vue'
import RecentActivityPanel from '~/components/RecentActivityPanel.vue'
import PlantelSetupModal from '~/components/PlantelSetupModal.vue'
import PremiumAvatar from '~/components/PremiumAvatar.vue'

const { data: plantelesList } = useFetch('/api/catalogs/planteles', { default: () => [] })
const todayDate = dayjs().format('YYYY-MM-DD')

const selectedEmployees = ref([])
const activeScenario = ref(null)
const isSubmitting = ref(false)

// Directory Completion Setup Logic for multiple planteles
const checkingCoverage = ref(false)
const coverageQueue = ref([])
const verifiedPlanteles = ref(new Set())

const currentCoverageTask = computed(() => coverageQueue.value[0] || null)

async function checkCoverageQueue(emp) {
  const plantel = emp.operationalPlantel || emp.originPlantel
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
    // Find all employees that were pointing to this cancelled destination and reset them or remove them
    selectedEmployees.value = selectedEmployees.value.filter(e => {
       if (e.operationalPlantel === plantel && e.originPlantel !== plantel) {
          e.operationalPlantel = e.originPlantel; // Graceful rollback to origin
          return true;
       }
       return e.operationalPlantel !== plantel;
    })
    
    if (selectedEmployees.value.length === 0) {
      activeScenario.value = null
    }
  }
}

async function addEmployee(emp) {
  if (!selectedEmployees.value.find(e => e.id === emp.id)) {
    // Optimistic UI insert with enrichment skeleton
    const tempEmp = { ...emp, _enriching: true, _selectingDestino: false }
    selectedEmployees.value.push(tempEmp)

    // Server-side enrichment query
    const enriched = await $fetch('/api/employees/enrich', { query: { name: emp.name, id: emp.id } }).catch(() => ({}))
    
    // Update live object
    const actualEmp = selectedEmployees.value.find(e => e.id === emp.id)
    if (actualEmp) {
      actualEmp.curp = enriched.curp || emp.curp || null
      actualEmp.originPlantel = enriched.plantel || emp.plantel || null
      actualEmp.operationalPlantel = actualEmp.originPlantel
      actualEmp.puesto = enriched.puesto || emp.puesto || null
      actualEmp.picture = enriched.picture || emp.picture || null
      actualEmp._selectingDestino = false
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

async function onDestinoSelected(emp) {
  emp._selectingDestino = false
  await checkCoverageQueue(emp)
}

async function resetDestino(emp) {
  emp.operationalPlantel = emp.originPlantel
  emp._selectingDestino = false
  await checkCoverageQueue(emp)
}

function triggerMoverseQuickAction() {
  selectedEmployees.value.forEach(emp => {
    emp._selectingDestino = true
  })
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
  regreso: false,
  horaRegreso: '',
  imss: '',
  tipoIncapacidad: 'Enfermedad en General'
})

const predefinedScenarios = [
  { id: 'salida', title: 'Salida Anticipada', icon: 'LogOut', categoryId: 2, needsTime: true, canReturn: true, isMedical: false },
  { id: 'llegada', title: 'Llegada Tarde', icon: 'LogIn', categoryId: 1, needsTime: true, canReturn: false, isMedical: false },
  { id: 'falta', title: 'Ausencia Justificada', icon: 'UserX', categoryId: 3, needsTime: false, canReturn: false, needsEndDate: true, isMedical: false },
  { id: 'imss', title: 'Incapacidad Médica', icon: 'Stethoscope', categoryId: 5, needsTime: false, canReturn: false, needsEndDate: true, isMedical: true }
]

function selectScenario(scenario) {
  activeScenario.value = scenario
  Object.assign(form, { 
    date: todayDate, endDate: todayDate, time: '', 
    comentarios: '', regreso: false, horaRegreso: '',
    imss: '', tipoIncapacidad: 'Enfermedad en General'
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

function triggerBirthdayQuickAction() {
  const salidaScenario = predefinedScenarios.find(s => s.categoryId === 2)
  selectScenario(salidaScenario)
  form.date = todayDate
  form.endDate = todayDate
  form.time = '14:00'
  
  const emp = selectedEmployees.value.find(e => isBirthday(e))
  let birthdayStr = ''
  if (emp && emp.curp && emp.curp.length >= 10) {
    const dd = emp.curp.substring(8, 10)
    const mm = emp.curp.substring(6, 8)
    birthdayStr = ` (Fecha de nacimiento: ${dd}/${mm})`
  }
  
  form.comentarios = `Pase de salida temprano con motivo de celebración de cumpleaños del colaborador${birthdayStr}.`
}

function triggerEarlyLeaveQuickAction() {
  const salidaScenario = predefinedScenarios.find(s => s.categoryId === 2)
  selectScenario(salidaScenario)
  form.time = getCurrentTime()
  form.comentarios = ''
}

async function submitPass() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  
  try {
    await Promise.all(selectedEmployees.value.map(emp => 
      $fetch('/api/passes', {
        method: 'POST',
        body: { 
          employeeName: emp.name, 
          plantel: emp.operationalPlantel || emp.originPlantel || 'N/A', 
          categoryId: activeScenario.value.categoryId, 
          ...form 
        }
      })
    ))
    
    activeScenario.value = null
    selectedEmployees.value = []
    coverageQueue.value = []
    
    refreshNuxtData() 
  } catch(e) {
    console.error('Error', e)
    alert('Hubo un problema al registrar el pase.')
  } finally {
    isSubmitting.value = false
  }
}
</script>