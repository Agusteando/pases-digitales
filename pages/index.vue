<template>
  <div class="flex flex-col xl:flex-row w-full min-h-[100dvh] xl:h-screen xl:overflow-hidden bg-transparent">
    
    <!-- LEFT COLUMN (Paso 1: Selección Múltiple Ininterrumpida) -->
    <section 
      class="w-full flex flex-col shrink-0 border-b xl:border-b-0 border-white/50 z-30 xl:h-full transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] relative bg-white/50 backdrop-blur-2xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-hidden"
      :class="activeScenario ? 'hidden xl:flex xl:w-0 xl:opacity-0 xl:border-none pointer-events-none' : 'flex xl:w-[460px] 2xl:w-[500px] xl:border-r opacity-100'"
    >
      <div class="w-full xl:w-[460px] 2xl:w-[500px] flex-col h-full flex shrink-0">
        
        <!-- Header & Search (Fixed Top) -->
        <div class="px-6 md:px-8 pt-6 md:pt-8 pb-4 shrink-0 bg-transparent flex flex-col gap-6 z-20">
          <header>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">Nuevo pase</h1>
            <p class="text-slate-500 mt-1 text-sm font-bold">Registro y justificación de incidencias</p>
          </header>

          <div class="relative">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-base font-black shadow-md shrink-0 bg-gradient-to-br from-[#8EC152] to-[#618B2F] text-white border border-[#7DB041] shadow-[#8EC152]/20">
                1
              </div>
              <div>
                <h2 class="text-xl font-black text-slate-900 tracking-tight leading-none">Colaboradores</h2>
                <p class="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Añade a los involucrados</p>
              </div>
            </div>
            <EmployeeSearch @select="addEmployee" />
          </div>
        </div>

        <!-- Scrollable Content Area: Selected Employees + Motivo -->
        <div class="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 pb-10 relative z-10 flex flex-col">
          
          <!-- Selected Employees List -->
          <div>
            <div v-if="(selectedEmployees || []).length > 0" class="flex flex-col gap-3">
              
              <div class="flex items-center justify-between pb-2 border-b border-white/60 px-1 mt-2">
                <h3 class="text-[11px] font-black text-[#007F92] uppercase tracking-widest">Lista seleccionada ({{ selectedEmployees.length }})</h3>
                <button v-if="selectedEmployees.length > 1" @click="resetFlow" class="text-[10px] font-bold text-casita-red hover:text-casita-red-dark uppercase tracking-widest transition-colors outline-none bg-white hover:bg-red-50 px-2.5 py-1 rounded-md border border-white shadow-sm">Remover todos</button>
              </div>
              
              <div class="flex flex-col gap-2.5">
                <div v-for="emp in selectedEmployees" :key="getEmpKey(emp)" class="flex flex-col bg-white/80 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white shadow-sm group hover:shadow-md transition-all">
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <!-- Picture flows strictly from the enrichment API via the selected CURP -->
                      <PremiumAvatar :src="emp.picture" :name="emp.name" size="sm" class="w-10 h-10 ring-2 ring-white shadow-sm shrink-0" />
                      <div class="flex flex-col min-w-0 flex-1">
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-black text-slate-900 truncate">{{ emp.name }}</span>
                          <span v-if="myProfile && emp.name === myProfile.name" class="shrink-0 text-[8px] font-black text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded uppercase tracking-widest border border-brand-100/50 shadow-sm">Yo</span>
                        </div>
                        
                        <!-- Loading State -->
                        <div v-if="emp._enriching" class="flex gap-2 mt-1.5">
                          <div class="h-3 w-16 bg-slate-200/50 animate-pulse rounded"></div>
                          <div class="h-3 w-24 bg-slate-200/50 animate-pulse rounded"></div>
                        </div>
                        
                        <!-- Enriched Info -->
                        <div v-else class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] font-bold text-slate-500">
                          <span v-if="emp.puesto" class="truncate max-w-[120px]">{{ emp.puesto }}</span>
                          <span v-if="emp.puesto && emp.plantelBase" class="text-slate-300">•</span>
                          
                          <span v-if="emp.plantelActual && emp.plantelActual !== emp.plantelBase" class="text-[#007F92] flex items-center gap-1 bg-[#007F92]/10 px-1.5 py-0.5 rounded border border-[#007F92]/20">
                            <MapPin class="w-3 h-3" /> {{ emp.plantelActual }}
                            <button @click.stop="resetPlantelActual(emp)" class="ml-0.5 hover:text-[#006575]"><XIcon class="w-3 h-3"/></button>
                          </span>
                          <span v-else-if="emp.plantelBase" class="flex items-center gap-1">
                            <Building2 class="w-3 h-3 text-slate-400" /> {{ emp.plantelBase }}
                          </span>
                          
                          <button v-if="!emp._editingActual" @click.stop="emp._editingActual = true" class="text-slate-400 hover:text-[#007F92] transition-colors uppercase tracking-widest ml-1 text-[9px] bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-sm">Cambiar</button>
                        </div>
                      </div>
                    </div>
                    <button @click="removeEmployee(getEmpKey(emp))" class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm border border-slate-100 transition-colors shrink-0 outline-none">
                      <XIcon class="w-4 h-4" />
                    </button>
                  </div>

                  <!-- Edit Plantel Actual inline -->
                  <div v-if="emp._editingActual" class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                    <select v-model="emp.plantelActual" @change="onPlantelActualSelected(emp)" class="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-[#007F92]/20 focus:border-[#007F92] outline-none cursor-pointer shadow-sm">
                      <option v-for="p in (plantelesList || [])" :key="p" :value="p">{{ p }}</option>
                    </select>
                    <button @click="emp._editingActual = false" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm border border-slate-200 outline-none shrink-0">
                      <XIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="flex flex-col items-center justify-center py-10 opacity-60">
              <Users class="w-12 h-12 text-slate-300 mb-3" />
              <p class="text-sm font-black text-slate-600">Ningún colaborador</p>
              <p class="text-xs font-bold text-slate-400 mt-1 max-w-[200px] text-center">Busca y selecciona a una o más personas para crear su pase.</p>
            </div>
          </div>

          <!-- Motivo Section -->
          <div v-if="checkingCoverage" class="mt-8 pt-8 border-t border-white/60 flex flex-col items-center justify-center">
             <Loader2 class="w-8 h-8 animate-spin text-[#007F92] mb-3 shrink-0" />
             <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verificando responsables...</p>
          </div>
          
          <div v-else-if="!currentCoverageTask && (selectedEmployees || []).length > 0" class="mt-6 pt-6 border-t border-white/60 flex flex-col">
            <div class="flex items-center gap-4 mb-5">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-base font-black shadow-md shrink-0 bg-gradient-to-br from-[#1AA8BC] to-[#007F92] text-white border border-[#0D94A6] shadow-[#007F92]/20">
                2
              </div>
              <div>
                <h2 class="text-xl font-black text-slate-900 tracking-tight leading-none">Motivo</h2>
                <p class="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Selecciona la razón de incidencia</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-1 -mx-1">
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
                  <p class="text-[11px] font-bold text-slate-500 mt-1">
                    {{ (selectedEmployees || []).length > 1 ? `Solicitud Múltiple (${selectedEmployees.length} personas)` : 'Completar detalles de solicitud' }}
                  </p>
                </div>
              </div>
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

          <!-- Horizontal Review Strip (Persistencia de Contexto) -->
          <div class="bg-white/50 backdrop-blur-xl border-b border-white/80 p-4 sm:p-5 shrink-0 shadow-[inset_0_-2px_10px_rgba(0,0,0,0.02)] z-30 relative">
            <h3 class="text-[10px] font-black text-[#007F92] uppercase tracking-widest mb-3 block w-full px-1">Colaboradores incluidos ({{ (selectedEmployees || []).length }})</h3>
            <div class="flex gap-3 overflow-x-auto custom-scrollbar pb-2 px-1">
              <div v-for="emp in selectedEmployees" :key="getEmpKey(emp)" class="flex items-center gap-3 bg-white/90 backdrop-blur-md p-2 pr-4 rounded-full border border-white shadow-sm shrink-0 transition-transform hover:-translate-y-0.5">
                <PremiumAvatar :src="emp.picture" :name="emp.name" size="sm" class="w-8 h-8 ring-2 ring-white shadow-sm" />
                <div class="flex flex-col">
                  <span class="text-xs font-black text-slate-800 leading-none">{{ emp.name.split(' ')[0] }} {{ emp.name.split(' ')[1] || '' }}</span>
                  <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{{ emp.plantelActual || emp.plantelBase || 'Sin Plantel' }}</span>
                </div>
              </div>
            </div>
          </div>

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
                      <option v-for="p in (plantelesList || [])" :key="p" :value="p">{{ p }}</option>
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

                <div v-if="activeScenario.categoryId === 3 || activeScenario.categoryId === 5" class="space-y-2 pt-2">
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
              <div v-if="!isAuthorizerForCurrent && (selectedEmployees || []).length > 0" class="p-5 sm:p-6 bg-white/80 backdrop-blur-md rounded-[1.5rem] border border-white shadow-sm transition-all animate-in fade-in mt-2">
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

              <!-- Telegram Schedule Option -->
              <div v-if="isFuture" class="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between gap-3 shadow-inner">
                 <div class="flex items-center gap-3">
                   <div class="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#007F92] border border-slate-200 shrink-0">
                     <CalendarClock class="w-4 h-4" />
                   </div>
                   <div class="text-left">
                     <h4 class="text-[11px] font-black text-slate-700 leading-tight">Aviso en Telegram Programado</h4>
                     <p class="text-[9px] font-bold text-slate-500 mt-0.5">Si se autoriza, se enviará a la hora del pase.</p>
                   </div>
                 </div>
                 <label class="relative inline-flex items-center cursor-pointer shrink-0">
                   <input type="checkbox" v-model="form.scheduleTg" class="sr-only peer">
                   <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#007F92]"></div>
                 </label>
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
                    <Send v-else class="w-5 h-5 text-[#007F92] group-hover:text-[#006575] transition-colors" /> 
                    <span>Solicitar autorización</span>
                  </div>
                </button>

                <button 
                  type="button" 
                  @click="submitPass(true)" 
                  :disabled="isSubmitting || !isFormComplete" 
                  class="w-full relative group overflow-hidden bg-gradient-to-b from-[#007F92] to-[#006575] text-white font-black text-base sm:text-sm rounded-[1.25rem] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed h-14 outline-none border border-[#00497B]/50"
                >
                  <div class="absolute inset-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                  <div class="absolute inset-0 flex items-center justify-center gap-2.5 transition-transform duration-300 group-hover:scale-[1.02] z-10">
                    <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin text-white/80" />
                    <CheckCircle v-else class="w-5 h-5 text-[#b4e2e2] group-hover:text-white transition-colors" /> 
                    <span class="tracking-wide">Autorizar directamente</span>
                  </div>
                </button>
              </div>

              <p v-if="hasSelfPass" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mt-2">
                <Info class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                Contiene un registro a tu propio nombre.
              </p>
            </div>

          </div>
        </template>
      </div>
    </section>

    <!-- RIGHT COLUMN (Context History - Stackeable) -->
    <section 
      class="w-full flex-1 flex flex-col relative bg-transparent z-10 xl:h-full min-w-0 overflow-y-auto custom-scrollbar transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
      :class="activeScenario ? 'hidden xl:flex' : 'flex'"
    >
      <div class="w-full max-w-4xl mx-auto flex flex-col gap-6 flex-1 min-h-0 relative p-5 md:p-8 pb-20">
        <template v-if="(selectedEmployees || []).length > 0">
          <div v-for="(emp, idx) in selectedEmployees" :key="emp.id" class="flex-1 min-h-[450px] max-h-[700px] shrink-0 animate-in fade-in slide-in-from-right-8 duration-500 relative flex flex-col" :style="{ animationDelay: `${idx * 0.1}s` }">
             <EmployeeContextPanel :employee="emp" class="flex-1 h-full" />
          </div>
        </template>
        <template v-else>
          <RecentActivityPanel class="flex-1 min-h-0 animate-in fade-in duration-700" />
        </template>
        
        <div class="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50/90 to-transparent pointer-events-none z-20 -mt-12 rounded-b-3xl"></div>
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
import { LogOut, LogIn, UserX, Stethoscope, Clock, Loader2, X as XIcon, Cake, Send, Building2, Briefcase, MapPin, Plus, CheckCircle, UploadCloud, Paperclip, FileText, RotateCcw, Check, Info, ArrowLeft, Users, CalendarClock } from 'lucide-vue-next'
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

const currentCoverageTask = computed(() => (coverageQueue.value || [])[0] || null)

const getEmpKey = (e) => e.ClaveUnica || e.curp || e.name;

const isAuthorizerForCurrent = computed(() => {
  if (!myProfile.value || !Array.isArray(myProfile.value.authorizedPlanteles) || (selectedEmployees.value || []).length === 0) return true;
  const targetPlantel = selectedEmployees.value[0]?.plantelActual || selectedEmployees.value[0]?.plantelBase;
  return myProfile.value.authorizedPlanteles.includes(targetPlantel);
})

const hasSelfPass = computed(() => {
  return myProfile.value && (selectedEmployees.value || []).some(e => e.name === myProfile.value.name)
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

const isFuture = computed(() => {
  if (!form.date) return false;
  const dateStr = dayjs(form.date).format('YYYY-MM-DD');
  const timeStr = form.time || '08:00';
  const dt = dayjs(`${dateStr} ${timeStr}`);
  return dt.isAfter(dayjs());
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
  if ((coverageQueue.value || []).find(c => c.plantel === plantel)) return

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
    
    selectedEmployees.value = (selectedEmployees.value || []).filter(e => {
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
  const empKey = getEmpKey(emp)
  if (!(selectedEmployees.value || []).find(e => getEmpKey(e) === empKey)) {
    const tempEmp = { ...emp, _enriching: true, _editingActual: false }
    selectedEmployees.value.push(tempEmp)

    let enriched = {}
    if (emp.curp) {
      enriched = await $fetch('/api/employees/enrich', { query: { curp: emp.curp } }).catch(() => ({}))
    }
    
    const actualEmp = (selectedEmployees.value || []).find(e => getEmpKey(e) === empKey)
    if (actualEmp) {
      actualEmp.curp = emp.curp || null 
      actualEmp.plantelBase = emp.plantel || null 
      actualEmp.plantelActual = actualEmp.plantelBase
      actualEmp.puesto = enriched.puesto || null 
      actualEmp.picture = enriched.picture || null 
      actualEmp.ClaveUnica = emp.ClaveUnica || null 
      actualEmp._editingActual = false
      actualEmp._enriching = false

      await checkCoverageQueue(actualEmp)
    }
  }
}

function removeEmployee(key) {
  selectedEmployees.value = (selectedEmployees.value || []).filter(e => getEmpKey(e) !== key)
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
  shiftEnd: '',
  scheduleTg: true
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
    tipoPermiso: '', shiftDate: '', shiftStart: '', shiftEnd: '', scheduleTg: true
  })
  
  if (window.innerWidth < 1280) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function isBirthday(emp) {
  if (!emp || !emp.curp) return false;
  const curpStr = String(emp.curp);
  if (curpStr.length < 10) return false;
  const mm = curpStr.substring(6, 8);
  const dd = curpStr.substring(8, 10);
  const today = new Date();
  const bMonth = parseInt(mm) - 1;
  const bDay = parseInt(dd);
  return today.getMonth() === bMonth && (today.getDate() === bDay || today.getDate() + 1 === bDay);
}

function hasBirthday() {
  return (selectedEmployees.value || []).some(emp => isBirthday(emp))
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
    const emp = (selectedEmployees.value || []).find(e => isBirthday(e))
    let birthdayStr = ''
    if (emp && emp.curp) {
      const curpStr = String(emp.curp);
      if (curpStr.length >= 10) {
        const dd = curpStr.substring(8, 10)
        const mm = curpStr.substring(6, 8)
        birthdayStr = ` (Nacimiento: ${dd}/${mm})`
      }
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
    if (form.optInAuthorizer && (selectedEmployees.value || []).length > 0) {
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

    await Promise.all((selectedEmployees.value || []).map(emp => 
      $fetch('/api/passes', {
        method: 'POST',
        body: { 
          employeeName: emp.name, 
          curp: emp.curp || null,
          ingressioId: emp.ClaveUnica || null,
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
          autoAuthorize,
          scheduleTg: form.scheduleTg
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