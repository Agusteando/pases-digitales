<template>
  <div class="p-5 md:p-8 max-w-[1800px] mx-auto h-full flex flex-col relative z-10">
    <header class="shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
      <div class="flex items-center gap-4">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-iedis-teal to-iedis-teal-dark text-white flex items-center justify-center shadow-md">
          <LockKeyhole class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight">Autorizaciones</h1>
          <p class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mt-1">Control de acceso</p>
        </div>
      </div>

      <div class="inline-flex self-start lg:self-auto p-1 rounded-2xl bg-white/70 border border-white shadow-sm">
        <button @click="switchView('AUTHORIZER')" class="px-5 py-2.5 rounded-xl text-xs font-black transition-all" :class="activeView === 'AUTHORIZER' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'">Por autorizador</button>
        <button @click="switchView('GROUP')" class="px-5 py-2.5 rounded-xl text-xs font-black transition-all" :class="activeView === 'GROUP' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'">Por grupo</button>
      </div>
    </header>

    <!-- USER-CENTRIC VIEW -->
    <div v-if="activeView === 'AUTHORIZER'" class="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
      <aside class="glass-panel rounded-[2.25rem] border border-white/80 shadow-sm overflow-hidden flex flex-col min-h-[360px] xl:min-h-0">
        <div class="p-4 border-b border-white/70 bg-white/45 flex items-center gap-3">
          <div class="relative flex-1">
            <Search class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input v-model="authorizerSearch" type="search" placeholder="Buscar autorizador" class="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/85 border border-white focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold text-slate-800 shadow-sm" />
          </div>
          <button @click="openScopeDrawer(null)" class="w-11 h-11 rounded-2xl bg-gradient-to-br from-iedis-teal to-iedis-teal-dark text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all outline-none" title="Agregar autorizador">
            <Plus class="w-5 h-5" />
          </button>
        </div>

        <div v-if="authorizersLoading" class="flex-1 flex items-center justify-center p-10">
          <Loader2 class="w-8 h-8 animate-spin text-iedis-teal" />
        </div>
        <div v-else class="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-1">
          <button v-for="authorizer in filteredAuthorizers" :key="authorizer.email" @click="selectedAuthorizerEmail = authorizer.email" class="w-full p-3.5 rounded-2xl flex items-center gap-3 text-left transition-all outline-none" :class="selectedAuthorizerEmail === authorizer.email ? 'bg-white shadow-md ring-1 ring-white' : 'hover:bg-white/60'">
            <PremiumAvatar :src="authorizer.photoUrl" :name="authorizer.name || authorizer.email" size="sm" class="shrink-0 ring-2 ring-white bg-white" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-black text-slate-900 truncate">{{ authorizer.name }}</p>
              <p class="text-[10px] font-bold text-slate-500 truncate mt-0.5">{{ authorizer.email }}</p>
            </div>
            <span class="shrink-0 min-w-7 h-7 px-2 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center">{{ authorizer.assignments.length }}</span>
          </button>

          <div v-if="!filteredAuthorizers.length" class="py-14 text-center">
            <UserCheck class="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p class="text-sm font-black text-slate-500">Sin autorizadores</p>
          </div>
        </div>
      </aside>

      <section class="glass-panel rounded-[2.5rem] border border-white/80 shadow-sm overflow-hidden flex flex-col min-h-[520px] xl:min-h-0">
        <template v-if="selectedAuthorizer">
          <div class="p-6 md:p-7 border-b border-white/70 bg-white/45 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4 min-w-0">
              <PremiumAvatar :src="selectedAuthorizer.photoUrl" :name="selectedAuthorizer.name || selectedAuthorizer.email" size="md" class="shrink-0 ring-4 ring-white shadow-sm bg-white" />
              <div class="min-w-0">
                <h2 class="text-xl md:text-2xl font-black text-slate-900 truncate">{{ selectedAuthorizer.name }}</h2>
                <p class="text-xs font-bold text-slate-500 truncate mt-0.5">{{ selectedAuthorizer.email }}</p>
              </div>
            </div>
            <button @click="openScopeDrawer(selectedAuthorizer)" class="px-5 py-3 rounded-2xl bg-gradient-to-r from-iedis-teal to-iedis-teal-dark text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 outline-none">
              <Plus class="w-4 h-4" /> Alcance
            </button>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-7">
            <div v-for="section in selectedAssignmentSections" :key="section.type" v-show="section.items.length" class="mb-7 last:mb-0">
              <div class="flex items-center gap-2 mb-3 px-1">
                <component :is="section.icon" class="w-4 h-4 text-slate-400" />
                <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{{ section.label }}</h3>
                <span class="text-[10px] font-black text-slate-300">{{ section.items.length }}</span>
              </div>

              <div class="grid grid-cols-1 2xl:grid-cols-2 gap-3">
                <div v-for="assignment in section.items" :key="assignment.key" class="group p-4 rounded-2xl bg-white/75 border border-white shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                  <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" :class="assignment.type === 'PERSON' ? 'bg-violet-50 text-violet-600' : assignment.type === 'PLANTEL' ? 'bg-iedis-blue/10 text-iedis-blue' : 'bg-iedis-teal/10 text-iedis-teal-dark'">
                    <component :is="section.icon" class="w-5 h-5" />
                  </div>
                  <button @click="openAssignment(assignment)" class="min-w-0 flex-1 text-left outline-none">
                    <p class="text-sm font-black text-slate-900 truncate">{{ assignment.label }}</p>
                    <div class="flex items-center gap-2 mt-1 min-w-0">
                      <span class="text-[10px] font-bold text-slate-500 truncate">{{ assignment.detail }}</span>
                      <span v-if="assignment.userCount" class="text-[9px] font-black text-slate-300">· {{ assignment.userCount }}</span>
                    </div>
                  </button>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <span v-for="channel in assignment.channels" :key="channel" class="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center" :title="channel">
                      <MessageCircle v-if="channel === 'WHATSAPP'" class="w-3.5 h-3.5 text-casita-green-dark" />
                      <Mail v-else class="w-3.5 h-3.5 text-iedis-blue-dark" />
                    </span>
                    <button v-if="assignment.targetCount <= 1" @click="removeAssignment(assignment)" class="w-8 h-8 rounded-lg text-slate-300 hover:text-casita-red hover:bg-red-50 transition-all flex items-center justify-center opacity-70 group-hover:opacity-100 outline-none" title="Eliminar regla">
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="!selectedAuthorizer.assignments.length" class="h-full min-h-[320px] flex items-center justify-center text-center">
              <div>
                <ShieldCheck class="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p class="text-sm font-black text-slate-500">Sin alcances</p>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="flex-1 flex items-center justify-center text-center p-10">
          <div>
            <UserCheck class="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p class="text-base font-black text-slate-500">Selecciona un autorizador</p>
          </div>
        </div>
      </section>
    </div>

    <!-- GROUP VIEW -->
    <div v-else class="flex-1 min-h-0 glass-panel rounded-[2.5rem] border border-white/80 shadow-sm overflow-hidden flex flex-col">
      <div class="p-4 md:p-5 border-b border-white/70 bg-white/45 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div class="flex flex-col sm:flex-row gap-3 flex-1">
          <select v-model="selectedPlantel" @change="setPlantel(selectedPlantel)" class="min-w-[240px] px-4 py-3 rounded-2xl bg-white/85 border border-white focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-xs font-black text-slate-700 shadow-sm">
            <option value="ALL">Toda la institución</option>
            <option v-for="plantel in matrix.planteles" :key="plantel" :value="plantel">{{ plantel }}</option>
          </select>
          <div class="relative flex-1 max-w-xl">
            <Search class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input v-model="groupSearchQuery" type="search" placeholder="Buscar puesto o autorizador" class="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/85 border border-white focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold text-slate-800 shadow-sm" />
          </div>
          <select v-model="statusFilter" class="px-4 py-3 rounded-2xl bg-white/85 border border-white focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-xs font-black text-slate-700 shadow-sm">
            <option value="ALL">Todos</option>
            <option value="PROTECTED">Protegidos</option>
            <option value="INCOMPLETE">Incompletos</option>
            <option value="OVERRIDES">Overrides</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <button @click="openPlantelDefault" :disabled="selectedPlantel === 'ALL'" class="px-4 py-3 rounded-2xl bg-white text-slate-700 text-xs font-black border border-white shadow-sm hover:text-iedis-teal-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            Default plantel
          </button>
          <button @click="openBulkAssignment" class="px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black shadow-sm hover:bg-slate-800 transition-all flex items-center gap-2">
            <Plus class="w-4 h-4" /> Asignar
          </button>
        </div>
      </div>

      <div v-if="matrixLoading" class="flex-1 flex items-center justify-center p-16">
        <Loader2 class="w-10 h-10 animate-spin text-iedis-teal" />
      </div>
      <div v-else class="flex-1 overflow-auto custom-scrollbar">
        <table class="w-full min-w-[980px] text-left">
          <thead class="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100">
            <tr class="text-[10px] font-black uppercase tracking-widest text-slate-400">
              <th class="px-5 py-4 w-12"><input type="checkbox" :checked="allVisibleSelected" @change="toggleAllVisible" class="w-4 h-4 rounded border-slate-300 text-iedis-teal focus:ring-iedis-teal" /></th>
              <th class="px-4 py-4">Puesto</th>
              <th class="px-4 py-4">Usuarios</th>
              <th class="px-4 py-4">Autorizador</th>
              <th class="px-4 py-4">Canal</th>
              <th class="px-4 py-4">Estado</th>
              <th class="px-4 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/70">
            <tr v-for="row in matrix.rows" :key="row.key" class="hover:bg-white/55 transition-all">
              <td class="px-5 py-4"><input type="checkbox" :checked="selectedKeys.includes(row.key)" @change="toggleRow(row)" class="w-4 h-4 rounded border-slate-300 text-iedis-teal focus:ring-iedis-teal" /></td>
              <td class="px-4 py-4">
                <p class="text-sm font-black text-slate-900 max-w-[320px] truncate">{{ row.puesto }}</p>
                <p class="text-[10px] font-bold text-slate-400 mt-1">{{ row.sourceLabel }}</p>
              </td>
              <td class="px-4 py-4"><span class="text-xs font-black text-slate-600">{{ row.userCount }}</span></td>
              <td class="px-4 py-4">
                <div v-if="row.targets?.length" class="flex items-center gap-2 max-w-[320px]">
                  <div class="flex -space-x-2 shrink-0"><PremiumAvatar v-for="target in row.targets.slice(0, 3)" :key="target.email" :src="target.photoUrl" :name="target.name || target.email" size="sm" class="!w-8 !h-8 ring-2 ring-white bg-white" /></div>
                  <div class="min-w-0"><p class="text-xs font-black text-slate-800 truncate">{{ targetLabel(row) }}</p><p class="text-[9px] font-bold text-slate-400 truncate mt-0.5">{{ targetEmails(row) }}</p></div>
                </div>
                <span v-else class="text-xs font-bold text-slate-400">—</span>
              </td>
              <td class="px-4 py-4">
                <div class="flex gap-1.5"><span v-for="channel in rowChannels(row)" :key="channel" class="w-7 h-7 rounded-lg bg-white border border-white shadow-sm flex items-center justify-center"><MessageCircle v-if="channel === 'WHATSAPP'" class="w-3.5 h-3.5 text-casita-green-dark" /><Mail v-else class="w-3.5 h-3.5 text-iedis-blue-dark" /></span></div>
              </td>
              <td class="px-4 py-4"><span class="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest" :class="stateClass(row.state)"><span class="w-1.5 h-1.5 rounded-full" :class="stateDotClass(row.state)"></span>{{ stateLabel(row.state) }}</span></td>
              <td class="px-4 py-4 text-right">
                <div class="inline-flex items-center gap-1">
                  <button @click="editGroupRow(row)" class="px-3 py-2 rounded-xl bg-white text-brand-700 border border-white shadow-sm text-[10px] font-black hover:shadow-md transition-all">Editar</button>
                  <button v-if="row.ruleIds?.length" @click="clearEffectiveRule(row)" class="w-9 h-9 rounded-xl bg-white text-slate-300 hover:text-casita-red border border-white shadow-sm flex items-center justify-center transition-all" title="Eliminar regla"><Trash2 class="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!matrix.rows.length" class="py-20 text-center"><Search class="w-8 h-8 text-slate-300 mx-auto mb-3" /><p class="text-sm font-black text-slate-500">Sin resultados</p></div>
      </div>
    </div>

    <!-- ASSIGNMENT DRAWER -->
    <div v-if="drawerOpen" class="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm" @click.self="closeDrawer">
      <div class="w-full max-w-xl h-full bg-white/95 backdrop-blur-xl shadow-2xl border-l border-white flex flex-col">
        <header class="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{{ drawerEyebrow }}</p>
            <h3 class="text-xl font-black text-slate-900 tracking-tight truncate">{{ drawerTitle }}</h3>
          </div>
          <button @click="closeDrawer" class="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all"><X class="w-5 h-5" /></button>
        </header>

        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <section v-if="!form.email" class="space-y-2">
            <div class="relative">
              <Search class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input v-model="gwSearchQuery" @input="searchGw" placeholder="Nombre o correo" class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold text-slate-800" />
              <div v-if="gwResults.length" class="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-dropdown overflow-hidden z-20 max-h-72 overflow-y-auto custom-scrollbar">
                <button v-for="result in gwResults" :key="result.email" @click="selectGw(result)" class="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors">
                  <PremiumAvatar :src="result.photoUrl" :name="result.name" size="sm" class="shrink-0 bg-white" />
                  <div class="min-w-0"><p class="text-sm font-black text-slate-900 truncate">{{ result.name }}</p><p class="text-[10px] font-bold text-slate-500 truncate">{{ result.email }}</p></div>
                </button>
              </div>
            </div>
          </section>

          <section v-else class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <PremiumAvatar :src="selectedGwPhoto" :name="selectedGwName || form.email" size="sm" class="shrink-0 ring-2 ring-white bg-white" />
            <div class="min-w-0 flex-1"><p class="text-sm font-black text-slate-900 truncate">{{ selectedGwName || form.email }}</p><p class="text-[10px] font-bold text-slate-500 truncate">{{ form.email }}</p></div>
            <button v-if="drawerContext === 'GROUP' || (drawerContext === 'AUTHORIZER' && !lockedAuthorizer)" @click="clearGw" class="w-8 h-8 rounded-lg text-slate-400 hover:text-casita-red flex items-center justify-center"><X class="w-4 h-4" /></button>
          </section>

          <template v-if="drawerContext === 'AUTHORIZER'">
            <section class="space-y-3">
              <div class="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button v-for="option in scopeTypeOptions" :key="option.value" @click="setScopeType(option.value)" :disabled="drawerMode === 'EDIT_ASSIGNMENT'" class="py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:cursor-default" :class="form.scopeType === option.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'">{{ option.label }}</button>
              </div>
            </section>

            <section v-if="form.scopeType === 'PERSON'" class="space-y-3">
              <div v-if="!form.person" class="relative">
                <Search class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input v-model="personSearchQuery" @input="searchPeople" placeholder="Buscar persona" class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none text-sm font-bold text-slate-800" />
                <div v-if="personResults.length" class="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-dropdown overflow-hidden z-20 max-h-72 overflow-y-auto custom-scrollbar">
                  <button v-for="person in personResults" :key="person.curp" @click="selectPerson(person)" class="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors"><p class="text-sm font-black text-slate-900 truncate">{{ person.name }}</p><p class="text-[10px] font-bold text-slate-500 truncate mt-0.5">{{ person.plantel || '—' }} · {{ person.curp }}</p></button>
                </div>
              </div>
              <div v-else class="p-4 rounded-2xl bg-violet-50 border border-violet-100 flex items-center gap-3"><User class="w-5 h-5 text-violet-600 shrink-0" /><div class="min-w-0 flex-1"><p class="text-sm font-black text-slate-900 truncate">{{ form.person.name }}</p><p class="text-[10px] font-bold text-slate-500 truncate">{{ form.person.plantel || '—' }}</p></div><button v-if="drawerMode !== 'EDIT_ASSIGNMENT'" @click="clearPerson" class="w-8 h-8 rounded-lg text-slate-400 hover:text-casita-red flex items-center justify-center"><X class="w-4 h-4" /></button></div>
            </section>

            <section v-if="form.scopeType === 'PLANTEL'" class="space-y-2">
              <select v-model="form.plantel" :disabled="drawerMode === 'EDIT_ASSIGNMENT'" class="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"><option value="">Plantel</option><option v-for="plantel in authorizerData.planteles" :key="plantel" :value="plantel">{{ plantel }}</option></select>
            </section>

            <section v-if="form.scopeType === 'PUESTO'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select v-model="form.plantel" :disabled="drawerMode === 'EDIT_ASSIGNMENT'" class="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"><option value="ALL">Toda la institución</option><option v-for="plantel in authorizerData.planteles" :key="plantel" :value="plantel">{{ plantel }}</option></select>
              <select v-model="form.puesto" :disabled="drawerMode === 'EDIT_ASSIGNMENT'" class="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"><option value="">Puesto</option><option v-for="puesto in authorizerData.catalogPuestos" :key="puesto" :value="puesto">{{ puesto }}</option></select>
            </section>
          </template>

          <template v-else>
            <section class="space-y-3">
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200"><p class="text-sm font-black text-slate-900">{{ form.plantel === 'ALL' ? 'Toda la institución' : form.plantel }}</p><p class="text-[10px] font-bold text-slate-500 mt-1">{{ groupScopeText }}</p></div>
              <div v-if="drawerMode === 'GROUP_BULK'" class="space-y-2">
                <select v-model="manualPuesto" @change="addManualPuesto" class="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold text-slate-700"><option value="">Agregar puesto</option><option v-for="puesto in availablePuestos" :key="puesto" :value="puesto">{{ puesto }}</option></select>
                <div class="flex flex-wrap gap-2"><span v-for="puesto in form.puestos" :key="puesto" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[10px] font-black text-slate-700 shadow-sm">{{ puesto }}<button @click="removePuesto(puesto)" class="text-slate-400 hover:text-casita-red"><X class="w-3 h-3" /></button></span></div>
              </div>
            </section>
          </template>

          <section class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <button @click="toggleChannel('EMAIL')" class="px-4 py-3.5 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-2" :class="form.channels.includes('EMAIL') ? 'bg-iedis-blue/10 text-iedis-blue-dark border-iedis-blue/30' : 'bg-white text-slate-400 border-slate-200'"><Mail class="w-4 h-4" /> Email</button>
              <button @click="toggleChannel('WHATSAPP')" class="px-4 py-3.5 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-2" :class="form.channels.includes('WHATSAPP') ? 'bg-casita-green/10 text-casita-green-dark border-casita-green/30' : 'bg-white text-slate-400 border-slate-200'"><MessageCircle class="w-4 h-4" /> WhatsApp</button>
            </div>
          </section>

          <section v-if="form.channels.includes('WHATSAPP')" class="space-y-2">
            <div class="flex rounded-2xl shadow-sm"><span class="px-4 py-3.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-2xl text-sm font-black text-slate-500">+52</span><input v-model="form.phone" @input="enforcePhoneDigits" maxlength="10" placeholder="10 dígitos" class="flex-1 px-4 py-3.5 rounded-r-2xl bg-white border border-slate-200 focus:border-casita-green focus:ring-2 focus:ring-casita-green/20 outline-none text-sm font-black text-slate-900" /></div>
          </section>
        </div>

        <footer class="p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
          <button @click="closeDrawer" class="px-5 py-3 rounded-2xl bg-slate-100 text-slate-600 text-xs font-black hover:text-slate-900 transition-all">Cancelar</button>
          <button @click="saveDrawer" :disabled="saving || !formValid" class="px-6 py-3 rounded-2xl bg-gradient-to-r from-iedis-teal to-iedis-teal-dark text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Loader2 v-if="saving" class="w-4 h-4 animate-spin" /><Check v-else class="w-4 h-4" /> Guardar</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { LockKeyhole, Search, Plus, Loader2, UserCheck, ShieldCheck, User, Building2, Briefcase, Mail, MessageCircle, X, Trash2, Check } from 'lucide-vue-next'
