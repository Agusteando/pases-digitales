<template>
  <div class="h-full min-h-[100dvh] md:min-h-0 p-4 sm:p-6 lg:p-8 2xl:p-10 relative z-10 flex flex-col overflow-hidden">
    <header class="shrink-0 max-w-[1800px] w-full mx-auto mb-5">
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck class="w-5 h-5" />
            </div>
            <div>
              <h1 class="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Autorizaciones</h1>
              <p class="text-xs font-bold text-slate-400 mt-0.5">{{ authorizerSummary.authorizers }} autorizadores · {{ authorizerSummary.scopes }} alcances</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="p-1 bg-white/75 border border-white rounded-2xl shadow-sm flex items-center">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 outline-none"
              :class="activeTab === tab.id ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white/70'"
            >
              <component :is="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </button>
          </div>
          <button
            @click="openNewAuthorizer"
            class="w-11 h-11 sm:w-auto sm:px-4 rounded-2xl bg-gradient-to-r from-iedis-teal to-iedis-teal-dark text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 outline-none"
            title="Agregar autorizador"
          >
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline text-xs font-black">Autorizador</span>
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 min-h-0 max-w-[1800px] w-full mx-auto">
      <section v-show="activeTab === 'AUTHORIZERS'" class="h-full min-h-0 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)] gap-4 lg:gap-5">
        <aside class="glass-panel rounded-[2rem] overflow-hidden min-h-[260px] lg:min-h-0 flex flex-col shadow-sm">
          <div class="p-4 border-b border-white/70 bg-white/45">
            <div class="relative">
              <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                v-model="authorizerSearch"
                type="search"
                placeholder="Buscar"
                class="w-full pl-10 pr-4 py-3 rounded-xl bg-white/85 border border-white text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-iedis-teal/20 focus:border-iedis-teal shadow-sm"
              />
            </div>
          </div>

          <div v-if="authorizersLoading" class="flex-1 flex items-center justify-center p-10">
            <Loader2 class="w-7 h-7 animate-spin text-iedis-teal" />
          </div>

          <div v-else-if="filteredAuthorizers.length" class="flex-1 overflow-y-auto custom-scrollbar p-2">
            <button
              v-for="authorizer in filteredAuthorizers"
              :key="authorizer.email"
              @click="selectedAuthorizerEmail = authorizer.email"
              class="w-full p-3.5 rounded-2xl flex items-center gap-3 text-left transition-all outline-none group"
              :class="selectedAuthorizerEmail === authorizer.email ? 'bg-slate-950 text-white shadow-md' : 'hover:bg-white/75 text-slate-800'"
            >
              <PremiumAvatar :src="authorizer.photoUrl" :name="authorizer.name" size="sm" class="shrink-0 ring-2 ring-white/80 shadow-sm bg-white" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-black truncate">{{ authorizer.name }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] font-bold" :class="selectedAuthorizerEmail === authorizer.email ? 'text-white/55' : 'text-slate-400'">{{ authorizer.scopes.length }} {{ authorizer.scopes.length === 1 ? 'alcance' : 'alcances' }}</span>
                  <span v-if="authorizer.channels.includes('WHATSAPP')" class="w-1 h-1 rounded-full" :class="selectedAuthorizerEmail === authorizer.email ? 'bg-white/30' : 'bg-slate-300'"></span>
                  <MessageCircle v-if="authorizer.channels.includes('WHATSAPP')" class="w-3 h-3" :class="selectedAuthorizerEmail === authorizer.email ? 'text-white/55' : 'text-casita-green'" />
                </div>
              </div>
              <ChevronRight class="w-4 h-4 shrink-0 transition-transform" :class="selectedAuthorizerEmail === authorizer.email ? 'text-white/60 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-500'" />
            </button>
          </div>

          <div v-else class="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div class="w-12 h-12 rounded-2xl bg-white border border-white flex items-center justify-center shadow-sm mb-3">
              <UserRoundCheck class="w-5 h-5 text-slate-400" />
            </div>
            <p class="text-sm font-black text-slate-700">Sin autorizadores</p>
          </div>
        </aside>

        <section class="glass-panel rounded-[2rem] overflow-hidden min-h-0 flex flex-col shadow-sm">
          <template v-if="selectedAuthorizer">
            <div class="p-5 sm:p-6 lg:p-7 border-b border-white/70 bg-white/45 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-center gap-4 min-w-0">
                <PremiumAvatar :src="selectedAuthorizer.photoUrl" :name="selectedAuthorizer.name" size="lg" class="shrink-0 ring-4 ring-white shadow-md bg-white" />
                <div class="min-w-0">
                  <h2 class="text-xl sm:text-2xl font-black text-slate-950 truncate">{{ selectedAuthorizer.name }}</h2>
                  <p class="text-xs font-bold text-slate-400 truncate mt-0.5">{{ selectedAuthorizer.email }}</p>
                  <div class="flex items-center gap-2 mt-2">
                    <span v-if="selectedAuthorizer.channels.includes('EMAIL')" class="w-7 h-7 rounded-lg bg-white border border-white shadow-sm flex items-center justify-center text-iedis-blue-dark" title="Email">
                      <Mail class="w-3.5 h-3.5" />
                    </span>
                    <span v-if="selectedAuthorizer.channels.includes('WHATSAPP')" class="w-7 h-7 rounded-lg bg-white border border-white shadow-sm flex items-center justify-center text-casita-green-dark" title="WhatsApp">
                      <MessageCircle class="w-3.5 h-3.5" />
                    </span>
                    <span v-if="selectedAuthorizer.phone" class="text-[10px] font-bold text-slate-400">{{ formatPhoneDisplay(selectedAuthorizer.phone) }}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <button @click="openScopeAssignment(selectedAuthorizer)" class="px-4 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-sm transition-all flex items-center gap-2 outline-none">
                  <Plus class="w-4 h-4" /> Alcance
                </button>
                <button @click="removeAuthorizer(selectedAuthorizer)" class="w-11 h-11 rounded-xl bg-white/80 hover:bg-red-50 text-slate-400 hover:text-casita-red border border-white shadow-sm transition-all flex items-center justify-center outline-none" title="Retirar autorizador">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 sm:p-6 lg:p-7">
              <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div v-for="group in selectedScopeGroups" :key="group.type" class="rounded-[1.6rem] bg-white/65 border border-white shadow-sm overflow-hidden">
                  <div class="px-5 pt-5 pb-3 flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                      <div class="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center" :class="group.iconClass">
                        <component :is="group.icon" class="w-4 h-4" />
                      </div>
                      <p class="text-xs font-black text-slate-800 uppercase tracking-widest">{{ group.label }}</p>
                    </div>
                    <span class="text-[10px] font-black text-slate-400">{{ group.scopes.length }}</span>
                  </div>

                  <div v-if="group.scopes.length" class="px-3 pb-3 space-y-1.5">
                    <div v-for="scope in group.scopes" :key="scope.key" @click="editScope(selectedAuthorizer, scope)" class="group/scope flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-all cursor-pointer">
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-black text-slate-900 truncate">{{ scope.label }}</p>
                        <p v-if="scopeSubtitle(scope)" class="text-[10px] font-bold text-slate-400 truncate mt-0.5">{{ scopeSubtitle(scope) }}</p>
                      </div>
                      <div class="flex items-center gap-1 shrink-0">
                        <Mail v-if="scope.channels.includes('EMAIL')" class="w-3.5 h-3.5 text-iedis-blue-dark/65" />
                        <MessageCircle v-if="scope.channels.includes('WHATSAPP')" class="w-3.5 h-3.5 text-casita-green-dark/65" />
                      </div>
                      <button @click.stop="removeScope(selectedAuthorizer, scope)" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-casita-red hover:bg-red-50 transition-all opacity-100 lg:opacity-0 lg:group-hover/scope:opacity-100 outline-none" title="Retirar">
                        <X class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <button v-else @click="openScopeAssignment(selectedAuthorizer, group.type)" class="w-full px-5 pb-5 pt-2 text-left text-xs font-black text-slate-400 hover:text-iedis-teal-dark transition-colors outline-none">
                    +
                  </button>
                </div>
              </div>
            </div>
          </template>

          <div v-else class="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div class="w-16 h-16 rounded-[1.5rem] bg-white border border-white shadow-sm flex items-center justify-center mb-4">
              <ShieldCheck class="w-7 h-7 text-slate-300" />
            </div>
            <p class="text-sm font-black text-slate-600">Selecciona un autorizador</p>
          </div>
        </section>
      </section>

      <section v-show="activeTab === 'GROUPS'" class="h-full min-h-0 flex flex-col gap-4">
        <div class="glass-panel rounded-[1.6rem] p-3 sm:p-4 shadow-sm shrink-0 flex flex-col lg:flex-row lg:items-center gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0 flex-1 lg:max-w-2xl">
            <div class="relative min-w-0">
              <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input v-model="matrixSearch" type="search" placeholder="Buscar puesto o autorizador" class="w-full pl-10 pr-4 py-3 rounded-xl bg-white/85 border border-white text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-iedis-teal/20 shadow-sm" />
            </div>
            <div class="relative min-w-0">
              <Building2 class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select v-model="selectedPlantel" @change="loadMatrix" class="w-full appearance-none pl-10 pr-9 py-3 rounded-xl bg-white/85 border border-white text-xs font-black text-slate-700 outline-none shadow-sm cursor-pointer">
                <option value="ALL">Toda la institución</option>
                <option v-for="plantel in matrix.planteles" :key="plantel" :value="plantel">{{ plantel }}</option>
              </select>
              <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button v-for="filter in matrixFilters" :key="filter.id" @click="matrixFilter = filter.id" class="px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all outline-none" :class="matrixFilter === filter.id ? 'bg-slate-950 text-white shadow-sm' : 'bg-white/70 text-slate-500 hover:text-slate-900'">
              {{ filter.label }}
            </button>
            <button v-if="selectedPlantel !== 'ALL'" @click="openPlantelDefault" class="px-3.5 py-2.5 rounded-xl bg-white/80 text-iedis-teal-dark text-[10px] font-black uppercase tracking-widest border border-white shadow-sm whitespace-nowrap flex items-center gap-1.5 outline-none">
              <Building2 class="w-3.5 h-3.5" /> Plantel
            </button>
            <button v-if="selectedMatrixKeys.length" @click="openBulkGroupAssignment" class="px-3.5 py-2.5 rounded-xl bg-iedis-teal-dark text-white text-[10px] font-black uppercase tracking-widest shadow-sm whitespace-nowrap flex items-center gap-1.5 outline-none">
              <Plus class="w-3.5 h-3.5" /> {{ selectedMatrixKeys.length }}
            </button>
          </div>
        </div>

        <div class="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px] gap-4">
          <div class="glass-panel rounded-[2rem] overflow-hidden min-h-0 flex flex-col shadow-sm">
            <div v-if="matrixLoading" class="flex-1 flex items-center justify-center p-12">
              <Loader2 class="w-8 h-8 animate-spin text-iedis-teal" />
            </div>
            <div v-else class="flex-1 overflow-auto custom-scrollbar">
              <table class="w-full min-w-[860px] text-left">
                <thead class="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-slate-100">
                  <tr class="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                    <th class="px-5 py-4 w-12"><input type="checkbox" :checked="allVisibleMatrixSelected" @change="toggleAllMatrixRows" class="w-4 h-4 rounded border-slate-300 text-iedis-teal focus:ring-iedis-teal" /></th>
                    <th class="px-3 py-4">Puesto</th>
                    <th class="px-3 py-4">Autorizador</th>
                    <th class="px-3 py-4">Alcance</th>
                    <th class="px-3 py-4 text-right">Personas</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/80">
                  <tr v-for="row in visibleMatrixRows" :key="row.key" @click="selectedMatrixRowKey = row.key" class="cursor-pointer transition-all" :class="selectedMatrixRowKey === row.key ? 'bg-iedis-teal/5' : 'hover:bg-white/55'">
                    <td class="px-5 py-4" @click.stop><input type="checkbox" :checked="selectedMatrixKeys.includes(row.key)" @change="toggleMatrixRow(row)" class="w-4 h-4 rounded border-slate-300 text-iedis-teal focus:ring-iedis-teal" /></td>
                    <td class="px-3 py-4">
                      <p class="text-sm font-black text-slate-900">{{ row.puesto }}</p>
                      <p class="text-[10px] font-bold text-slate-400 mt-1">{{ selectedPlantel === 'ALL' ? 'Institucional' : selectedPlantel }}</p>
                    </td>
                    <td class="px-3 py-4">
                      <div v-if="row.targets?.length" class="flex items-center">
                        <PremiumAvatar v-for="(target, index) in row.targets.slice(0, 3)" :key="target.email" :src="target.photoUrl" :name="target.name || target.email" size="xs" class="ring-2 ring-white shadow-sm bg-white" :class="index ? '-ml-2' : ''" />
                        <span class="ml-2 text-xs font-black text-slate-700 max-w-[220px] truncate">{{ targetSummary(row.targets) }}</span>
                      </div>
                      <span v-else class="text-xs font-black text-slate-300">—</span>
                    </td>
                    <td class="px-3 py-4">
                      <span class="inline-flex items-center px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border" :class="matrixSourceClass(row)">{{ matrixSourceLabel(row) }}</span>
                    </td>
                    <td class="px-3 py-4 text-right text-sm font-black text-slate-700 tabular-nums">{{ row.userCount }}</td>
                  </tr>
                </tbody>
              </table>

              <div v-if="!visibleMatrixRows.length" class="h-full min-h-[260px] flex flex-col items-center justify-center p-10 text-center">
                <Search class="w-6 h-6 text-slate-300 mb-3" />
                <p class="text-sm font-black text-slate-500">Sin resultados</p>
              </div>
            </div>
          </div>

          <aside class="glass-panel rounded-[2rem] overflow-hidden min-h-[300px] xl:min-h-0 flex flex-col shadow-sm">
            <template v-if="selectedMatrixRow">
              <div class="p-5 border-b border-white/70 bg-white/45">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.18em] mb-2">{{ selectedMatrixRow.sourceLabel }}</p>
                <h3 class="text-lg font-black text-slate-950 leading-tight">{{ selectedMatrixRow.puesto }}</h3>
                <p class="text-xs font-bold text-slate-400 mt-1">{{ selectedPlantel === 'ALL' ? 'Toda la institución' : selectedPlantel }} · {{ selectedMatrixRow.userCount }}</p>
              </div>

              <div class="p-4 flex-1 overflow-y-auto custom-scrollbar">
                <div v-if="selectedMatrixRow.targets?.length" class="space-y-2">
                  <div v-for="target in selectedMatrixRow.targets" :key="target.email" class="p-3 rounded-2xl bg-white/70 border border-white shadow-sm flex items-center gap-3">
                    <PremiumAvatar :src="target.photoUrl" :name="target.name || target.email" size="sm" class="ring-2 ring-white shadow-sm bg-white shrink-0" />
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-black text-slate-900 truncate">{{ target.name || target.email }}</p>
                      <p class="text-[10px] font-bold text-slate-400 truncate">{{ target.email }}</p>
                    </div>
                    <button v-if="matrixTargetRemovableHere(selectedMatrixRow)" @click="removeMatrixTarget(selectedMatrixRow, target)" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-casita-red hover:bg-red-50 transition-all outline-none" title="Retirar">
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div v-else class="py-8 text-center"><Minus class="w-5 h-5 text-slate-300 mx-auto" /></div>
              </div>

              <div class="p-4 border-t border-white/70 bg-white/35">
                <button @click="openMatrixRowAssignment(selectedMatrixRow)" class="w-full px-4 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-sm transition-all flex items-center justify-center gap-2 outline-none">
                  <Plus class="w-4 h-4" /> {{ matrixRowEditableHere(selectedMatrixRow) ? 'Autorizador' : 'Regla directa' }}
                </button>
              </div>
            </template>

            <div v-else class="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <Layers3 class="w-7 h-7 text-slate-300 mb-3" />
              <p class="text-sm font-black text-slate-500">Selecciona un puesto</p>
            </div>
          </aside>
        </div>
      </section>
    </main>

    <Transition name="fade">
      <div v-if="assignmentOpen" class="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-sm flex justify-end" @click.self="closeAssignment">
        <div class="w-full max-w-xl h-full bg-slate-50/95 backdrop-blur-2xl shadow-2xl border-l border-white flex flex-col">
          <header class="p-5 sm:p-6 border-b border-white bg-white/75 flex items-center justify-between gap-4 shrink-0">
            <div class="min-w-0">
              <p class="text-[9px] font-black uppercase tracking-[0.18em] text-iedis-teal-dark">Asignar</p>
              <h3 class="text-xl font-black text-slate-950 truncate mt-1">{{ assignmentTitle }}</h3>
            </div>
            <button @click="closeAssignment" class="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-950 flex items-center justify-center outline-none"><X class="w-4 h-4" /></button>
          </header>

          <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-6">
            <section>
              <div v-if="assignment.authorizer" class="p-3.5 rounded-2xl bg-white border border-white shadow-sm flex items-center gap-3">
                <PremiumAvatar :src="assignment.authorizer.photoUrl" :name="assignment.authorizer.name" size="sm" class="ring-2 ring-white shadow-sm bg-white shrink-0" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-black text-slate-900 truncate">{{ assignment.authorizer.name }}</p>
                  <p class="text-[10px] font-bold text-slate-400 truncate">{{ assignment.authorizer.email }}</p>
                </div>
                <button v-if="!assignment.lockAuthorizer" @click="clearAssignmentAuthorizer" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 outline-none"><X class="w-3.5 h-3.5" /></button>
              </div>

              <div v-else class="relative">
                <Search class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input v-model="workspaceQuery" @input="searchWorkspace" type="search" placeholder="Nombre o correo" class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-white text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-iedis-teal/20 shadow-sm" autofocus />
                <div v-if="workspaceLoading || workspaceResults.length" class="absolute z-20 left-0 right-0 top-full mt-2 p-2 rounded-2xl bg-white shadow-dropdown border border-slate-100 max-h-72 overflow-y-auto custom-scrollbar">
                  <div v-if="workspaceLoading" class="p-6 flex justify-center"><Loader2 class="w-5 h-5 animate-spin text-iedis-teal" /></div>
                  <button v-for="result in workspaceResults" :key="result.email" @click="selectAssignmentAuthorizer(result)" class="w-full p-3 rounded-xl flex items-center gap-3 text-left hover:bg-slate-50 transition-all outline-none">
                    <PremiumAvatar :src="result.photoUrl" :name="result.name" size="sm" class="ring-2 ring-white shadow-sm bg-white shrink-0" />
                    <div class="min-w-0 flex-1"><p class="text-sm font-black text-slate-900 truncate">{{ result.name }}</p><p class="text-[10px] font-bold text-slate-400 truncate">{{ result.email }}</p></div>
                  </button>
                </div>
              </div>
            </section>

            <section v-if="!assignment.lockScopes" class="space-y-3">
              <div class="p-1 rounded-2xl bg-white/70 border border-white shadow-sm grid grid-cols-4 gap-1">
                <button v-for="type in scopeTypes" :key="type.id" @click="setAssignmentScopeType(type.id)" class="py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 outline-none" :class="assignment.scopeType === type.id ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-white'">
                  <component :is="type.icon" class="w-3.5 h-3.5" />
                  <span class="hidden sm:inline">{{ type.label }}</span>
                </button>
              </div>

              <div v-if="['PUESTO','AREA'].includes(assignment.scopeType)" class="relative">
                <Globe2 class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select v-model="assignment.scopePlantel" @change="loadSubjects" class="w-full appearance-none pl-11 pr-10 py-3.5 rounded-2xl bg-white border border-white text-xs font-black text-slate-700 outline-none shadow-sm cursor-pointer">
                  <option value="ALL">Toda la institución</option>
                  <option v-for="plantel in catalogPlanteles" :key="plantel" :value="plantel">{{ plantel }}</option>
                </select>
                <ChevronDown class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div class="relative">
                <Search class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input v-model="subjectQuery" @input="scheduleSubjectLoad" type="search" :placeholder="subjectPlaceholder" class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-white text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-iedis-teal/20 shadow-sm" />
              </div>

              <div class="rounded-2xl bg-white/65 border border-white shadow-sm overflow-hidden min-h-[160px] max-h-[310px] overflow-y-auto custom-scrollbar">
                <div v-if="subjectsLoading" class="h-40 flex items-center justify-center"><Loader2 class="w-5 h-5 animate-spin text-iedis-teal" /></div>
                <button v-for="subject in subjectResults" :key="subjectKey(subject)" @click="toggleSubject(subject)" class="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-white transition-all border-b border-slate-100/60 last:border-b-0 outline-none">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border" :class="isSubjectSelected(subject) ? 'bg-iedis-teal/10 border-iedis-teal/20 text-iedis-teal-dark' : 'bg-slate-50 border-slate-100 text-slate-400'">
                    <Check v-if="isSubjectSelected(subject)" class="w-4 h-4" />
                    <component v-else :is="currentScopeType.icon" class="w-4 h-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-black text-slate-900 truncate">{{ subject.label }}</p>
                    <p v-if="subject.subtitle || subject.userCount !== undefined" class="text-[10px] font-bold text-slate-400 truncate mt-0.5">{{ subject.subtitle || `${subject.userCount} personas` }}</p>
                  </div>
                </button>
                <div v-if="!subjectsLoading && !subjectResults.length" class="h-40 flex items-center justify-center text-center p-6"><p class="text-xs font-black text-slate-300">—</p></div>
              </div>
            </section>

            <section v-if="assignment.scopes.length" class="space-y-2">
              <div class="flex flex-wrap gap-2">
                <span v-for="scope in assignment.scopes" :key="scope.key" class="inline-flex items-center gap-2 max-w-full px-3 py-2 rounded-xl bg-slate-950 text-white shadow-sm">
                  <span class="text-[10px] font-black truncate max-w-[280px]">{{ scopeChipLabel(scope) }}</span>
                  <button v-if="!assignment.lockScopes" @click="removeDraftScope(scope.key)" class="text-white/45 hover:text-white outline-none"><X class="w-3 h-3" /></button>
                </span>
              </div>
            </section>

            <section class="space-y-3">
              <div class="grid grid-cols-2 gap-2">
                <button @click="toggleAssignmentChannel('EMAIL')" class="p-3.5 rounded-2xl border flex items-center gap-3 text-left transition-all outline-none" :class="assignment.channels.includes('EMAIL') ? 'bg-iedis-blue/10 border-iedis-blue/25 text-iedis-blue-dark' : 'bg-white border-white text-slate-400'">
                  <Mail class="w-4 h-4" /><span class="text-xs font-black">Email</span><Check v-if="assignment.channels.includes('EMAIL')" class="w-4 h-4 ml-auto" />
                </button>
                <button @click="toggleAssignmentChannel('WHATSAPP')" class="p-3.5 rounded-2xl border flex items-center gap-3 text-left transition-all outline-none" :class="assignment.channels.includes('WHATSAPP') ? 'bg-casita-green/10 border-casita-green/25 text-casita-green-dark' : 'bg-white border-white text-slate-400'">
                  <MessageCircle class="w-4 h-4" /><span class="text-xs font-black">WhatsApp</span><Check v-if="assignment.channels.includes('WHATSAPP')" class="w-4 h-4 ml-auto" />
                </button>
              </div>

              <div v-if="assignment.channels.includes('WHATSAPP')" class="relative">
                <Smartphone class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input v-model="assignment.phone" @input="assignment.phone = normalizePhone(assignment.phone)" inputmode="numeric" maxlength="10" placeholder="10 dígitos" class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-white text-sm font-black tracking-wider text-slate-800 outline-none focus:ring-2 focus:ring-casita-green/20 shadow-sm" />
              </div>
            </section>
          </div>

          <footer class="p-5 sm:p-6 border-t border-white bg-white/75 shrink-0">
            <button @click="saveAssignment" :disabled="!assignmentValid || assignmentSaving" class="w-full h-14 py-3.5 rounded-2xl bg-gradient-to-r from-iedis-teal to-iedis-teal-dark text-white text-sm font-black shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 outline-none">
              <Loader2 v-if="assignmentSaving" class="w-4 h-4 animate-spin" />
              <Check v-else class="w-4 h-4" />
              {{ assignmentButtonLabel }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="toast.visible" class="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-8 z-[90] max-w-[calc(100vw-2rem)] rounded-2xl bg-slate-950 text-white shadow-2xl px-4 py-3 flex items-center gap-4">
        <p class="text-xs font-black whitespace-nowrap">{{ toast.message }}</p>
        <button v-if="toast.action" @click="toast.action" class="text-xs font-black text-iedis-teal-light hover:text-white transition-colors outline-none">Deshacer</button>
        <button @click="hideToast" class="text-white/40 hover:text-white outline-none"><X class="w-3.5 h-3.5" /></button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  ShieldCheck, Plus, Search, Loader2, Mail, MessageCircle, ChevronRight, Trash2, X,
  UserRoundCheck, Users, Building2, BriefcaseBusiness, Network, ChevronDown, Globe2,
  Check, Smartphone, Layers3, Minus, UserRound, MapPinned
} from 'lucide-vue-next'
import PremiumAvatar from '~/components/PremiumAvatar.vue'

