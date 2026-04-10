<template>
  <div class="flex flex-col xl:flex-row w-full min-h-[100dvh] xl:h-screen xl:overflow-hidden bg-transparent">
    
    <!-- LEFT COLUMN (Dynamic Layout Switcher) -->
    <section 
      class="w-full flex flex-col shrink-0 border-b xl:border-b-0 border-white/60 z-30 xl:h-full transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] relative bg-white/40 backdrop-blur-md overflow-hidden"
      :class="activeScenario ? 'xl:w-[280px] 2xl:w-[320px] xl:border-r' : 'xl:w-[460px] 2xl:w-[500px] xl:border-r'"
    >
      <!-- STATE 1: NORMAL EXPANDED MODE -->
      <div class="absolute top-0 left-0 h-full flex flex-col transition-all duration-500 w-full xl:w-[460px] 2xl:w-[500px] z-10"
           :class="activeScenario ? 'opacity-0 translate-x-[-20px] pointer-events-none' : 'opacity-100 translate-x-0 delay-200'">
        <header class="px-6 md:px-8 py-8 border-b border-white/50 bg-white/20 shrink-0">
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">Nuevo pase</h1>
          <p class="text-slate-500 mt-2 text-sm font-bold">Registro y justificación de incidencias.</p>
        </header>

        <div class="flex-1 overflow-y-auto px-6 py-8 md:px-8 custom-scrollbar relative flex flex-col gap-10 min-h-0">
          
          <div class="relative">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-casita-green-light to-casita-green text-white flex items-center justify-center text-sm font-black shadow-sm shrink-0">1</div>
              <h2 class="text-lg font-black text-slate-900 tracking-tight">Seleccionar colaborador</h2>
            </div>
            
            <EmployeeSearch @select="addEmployee" />
            
            <div v-if="selectedEmployees.length > 0" class="flex flex-col gap-4 mt-6">
              <div v-for="emp in selectedEmployees" :key="emp.id" class="flex flex-col w-full bg-white/80 backdrop-blur-md border border-white p-5 rounded-[1.5rem] group shadow-sm transition-all relative overflow-hidden">
                <div class="flex items-center justify-between mb-3 relative z-10">
                  <div class="flex items-center gap-4 min-w-0">
                     <PremiumAvatar :src="emp.picture || null" :name="emp.name" size="md" class="shrink-0 shadow-sm border border-white" />
                     <div class="flex flex-col min-w-0 pr-2">
                       <span class="text-base font-black text-slate-900 truncate">{{ emp.name }}</span>
                       <span v-if="myProfile && emp.name === myProfile.name" class="text-[10px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded uppercase tracking-widest mt-1 w-max border border-brand-100">Registro propio</span>
                     </div>
                  </div>
                  <button type="button" @click="removeEmployee(emp.id)" class="text-slate-400 hover:text-casita-red bg-white hover:bg-casita-red/10 w-8 h-8 flex items-center justify-center rounded-full transition-colors focus:outline-none border border-slate-100 shrink-0 shadow-sm">
                    <XIcon class="w-4 h-4" />
                  </button>
                </div>
                
                <div v-if="emp._enriching" class="flex gap-2 mt-2">
                  <div class="h-6 w-24 bg-slate-100 animate-pulse rounded-lg"></div>
                  <div class="h-6 w-32 bg-slate-100 animate-pulse rounded-lg"></div>
                </div>
                <div v-else class="flex flex-col gap-3 w-full mt-1 relative z-10 pt-3 border-t border-slate-100">
                  <div class="flex flex-wrap items-center gap-2">
                    <span v-if="emp.puesto" class="px-2.5 py-1 bg-white text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200/50 shadow-sm flex items-center gap-1.5">
                      <Briefcase class="w-3.5 h-3.5 text-slate-400" /> {{ emp.puesto }}
                    </span>
                    <span v-if="emp.plantelBase" class="px-2.5 py-1 bg-white text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200/50 flex items-center gap-1.5 shadow-sm" :class="{'opacity-60': emp.plantelActual && emp.plantelActual !== emp.plantelBase}">
                      <Building2 class="w-3.5 h-3.5 text-casita-green" />
                      {{ emp.plantelBase }}
                    </span>
                    <template v-if="emp.plantelActual && emp.plantelActual !== emp.plantelBase">
                      <span class="px-2.5 py-1 bg-iedis-blue/10 text-iedis-blue-dark text-[11px] font-black tracking-tight rounded-lg border border-iedis-blue/20 shadow-sm flex items-center gap-1.5 animate-in fade-in duration-300">
                        <MapPin class="w-3.5 h-3.5 text-iedis-blue" />
                        Ubicación: {{ emp.plantelActual }}
                        <button type="button" @click.stop="resetPlantelActual(emp)" class="ml-1 hover:text-iedis-blue-dark bg-iedis-blue/20 p-0.5 rounded-md transition-colors outline-none"><XIcon class="w-3 h-3"/></button>
                      </span>
                    </template>
                    <button v-else-if="!emp._editingActual" type="button" @click.stop="emp._editingActual = true" class="text-[10px] font-bold text-slate-500 hover:text-iedis-blue-dark px-2 py-1 rounded-lg hover:bg-iedis-blue/10 transition-colors flex items-center gap-1 border border-transparent hover:border-iedis-blue/20 outline-none">
                      <MapPin class="w-3 h-3" /> Cambiar ubicación
                    </button>
                  </div>

                  <div v-if="emp._editingActual" class="p-3 bg-slate-50/80 backdrop-blur-md border border-slate-200/60 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200 shadow-inner">
                     <div class="flex-1">
                        <select v-model="emp.plantelActual" @change="onPlantelActualSelected(emp)" class="w-full px-3 py-2 rounded-lg border border-slate-200/80 text-sm font-bold text-slate-800 bg-white focus:ring-2 focus:ring-iedis-blue/30 focus:border-iedis-blue outline-none shadow-sm cursor-pointer transition-all">
                           <option v-for="p in plantelesList" :key="p" :value="p">{{ p }}</option>
                        </select>
                     </div>
                     <button type="button" @click="emp._editingActual = false" class="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-lg transition-colors border border-slate-200 shadow-sm outline-none">
                        <XIcon class="w-4 h-4" />
                     </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="checkingCoverage" class="py-12 flex flex-col items-center justify-center bg-white/60 rounded-[2rem] border border-white shadow-sm">
             <Loader2 class="w-10 h-10 animate-spin text-brand-500 mb-4" />
             <p class="text-xs font-black text-slate-600 uppercase tracking-widest">Verificando responsables...</p>
          </div>
          
          <div v-else-if="!currentCoverageTask && selectedEmployees.length > 0" class="relative animate-in slide-in-from-bottom-4 fade-in duration-500 pb-8">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-iedis-teal to-iedis-teal-dark text-white flex items-center justify-center text-sm font-black shadow-sm shrink-0">2</div>
              <h2 class="text-lg font-black text-slate-900 tracking-tight">Motivo de la incidencia</h2>
            </div>

            <div class="grid grid-cols-2 gap-5">
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
      <div class="absolute top-0 left-0 h-full flex flex-col transition-all duration-500 bg-white/30 w-full xl:w-[280px] 2xl:w-[320px] z-20"
           :class="activeScenario ? 'opacity-100 translate-x-0 delay-200' : 'opacity-0 translate-x-[-20px] pointer-events-none'">
        
        <div class="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-6">
          
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Colaboradores</h2>
            <button @click="resetFlow" class="text-[10px] font-black text-brand-600 hover:text-white bg-white hover:bg-brand-500 px-3 py-1.5 rounded-xl transition-colors border border-transparent hover:border-brand-600 shadow-sm outline-none uppercase tracking-widest flex items-center gap-1.5">
              <RotateCcw class="w-3 h-3" /> Reiniciar
            </button>
          </div>

          <div class="flex flex-col gap-3">
            <div v-for="emp in selectedEmployees" :key="emp.id" class="bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-white shadow-sm flex items-center justify-between group relative overflow-hidden">
              <div class="flex items-center gap-3 w-full min-w-0 pr-2">
                <PremiumAvatar :src="emp.picture" :name="emp.name" size="sm" class="shrink-0 shadow-sm border border-white" />
                <div class="flex flex-col min-w-0">
                  <span class="text-sm font-black text-slate-900 truncate tracking-tight">{{ emp.name.split(' ')[0] }} {{ emp.name.split(' ')[1] || '' }}</span>
                  <span class="text-[10px] font-bold text-slate-500 truncate mt-0.5">{{ emp.plantelActual || emp.plantelBase }}</span>
                </div>
              </div>
              <button @click="removeEmployee(emp.id)" class="text-slate-400 hover:text-casita-red bg-white hover:bg-casita-red/10 w-7 h-7 flex items-center justify-center rounded-full transition-colors border border-slate-100 shrink-0 shadow-sm outline-none">
                <XIcon class="w-3.5 h-3.5" />
              </button>
            </div>
            
            <button @click="activeScenario = null" class="mt-2 text-[10px] font-black text-brand-600 hover:text-brand-800 flex items-center justify-center gap-1.5 bg-brand-50 hover:bg-brand-100 py-3 rounded-2xl transition-colors outline-none border border-brand-100/50 uppercase tracking-widest border-dashed">
              <Plus class="w-3 h-3" /> Añadir otro
            </button>
          </div>

          <div class="h-px bg-white/60 mx-2 my-2"></div>

          <div class="flex flex-col gap-3 relative">
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1">Motivo operativo</h3>
            <button 
              v-for="scenario in predefinedScenarios" 
              :key="scenario.id"
              @click="selectScenario(scenario)"
              class="flex items-center gap-4 w-full p-4 rounded-[1.5rem] transition-all outline-none text-left group border"
              :class="activeScenario?.id === scenario.id 
                ? 'bg-gradient-to-r from-iedis-teal to-iedis-teal-dark text-white border-transparent shadow-lg shadow-iedis-teal/20' 
                : 'bg-white/50 border-white hover:bg-white hover:border-brand-200 text-slate-600 shadow-sm'"
            >
              <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0 bg-white"
                   :class="activeScenario?.id === scenario.id ? 'text-iedis-teal-dark' : 'text-slate-400 group-hover:text-brand-500'">
                <component :is="getScenarioIcon(scenario.icon)" class="w-5 h-5" />
              </div>
              <span class="text-sm font-black tracking-tight" :class="activeScenario?.id === scenario.id ? 'text-white' : 'text-slate-800'">{{ scenario.title }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- MIDDLE COLUMN (Form Details) -->
    <section 
      class="transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden shrink-0 flex flex-col bg-slate-50/70 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.03)] z-20 relative"
      :class="activeScenario ? 'max-h-[3000px] xl:max-h-none xl:w-[480px] 2xl:w-[560px] opacity-100 border-b xl:border-b-0 xl:border-r border-white/80' : 'max-h-0 xl:max-h-none xl:w-0 opacity-0 border-transparent'"
    >
      <div class="w-full xl:w-[480px] 2xl:w-[560px] shrink-0 h-full flex flex-col relative transition-opacity duration-500 delay-300"
           :class="activeScenario ? 'opacity-100' : 'opacity-0'">
        <template v-if="activeScenario">
          <header class="hidden xl:flex px-8 py-8 border-b border-white/50 bg-white/40 shrink-0 items-center gap-5">
            <div class="w-12 h-12 rounded-[1rem] bg-brand-100 flex items-center justify-center shadow-sm shrink-0 border border-white">
              <component :is="getScenarioIcon(activeScenario.icon)" class="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h2 class="text-2xl font-black text-slate-900 tracking-tight">Detalles del pase</h2>
              <p class="text-slate-500 mt-1 text-xs font-bold uppercase tracking-widest">{{ activeScenario.title }}</p>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto px-6 py-8 md:px-8 custom-scrollbar relative flex flex-col min-h-0 bg-white/20">
            
            <div class="xl:hidden flex items-center gap-3 mb-6">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center text-sm font-black shadow-sm shrink-0">3</div>
              <h2 class="text-lg font-black text-slate-900 tracking-tight">Completar formulario</h2>
            </div>

            <form @submit.prevent class="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-sm relative flex flex-col gap-6">
              
              <div v-if="activeScenario.categoryId === 2" class="flex flex-wrap items-center gap-2 pb-5 border-b border-white/60">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest w-full mb-1">Opciones rápidas:</span>
                <button type="button" @click="applyPreset('now')" class="px-3 py-1.5 bg-white hover:bg-brand-50 text-slate-600 hover:text-brand-700 text-xs font-bold rounded-xl border border-slate-200/60 transition-colors flex items-center gap-1.5 outline-none shadow-sm">
                  <Clock class="w-3.5 h-3.5" /> Asignar hora actual
                </button>
                <button type="button" @click="applyPreset('transfer')" class="px-3 py-1.5 bg-white hover:bg-brand-50 text-slate-600 hover:text-brand-700 text-xs font-bold rounded-xl border border-slate-200/60 transition-colors flex items-center gap-1.5 outline-none shadow-sm">
                  <MapPin class="w-3.5 h-3.5" /> Traslado a plantel
                </button>
                <button v-if="hasBirthday()" type="button" @click="applyPreset('birthday')" class="px-3 py-1.5 bg-casita-peach/10 hover:bg-casita-peach/20 text-casita-peach text-xs font-bold rounded-xl border border-casita-peach/30 transition-colors flex items-center gap-1.5 outline-none shadow-sm">
                  <Cake class="w-3.5 h-3.5" /> Cumpleaños
                </button>
              </div>

              <div v-if="activeScenario.categoryId === 4" class="space-y-5 p-6 bg-casita-gold/5 rounded-3xl border border-casita-gold/20 shadow-sm">
                <p class="text-[10px] font-black text-casita-gold-dark uppercase tracking-widest mb-1">Generador de Cobertura Extendida</p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div class="space-y-2">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase">Fecha a cubrir</label>
                    <input type="date" v-model="form.shiftDate" :min="todayDate" class="w-full px-4 py-3 rounded-2xl border border-white focus:border-casita-gold focus:ring-2 focus:ring-casita-gold/20 outline-none text-sm font-bold text-slate-900 transition-all bg-white/70 shadow-sm" />
                  </div>
                  <div class="space-y-2">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase">De (Inicio)</label>
                    <input type="time" v-model="form.shiftStart" class="w-full px-4 py-3 rounded-2xl border border-white focus:border-casita-gold focus:ring-2 focus:ring-casita-gold/20 outline-none text-sm font-bold text-slate-900 transition-all bg-white/70 shadow-sm" />
                  </div>
                  <div class="space-y-2">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase">A (Fin)</label>
                    <input type="time" v-model="form.shiftEnd" class="w-full px-4 py-3 rounded-2xl border border-white focus:border-casita-gold focus:ring-2 focus:ring-casita-gold/20 outline-none text-sm font-bold text-slate-900 transition-all bg-white/70 shadow-sm" />
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-5">
                <div class="space-y-2 col-span-2 md:col-span-1">
                  <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha de inicio</label>
                  <input type="date" v-model="form.date" :min="todayDate" required class="w-full px-4 py-3 rounded-2xl border border-white/80 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-white/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
                </div>
                
                <div v-if="activeScenario.needsEndDate" class="space-y-2 col-span-2 md:col-span-1">
                  <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha de término</label>
                  <input type="date" v-model="form.endDate" :min="todayDate" required class="w-full px-4 py-3 rounded-2xl border border-white/80 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-white/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
                </div>

                <div v-if="activeScenario.needsTime" class="space-y-2 col-span-2 md:col-span-1">
                  <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora</label>
                  <input type="time" v-model="form.time" required class="w-full px-4 py-3 rounded-2xl border border-white/80 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-white/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
                </div>

                <div v-if="activeScenario.categoryId === 3" class="space-y-3 col-span-2 animate-in fade-in zoom-in-95 duration-200">
                  <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Clasificación de la ausencia</label>
                  <div class="flex flex-wrap gap-3">
                    <button 
                      v-for="sub in subcategories" :key="sub"
                      type="button"
                      @click="form.tipoPermiso = form.tipoPermiso === sub ? '' : sub"
                      class="px-4 py-2.5 text-xs font-bold rounded-xl transition-all border outline-none flex-1 sm:flex-none text-center"
                      :class="form.tipoPermiso === sub 
                        ? 'bg-casita-red/10 text-casita-red-dark border-casita-red/50 shadow-sm ring-1 ring-casita-red/30' 
                        : 'bg-white/60 text-slate-600 border-transparent shadow-sm hover:border-slate-300 hover:bg-white'"
                    >
                      {{ sub }}
                    </button>
                  </div>
                </div>

                <div v-if="activeScenario.categoryId === 4" class="space-y-3 col-span-2 animate-in fade-in zoom-in-95 duration-200">
                  <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de permiso</label>
                  <div class="flex flex-col sm:flex-row gap-3">
                    <button 
                      v-for="opt in ['Permiso para salir temprano', 'Permiso para llegar tarde']" :key="opt"
                      type="button"
                      @click="form.tipoPermiso = form.tipoPermiso === opt ? '' : opt"
                      class="px-4 py-3 text-xs font-bold rounded-xl transition-all border outline-none flex-1 text-center"
                      :class="form.tipoPermiso === opt 
                        ? 'bg-casita-gold/10 text-casita-gold-dark border-casita-gold/50 shadow-sm ring-1 ring-casita-gold/30' 
                        : 'bg-white/60 text-slate-600 border-transparent shadow-sm hover:border-slate-300 hover:bg-white'"
                    >
                      {{ opt }}
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="activeScenario.canReturn" class="flex items-center gap-4 bg-white/60 p-4 rounded-2xl border border-white shadow-sm">
                <input type="checkbox" id="regreso" v-model="form.regreso" class="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300 transition-colors cursor-pointer" />
                <label for="regreso" class="text-sm font-black text-slate-700 cursor-pointer select-none">Retorna en la misma jornada</label>
              </div>

              <div v-if="form.regreso" class="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora de retorno</label>
                <input type="time" v-model="form.horaRegreso" required class="w-full px-4 py-3 rounded-2xl border border-white/80 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-white/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
              </div>

              <div v-if="activeScenario.isMedical" class="space-y-5 p-6 bg-iedis-teal/5 rounded-3xl border border-iedis-teal/20 shadow-sm">
                <div class="space-y-2">
                  <label class="block text-[10px] font-black text-iedis-teal-dark uppercase tracking-widest">Folio IMSS</label>
                  <input type="text" v-model="form.imss" placeholder="Ej. 12345678" class="w-full px-4 py-3 rounded-2xl border border-white focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold text-iedis-teal-dark transition-all bg-white/70 shadow-sm" />
                </div>
                <div class="space-y-3">
                  <label class="block text-[10px] font-black text-iedis-teal-dark uppercase tracking-widest">Clasificación Médica</label>
                  <div class="flex flex-col sm:flex-row gap-3">
                    <button 
                      v-for="tipo in ['Enfermedad general', 'Riesgo de trabajo', 'Maternidad']" :key="tipo"
                      type="button"
                      @click="form.tipoIncapacidad = tipo"
                      class="px-4 py-2.5 text-xs font-bold rounded-xl transition-all border outline-none flex-1 text-center"
                      :class="form.tipoIncapacidad === tipo 
                        ? 'bg-iedis-teal/10 text-iedis-teal-dark border-iedis-teal/50 shadow-sm ring-1 ring-iedis-teal/30' 
                        : 'bg-white/60 text-slate-600 border-transparent shadow-sm hover:border-iedis-teal/30 hover:bg-white'"
                    >
                      {{ tipo }}
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="activeScenario.categoryId === 3" class="space-y-2 col-span-2">
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Paperclip class="w-3.5 h-3.5" /> Evidencia / Justificante (Opcional)
                </label>
                <div class="relative border-2 border-dashed border-white/80 hover:border-brand-400 bg-white/40 rounded-2xl p-6 transition-all text-center group" :class="{'border-brand-500 bg-brand-50/50': evidenceFile}">
                  <input type="file" @change="onFileChange" accept="image/*,application/pdf" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div v-if="!evidenceFile" class="flex flex-col items-center gap-2">
                    <UploadCloud class="w-6 h-6 text-slate-400 group-hover:text-brand-500 transition-colors" />
                    <span class="text-sm font-bold text-slate-600">Haz clic o arrastra un archivo aquí</span>
                    <span class="text-[10px] font-medium text-slate-400">PDF, JPG o PNG (Max. 5MB)</span>
                  </div>
                  <div v-else class="flex items-center justify-between z-20 relative">
                    <div class="flex items-center gap-3">
                       <FileText class="w-6 h-6 text-brand-600" />
                       <div class="text-left">
                          <p class="text-sm font-black text-slate-800 truncate max-w-[200px] sm:max-w-xs">{{ evidenceFile.name }}</p>
                          <p class="text-[10px] font-bold text-slate-500">{{ (evidenceFile.size / 1024 / 1024).toFixed(2) }} MB</p>
                       </div>
                    </div>
                    <button type="button" @click.stop.prevent="clearEvidence" class="p-2 text-slate-400 hover:text-casita-red bg-white rounded-full shadow-sm relative z-20 transition-colors border border-transparent hover:border-casita-red/20 outline-none">
                      <XIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div class="space-y-3 pt-2">
                <div v-if="!showDestino" class="flex">
                  <button type="button" @click="showDestino = true" class="text-xs font-bold text-slate-500 hover:text-brand-600 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white transition-colors shadow-sm border border-transparent hover:border-slate-200/50">
                    <Plus class="w-3.5 h-3.5" /> Añadir destino a otro plantel
                  </button>
                </div>
                <div v-else class="p-4 bg-white/60 rounded-2xl border border-white relative animate-in fade-in zoom-in-95 duration-200 shadow-sm">
                  <button type="button" @click="showDestino = false" class="absolute top-3 right-3 text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-100 shadow-sm outline-none">
                     <XIcon class="w-4 h-4" />
                  </button>
                  <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Plantel de destino</label>
                  <select v-model="form.destino" class="w-full px-4 py-3 rounded-2xl border border-white/80 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 bg-white/70 shadow-sm cursor-pointer">
                    <option value="">Seleccione un plantel...</option>
                    <option v-for="p in plantelesList" :key="p" :value="p">{{ p }}</option>
                  </select>
                </div>
              </div>

              <div class="space-y-2">
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Justificación</label>
                <textarea v-model="form.comentarios" rows="3" placeholder="Describe el motivo de forma clara..." required class="w-full px-4 py-3 rounded-2xl border border-white/80 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-medium text-slate-900 resize-none transition-all bg-white/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"></textarea>
              </div>

              <div v-if="!isAuthorizerForCurrent && selectedEmployees.length > 0" class="p-4 bg-white/60 rounded-2xl border border-white shadow-sm mt-2 mb-2 transition-all">
                <div class="flex items-start gap-3">
                  <input type="checkbox" id="optInAuth" v-model="form.optInAuthorizer" class="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer" />
                  <label for="optInAuth" class="cursor-pointer select-none">
                    <p class="text-sm font-bold text-slate-800">Recibir avisos de este plantel</p>
                    <p class="text-xs text-slate-500 mt-0.5">Asignarme como responsable para revisar y autorizar futuros pases.</p>
                  </label>
                </div>
                <div v-if="form.optInAuthorizer && !myProfile?.phone" class="mt-4 pt-4 border-t border-white animate-in fade-in slide-in-from-top-2">
                  <label class="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Número de celular (WhatsApp)</label>
                  <div class="flex items-center shadow-sm rounded-xl">
                     <div class="bg-white/80 border border-white border-r-0 px-4 py-3 rounded-l-xl text-slate-600 font-black text-sm">+52 1</div>
                     <input v-model="form.authorizerPhone" type="tel" maxlength="10" placeholder="10 dígitos" @input="form.authorizerPhone = form.authorizerPhone.replace(/\D/g, '').substring(0, 10)" class="flex-1 px-4 py-3 rounded-r-xl border border-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-black text-slate-900 bg-white/80" />
                  </div>
                </div>
              </div>

              <div class="pt-6 border-t border-white/60 flex flex-col gap-4">
                <div class="flex items-start gap-3 bg-white/50 p-4 rounded-2xl border border-white shadow-sm">
                  <Bell class="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <p class="text-[11px] font-medium text-slate-600 leading-relaxed">
                    El sistema enviará el enlace de autorización a los responsables asignados. Puedes delegar la revisión o resolver el pase directamente en este momento.
                  </p>
                </div>
                <div class="flex flex-col sm:flex-row gap-3">
                  <button type="button" @click="submitPass(false)" :disabled="isSubmitting" class="flex-1 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-black text-sm rounded-xl transition-all border border-slate-200/60 flex items-center justify-center gap-2 outline-none shadow-sm disabled:opacity-50">
                    <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
                    <Send v-else class="w-4 h-4 text-slate-400" /> 
                    <span>Solicitar autorización</span>
                  </button>
                  <button type="button" @click="submitPass(true)" :disabled="isSubmitting" class="flex-1 py-3.5 bg-gradient-to-r from-casita-green to-casita-green-light hover:from-casita-green-dark hover:to-casita-green text-white font-black text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 outline-none disabled:opacity-50">
                    <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
                    <CheckCircle v-else class="w-4 h-4" /> 
                    <span>Autorizar directamente</span>
                  </button>
                </div>
                <p v-if="hasSelfPass" class="text-[10px] font-bold text-slate-400 text-center px-4 mt-2">
                  Estás generando una solicitud a tu propio nombre. La resolución quedará documentada bajo tu usuario.
                </p>
              </div>
              
            </form>
          </div>
        </template>
      </div>
    </section>

    <!-- RIGHT COLUMN (Operational Context) -->
    <section class="w-full flex-1 flex flex-col p-6 lg:p-8 relative bg-transparent z-10 xl:h-full min-w-0 overflow-hidden transition-all duration-500 ease-in-out">
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
import { LogOut, LogIn, UserX, Stethoscope, Clock, Loader2, X as XIcon, Cake, Send, Building2, Briefcase, MapPin, Plus, Bell, CheckCircle, UploadCloud, Paperclip, FileText, RotateCcw } from 'lucide-vue-next'
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
  { id: 'falta', title: 'Ausencia justificada', icon: 'UserX', categoryId: 3, needsTime: false, canReturn: false, needsEndDate: true, isMedical: false },
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
  if (isSubmitting.value) return
  if (!form.date || (!form.comentarios && activeScenario.value.categoryId !== 1)) {
    alert('Por favor, completa los campos requeridos.')
    return
  }
  
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