import PremiumAvatar from '~/components/PremiumAvatar.vue'

const activeView = ref('AUTHORIZER')
const authorizersLoading = ref(true)
const matrixLoading = ref(false)
const saving = ref(false)
const authorizerData = ref({ authorizers: [], planteles: [], catalogPuestos: [] })
const authorizerSearch = ref('')
const selectedAuthorizerEmail = ref('')

const selectedPlantel = ref('ALL')
const groupSearchQuery = ref('')
const statusFilter = ref('ALL')
const matrix = ref({ rows: [], planteles: [], catalogPuestos: [], summary: {} })
const selectedKeys = ref([])
let matrixTimer = null

const drawerOpen = ref(false)
const drawerContext = ref('AUTHORIZER')
const drawerMode = ref('ADD_SCOPE')
const lockedAuthorizer = ref(false)
const manualPuesto = ref('')
const gwSearchQuery = ref('')
const gwResults = ref([])
const selectedGwName = ref('')
const selectedGwPhoto = ref('')
const personSearchQuery = ref('')
const personResults = ref([])
let gwTimer = null
let peopleTimer = null

const form = reactive({
  email: '',
  channels: ['EMAIL'],
  phone: '',
  scopeType: 'PUESTO',
  plantel: 'ALL',
  puesto: '',
  puestos: [],
  person: null
})