const tabs = [
  { id: 'AUTHORIZERS', label: 'Por autorizador', icon: UserRoundCheck },
  { id: 'GROUPS', label: 'Por grupo', icon: Layers3 }
]
const scopeTypes = [
  { id: 'PERSON', label: 'Personas', icon: UserRound },
  { id: 'PLANTEL', label: 'Planteles', icon: Building2 },
  { id: 'PUESTO', label: 'Puestos', icon: BriefcaseBusiness },
  { id: 'AREA', label: 'Áreas', icon: Network }
]
const matrixFilters = [
  { id: 'ALL', label: 'Todos' },
  { id: 'PROTECTED', label: 'Protegidos' },
  { id: 'OVERRIDES', label: 'Directos' },
  { id: 'INCOMPLETE', label: 'Incompletos' }
]

const activeTab = ref('AUTHORIZERS')
const authorizers = ref([])
const authorizerSummary = ref({ authorizers: 0, scopes: 0, people: 0, groups: 0 })
const authorizersLoading = ref(true)
const authorizerSearch = ref('')
const selectedAuthorizerEmail = ref('')
const catalogPlanteles = ref([])

const filteredAuthorizers = computed(() => {
  const q = authorizerSearch.value.trim().toLowerCase()
  if (!q) return authorizers.value
  return authorizers.value.filter((authorizer) => [authorizer.name, authorizer.email, ...authorizer.scopes.map((scope) => `${scope.label} ${scope.plantel}`)].join(' ').toLowerCase().includes(q))
})
const selectedAuthorizer = computed(() => authorizers.value.find((authorizer) => authorizer.email === selectedAuthorizerEmail.value) || null)
const selectedScopeGroups = computed(() => {
  const scopes = selectedAuthorizer.value?.scopes || []
  return [
    { type: 'PERSON', label: 'Personas', icon: UserRound, iconClass: 'text-violet-600', scopes: scopes.filter((scope) => scope.type === 'PERSON') },
    { type: 'PLANTEL', label: 'Planteles', icon: Building2, iconClass: 'text-iedis-teal-dark', scopes: scopes.filter((scope) => scope.type === 'PLANTEL') },
    { type: 'PUESTO', label: 'Puestos', icon: BriefcaseBusiness, iconClass: 'text-iedis-blue-dark', scopes: scopes.filter((scope) => scope.type === 'PUESTO') },
    { type: 'AREA', label: 'Áreas', icon: Network, iconClass: 'text-casita-gold', scopes: scopes.filter((scope) => scope.type === 'AREA') }
  ]
})

