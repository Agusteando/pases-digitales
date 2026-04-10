<template>
  <div class="flex flex-col xl:flex-row w-full min-h-[100dvh] xl:h-screen xl:overflow-hidden bg-transparent">
    
    <!-- LEFT COLUMN (Paso 1: Selección - Divulgación Progresiva) -->
    <section 
      class="w-full flex flex-col shrink-0 border-b xl:border-b-0 border-white/50 z-30 xl:h-full transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] relative bg-white/50 backdrop-blur-2xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-hidden"
      :class="activeScenario ? 'hidden xl:flex xl:w-0 xl:opacity-0 xl:border-none pointer-events-none' : 'flex xl:w-[460px] 2xl:w-[500px] xl:border-r opacity-100'"
    >
      <div class="w-full xl:w-[460px] 2xl:w-[500px] flex-col h-full flex shrink-0">
        <header class="px-6 md:px-8 py-6 md:py-8 border-b border-white/60 bg-transparent shrink-0">
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">Nuevo pase</h1>
          <p class="text-slate-500 mt-1 text-sm font-bold">Registro y justificación de incidencias</p>
        </header>

        <div class="flex-1 overflow-y-auto overflow-visible px-6 py-6 md:px-8 custom-scrollbar relative flex flex-col gap-10 min-h-0 xl:shadow-[inset_0_10px_20px_rgba(0,0,0,0.01)] pb-[120px] xl:pb-8">
          
          <div class="relative">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-base font-black shadow-md shrink-0 bg-gradient-to-br from-[#8EC152] to-[#618B2F] text-white border border-[#7DB041] shadow-[#8EC152]/20">
                1
              </div>
              <div>
                <h2 class="text-xl font-black text-slate-900 tracking-tight leading-none">Colaborador</h2>
                <p class="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Identifica a la persona</p>
              </div>
            </div>
            
            <EmployeeSearch @select="addEmployee" />
            
            <div v-if="selectedEmployees.length > 0" class="flex flex-col gap-3 mt-5">
              <div v-for="emp in selectedEmployees" :key="emp.id" class="flex flex-col w-full bg-white/70 backdrop-blur-md p-4 rounded-[1.5rem] border border-white shadow-sm group transition-all relative overflow-hidden hover:border-white/80 hover:shadow-md">
                <div class="flex items-start justify-between mb-2 relative z-10">
                  <div class="flex items-center gap-3 min-w-0 pr-2">
                     <PremiumAvatar :src="emp.picture || null" :name="emp.name" size="md" class="shrink-0 border border-white shadow-sm" />
                     <div class="flex flex-col min-w-0">
                       <span class="text-sm font-black text-slate-900 truncate" :title="emp.name">{{ emp.name }}</span>
                       <span v-if="myProfile && emp.name === myProfile.name" class="text-[9px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded uppercase tracking-widest mt-1.5 w-max border border-brand-100/50">Registro propio</span>
                     </div>
                  </div>
                  <button type="button" @click="removeEmployee(emp.id)" class="text-slate-400 hover:text-red-500 bg-white shadow-sm w-8 h-8 flex items-center justify-center rounded-full transition-colors focus:outline-none shrink-0 outline-none border border-white/60">
                    <XIcon class="w-4 h-4 shrink-0" />
                  </button>
                </div>
                
                <div v-if="emp._enriching" class="flex gap-2 mt-1">
                  <div class="h-4 w-20 bg-slate-100 animate-pulse rounded-md"></div>
                  <div class="h-4 w-28 bg-slate-100 animate-pulse rounded-md"></div>
                </div>
                <div v-else class="flex flex-col gap-2 w-full mt-1 relative z-10 pt-3 border-t border-white/60">
                  <div class="flex flex-wrap items-center gap-2">
                    <span v-if="emp.puesto" class="text-slate-600 font-bold text-[11px] flex items-center gap-1.5">
                      <Briefcase class="w-3.5 h-3.5 text-slate-400" /> {{ emp.puesto }}
                    </span>
                    <span v-if="emp.puesto && emp.plantelBase" class="text-slate-300">•</span>
                    <span v-if="emp.plantelBase" class="text-slate-600 font-bold text-[11px] flex items-center gap-1.5" :class="{'opacity-60': emp.plantelActual && emp.plantelActual !== emp.plantelBase}">
                      <Building2 class="w-3.5 h-3.5 text-slate-400" />
                      {{ emp.plantelBase }}
                    </span>
                    
                    <template v-if="emp.plantelActual && emp.plantelActual !== emp.plantelBase">
                      <span class="text-[#007F92] text-[11px] font-black flex items-center gap-1.5 animate-in fade-in duration-300 ml-2 bg-[#007F92]/10 px-2.5 py-1 rounded-lg border border-[#007F92]/20">
                        <MapPin class="w-3.5 h-3.5" />
                        {{ emp.plantelActual }}
                        <button type="button" @click.stop="resetPlantelActual(emp)" class="ml-1.5 hover:text-[#006575] transition-colors outline-none flex items-center justify-center"><XIcon class="w-3 h-3 shrink-0"/></button>
                      </span>
                    </template>
                    <button v-else-if="!emp._editingActual" type="button" @click.stop="emp._editingActual = true" class="text-[10px] font-black text-slate-400 hover:text-[#007F92] ml-2 transition-colors flex items-center gap-1 outline-none uppercase tracking-widest bg-white/50 px-2 py-1 rounded-lg border border-white shadow-sm">
                      <MapPin class="w-3 h-3 shrink-0" /> Cambiar
                    </button>
                  </div>

                  <div v-if="emp._editingActual" class="p-2 bg-white/60 backdrop-blur-md rounded-xl flex items-center gap-2 animate-in fade-in duration-200 mt-2 border border-white shadow-sm">
                     <div class="flex-1">
                        <select v-model="emp.plantelActual" @change="onPlantelActualSelected(emp)" class="w-full px-3 py-2.5 rounded-lg border border-white/80 text-base sm:text-xs font-bold text-slate-700 bg-white/80 focus:ring-2 focus:ring-[#007F92]/20 focus:border-[#007F92] outline-none cursor-pointer transition-all shadow-sm">
                           <option v-for="p in plantelesList" :key="p" :value="p">{{ p }}</option>
                        </select>
                     </div>
                     <button type="button" @click="emp._editingActual = false" class="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white rounded-lg shadow-sm transition-colors border border-white outline-none shrink-0">
                        <XIcon class="w-4 h-4 shrink-0" />
                     </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="checkingCoverage" class="py-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md rounded-[1.5rem] border border-white shadow-sm mt-6">
             <Loader2 class="w-8 h-8 animate-spin text-[#007F92] mb-3 shrink-0" />
             <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verificando responsables...</p>
          </div>
          
          <div v-else-if="!currentCoverageTask && selectedEmployees.length > 0" class="relative animate-in slide-in-from-bottom-4 fade-in duration-500 pb-8 mt-4">
            <div class="flex items-center gap-4 mb-6 transition-opacity duration-300" :class="selectedEmployees.length === 0 ? 'opacity-50' : 'opacity-100'">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-base font-black shadow-md shrink-0 bg-gradient-to-br from-[#1AA8BC] to-[#007F92] text-white border border-[#0D94A6] shadow-[#007F92]/20">
                2
              </div>
              <div>
                <h2 class="text-xl font-black text-slate-900 tracking-tight leading-none">Motivo</h2>
                <p class="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Selecciona la razón</p>
              </div>
            </div>

            <div class="bg-white/40 backdrop-blur-md p-3 sm:p-4 rounded-[2rem] shadow-sm border border-white/60">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
      </div>
    </section>

    <!-- MIDDLE COLUMN (Paso 2: Detalles y Envío) -->
    <section 
      class="transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] shrink-0 flex-col bg-white/30 backdrop-blur-xl z-20 relative overflow-hidden"
      :class="activeScenario ? 'flex xl:w-[500px] 2xl:w-[600px] opacity-100 border-b xl:border-b-0 xl:border-r border-white/50 w-full' : 'hidden xl:flex xl:w-0 opacity-0 border-transparent pointer-events-none'"
    >
      <div class="w-full xl:w-[500px] 2xl:w-[600px] shrink-0 xl:h-full flex flex-col relative transition-opacity duration-500 xl:delay-300"
           :class="activeScenario ? 'opacity-100' : 'opacity-0'">
        <template v-if="activeScenario">
          
          <header class="hidden xl:flex px-6 py-5 border-b border-white/60 bg-white/40 items-center justify-between shrink-0">
            <div class="flex items-center gap-4">
              <button type="button" @click="goBack" class="p-2.5 bg-white rounded-xl text-slate-400 hover:text-[#007F92] hover:shadow-md transition-all border border-white/80 shadow-sm outline-none" title="Modificar selección">
                <ArrowLeft class="w-5 h-5" />
              </button>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-[1rem] flex items-center justify-center shadow-sm shrink-0 border border-white bg-white text-[#007F92]">
                  <component :is="getScenarioIcon(activeScenario.icon)" class="w-5 h-5" />
                </div>
                <div>
                  <h2 class="text-base font-black text-slate-900 tracking-tight leading-none">{{ activeScenario.title }}</h2>
                  <p class="text-[11px] font-bold text-slate-500 mt-1">{{ selectedEmployees.length }} colaborador(es) seleccionado(s)</p>
                </div>
              </div>
            </div>
            <div class="hidden sm:flex -space-x-3 overflow-hidden px-2">
              <PremiumAvatar v-for="emp in selectedEmployees" :key="emp.id" :src="emp.picture" :name="emp.name" size="sm" class="inline-block ring-2 ring-white shadow-sm" />
            </div>
          </header>

          <header class="xl:hidden flex px-5 py-4 border-b border-white/60 bg-white/95 backdrop-blur-xl shrink-0 items-center justify-between sticky top-0 z-40 shadow-sm">
            <div class="flex items-center gap-4">
               <button type="button" @click="goBack" class="p-2 bg-white rounded-xl text-slate-500 hover:text-[#007F92] transition-colors shadow-sm border border-slate-200 outline-none">
                 <ArrowLeft class="w-5 h-5" />
               </button>
               <div>
                 <h2 class="text-lg font-black text-slate-900 tracking-tight leading-none">Completar solicitud</h2>
                 <p class="text-[11px] font-bold text-[#007F92] mt-1 uppercase tracking-widest">{{ activeScenario?.title }}</p>
               </div>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto px-5 py-6 md:px-8 custom-scrollbar relative flex flex-col min-h-0 bg-transparent xl:shadow-[inset_0_10px_20px_rgba(0,0,0,0.01)]">
            
            <form @submit.prevent class="relative flex flex-col gap-8 py-2">
              
              <!-- Quick Presets -->
              <div v-if="activeScenario.categoryId === 2" class="flex flex-wrap items-center gap-2.5 pb-6 border-b border-white/60">
                <button type="button" @click="applyPreset('now')" class="px-4 py-2.5 bg-white/70 backdrop-blur-md hover:bg-white text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white transition-colors flex items-center gap-1.5 outline-none shadow-sm">
                  <Clock class="w-3.5 h-3.5" /> Hora actual
                </button>
                <button type="button" @click="applyPreset('transfer')" class="px-4 py-2.5 bg-white/70 backdrop-blur-md hover:bg-white text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white transition-colors flex items-center gap-1.5 outline-none shadow-sm">
                  <MapPin class="w-3.5 h-3.5" /> Traslado
                </button>
                <button v-if="hasBirthday()" type="button" @click="applyPreset('birthday')" class="px-4 py-2.5 bg-[#F49A6D]/15 backdrop-blur-md hover:bg-[#F49A6D]/25 text-[#D97746] text-[10px] font-black uppercase tracking-widest rounded-xl border border-[#F49A6D]/30 transition-colors flex items-center gap-1.5 outline-none shadow-sm">
                  <Cake class="w-3.5 h-3.5" /> Cumpleaños
                </button>
              </div>

              <!-- SECTION: Fechas y horarios -->
              <div class="relative group">
                <h3 class="text-[11px] font-black text-[#007F92] uppercase tracking-widest mb-4 block w-full">Fechas y horarios</h3>
                
                <div v-if="activeScenario.categoryId === 4" class="space-y-4 mb-5 pb-5 border-b border-white/60">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="space-y-1.5">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Fecha a cubrir</label>
                      <input type="date" v-model="form.shiftDate" :min="todayDate" class="w-full px-4 py-3.5 rounded-xl border border-white/80 focus:border-[#007F92] focus:ring-2 focus:ring-[#007F92]/20 outline-none text-base sm:text-sm font-bold text-slate-800 transition-all bg-white/70 backdrop-blur-sm shadow-sm" />
                    </div>
                    <div class="space-y-1.5">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Inicio</label>
                      <input type="time" v-model="form.shiftStart" class="w-full px-4 py-3.5 rounded-xl border border-white/80 focus:border-[#007F92] focus:ring-2 focus:ring-[#007F92]/20 outline-none text-base sm:text-sm font-bold text-slate-800 transition-all bg-white/70 backdrop-blur-sm shadow-sm" />
                    </div>
                    <div class="space-y-1.5">
                      <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Fin</label>
                      <input type="time" v-model="form.shiftEnd" class="w-full px-4 py-3.5 rounded-xl border border-white/80 focus:border-[#007F92] focus:ring-2 focus:ring-[#007F92]/20 outline-none text-base sm:text-sm font-bold text-slate-800 transition-all bg-white/70 backdrop-blur-sm shadow-sm" />
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-1.5 col-span-2 sm:col-span-1">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Fecha de inicio</label>
                    <input type="date" v-model="form.date" :min="todayDate" required class="w-full px-4 py-3.5 rounded-xl border border-white/80 focus:border-[#007F92] focus:ring-2 focus:ring-[#007F92]/20 outline-none text-base sm:text-sm font-bold text-slate-800 transition-all bg-white/70 backdrop-blur-sm shadow-sm" />
                  </div>
                  
                  <div v-if="activeScenario.needsEndDate" class="space-y-1.5 col-span-2 sm:col-span-1">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Fecha de término</label>
                    <input type="date" v-model="form.endDate" :min="todayDate" required class="w-full px-4 py-3.5 rounded-xl border border-white/80 focus:border-[#007F92] focus:ring-2 focus:ring-[#007F92]/20 outline-none text-base sm:text-sm font-bold text-slate-800 transition-all bg-white/70 backdrop-blur-sm shadow-sm" />
                  </div>

                  <div v-if="activeScenario.needsTime" class="space-y-1.5 col-span-2 sm:col-span-1">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Hora</label>
                    <input type="time" v-model="form.time" required class="w-full px-4 py-3.5 rounded-xl border border-white/80 focus:border-[#007F92] focus:ring-2 focus:ring-[#007F92]/20 outline-none text-base sm:text-sm font-bold text-slate-800 transition-all bg-white/70 backdrop-blur-sm shadow-sm" />
                  </div>
                </div>

                <div v-if="activeScenario.canReturn" class="mt-5 pt-5 border-t border-white/60 space-y-4">
                  <div class="flex items-center gap-3">
                    <input type="checkbox" id="regreso" v-model="form.regreso" class="w-5 h-5 rounded text-[#007F92] focus:ring-[#007F92] border-slate-300 transition-colors cursor-pointer bg-white/70" />
                    <label for="regreso" class="text-sm font-black text-slate-700 cursor-pointer select-none">Retorna en la misma jornada</label>
                  </div>

                  <div v-if="form.regreso" class="space-y-2 animate-in fade-in bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm">
                    <label class="block text-[10px] font-black text-[#007F92] uppercase tracking-widest px-1">Hora de retorno estimada</label>
                    <input type="time" v-model="form.horaRegreso" required class="w-full px-4 py-3 rounded-xl border border-white/80 focus:border-[#007F92] focus:ring-2 focus:ring-[#007F92]/20 outline-none text-base sm:text-sm font-bold text-slate-800 transition-all bg-white shadow-inner" />
                  </div>
                </div>
              </div>

              <!-- SECTION: Especificaciones (Conditional) -->
              <div v-if="activeScenario.categoryId === 3 || activeScenario.categoryId === 4 || activeScenario.isMedical || activeScenario.categoryId === 2" class="relative group pt-6 border-t border-white/60">
                <h3 class="text-[11px] font-black text-[#007F92] uppercase tracking-widest mb-4 block w-full">Clasificación y opciones</h3>
                
                <div v-if="activeScenario.categoryId === 3" class="space-y-3">
                  <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Clasificación de ausencia</label>
                  <div class="flex flex-wrap gap-2.5">
                    <button 
                      v-for="sub in subcategories" :key="sub"
                      type="button"
                      @click="form.tipoPermiso = form.tipoPermiso === sub ? '' : sub"
                      class="px-4 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all border outline-none text-center shadow-sm backdrop-blur-md"
                      :class="form.tipoPermiso === sub 
                        ? 'bg-[#E83F4B]/15 text-[#C62833] border-[#E83F4B]/40 ring-1 ring-[#E83F4B]/20' 
                        : 'bg-white/70 text-slate-600 border-white hover:border-white/80 hover:bg-white'"
                    >
                      {{ sub }}
                    </button>
                  </div>
                </div>

                <div v-if="activeScenario.categoryId === 4" class="space-y-3">
                  <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Tipo de permiso</label>
                  <div class="flex flex-col sm:flex-row gap-3">
                    <button 
                      v-for="opt in ['Permiso para salir temprano', 'Permiso para llegar tarde']" :key="opt"
                      type="button"
                      @click="form.tipoPermiso = form.tipoPermiso === opt ? '' : opt"
                      class="px-4 py-3.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all border outline-none flex-1 text-center shadow-sm backdrop-blur-md"
                      :class="form.tipoPermiso === opt 
                        ? 'bg-[#FCBF2C]/15 text-[#B7881C] border-[#FCBF2C]/40 ring-1 ring-[#FCBF2C]/20' 
                        : 'bg-white/70 text-slate-600 border-white hover:border-white/80 hover:bg-white'"
                    >
                      {{ opt }}
                    </button>
                  </div>
                </div>

                <div v-if="activeScenario.isMedical" class="space-y-5">
                  <div class="space-y-1.5">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Folio IMSS</label>
                    <input type="text" v-model="form.imss" placeholder="Ej. 12345678" class="w-full px-4 py-3.5 rounded-xl border border-white/80 focus:border-[#007F92] focus:ring-2 focus:ring-[#007F92]/20 outline-none text-base sm:text-sm font-bold text-slate-800 transition-all bg-white/70 backdrop-blur-sm shadow-sm" />
                  </div>
                  <div class="space-y-3">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Clasificación Médica</label>
                    <div class="flex flex-col sm:flex-row gap-3">
                      <button 
                        v-for="tipo in ['Enfermedad general', 'Riesgo de trabajo', 'Maternidad']" :key="tipo"
                        type="button"
                        @click="form.tipoIncapacidad = tipo"
                        class="px-4 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border outline-none flex-1 text-center shadow-sm backdrop-blur-md"
                        :class="form.tipoIncapacidad === tipo 
                          ? 'bg-[#007F92]/15 text-[#007F92] border-[#007F92]/40 ring-1 ring-[#007F92]/20' 
                          : 'bg-white/70 text-slate-600 border-white hover:border-white/80 hover:bg-white'"
                      >
                        {{ tipo }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Traslado a otro plantel -->
                <div v-if="activeScenario.categoryId === 2" class="mt-5">
                  <div v-if="!showDestino" class="flex">
                    <button type="button" @click="showDestino = true" class="text-[10px] font-black text-slate-500 hover:text-[#007F92] flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white/70 backdrop-blur-md border border-white hover:bg-white transition-colors shadow-sm outline-none uppercase tracking-widest">
                      <Plus class="w-4 h-4" /> Destino alterno
                    </button>
                  </div>
                  <div v-else class="p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-sm relative animate-in fade-in duration-200">
                    <button type="button" @click="showDestino = false" class="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-2 bg-white rounded-lg hover:bg-slate-50 border border-white/60 transition-colors outline-none shadow-sm">
                       <XIcon class="w-4 h-4" />
                    </button>
                    <label class="block text-[10px] font-black text-[#007F92] uppercase tracking-widest mb-2 px-1">Plantel de destino</label>
                    <select v-model="form.destino" class="w-full px-4 py-3.5 rounded-xl border border-white/80 focus:border-[#007F92] focus:ring-2 focus:ring-[#007F92]/20 outline-none text-base sm:text-sm font-bold text-slate-800 bg-white/80 cursor-pointer transition-all pr-8 shadow-sm">
                      <option value="">Seleccione un plantel...</option>
                      <option v-for="p in plantelesList" :key="p" :value="p">{{ p }}</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- SECTION: Justificación -->
              <div class="relative group pt-6 border-t border-white/60">
                <h3 class="text-[11px] font-black text-[#007F92] uppercase tracking-widest mb-4 block w-full">Justificación y respaldo</h3>
                
                <div class="space-y-1.5 mb-5">
                  <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Motivo detallado</label>
                  <textarea v-model="form.comentarios" rows="3" placeholder="Describe brevemente la razón..." required class="w-full px-4 py-3.5 rounded-xl border border-white/80 focus:border-[#007F92] focus:ring-2 focus:ring-[#007F92]/20 outline-none text-base sm:text-sm font-medium text-slate-900 resize-none transition-all bg-white/70 backdrop-blur-sm shadow-sm"></textarea>
                </div>

                <div v-if="activeScenario.categoryId === 3" class="space-y-2 pt-2">
                  <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                    <Paperclip class="w-3.5 h-3.5" /> Evidencia Adjunta (Opcional)
                  </label>
                  <div class="relative border-2 border-dashed border-slate-300/80 hover:border-[#007F92]/50 bg-white/50 backdrop-blur-md rounded-2xl p-6 transition-all text-center group cursor-pointer" :class="{'border-[#007F92] border-solid bg-[#007F92]/5': evidenceFile}">
                    <input type="file" @change="onFileChange" accept="image/*,application/pdf" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div v-if="!evidenceFile" class="flex flex-col items-center gap-2">
                      <UploadCloud class="w-7 h-7 text-slate-400 group-hover:text-[#007F92] transition-colors shrink-0" />
                      <span class="text-sm font-black text-slate-700 mt-1">Haz clic o arrastra un archivo</span>
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDF, JPG o PNG (Max. 5MB)</span>
                    </div>
                    <div v-else class="flex items-center justify-between z-20 relative px-1">
                      <div class="flex items-center gap-3 min-w-0">
                         <FileText class="w-7 h-7 text-[#007F92] shrink-0" />
                         <div class="text-left min-w-0">
                            <p class="text-sm font-black text-slate-800 truncate" :title="evidenceFile.name">{{ evidenceFile.name }}</p>
                            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{{ (evidenceFile.size / 1024 / 1024).toFixed(2) }} MB</p>
                         </div>
                      </div>
                      <button type="button" @click.stop.prevent="clearEvidence" class="p-2.5 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-xl transition-colors outline-none shrink-0 shadow-sm border border-white/60">
                        <XIcon class="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Opt-In Authorizer -->
              <div v-if="!isAuthorizerForCurrent && selectedEmployees.length > 0" class="p-5 sm:p-6 bg-white/80 backdrop-blur-md rounded-[1.5rem] border border-white shadow-sm transition-all animate-in fade-in mt-2">
                <div class="flex items-start gap-3">
                  <input type="checkbox" id="optInAuth" v-model="form.optInAuthorizer" class="mt-[3px] w-5 h-5 rounded text-[#007F92] focus:ring-[#007F92] border-slate-300 cursor-pointer bg-white" />
                  <label for="optInAuth" class="cursor-pointer select-none">
                    <p class="text-sm font-black text-slate-800">Recibir avisos de este plantel</p>
                    <p class="text-[11px] font-bold text-slate-500 mt-0.5">Asignarme como responsable para autorizar futuros pases.</p>
                  </label>
                </div>
                <div v-if="form.optInAuthorizer && !myProfile?.phone" class="mt-4 pt-4 border-t border-white/60 animate-in fade-in">
                  <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1">Número de celular (Obligatorio)</label>
                  <div class="flex items-center rounded-xl border border-white/80 overflow-hidden bg-white/80 focus-within:border-[#007F92] focus-within:ring-2 focus-within:ring-[#007F92]/20 shadow-sm">
                     <div class="bg-white/90 border-r border-white px-4 py-3.5 text-slate-500 font-black text-sm">+52 1</div>
                     <input v-model="form.authorizerPhone" type="tel" maxlength="10" placeholder="10 dígitos" @input="form.authorizerPhone = form.authorizerPhone.replace(/\D/g, '').substring(0, 10)" class="flex-1 px-4 py-3.5 outline-none text-base sm:text-sm font-bold text-slate-800 bg-transparent" />
                  </div>
                </div>
              </div>
            </form>

            <!-- Massive Bottom Actions Zone -->
            <div class="mt-8 mb-[100px] xl:mb-6 xl:mt-auto bg-white/80 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] border border-white shadow-sm flex flex-col gap-5">
              <div class="text-center mb-1">
                <h3 class="text-sm font-black text-slate-800">Finalizar solicitud</h3>
                <p class="text-[11px] font-bold text-slate-500 mt-1">Revisa la información antes de proceder</p>
              </div>
              
              <div class="flex flex-col gap-4">
                <button 
                  type="button" 
                  @click="submitPass(false)" 
                  :disabled="isSubmitting || !isFormComplete" 
                  class="w-full relative group overflow-hidden bg-white hover:bg-slate-50 text-slate-700 font-black text-base sm:text-sm rounded-[1.25rem] transition-all border-2 border-slate-200/60 hover:border-slate-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed h-14 outline-none"
                >
                  <div class="absolute inset-0 flex items-center justify-center gap-2.5 transition-transform duration-300 group-hover:scale-[1.02]">
                    <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin text-slate-400" />
                    <Send v-else class="w-5 h-5 text-brand-500 group-hover:text-brand-600 transition-colors" /> 
                    <span>Solicitar autorización</span>
                  </div>
                </button>

                <button 
                  type="button" 
                  @click="submitPass(true)" 
                  :disabled="isSubmitting || !isFormComplete" 
                  class="w-full relative group overflow-hidden bg-gradient-to-b from-brand-500 to-brand-700 text-white font-black text-base sm:text-sm rounded-[1.25rem] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed h-14 outline-none border border-brand-800/50"
                >
                  <div class="absolute inset-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                  <div class="absolute inset-0 flex items-center justify-center gap-2.5 transition-transform duration-300 group-hover:scale-[1.02] z-10">
                    <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin text-white/80" />
                    <CheckCircle v-else class="w-5 h-5 text-brand-200 group-hover:text-white transition-colors" /> 
                    <span class="tracking-wide">Autorizar directamente</span>
                  </div>
                </button>
              </div>

              <p v-if="hasSelfPass" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mt-2">
                <Info class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                Solicitud registrada a tu nombre.
              </p>
            </div>

          </div>
        </template>
      </div>
    </section>

    <!-- RIGHT COLUMN (Context History) -->
    <section 
      class="w-full flex-1 flex flex-col p-5 md:p-8 relative bg-transparent z-10 xl:h-full min-w-0 overflow-visible xl:overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
      :class="activeScenario ? 'hidden xl:flex' : 'flex'"
    >
      <div class="w-full max-w-4xl mx-auto flex flex-col gap-6 flex-1 min-h-0 relative">
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
        
        <div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50/90 to-transparent pointer-events-none z-20 rounded-b-3xl"></div>
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
import { LogOut, LogIn, UserX, Stethoscope, Clock, Loader2, X as XIcon, Cake, Send, Building2, Briefcase, MapPin, Plus, CheckCircle, UploadCloud, Paperclip, FileText, RotateCcw, Check, Info, ArrowLeft } from 'lucide-vue-next'
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

function goBack() {
  activeScenario.value = null
  if (window.innerWidth < 1280) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
  
  if (window.innerWidth < 1280) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
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
    alert('Hubo un problema al registrar la solicitud.')
  } finally {
    isSubmitting.value = false
  }
}
</script>