const scopeTypeOptions = [
  { value: 'PERSON', label: 'Persona' },
  { value: 'PLANTEL', label: 'Plantel' },
  { value: 'PUESTO', label: 'Puesto' }
]

const filteredAuthorizers = computed(() => {
  const q = authorizerSearch.value.trim().toLowerCase()
  if (!q) return authorizerData.value.authorizers || []
  return (authorizerData.value.authorizers || []).filter((item) => [item.name, item.email, ...item.assignments.flatMap((assignment) => [assignment.label, assignment.detail])].join(' ').toLowerCase().includes(q))
})

const selectedAuthorizer = computed(() => (authorizerData.value.authorizers || []).find((item) => item.email === selectedAuthorizerEmail.value) || null)
const selectedAssignmentSections = computed(() => {
  const assignments = selectedAuthorizer.value?.assignments || []
  return [
    { type: 'PERSON', label: 'Personas', icon: User, items: assignments.filter((item) => item.type === 'PERSON') },
    { type: 'PLANTEL', label: 'Planteles', icon: Building2, items: assignments.filter((item) => item.type === 'PLANTEL') },
    { type: 'PUESTO', label: 'Puestos', icon: Briefcase, items: assignments.filter((item) => item.type === 'PUESTO') }
  ]
})

const availablePuestos = computed(() => (matrix.value.catalogPuestos || authorizerData.value.catalogPuestos || []).filter((puesto) => !form.puestos.includes(puesto)))
const allVisibleSelected = computed(() => matrix.value.rows.length > 0 && matrix.value.rows.every((row) => selectedKeys.value.includes(row.key)))
const drawerEyebrow = computed(() => drawerContext.value === 'AUTHORIZER' ? (drawerMode.value === 'EDIT_ASSIGNMENT' ? 'Editar alcance' : 'Nuevo alcance') : (drawerMode.value === 'PLANTEL_DEFAULT' ? 'Default de plantel' : drawerMode.value === 'GROUP_ROW' ? 'Regla de grupo' : 'Asignación masiva'))
const drawerTitle = computed(() => selectedGwName.value || form.email || (drawerContext.value === 'GROUP' ? 'Asignar autorizador' : 'Nuevo autorizador'))
const groupScopeText = computed(() => form.puestos.length === 1 && form.puestos[0] === 'ALL' ? 'Todos los puestos' : `${form.puestos.length} puesto${form.puestos.length === 1 ? '' : 's'}`)