const matrix = ref({ rows: [], planteles: [], catalogPuestos: [], summary: {} })
const matrixLoading = ref(false)
const selectedPlantel = ref('ALL')
const matrixSearch = ref('')
const matrixFilter = ref('ALL')
const selectedMatrixKeys = ref([])
const selectedMatrixRowKey = ref('')
let matrixTimer = null
const visibleMatrixRows = computed(() => matrix.value.rows || [])
const selectedMatrixRow = computed(() => visibleMatrixRows.value.find((row) => row.key === selectedMatrixRowKey.value) || null)
const allVisibleMatrixSelected = computed(() => visibleMatrixRows.value.length > 0 && visibleMatrixRows.value.every((row) => selectedMatrixKeys.value.includes(row.key)))

const assignmentOpen = ref(false)
const assignmentSaving = ref(false)
const workspaceQuery = ref('')
const workspaceResults = ref([])
const workspaceLoading = ref(false)
let workspaceTimer = null
const subjectQuery = ref('')
const subjectResults = ref([])
const subjectsLoading = ref(false)
let subjectTimer = null

const assignment = reactive({
  authorizer: null,
  lockAuthorizer: false,
  scopes: [],
  lockScopes: false,
  scopeType: 'PUESTO',
  scopePlantel: 'ALL',
  channels: ['EMAIL'],
  phone: ''
})

