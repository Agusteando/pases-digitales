### pages/index.vue
<template>
  <div class="flex flex-col xl:flex-row w-full min-h-[100dvh] xl:h-screen xl:overflow-hidden bg-transparent">
    
    <!-- LEFT COLUMN (Dynamic Layout Switcher) -->
    <section 
      class="w-full flex flex-col shrink-0 border-b xl:border-b-0 border-slate-200 z-30 xl:h-full transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] relative bg-white overflow-hidden"
      :class="activeScenario ? 'xl:w-[280px] 2xl:w-[320px] xl:border-r' : 'xl:w-[460px] 2xl:w-[500px] xl:border-r'"
    >
      <!-- STATE 1: NORMAL EXPANDED MODE -->
      <div class="absolute top-0 left-0 h-full flex flex-col transition-all duration-500 w-full xl:w-[460px] 2xl:w-[500px] z-10"
           :class="activeScenario ? 'opacity-0 translate-x-[-20px] pointer-events-none' : 'opacity-100 translate-x-0 delay-200'">
        <header class="px-6 md:px-8 py-6 md:py-8 border-b border-slate-100 bg-white shrink-0">
          <h1 class="text-2xl font-semibold text-slate-900 tracking-tight">Nuevo pase</h1>
          <p class="text-slate-500 mt-1 text-sm">Registro y justificación de incidencias</p>
        </header>

        <div class="flex-1 overflow-y-auto px-6 py-6 md:px-8 custom-scrollbar relative flex flex-col gap-8 min-h-0">
          
          <div class="relative">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors"
                   :class="selectedEmployees.length > 0 ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-500'">
                <span>1</span>
              </div>
              <div>
                <h2 class="text-sm font-semibold text-slate-800 tracking-tight">Seleccionar colaborador</h2>
              </div>
            </div>
            
            <EmployeeSearch @select="addEmployee" />
            
            <div v-if="selectedEmployees.length > 0" class="flex flex-col gap-3 mt-4">
              <div v-for="emp in selectedEmployees" :key="emp.id" class="flex flex-col w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm group transition-all relative overflow-hidden hover:border-brand-200">
                <div class="flex items-start justify-between mb-2 relative z-10">
                  <div class="flex items-center gap-3 min-w-0 pr-2">
                     <PremiumAvatar :src="emp.picture || null" :name="emp.name" size="md" class="shrink-0" />
                     <div class="flex flex-col min-w-0">
                       <span class="text-sm font-semibold text-slate-900 truncate" :title="emp.name">{{ emp.name }}</span>
                       <span v-if="myProfile && emp.name === myProfile.name" class="text-[10px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded mt-1 w-max">Registro propio</span>
                     </div>
                  </div>
                  <button type="button" @click="removeEmployee(emp.id)" class="text-slate-400 hover:text-red-500 bg-transparent w-7 h-7 flex items-center justify-center rounded-full transition-colors focus:outline-none shrink-0 outline-none">
                    <XIcon class="w-4 h-4 shrink-0" />
                  </button>
                </div>
                
                <div v-if="emp._enriching" class="flex gap-2 mt-1">
                  <div class="h-4 w-20 bg-slate-100 animate-pulse rounded-md"></div>
                  <div class="h-4 w-28 bg-slate-100 animate-pulse rounded-md"></div>
                </div>
                <div v-else class="flex flex-col gap-2 w-full mt-1 relative z-10 pt-3 border-t border-slate-50">
                  <div class="flex flex-wrap items-center gap-2">
                    <span v-if="emp.puesto" class="text-slate-500 text-xs flex items-center gap-1">
                      <Briefcase class="w-3.5 h-3.5" /> {{ emp.puesto }}
                    </span>
                    <span v-if="emp.puesto && emp.plantelBase" class="text-slate-300">•</span>
                    <span v-if="emp.plantelBase" class="text-slate-500 text-xs flex items-center gap-1" :class="{'opacity-60': emp.plantelActual && emp.plantelActual !== emp.plantelBase}">
                      <Building2 class="w-3.5 h-3.5" />
                      {{ emp.plantelBase }}
                    </span>
                    
                    <template v-if="emp.plantelActual && emp.plantelActual !== emp.plantelBase">
                      <span class="text-brand-600 text-xs font-medium flex items-center gap-1 animate-in fade-in duration-300 ml-2 bg-brand-50 px-2 py-0.5 rounded-md">
                        <MapPin class="w-3.5 h-3.5" />
                        {{ emp.plantelActual }}
                        <button type="button" @click.stop="resetPlantelActual(emp)" class="ml-1 hover:text-brand-800 transition-colors outline-none flex items-center justify-center"><XIcon class="w-3 h-3 shrink-0"/></button>
                      </span>
                    </template>
                    <button v-else-if="!emp._editingActual" type="button" @click.stop="emp._editingActual = true" class="text-[10px] font-medium text-slate-400 hover:text-brand-600 ml-2 transition-colors flex items-center gap-1 outline-none">
                      <MapPin class="w-3 h-3 shrink-0" /> Cambiar
                    </button>
                  </div>

                  <div v-if="emp._editingActual" class="p-2 bg-slate-50 rounded-lg flex items-center gap-2 animate-in fade-in duration-200 mt-2">
                     <div class="flex-1">
                        <select v-model="emp.plantelActual" @change="onPlantelActualSelected(emp)" class="w-full px-2 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:ring-1 focus:ring-brand-400 focus:border-brand-400 outline-none cursor-pointer transition-all">
                           <option v-for="p in plantelesList" :key="p" :value="p">{{ p }}</option>
                        </select>
                     </div>
                     <button type="button" @click="emp._editingActual = false" class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-transparent rounded-md transition-colors outline-none shrink-0">
                        <XIcon class="w-3.5 h-3.5 shrink-0" />
                     </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="checkingCoverage" class="py-8 flex flex-col items-center justify-center bg-slate-50 rounded-xl">
             <Loader2 class="w-6 h-6 animate-spin text-brand-500 mb-2 shrink-0" />
             <p class="text-xs font-medium text-slate-500">Verificando responsables...</p>
          </div>
          
          <div v-else-if="!currentCoverageTask && selectedEmployees.length > 0" class="relative animate-in slide-in-from-bottom-4 fade-in duration-500 pb-8">
            <div class="flex items-center gap-3 mb-4 transition-opacity duration-300" :class="selectedEmployees.length === 0 ? 'opacity-50' : 'opacity-100'">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors"
                   :class="activeScenario ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-500'">
                <span>2</span>
              </div>
              <div>
                <h2 class="text-sm font-semibold text-slate-800 tracking-tight">Motivo de la incidencia</h2>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </div>
      </div>

      <!-- STATE 2: COMPACT SIDEBAR MODE -->
      <div class="absolute top-0 left-0 h-full flex flex-col transition-all duration-500 bg-white w-full xl:w-[280px] 2xl:w-[320px] z-20"
           :class="activeScenario ? 'opacity-100 translate-x-0 delay-200' : 'opacity-0 translate-x-[-20px] pointer-events-none'">
        
        <div class="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar flex flex-col gap-6">
          
          <div class="flex items-center justify-between mb-1 border-b border-slate-100 pb-2">
            <h2 class="text-xs font-semibold text-slate-800">Colaboradores</h2>
            <button @click="resetFlow" class="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors outline-none flex items-center gap-1">
              <RotateCcw class="w-3.5 h-3.5" /> Reiniciar
            </button>
          </div>

          <div class="flex flex-col gap-2">
            <div v-for="emp in selectedEmployees" :key="emp.id" class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group relative overflow-hidden">
              <div class="flex items-center gap-3 w-full min-w-0 pr-2">
                <PremiumAvatar :src="emp.picture" :name="emp.name" size="sm" class="shrink-0" />
                <div class="flex flex-col min-w-0">
                  <span class="text-sm font-medium text-slate-900 truncate" :title="emp.name">{{ emp.name.split(' ')[0] }} {{ emp.name.split(' ')[1] || '' }}</span>
                  <span class="text-xs text-slate-500 truncate">{{ emp.plantelActual || emp.plantelBase }}</span>
                </div>
              </div>
              <button @click="removeEmployee(emp.id)" class="text-slate-400 hover:text-red-500 w-6 h-6 flex items-center justify-center rounded-full transition-colors shrink-0 outline-none">
                <XIcon class="w-4 h-4" />
              </button>
            </div>
            
            <button @click="activeScenario = null" class="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors outline-none border border-transparent hover:bg-brand-50">
              <Plus class="w-3.5 h-3.5" /> Añadir otro
            </button>
          </div>

          <div class="flex flex-col gap-2 relative mt-4">
            <h3 class="text-xs font-semibold text-slate-800 mb-2 border-b border-slate-100 pb-2">Motivo</h3>
            <button 
              v-for="scenario in predefinedScenarios" 
              :key="scenario.id"
              @click="selectScenario(scenario)"
              class="flex items-center gap-3 w-full p-2.5 rounded-xl transition-all outline-none text-left group"
              :class="activeScenario?.id === scenario.id 
                ? 'bg-brand-50 ring-1 ring-brand-200' 
                : 'bg-white hover:bg-slate-50 border border-transparent hover:border-slate-200'"
            >
              <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
                   :class="activeScenario?.id === scenario.id ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500'">
                <component :is="getScenarioIcon(scenario.icon)" class="w-4 h-4 shrink-0" />
              </div>
              <span class="text-sm font-medium tracking-tight" :class="activeScenario?.id === scenario.id ? 'text-brand-900 font-semibold' : 'text-slate-700'">{{ scenario.title }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- MIDDLE COLUMN (Form Details) -->
    <section 
      class="transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden shrink-0 flex flex-col bg-white z-20 relative"
      :class="activeScenario ? 'max-h-[3000px] xl:max-h-none xl:w-[480px] 2xl:w-[560px] opacity-100 border-b xl:border-b-0 xl:border-r border-slate-200' : 'max-h-0 xl:max-h-none xl:w-0 opacity-0 border-transparent'"
    >
      <div class="w-full xl:w-[480px] 2xl:w-[560px] shrink-0 h-full flex flex-col relative transition-opacity duration-500 delay-300"
           :class="activeScenario ? 'opacity-100' : 'opacity-0'">
        <template v-if="activeScenario">
          <header class="hidden xl:flex px-6 py-6 border-b border-slate-100 bg-white shrink-0 items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                <component :is="getScenarioIcon(activeScenario.icon)" class="w-4 h-4 text-brand-600" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-900">{{ activeScenario.title }}</h2>
              </div>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto px-5 py-6 md:px-6 custom-scrollbar relative flex flex-col min-h-0 bg-white">
            
            <div class="xl:hidden flex items-center gap-3 mb-5">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors"
                   :class="isFormComplete ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-500'">
                <span>3</span>
              </div>
              <div>
                <h2 class="text-sm font-semibold text-slate-800">Completar información</h2>
              </div>
            </div>

            <form @submit.prevent class="relative flex flex-col gap-6 py-2">
              
              <!-- Quick Presets -->
              <div v-if="activeScenario.categoryId === 2" class="flex flex-wrap items-center gap-2 pb-5 border-b border-slate-100">
                <button type="button" @click="applyPreset('now')" class="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 outline-none">
                  <Clock class="w-3.5 h-3.5" /> Hora actual
                </button>
                <button type="button" @click="applyPreset('transfer')" class="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 outline-none">
                  <MapPin class="w-3.5 h-3.5" /> Traslado plantel
                </button>
                <button v-if="hasBirthday()" type="button" @click="applyPreset('birthday')" class="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 outline-none">
                  <Cake class="w-3.5 h-3.5" /> Cumpleaños
                </button>
              </div>

              <!-- SECTION: Fechas y horarios -->
              <div class="relative group">
                <h3 class="text-[11px] font-semibold text-slate-800 mb-3 block w-full">Fechas y horarios</h3>
                
                <div v-if="activeScenario.categoryId === 4" class="space-y-4 mb-4 pb-4 border-b border-slate-100">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="space-y-1.5">
                      <label class="block text-xs font-medium text-slate-600">Fecha a cubrir</label>
                      <input type="date" v-model="form.shiftDate" :min="todayDate" class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm text-slate-800 transition-all bg-white" />
                    </div>
                    <div class="space-y-1.5">
                      <label class="block text-xs font-medium text-slate-600">Inicio</label>
                      <input type="time" v-model="form.shiftStart" class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm text-slate-800 transition-all bg-white" />
                    </div>
                    <div class="space-y-1.5">
                      <label class="block text-xs font-medium text-slate-600">Fin</label>
                      <input type="time" v-model="form.shiftEnd" class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm text-slate-800 transition-all bg-white" />
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-1.5 col-span-2 sm:col-span-1">
                    <label class="block text-xs font-medium text-slate-600">Fecha de inicio</label>
                    <input type="date" v-model="form.date" :min="todayDate" required class="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm text-slate-800 transition-all bg-white" />
                  </div>
                  
                  <div v-if="activeScenario.needsEndDate" class="space-y-1.5 col-span-2 sm:col-span-1">
                    <label class="block text-xs font-medium text-slate-600">Fecha de término</label>
                    <input type="date" v-model="form.endDate" :min="todayDate" required class="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm text-slate-800 transition-all bg-white" />
                  </div>

                  <div v-if="activeScenario.needsTime" class="space-y-1.5 col-span-2 sm:col-span-1">
                    <label class="block text-xs font-medium text-slate-600">Hora</label>
                    <input type="time" v-model="form.time" required class="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm text-slate-800 transition-all bg-white" />
                  </div>
                </div>

                <div v-if="activeScenario.canReturn" class="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <div class="flex items-center gap-2">
                    <input type="checkbox" id="regreso" v-model="form.regreso" class="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 transition-colors cursor-pointer" />
                    <label for="regreso" class="text-sm font-medium text-slate-700 cursor-pointer select-none">Retorna en la misma jornada</label>
                  </div>

                  <div v-if="form.regreso" class="space-y-1.5 animate-in fade-in bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <label class="block text-xs font-medium text-slate-600">Hora de retorno estimada</label>
                    <input type="time" v-model="form.horaRegreso" required class="w-full px-3 py-2 rounded-md border border-slate-200 focus:border-brand-400 focus:ring-1 focus:ring-brand-400 outline-none text-sm text-slate-800 transition-all bg-white" />
                  </div>
                </div>
              </div>

              <!-- SECTION: Especificaciones (Conditional) -->
              <div v-if="activeScenario.categoryId === 3 || activeScenario.categoryId === 4 || activeScenario.isMedical || activeScenario.categoryId === 2" class="relative group pt-5 border-t border-slate-100">
                <h3 class="text-[11px] font-semibold text-slate-800 mb-3 block w-full">Clasificación y opciones</h3>
                
                <div v-if="activeScenario.categoryId === 3" class="space-y-2">
                  <label class="block text-xs font-medium text-slate-600">Clasificación de ausencia</label>
                  <div class="flex flex-wrap gap-2">
                    <button 
                      v-for="sub in subcategories" :key="sub"
                      type="button"
                      @click="form.tipoPermiso = form.tipoPermiso === sub ? '' : sub"
                      class="px-3 py-2 text-xs font-medium rounded-lg transition-all border outline-none text-center"
                      :class="form.tipoPermiso === sub 
                        ? 'bg-brand-50 text-brand-700 border-brand-200' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
                    >
                      {{ sub }}
                    </button>
                  </div>
                </div>

                <div v-if="activeScenario.categoryId === 4" class="space-y-2">
                  <label class="block text-xs font-medium text-slate-600">Tipo de permiso</label>
                  <div class="flex flex-col sm:flex-row gap-2">
                    <button 
                      v-for="opt in ['Permiso para salir temprano', 'Permiso para llegar tarde']" :key="opt"
                      type="button"
                      @click="form.tipoPermiso = form.tipoPermiso === opt ? '' : opt"
                      class="px-3 py-2 text-xs font-medium rounded-lg transition-all border outline-none flex-1 text-center"
                      :class="form.tipoPermiso === opt 
                        ? 'bg-brand-50 text-brand-700 border-brand-200' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
                    >
                      {{ opt }}
                    </button>
                  </div>
                </div>

                <div v-if="activeScenario.isMedical" class="space-y-4">
                  <div class="space-y-1.5">
                    <label class="block text-xs font-medium text-slate-600">Folio IMSS</label>
                    <input type="text" v-model="form.imss" placeholder="Ej. 12345678" class="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm text-slate-800 transition-all bg-white" />
                  </div>
                  <div class="space-y-2">
                    <label class="block text-xs font-medium text-slate-600">Clasificación Médica</label>
                    <div class="flex flex-col sm:flex-row gap-2">
                      <button 
                        v-for="tipo in ['Enfermedad general', 'Riesgo de trabajo', 'Maternidad']" :key="tipo"
                        type="button"
                        @click="form.tipoIncapacidad = tipo"
                        class="px-3 py-2 text-xs font-medium rounded-lg transition-all border outline-none flex-1 text-center"
                        :class="form.tipoIncapacidad === tipo 
                          ? 'bg-brand-50 text-brand-700 border-brand-200' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
                      >
                        {{ tipo }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Traslado a otro plantel -->
                <div v-if="activeScenario.categoryId === 2" class="mt-4">
                  <div v-if="!showDestino" class="flex">
                    <button type="button" @click="showDestino = true" class="text-xs font-medium text-slate-500 hover:text-brand-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent outline-none">
                      <Plus class="w-3.5 h-3.5" /> Destino alterno
                    </button>
                  </div>
                  <div v-else class="p-3 bg-slate-50 rounded-lg border border-slate-100 relative animate-in fade-in duration-200">
                    <button type="button" @click="showDestino = false" class="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-1 outline-none">
                       <XIcon class="w-4 h-4" />
                    </button>
                    <label class="block text-xs font-medium text-slate-600 mb-1.5">Plantel de destino</label>
                    <select v-model="form.destino" class="w-full px-3 py-2 rounded-md border border-slate-200 focus:border-brand-400 focus:ring-1 focus:ring-brand-400 outline-none text-sm text-slate-800 bg-white cursor-pointer transition-all pr-8">
                      <option value="">Seleccione un plantel...</option>
                      <option v-for="p in plantelesList" :key="p" :value="p">{{ p }}</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- SECTION: Justificación -->
              <div class="relative group pt-5 border-t border-slate-100">
                <h3 class="text-[11px] font-semibold text-slate-800 mb-3 block w-full">Justificación y respaldo</h3>
                
                <div class="space-y-1.5 mb-4">
                  <label class="block text-xs font-medium text-slate-600">Motivo detallado</label>
                  <textarea v-model="form.comentarios" rows="3" placeholder="Describe brevemente la razón..." required class="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-sm text-slate-900 resize-none transition-all bg-white"></textarea>
                </div>

                <div v-if="activeScenario.categoryId === 3" class="space-y-1.5 pt-2">
                  <label class="block text-xs font-medium text-slate-600 flex items-center gap-1.5">
                    <Paperclip class="w-3.5 h-3.5" /> Evidencia Adjunta (Opcional)
                  </label>
                  <div class="relative border border-dashed border-slate-300 hover:border-brand-400 bg-white rounded-lg p-4 transition-all text-center group cursor-pointer" :class="{'border-brand-500 border-solid bg-brand-50': evidenceFile}">
                    <input type="file" @change="onFileChange" accept="image/*,application/pdf" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div v-if="!evidenceFile" class="flex flex-col items-center gap-1">
                      <UploadCloud class="w-5 h-5 text-slate-400 group-hover:text-brand-500 transition-colors shrink-0" />
                      <span class="text-sm font-medium text-slate-600 mt-1">Haz clic o arrastra un archivo</span>
                      <span class="text-xs text-slate-400">PDF, JPG o PNG (Max. 5MB)</span>
                    </div>
                    <div v-else class="flex items-center justify-between z-20 relative px-1">
                      <div class="flex items-center gap-3 min-w-0">
                         <FileText class="w-5 h-5 text-brand-600 shrink-0" />
                         <div class="text-left min-w-0">
                            <p class="text-sm font-medium text-slate-800 truncate" :title="evidenceFile.name">{{ evidenceFile.name }}</p>
                            <p class="text-xs text-slate-500">{{ (evidenceFile.size / 1024 / 1024).toFixed(2) }} MB</p>
                         </div>
                      </div>
                      <button type="button" @click.stop.prevent="clearEvidence" class="p-1 text-slate-400 hover:text-red-500 transition-colors outline-none shrink-0">
                        <XIcon class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Opt-In Authorizer -->
              <div v-if="!isAuthorizerForCurrent && selectedEmployees.length > 0" class="p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all animate-in fade-in">
                <div class="flex items-start gap-3">
                  <input type="checkbox" id="optInAuth" v-model="form.optInAuthorizer" class="mt-[3px] w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer" />
                  <label for="optInAuth" class="cursor-pointer select-none">
                    <p class="text-sm font-medium text-slate-800">Recibir avisos de este plantel</p>
                    <p class="text-xs text-slate-500 mt-0.5">Asignarme como responsable para autorizar futuros pases.</p>
                  </label>
                </div>
                <div v-if="form.optInAuthorizer && !myProfile?.phone" class="mt-4 pt-4 border-t border-slate-200 animate-in fade-in">
                  <label class="block text-xs font-medium text-slate-600 mb-1.5">Número de celular (Obligatorio)</label>
                  <div class="flex items-center rounded-lg border border-slate-200 overflow-hidden bg-white focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
                     <div class="bg-slate-50 border-r border-slate-200 px-3 py-2 text-slate-500 font-medium text-sm">+52 1</div>
                     <input v-model="form.authorizerPhone" type="tel" maxlength="10" placeholder="10 dígitos" @input="form.authorizerPhone = form.authorizerPhone.replace(/\D/g, '').substring(0, 10)" class="flex-1 px-3 py-2 outline-none text-sm text-slate-800 bg-transparent" />
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="pt-4 flex flex-col gap-4">
                <transition name="fade">
                  <div v-if="missingFieldsText" class="flex items-start gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
                    <Info class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span class="text-xs font-medium text-amber-800">{{ missingFieldsText }}</span>
                  </div>
                </transition>

                <div class="flex flex-col sm:flex-row gap-3 items-stretch">
                  <button 
                    type="button" 
                    @click="submitPass(false)" 
                    :disabled="isSubmitting || !isFormComplete" 
                    class="flex-1 relative bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl transition-all border border-slate-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed h-12 outline-none"
                  >
                    <div class="absolute inset-0 flex items-center justify-center gap-2 transition-transform duration-300">
                      <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin text-slate-400" />
                      <Send v-else class="w-4 h-4 text-slate-400" /> 
                      <span>Solicitar autorización</span>
                    </div>
                  </button>

                  <button 
                    type="button" 
                    @click="submitPass(true)" 
                    :disabled="isSubmitting || !isFormComplete" 
                    class="flex-1 relative bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed h-12 outline-none border border-transparent"
                  >
                    <div class="absolute inset-0 flex items-center justify-center gap-2 transition-transform duration-300">
                      <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin text-white/80" />
                      <CheckCircle v-else class="w-4 h-4 text-white/90" /> 
                      <span>Autorizar de inmediato</span>
                    </div>
                  </button>
                </div>
                
                <p v-if="hasSelfPass" class="text-xs text-slate-500 text-center px-4">
                  <Info class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                  Estás generando una solicitud a tu propio nombre.
                </p>
              </div>
              
            </form>
          </div>
        </template>
      </div>
    </section>

    <!-- RIGHT COLUMN (Context History) -->
    <section class="w-full flex-1 flex flex-col p-5 md:p-8 relative bg-transparent z-10 xl:h-full min-w-0 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
      <div class="w-full max-w-4xl mx-auto flex flex-col gap-6 flex-1 min-h-0">
        <template v-if="selectedEmployees.length > 0">
          <EmployeeContextPanel 
            v-for="emp in selectedEmployees" 
            :key="emp.id" 
            :employee="emp" 
            class="flex-1 min-h-[400px] animate-in fade-in slide-in-from-right-8 duration-500" 
          />
        </template>
        <template v-else>
          <RecentActivityPanel class="flex-1 min-h-0 animate-in fade-in duration-700" />
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
import { LogOut, LogIn, UserX, Stethoscope, Clock, Loader2, X as XIcon, Cake, Send, Building2, Briefcase, MapPin, Plus, CheckCircle, UploadCloud, Paperclip, FileText, RotateCcw, Check, Info } from 'lucide-vue-next'
import EmployeeSearch from '~/components/EmployeeSearch.vue'
import ScenarioCard from '~/components/ScenarioCard.vue'
import EmployeeContextPanel from '~/components/EmployeeContextPanel.vue'
import RecentActivityPanel from '~/components/RecentActivityPanel.vue'
import PlantelSetupModal from '~/components/PlantelSetupModal.vue'
import PremiumAvatar from '~/components/PremiumAvatar.vue'

const { data: plantelesList } = useFetch('/api/catalogs/planteles', { default: () => [] })
const { data: myProfile, refresh: refreshProfile } = useFetch('/api/auth/profile')
const todayDate = dayjs().format('YYYY-MM-DD')

const subcategories = [
  'Cuidados Maternos',
  'Comisiones',
  'Por Estudios',
  'Por Embarazo',
  'Por Definir',
  'Permiso de Paternidad'
]

const selectedEmployees = ref([])
const activeScenario = ref(null)
const isSubmitting = ref(false)
const showDestino = ref(false)
const evidenceFile = ref(null)

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

const isFormComplete = computed(() => {
  if (!activeScenario.value) return false;
  if (!form.date) return false;
  if (activeScenario.value.needsEndDate && !form.endDate) return false;
  if (activeScenario.value.needsTime && !form.time) return false;
  if (activeScenario.value.canReturn && form.regreso && !form.horaRegreso) return false;
  if (activeScenario.value.categoryId !== 1 && !form.comentarios) return false;
  
  if (activeScenario.value.categoryId === 4) { 
     if (!form.shiftDate || !form.shiftStart || !form.shiftEnd) return false;
  }
  return true;
})

const missingFieldsText = computed(() => {
  if (!activeScenario.value) return '';
  const missing = [];
  if (!form.date) missing.push('Fecha de inicio');
  if (activeScenario.value.needsEndDate && !form.endDate) missing.push('Fecha de término');
  if (activeScenario.value.needsTime && !form.time) missing.push('Hora operativa');
  if (activeScenario.value.canReturn && form.regreso && !form.horaRegreso) missing.push('Hora de retorno');
  if (activeScenario.value.categoryId !== 1 && !form.comentarios) missing.push('Motivo detallado');
  if (activeScenario.value.categoryId === 4 && (!form.shiftDate || !form.shiftStart || !form.shiftEnd)) missing.push('Fechas y horas del cambio');
  
  if (missing.length === 0) return '';
  return `Para continuar, completa: ${missing.join(', ')}`;
})

const getScenarioIcon = (iconName) => {
  const map = { LogOut, LogIn, UserX, Stethoscope, Clock }
  return map[iconName] || Clock
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    alert('El archivo supera el tamaño máximo permitido (5MB).')
    e.target.value = ''
    return
  }
  evidenceFile.value = file
}

function clearEvidence() {
  evidenceFile.value = null
}

async function uploadFileToServer(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', `pases-evidencia/${dayjs().format('YYYY-MM')}`)
  formData.append('includeUrl', '1')

  const res = await fetch('https://expediente.casitaapps.com/upload.ashx', {
    method: 'POST',
    body: formData
  })
  if (!res.ok) throw new Error('Fallo al comunicarse con el servidor de expedientes.')
  const data = await res.json()
  if (!data.success) throw new Error('El servidor rechazó el archivo.')
  return data.url
}

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

    const queryParams = emp.id ? { id: emp.id } : { name: emp.name }
    const enriched = await $fetch('/api/employees/enrich', { query: queryParams }).catch(() => ({}))
    
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

function resetFlow() {
  activeScenario.value = null
  selectedEmployees.value = []
  coverageQueue.value = []
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

function formatAmPm(timeStr) {
  if (!timeStr) return ''
  let [h, m] = timeStr.split(':')
  h = parseInt(h, 10)
  const ampm = h >= 12 ? 'pm' : 'am'
  h = h % 12 || 12
  return `${h}:${m} ${ampm}`
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
  authorizerPhone: '',
  tipoPermiso: '',
  shiftDate: '',
  shiftStart: '',
  shiftEnd: ''
})

watch([() => form.shiftDate, () => form.shiftStart, () => form.shiftEnd], ([d, s, e]) => {
  if (activeScenario.value?.categoryId === 4 && d && s && e) {
    const fmtDate = dayjs(d).format('DD/MM/YYYY')
    const fmtStart = formatAmPm(s)
    const fmtEnd = formatAmPm(e)
    form.comentarios = `Cubre tiempo extendido a partir del ${fmtDate} de ${fmtStart} a ${fmtEnd}`
  }
})

const predefinedScenarios = [
  { id: 'salida', title: 'Salida anticipada', icon: 'LogOut', categoryId: 2, needsTime: true, canReturn: true, isMedical: false },
  { id: 'llegada', title: 'Llegada tarde', icon: 'LogIn', categoryId: 1, needsTime: true, canReturn: false, isMedical: false },
  { id: 'falta', title: 'Ausencia', icon: 'UserX', categoryId: 3, needsTime: false, canReturn: false, needsEndDate: true, isMedical: false },
  { id: 'cambio', title: 'Cambio de horario', icon: 'Clock', categoryId: 4, needsTime: false, canReturn: false, isMedical: false },
  { id: 'imss', title: 'Incapacidad médica', icon: 'Stethoscope', categoryId: 5, needsTime: false, canReturn: false, needsEndDate: true, isMedical: true }
]

function selectScenario(scenario) {
  activeScenario.value = scenario
  showDestino.value = false
  clearEvidence()
  Object.assign(form, { 
    date: todayDate, endDate: todayDate, time: '', 
    comentarios: '', destino: '', regreso: false, horaRegreso: '',
    imss: '', tipoIncapacidad: 'Enfermedad general',
    optInAuthorizer: false, authorizerPhone: '',
    tipoPermiso: '', shiftDate: '', shiftStart: '', shiftEnd: ''
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
  if (isSubmitting.value || !isFormComplete.value) return
  
  isSubmitting.value = true
  
  let evidenceUrl = null
  if (evidenceFile.value) {
    try {
      evidenceUrl = await uploadFileToServer(evidenceFile.value)
    } catch (err) {
      alert('No se pudo subir la evidencia adjunta. ' + err.message)
      isSubmitting.value = false
      return
    }
  }

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
          tipoPermiso: form.tipoPermiso,
          evidence: evidenceUrl,
          autoAuthorize
        }
      })
    ))
    
    resetFlow();
    clearEvidence();
    
    refreshNuxtData() 
  } catch(e) {
    console.error('Error', e)
    alert('Hubo un problema al registrar el pase.')
  } finally {
    isSubmitting.value = false
  }
}
</script>