const formValid = computed(() => {
  if (!form.email || !form.channels.length) return false
  if (form.channels.includes('WHATSAPP') && form.phone.length !== 10) return false
  if (drawerContext.value === 'GROUP') return Boolean(form.plantel && form.puestos.length)
  if (form.scopeType === 'PERSON') return Boolean(form.person?.curp)
  if (form.scopeType === 'PLANTEL') return Boolean(form.plantel && form.plantel !== 'ALL')
  if (form.scopeType === 'PUESTO') return Boolean(form.plantel && form.puesto)
  return false
})

const loadAuthorizers = async () => {
  authorizersLoading.value = true
  try {
    const data = await $fetch('/api/authorizations/authorizers')
    authorizerData.value = data
    if (!selectedAuthorizerEmail.value || !data.authorizers.some((item) => item.email === selectedAuthorizerEmail.value)) {
      selectedAuthorizerEmail.value = data.authorizers[0]?.email || ''
    }
  } catch (error) {
    alert(error?.data?.message || 'No se pudieron cargar las autorizaciones.')
  } finally {
    authorizersLoading.value = false
  }
}

const loadMatrix = async () => {
  matrixLoading.value = true
  try {
    const data = await $fetch('/api/authorizations/matrix', { query: { plantel: selectedPlantel.value, search: groupSearchQuery.value, status: statusFilter.value } })
    matrix.value = data
    selectedKeys.value = selectedKeys.value.filter((key) => data.rows.some((row) => row.key === key))
  } catch (error) {
    alert(error?.data?.message || 'No se pudo cargar la matriz de autorizaciones.')
  } finally {
    matrixLoading.value = false
  }
}