const toast = reactive({ visible: false, message: '', action: null })
let toastTimer = null

const currentScopeType = computed(() => scopeTypes.find((type) => type.id === assignment.scopeType) || scopeTypes[0])
const subjectPlaceholder = computed(() => ({ PERSON: 'Buscar persona', PLANTEL: 'Buscar plantel', PUESTO: 'Buscar puesto', AREA: 'Buscar área' }[assignment.scopeType]))
const assignmentTitle = computed(() => {
  if (assignment.lockScopes && assignment.scopes.length === 1) return scopeChipLabel(assignment.scopes[0])
  if (assignment.lockScopes && assignment.scopes.length > 1) return `${assignment.scopes.length} puestos`
  return assignment.authorizer?.name || 'Nuevo autorizador'
})
const assignmentValid = computed(() => {
  if (!assignment.authorizer?.email || !assignment.scopes.length || !assignment.channels.length) return false
  if (assignment.channels.includes('WHATSAPP') && normalizePhone(assignment.phone).length !== 10) return false
  return true
})
const assignmentButtonLabel = computed(() => assignment.scopes.length > 1 ? `Asignar ${assignment.scopes.length}` : 'Asignar')

watch([matrixSearch, matrixFilter], () => {
  if (matrixTimer) clearTimeout(matrixTimer)
  matrixTimer = setTimeout(loadMatrix, 220)
})
watch(activeTab, (value) => {
  if (value === 'GROUPS' && !matrix.value.rows.length) loadMatrix()
})

