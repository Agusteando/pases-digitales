<template>
  <div class="flex flex-col lg:flex-row h-full w-full">
    
    <!-- Left Column: Search & Action Form -->
    <section class="w-full lg:w-[45%] xl:w-[40%] flex flex-col bg-white/60 backdrop-blur-sm border-r border-slate-200 z-20 min-h-[50vh] lg:h-screen lg:sticky lg:top-0 shadow-sm">
      
      <header class="px-6 md:px-8 py-6 border-b border-slate-200/60 bg-white">
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">Emisión de Pase</h1>
        <p class="text-slate-500 mt-1 text-sm font-medium">Genera pases digitales de manera ágil y segura.</p>
      </header>

      <div class="flex-1 overflow-y-auto px-6 md:px-8 py-8 custom-scrollbar">
        
        <!-- Search Section -->
        <div class="mb-8">
          <label class="block text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Buscar Colaborador</label>
          <EmployeeSearch @select="addEmployee" />
          
          <div v-if="selectedEmployees.length > 0" class="flex flex-wrap gap-2 mt-4">
            <div v-for="emp in selectedEmployees" :key="emp.id" class="flex items-center gap-2 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg group shadow-sm transition-all">
              <span class="text-sm font-bold text-brand-900">{{ emp.name.split(' ')[0] }} {{ emp.name.split(' ')[1] || '' }}</span>
              <button type="button" @click="removeEmployee(emp.id)" class="text-brand-400 hover:text-brand-700 p-0.5 focus:outline-none transition-colors hover:bg-brand-100 rounded">
                <XIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Scenarios Section -->
        <div v-if="selectedEmployees.length > 0" class="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <label class="block text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Tipo de Pase</label>
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

        <!-- Form Section -->
        <form v-if="activeScenario" @submit.prevent="submitPass" class="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>
          
          <h3 class="font-extrabold text-slate-900 text-base mb-2">Detalles del Pase</h3>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5 col-span-2 md:col-span-1">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha inicio</label>
              <input type="date" v-model="form.date" required class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-medium text-slate-900 transition-all shadow-sm" />
            </div>
            <div v-if="activeScenario.needsEndDate" class="space-y-1.5 col-span-2 md:col-span-1">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha fin</label>
              <input type="date" v-model="form.endDate" required class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-medium text-slate-900 transition-all shadow-sm" />
            </div>
            <div v-if="activeScenario.needsTime" class="space-y-1.5 col-span-2 md:col-span-1">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hora evento</label>
              <input type="time" v-model="form.time" required class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-medium text-slate-900 transition-all shadow-sm" />
            </div>
          </div>

          <div v-if="activeScenario.canReturn" class="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <input type="checkbox" id="regreso" v-model="form.regreso" class="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 transition-colors cursor-pointer" />
            <label for="regreso" class="text-sm font-bold text-slate-700 cursor-pointer select-none">El colaborador regresa al plantel hoy</label>
          </div>

          <div v-if="form.regreso" class="space-y-1.5">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hora estimada de regreso</label>
            <input type="time" v-model="form.horaRegreso" required class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-medium text-slate-900 transition-all shadow-sm" />
          </div>

          <!-- Medical specifics -->
          <div v-if="activeScenario.isMedical" class="space-y-4 p-4 bg-teal-50/50 rounded-xl border border-teal-100">
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Folio IMSS</label>
              <input type="text" v-model="form.imss" placeholder="Ej. 12345678" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-medium text-slate-900 transition-all shadow-sm" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Clasificación Médica</label>
              <select v-model="form.tipoIncapacidad" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-medium text-slate-900 transition-all shadow-sm bg-white">
                <option value="Enfermedad en General">Enfermedad en General</option>
                <option value="Riesgo de Trabajo">Riesgo de Trabajo</option>
                <option value="Maternidad">Maternidad</option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Justificación</label>
            <textarea v-model="form.comentarios" rows="2" placeholder="Motivo o detalle del pase..." required class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-medium text-slate-900 resize-none transition-all shadow-sm"></textarea>
          </div>

          <div class="pt-2">
            <button type="submit" :disabled="isSubmitting" class="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:hover:bg-brand-600 flex items-center justify-center gap-2">
              <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin" />
              <span>{{ isSubmitting ? 'Procesando...' : 'Autorizar y Generar Folio' }}</span>
            </button>
          </div>
        </form>
      </div>
    </section>

    <!-- Right Column: Operational Context -->
    <section class="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar relative lg:h-screen bg-transparent z-10">
      <div class="max-w-3xl mx-auto flex flex-col gap-6">
        <template v-if="selectedEmployees.length > 0">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 class="text-xl font-black text-slate-900 tracking-tight">Historial del Colaborador</h2>
          </div>
          <EmployeeContextPanel v-for="emp in selectedEmployees" :key="emp.id" :employee="emp" class="animate-in fade-in slide-in-from-right-4 duration-300" />
        </template>
        <template v-else>
          <RecentActivityPanel class="animate-in fade-in duration-500" />
        </template>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Loader2, X as XIcon } from 'lucide-vue-next'
import EmployeeSearch from '~/components/EmployeeSearch.vue'
import ScenarioCard from '~/components/ScenarioCard.vue'
import EmployeeContextPanel from '~/components/EmployeeContextPanel.vue'
import RecentActivityPanel from '~/components/RecentActivityPanel.vue'

const selectedEmployees = ref([])
const activeScenario = ref(null)
const isSubmitting = ref(false)

function addEmployee(emp) {
  if (!selectedEmployees.value.find(e => e.id === emp.id)) {
    selectedEmployees.value.push(emp)
  }
}

function removeEmployee(id) {
  selectedEmployees.value = selectedEmployees.value.filter(e => e.id !== id)
  if (selectedEmployees.value.length === 0) activeScenario.value = null
}

const getToday = () => new Date().toISOString().split('T')[0]

const form = reactive({
  date: getToday(),
  endDate: '',
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
    date: getToday(), endDate: getToday(), time: '', 
    comentarios: '', regreso: false, horaRegreso: '',
    imss: '', tipoIncapacidad: 'Enfermedad en General'
  })
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
          plantel: emp.plantel || 'N/A', 
          categoryId: activeScenario.value.categoryId, 
          ...form 
        }
      })
    ))
    
    activeScenario.value = null
    selectedEmployees.value = []
    
    refreshNuxtData() 
  } catch(e) {
    console.error('Error', e)
    alert('Hubo un problema al registrar el pase.')
  } finally {
    isSubmitting.value = false
  }
}
</script>