const switchView = async (view) => {
  activeView.value = view
  if (view === 'GROUP') await loadMatrix()
  else await loadAuthorizers()
}

const scheduleMatrixLoad = () => {
  if (activeView.value !== 'GROUP') return
  if (matrixTimer) clearTimeout(matrixTimer)
  matrixTimer = setTimeout(loadMatrix, 250)
}
watch([groupSearchQuery, statusFilter], scheduleMatrixLoad)

const setPlantel = () => {
  selectedKeys.value = []
  loadMatrix()
}

const toggleRow = (row) => {
  selectedKeys.value = selectedKeys.value.includes(row.key) ? selectedKeys.value.filter((key) => key !== row.key) : [...selectedKeys.value, row.key]
}
const toggleAllVisible = () => { selectedKeys.value = allVisibleSelected.value ? [] : matrix.value.rows.map((row) => row.key) }

const resetForm = () => {
  form.email = ''
  form.channels = ['EMAIL']
  form.phone = ''
  form.scopeType = 'PUESTO'
  form.plantel = 'ALL'
  form.puesto = ''
  form.puestos = []
  form.person = null
  selectedGwName.value = ''
  selectedGwPhoto.value = ''
  gwSearchQuery.value = ''
  gwResults.value = []
  personSearchQuery.value = ''
  personResults.value = []
  manualPuesto.value = ''
  lockedAuthorizer.value = false
}