async function loadAuthorizers(preferredEmail = '') {
  if (!authorizers.value.length) authorizersLoading.value = true
  try {
    const data = await $fetch('/api/authorizations/authorizers')
    authorizers.value = data.authorizers || []
    authorizerSummary.value = data.summary || { authorizers: 0, scopes: 0, people: 0, groups: 0 }
    if (preferredEmail && authorizers.value.some((authorizer) => authorizer.email === preferredEmail)) selectedAuthorizerEmail.value = preferredEmail
    else if (!authorizers.value.some((authorizer) => authorizer.email === selectedAuthorizerEmail.value)) selectedAuthorizerEmail.value = authorizers.value[0]?.email || ''
  } catch (error) {
    showToast(error?.data?.message || 'No se pudieron cargar las autorizaciones.')
  } finally {
    authorizersLoading.value = false
  }
}

async function loadMatrix() {
  matrixLoading.value = true
  try {
    const data = await $fetch('/api/authorizations/matrix', { query: { plantel: selectedPlantel.value, search: matrixSearch.value, status: matrixFilter.value } })
    matrix.value = data
    selectedMatrixKeys.value = selectedMatrixKeys.value.filter((key) => data.rows.some((row) => row.key === key))
    if (!data.rows.some((row) => row.key === selectedMatrixRowKey.value)) selectedMatrixRowKey.value = data.rows[0]?.key || ''
  } catch (error) {
    showToast(error?.data?.message || 'No se pudo cargar la vista por grupo.')
  } finally {
    matrixLoading.value = false
  }
}

