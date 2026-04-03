<template>
  <div class="flex flex-col lg:flex-row h-full w-full font-sans">
    
    <!-- Left Column: Form Flow -->
    <section class="w-full lg:w-[45%] lg:min-w-[450px] flex flex-col bg-white border-r border-slate-200 z-20 min-h-[50vh] lg:h-screen lg:sticky lg:top-0">
      
      <header class="px-6 md:px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
        <div>
          <h1 class="text-xl font-bold text-slate-900">Emisión de Pase</h1>
          <p class="text-slate-500 mt-1 text-sm">Registrar incidencia oficial de colaborador</p>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto px-6 md:px-8 py-6 custom-scrollbar">
        
        <div class="mb-8">
          <label class="block text-sm font-semibold text-slate-900 mb-3">Buscar colaborador</label>
          <EmployeeSearch @select="addEmployee" />
          
          <div v-if="selectedEmployees.length > 0" class="flex flex-wrap gap-2 mt-3">
            <div v-for="emp in selectedEmployees" :key="emp.id" class="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg group">
              <div class="flex flex-col">
                <span class="text-sm font-medium text-slate-900">{{ emp.name.split(' ')[0] }} {{ emp.name.split(' ')[1] || '' }}</span>
              </div>
              <button type="button" @click="removeEmployee(emp.id)" class="text-slate-400 hover:text-slate-700 ml-1 p-0.5 focus:outline-none">
                <XIcon class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="selectedEmployees.length > 0" class="mb-8">
          <label class="block text-sm font-semibold text-slate-900 mb-3">Tipo de registro</label>
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

        <form v-if="activeScenario" @submit.prevent="submitPass" class="space-y-5 bg-slate-50 p-5 rounded-xl border border-slate-200">
          <h3 class="font-semibold text-slate-900 text-sm mb-4">Parámetros Operativos</h3>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5 col-span-2 md:col-span-1">
              <label class="block text-xs font-medium text-slate-700">Fecha de inicio</label>
              <input type="date" v-model="form.date" required class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900" />
            </div>
            <div v-if="activeScenario.needsEndDate" class="space-y-1.5 col-span-2 md:col-span-1">
              <label class="block text-xs font-medium text-slate-700">Fecha de fin</label>
              <input type="date" v-model="form.endDate" required class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900" />
            </div>
            <div v-if="activeScenario.needsTime" class="space-y-1.5 col-span-2 md:col-span-1">
              <label class="block text-xs font-medium text-slate-700">Hora del evento</label>
              <input type="time" v-model="form.time" required class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900" />
            </div>
          </div>

          <div v-if="activeScenario.canReturn" class="flex items-center gap-3">
            <input type="checkbox" id="regreso" v-model="form.regreso" class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
            <label for="regreso" class="text-sm font-medium text-slate-700 cursor-pointer">Regresa al plantel hoy</label>
          </div>

          <div v-if="form.regreso" class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">Hora de regreso</label>
            <input type="time" v-model="form.horaRegreso" required class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900" />
          </div>

          <div v-if="activeScenario.isMedical" class="space-y-4 p-4 bg-white rounded-lg border border-slate-200">
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-700">Folio IMSS</label>
              <input type="text" v-model="form.imss" class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-700">Clasificación</label>
              <select v-model="form.tipoIncapacidad" class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 bg-none">
                <option value="Enfermedad en General">Enfermedad en General</option>
                <option value="Riesgo de Trabajo">Riesgo de Trabajo</option>
                <option value="Maternidad">Maternidad</option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-slate-700">Justificación Oficial</label>
            <textarea v-model="form.comentarios" rows="2" required class="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm text-slate-900 resize-none"></textarea>
          </div>

          <div class="pt-2">
            <button type="submit" :disabled="isSubmitting" class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <span>{{ isSubmitting ? 'Registrando...' : 'Emitir Documento' }}</span>
            </button>
          </div>
        </form>
      </div>
    </section>

    <!-- Right Column: Context -->
    <section class="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-slate-50 relative lg:h-screen">
      <div class="max-w-3xl mx-auto flex flex-col gap-6">
        <template v-if="selectedEmployees.length > 0">
          <EmployeeContextPanel v-for="emp in selectedEmployees" :key="emp.id" :employee="emp" />
        </template>
        <template v-else>
          <RecentActivityPanel />
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
  { id: 'falta', title: 'Falta Justificada', icon: 'UserX', categoryId: 3, needsTime: false, canReturn: false, needsEndDate: true, isMedical: false },
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
    alert('Hubo un problema al registrar la incidencia.')
  } finally {
    isSubmitting.value = false
  }
}
</script>