const setAuthorizer = (authorizer) => {
  if (!authorizer) return
  form.email = authorizer.email
  selectedGwName.value = authorizer.name
  selectedGwPhoto.value = authorizer.photoUrl || ''
  form.phone = String(authorizer.phone || '').replace(/\D/g, '').slice(-10)
}

const openScopeDrawer = (authorizer) => {
  resetForm()
  drawerContext.value = 'AUTHORIZER'
  drawerMode.value = 'ADD_SCOPE'
  if (authorizer) {
    setAuthorizer(authorizer)
    lockedAuthorizer.value = true
  }
  drawerOpen.value = true
}

const openAssignment = async (assignment) => {
  if (assignment.targetCount <= 1 || assignment.type === 'PERSON') {
    editAssignment(assignment)
    return
  }

  activeView.value = 'GROUP'
  selectedPlantel.value = assignment.plantel || 'ALL'
  groupSearchQuery.value = assignment.puesto || ''
  await loadMatrix()
}

const editAssignment = (assignment) => {
  if (!selectedAuthorizer.value) return
  resetForm()
  drawerContext.value = 'AUTHORIZER'
  drawerMode.value = 'EDIT_ASSIGNMENT'
  setAuthorizer(selectedAuthorizer.value)
  lockedAuthorizer.value = true
  form.channels = assignment.channels?.length ? [...assignment.channels] : ['EMAIL']
  form.scopeType = assignment.type
  form.plantel = assignment.plantel || 'ALL'
  if (assignment.type === 'PUESTO') form.puesto = assignment.puesto
  if (assignment.type === 'PERSON') form.person = { name: assignment.employeeName, curp: assignment.employeeCurp, plantel: assignment.plantel }
  drawerOpen.value = true
}