function resetAssignment() {
  assignment.authorizer = null
  assignment.lockAuthorizer = false
  assignment.scopes = []
  assignment.lockScopes = false
  assignment.scopeType = 'PUESTO'
  assignment.scopePlantel = 'ALL'
  assignment.channels = ['EMAIL']
  assignment.phone = ''
  workspaceQuery.value = ''
  workspaceResults.value = []
  subjectQuery.value = ''
  subjectResults.value = []
}

function openNewAuthorizer() {
  resetAssignment()
  assignmentOpen.value = true
}

function openScopeAssignment(authorizer, preferredType = 'PUESTO') {
  resetAssignment()
  assignment.authorizer = { ...authorizer }
  assignment.lockAuthorizer = true
  assignment.phone = normalizePhone(authorizer.phone)
  assignment.scopeType = preferredType
  assignmentOpen.value = true
  loadSubjects()
}

function editScope(authorizer, scope) {
  resetAssignment()
  assignment.authorizer = { ...authorizer }
  assignment.lockAuthorizer = true
  assignment.lockScopes = true
  assignment.scopes = [{ ...scope }]
  assignment.channels = scope.channels?.length ? [...scope.channels] : ['EMAIL']
  assignment.phone = normalizePhone(authorizer.phone)
  assignmentOpen.value = true
}

function openMatrixRowAssignment(row) {
  resetAssignment()
  assignment.lockScopes = true
  assignment.scopes = [{ key: `PUESTO|||${selectedPlantel.value}|||${row.puesto}`, type: 'PUESTO', value: row.puesto, label: row.puesto, plantel: selectedPlantel.value }]
  assignmentOpen.value = true
}

function openBulkGroupAssignment() {
  const scopes = visibleMatrixRows.value.filter((row) => selectedMatrixKeys.value.includes(row.key)).map((row) => ({ key: `PUESTO|||${selectedPlantel.value}|||${row.puesto}`, type: 'PUESTO', value: row.puesto, label: row.puesto, plantel: selectedPlantel.value }))
  if (!scopes.length) return
  resetAssignment()
  assignment.lockScopes = true
  assignment.scopes = scopes
  assignmentOpen.value = true
}

function openPlantelDefault() {
  if (selectedPlantel.value === 'ALL') return
  resetAssignment()
  assignment.lockScopes = true
  assignment.scopes = [{ key: `PLANTEL|||${selectedPlantel.value}|||${selectedPlantel.value}`, type: 'PLANTEL', value: selectedPlantel.value, label: selectedPlantel.value, plantel: selectedPlantel.value }]
  assignmentOpen.value = true
}

function closeAssignment() {
  assignmentOpen.value = false
  workspaceResults.value = []
  subjectResults.value = []
}

function clearAssignmentAuthorizer() {
  assignment.authorizer = null
  assignment.phone = ''
}

function searchWorkspace() {
  if (workspaceTimer) clearTimeout(workspaceTimer)
  const q = workspaceQuery.value.trim()
  if (q.length < 2) {
    workspaceResults.value = []
    workspaceLoading.value = false
    return
  }
  workspaceLoading.value = true
  workspaceTimer = setTimeout(async () => {
    try {
      workspaceResults.value = await $fetch('/api/workspace/search', { query: { q } })
    } catch {
      workspaceResults.value = []
    } finally {
      workspaceLoading.value = false
    }
  }, 260)
}

function selectAssignmentAuthorizer(result) {
  assignment.authorizer = result
  assignment.phone = normalizePhone(result.phone)
  workspaceQuery.value = ''
  workspaceResults.value = []
  if (!assignment.lockScopes && !subjectResults.value.length) loadSubjects()
}

function setAssignmentScopeType(type) {
  assignment.scopeType = type
  assignment.scopePlantel = 'ALL'
  subjectQuery.value = ''
  loadSubjects()
}

function scheduleSubjectLoad() {
  if (subjectTimer) clearTimeout(subjectTimer)
  subjectTimer = setTimeout(loadSubjects, 220)
}

async function loadSubjects() {
  if (assignment.lockScopes) return
  if (assignment.scopeType === 'PERSON' && subjectQuery.value.trim().length < 2) {
    subjectResults.value = []
    return
  }
  subjectsLoading.value = true
  try {
    subjectResults.value = await $fetch('/api/authorizations/subjects', { query: { type: assignment.scopeType, q: subjectQuery.value, plantel: assignment.scopePlantel } })
  } catch (error) {
    subjectResults.value = []
    showToast(error?.data?.message || 'No se pudo cargar el alcance.')
  } finally {
    subjectsLoading.value = false
  }
}

function subjectKey(subject) {
  return `${subject.type}|||${subject.plantel || assignment.scopePlantel || 'ALL'}|||${subject.value}`
}

function isSubjectSelected(subject) {
  return assignment.scopes.some((scope) => scope.key === subjectKey(subject))
}

function toggleSubject(subject) {
  const key = subjectKey(subject)
  const existing = assignment.scopes.find((scope) => scope.key === key)
  if (existing) assignment.scopes = assignment.scopes.filter((scope) => scope.key !== key)
  else assignment.scopes = [...assignment.scopes, { ...subject, key, plantel: subject.type === 'PERSON' ? 'ALL' : (subject.plantel || assignment.scopePlantel || 'ALL') }]
}

function removeDraftScope(key) {
  assignment.scopes = assignment.scopes.filter((scope) => scope.key !== key)
}

function toggleAssignmentChannel(channel) {
  if (assignment.channels.includes(channel)) {
    if (assignment.channels.length === 1) return
    assignment.channels = assignment.channels.filter((item) => item !== channel)
  } else assignment.channels = [...assignment.channels, channel]
}

async function saveAssignment() {
  if (!assignmentValid.value || assignmentSaving.value) return
  assignmentSaving.value = true
  const email = assignment.authorizer.email
  try {
    await $fetch('/api/authorizations/grants-batch', {
      method: 'POST',
      body: {
        authorizerEmail: email,
        assignments: assignment.scopes.map((scope) => ({
          scopeType: scope.type,
          scopeValue: scope.value,
          plantel: scope.type === 'PERSON' || scope.type === 'PLANTEL' ? 'ALL' : (scope.plantel || 'ALL')
        })),
        channels: assignment.channels,
        phone: assignment.phone
      }
    })
    closeAssignment()
    selectedMatrixKeys.value = []
    await Promise.all([loadAuthorizers(email), loadMatrix()])
    activeTab.value = assignment.lockScopes && activeTab.value === 'GROUPS' ? 'GROUPS' : 'AUTHORIZERS'
    showToast('Autorización actualizada')
  } catch (error) {
    showToast(error?.data?.message || 'No se pudo guardar la autorización.')
  } finally {
    assignmentSaving.value = false
  }
}