const editGroupRow = (row) => {
  resetForm()
  drawerContext.value = 'GROUP'
  drawerMode.value = 'GROUP_ROW'
  form.plantel = selectedPlantel.value === 'ALL' ? 'ALL' : selectedPlantel.value
  form.puestos = [row.puesto]
  if (row.targets?.length) {
    const target = row.targets[0]
    form.email = target.email
    form.channels = target.channels?.length ? [...target.channels] : ['EMAIL']
    form.phone = String(target.phone || '').replace(/\D/g, '').slice(-10)
    selectedGwName.value = target.name
    selectedGwPhoto.value = target.photoUrl || ''
  }
  drawerOpen.value = true
}

const openBulkAssignment = () => {
  resetForm()
  drawerContext.value = 'GROUP'
  drawerMode.value = 'GROUP_BULK'
  form.plantel = selectedPlantel.value
  form.puestos = matrix.value.rows.filter((row) => selectedKeys.value.includes(row.key)).map((row) => row.puesto)
  drawerOpen.value = true
}

const openPlantelDefault = () => {
  resetForm()
  drawerContext.value = 'GROUP'
  drawerMode.value = 'PLANTEL_DEFAULT'
  form.plantel = selectedPlantel.value
  form.puestos = ['ALL']
  drawerOpen.value = true
}

const closeDrawer = () => { drawerOpen.value = false }
const setScopeType = (type) => { form.scopeType = type; form.person = null; form.puesto = ''; form.plantel = type === 'PLANTEL' ? '' : 'ALL' }

const searchGw = () => {
  if (gwTimer) clearTimeout(gwTimer)
  if (gwSearchQuery.value.trim().length < 2) { gwResults.value = []; return }
  gwTimer = setTimeout(async () => {
    try { gwResults.value = await $fetch('/api/workspace/search', { params: { q: gwSearchQuery.value } }) || [] } catch { gwResults.value = [] }
  }, 250)
}

const selectGw = (result) => {
  form.email = result.email
  selectedGwName.value = result.name
  selectedGwPhoto.value = result.photoUrl || ''
  let phone = String(result.phone || '').replace(/\D/g, '')
  if (phone.startsWith('521') && phone.length >= 13) phone = phone.slice(3)
  form.phone = phone.slice(-10)
  gwSearchQuery.value = ''
  gwResults.value = []
}
const clearGw = () => { form.email = ''; selectedGwName.value = ''; selectedGwPhoto.value = ''; form.phone = '' }

const searchPeople = () => {
  if (peopleTimer) clearTimeout(peopleTimer)
  if (personSearchQuery.value.trim().length < 2) { personResults.value = []; return }
  peopleTimer = setTimeout(async () => {
    try { personResults.value = await $fetch('/api/authorizations/people', { query: { q: personSearchQuery.value } }) || [] } catch { personResults.value = [] }
  }, 250)
}
const selectPerson = (person) => { form.person = person; personSearchQuery.value = ''; personResults.value = [] }
const clearPerson = () => { form.person = null }