async function removeScope(authorizer, scope) {
  try {
    await deleteScopeRequest(authorizer.email, scope)
    await Promise.all([loadAuthorizers(authorizer.email), activeTab.value === 'GROUPS' ? loadMatrix() : Promise.resolve()])
    showToast('Autorización retirada', async () => {
      try {
        await $fetch('/api/authorizations/grants', { method: 'POST', body: { authorizerEmail: authorizer.email, scopeType: scope.type, scopeValue: scope.value, plantel: scope.plantel, channels: scope.channels, phone: normalizePhone(authorizer.phone) } })
        await Promise.all([loadAuthorizers(authorizer.email), activeTab.value === 'GROUPS' ? loadMatrix() : Promise.resolve()])
        showToast('Autorización restaurada')
      } catch (error) {
        showToast(error?.data?.message || 'No se pudo restaurar.')
      }
    })
  } catch (error) {
    showToast(error?.data?.message || 'No se pudo retirar la autorización.')
  }
}

async function deleteScopeRequest(authorizerEmail, scope) {
  return $fetch('/api/authorizations/grants', { method: 'DELETE', query: { authorizerEmail, scopeType: scope.type, scopeValue: scope.value, plantel: scope.plantel || 'ALL' } })
}

async function removeAuthorizer(authorizer) {
  if (!confirm(`¿Retirar todos los alcances de ${authorizer.name}?`)) return
  try {
    await $fetch(`/api/authorizations/authorizers/${encodeURIComponent(authorizer.email)}`, { method: 'DELETE' })
    await Promise.all([loadAuthorizers(), activeTab.value === 'GROUPS' ? loadMatrix() : Promise.resolve()])
    showToast('Autorizador retirado')
  } catch (error) {
    showToast(error?.data?.message || 'No se pudo retirar al autorizador.')
  }
}

function matrixRowEditableHere(row) {
  if (!row?.isExclusive) return true
  if (selectedPlantel.value === 'ALL') return row.source === 'GLOBAL_PUESTO'
  return row.source === 'EXACT_PUESTO' && String(row.configuredPlantel || '') === String(selectedPlantel.value) && String(row.configuredPuesto || '') === String(row.puesto)
}

function matrixTargetRemovableHere(row) {
  return Boolean(row?.isExclusive && matrixRowEditableHere(row))
}

async function removeMatrixTarget(row, target) {
  if (!matrixTargetRemovableHere(row)) return
  const scope = { type: 'PUESTO', value: row.puesto, label: row.puesto, plantel: selectedPlantel.value, channels: target.channels || ['EMAIL'] }
  await removeScope({ email: target.email, name: target.name || target.email, phone: target.phone }, scope)
}

function toggleMatrixRow(row) {
  if (selectedMatrixKeys.value.includes(row.key)) selectedMatrixKeys.value = selectedMatrixKeys.value.filter((key) => key !== row.key)
  else selectedMatrixKeys.value = [...selectedMatrixKeys.value, row.key]
}

function toggleAllMatrixRows() {
  selectedMatrixKeys.value = allVisibleMatrixSelected.value ? [] : visibleMatrixRows.value.map((row) => row.key)
}

function targetSummary(targets) {
  const names = targets.map((target) => target.name || target.email)
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
}

function matrixSourceLabel(row) {
  if (!row.isExclusive) return row.targets?.length ? 'Estándar' : 'Sin regla'
  if (row.source === 'EXACT_PUESTO') return 'Directo'
  if (row.source === 'GLOBAL_PUESTO') return 'Global'
  if (row.source === 'PLANTEL_DEFAULT') return 'Heredado'
  return 'Protegido'
}

function matrixSourceClass(row) {
  if (!row.isExclusive) return row.targets?.length ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-red-50 text-red-600 border-red-100'
  if (matrixRowEditableHere(row)) return 'bg-violet-50 text-violet-700 border-violet-200'
  return 'bg-blue-50 text-blue-700 border-blue-200'
}

function scopeSubtitle(scope) {
  if (scope.subtitle) return scope.subtitle
  if (scope.type === 'PUESTO' || scope.type === 'AREA') return scope.plantel === 'ALL' ? 'Toda la institución' : scope.plantel
  return ''
}

function scopeChipLabel(scope) {
  const suffix = (scope.type === 'PUESTO' || scope.type === 'AREA') && scope.plantel && scope.plantel !== 'ALL' ? ` · ${scope.plantel}` : ''
  return `${scope.label || scope.value}${suffix}`
}

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('521') && digits.length >= 13) digits = digits.slice(3)
  if (digits.length > 10) digits = digits.slice(-10)
  return digits.slice(0, 10)
}

function formatPhoneDisplay(value) {
  const digits = normalizePhone(value)
  if (digits.length !== 10) return value || ''
  return `+52 ${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`
}

function showToast(message, action = null) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.visible = true
  toast.message = message
  toast.action = action
  toastTimer = setTimeout(hideToast, action ? 7000 : 3200)
}

function hideToast() {
  if (toastTimer) clearTimeout(toastTimer)
  toast.visible = false
  toast.action = null
}

onMounted(async () => {
  const [, planteles] = await Promise.all([
    loadAuthorizers(),
    $fetch('/api/catalogs/planteles').catch(() => [])
  ])
  catalogPlanteles.value = planteles || []
})
</script>