const toggleChannel = (channel) => {
  form.channels = form.channels.includes(channel) ? form.channels.filter((item) => item !== channel) : [...form.channels, channel]
}
const enforcePhoneDigits = () => { form.phone = form.phone.replace(/\D/g, '').slice(0, 10) }
const addManualPuesto = () => { if (manualPuesto.value && !form.puestos.includes(manualPuesto.value)) form.puestos = [...form.puestos, manualPuesto.value]; manualPuesto.value = '' }
const removePuesto = (puesto) => { form.puestos = form.puestos.filter((item) => item !== puesto) }

const saveDrawer = async () => {
  if (saving.value || !formValid.value) return
  saving.value = true
  try {
    if (drawerContext.value === 'AUTHORIZER' && form.scopeType === 'PERSON') {
      await $fetch('/api/authorizations/person', { method: 'POST', body: { employeeCurp: form.person.curp, employeeName: form.person.name, employeePlantel: form.person.plantel, email: form.email, channels: form.channels, phone: form.phone } })
    } else {
      const plantel = drawerContext.value === 'AUTHORIZER' ? form.plantel : form.plantel
      const puestos = drawerContext.value === 'AUTHORIZER' ? [form.scopeType === 'PLANTEL' ? 'ALL' : form.puesto] : form.puestos
      await $fetch('/api/authorizations/rules', { method: 'POST', body: { plantel, puestos, email: form.email, channels: form.channels, phone: form.phone, replaceExisting: true } })
    }
    closeDrawer()
    await Promise.all([loadAuthorizers(), activeView.value === 'GROUP' ? loadMatrix() : Promise.resolve()])
    if (form.email) selectedAuthorizerEmail.value = form.email
  } catch (error) {
    alert(error?.data?.message || 'No se pudo guardar la autorización.')
  } finally { saving.value = false }
}

const removeAssignment = async (assignment) => {
  const extra = assignment.targetCount > 1 ? '\nSe eliminará la regla completa.' : ''
  if (!confirm(`¿Eliminar la regla de ${assignment.label}?${extra}`)) return
  try {
    if (assignment.type === 'PERSON') {
      await $fetch('/api/authorizations/person', { method: 'DELETE', query: { curp: assignment.employeeCurp } })
    } else {
      await $fetch('/api/authorizations/group', { method: 'DELETE', query: { plantel: assignment.plantel, puesto: assignment.puesto } })
    }
    await loadAuthorizers()
  } catch (error) { alert(error?.data?.message || 'No se pudo eliminar la regla.') }
}

const clearEffectiveRule = async (row) => {
  const plantel = row.configuredPlantel || (selectedPlantel.value === 'ALL' ? 'ALL' : selectedPlantel.value)
  const puesto = row.configuredPuesto || row.puesto
  if (!confirm(`¿Eliminar la regla activa para ${puesto} en ${plantel}?`)) return
  try {
    await $fetch('/api/authorizations/group', { method: 'DELETE', query: { plantel, puesto } })
    await Promise.all([loadMatrix(), loadAuthorizers()])
  } catch (error) { alert(error?.data?.message || 'No se pudo eliminar la regla.') }
}

const targetLabel = (row) => (row.targets || []).map((target) => target.name || target.email).join(', ')
const targetEmails = (row) => (row.targets || []).map((target) => target.email).join(', ')
const rowChannels = (row) => Array.from(new Set((row.targets || []).flatMap((target) => target.channels || [])))
const stateLabel = (state) => ({ STANDARD: 'Normal', OVERRIDE: 'Override', GLOBAL_OVERRIDE: 'Override global', INHERITED: 'Heredado', INCOMPLETE: 'Incompleto', UNCONFIGURED: 'Sin destino' }[state] || state)
const stateClass = (state) => ({ STANDARD: 'bg-slate-50 text-slate-600 border-slate-200', OVERRIDE: 'bg-purple-50 text-purple-700 border-purple-200', GLOBAL_OVERRIDE: 'bg-purple-50 text-purple-700 border-purple-200', INHERITED: 'bg-blue-50 text-blue-700 border-blue-200', INCOMPLETE: 'bg-amber-50 text-amber-700 border-amber-200', UNCONFIGURED: 'bg-red-50 text-red-700 border-red-200' }[state] || 'bg-slate-50 text-slate-600 border-slate-200')
const stateDotClass = (state) => ({ STANDARD: 'bg-slate-400', OVERRIDE: 'bg-purple-500', GLOBAL_OVERRIDE: 'bg-purple-500', INHERITED: 'bg-blue-500', INCOMPLETE: 'bg-amber-500', UNCONFIGURED: 'bg-red-500' }[state] || 'bg-slate-400')

onMounted(loadAuthorizers)
</script>
