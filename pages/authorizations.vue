<template>
  <div class="p-6 md:p-10 max-w-[1800px] mx-auto h-full flex flex-col relative z-10">
    <header class="mb-6 shrink-0 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-white shadow-sm mb-4 text-[10px] font-black text-iedis-teal-dark uppercase tracking-widest">
          <LockKeyhole class="w-3.5 h-3.5" /> Autorización exclusiva
        </div>
        <h1 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Autorizaciones críticas</h1>
        <p class="text-slate-500 mt-2 text-sm font-bold max-w-3xl">
          Define por plantel y puesto quién puede recibir el enlace y resolver un pase. Las notificaciones ahora son enlaces de autorización; no se envían a destinatarios no autorizados.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button @click="openPlantelDefault" :disabled="selectedPlantel === 'ALL'" class="px-5 py-3 bg-white/80 border border-white text-slate-700 text-xs font-black rounded-2xl shadow-sm hover:border-brand-300 hover:text-brand-700 transition-all flex items-center gap-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed">
          <Building2 class="w-4 h-4" /> Default del plantel
        </button>
        <button @click="openBulkAssignment" class="px-5 py-3 bg-gradient-to-r from-iedis-teal to-iedis-teal-dark text-white text-xs font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 outline-none">
          <Plus class="w-4 h-4" /> Asignación masiva
        </button>
      </div>
    </header>

    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6 shrink-0">
      <div v-for="card in summaryCards" :key="card.label" class="glass-panel p-5 rounded-[2rem] border border-white/80 shadow-sm">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{{ card.label }}</p>
        <div class="flex items-end justify-between gap-3">
          <p class="text-3xl font-black text-slate-900 tracking-tight">{{ card.value }}</p>
          <component :is="card.icon" class="w-6 h-6 text-iedis-teal" />
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col xl:flex-row gap-6 min-h-0">
      <aside class="w-full xl:w-72 2xl:w-80 flex flex-col shrink-0 min-h-0 glass-panel rounded-[2.5rem] overflow-hidden shadow-sm">
        <div class="p-6 border-b border-white/60 bg-white/40">
          <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Building2 class="w-4 h-4 text-brand-500" /> Planteles
          </h2>
          <p class="text-[11px] font-bold text-slate-500 mt-2">El puesto específico siempre puede reemplazar el default del plantel.</p>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 bg-white/20">
          <button
            @click="setPlantel('ALL')"
            class="w-full text-left px-5 py-3.5 rounded-2xl font-bold text-sm transition-all outline-none flex items-center justify-between group"
            :class="selectedPlantel === 'ALL' ? 'bg-gradient-to-r from-iedis-teal to-iedis-teal-dark text-white shadow-md' : 'text-slate-700 hover:bg-white/60 hover:text-slate-900 hover:shadow-sm'"
          >
            <div class="flex items-center gap-3">
              <Globe class="w-4 h-4" :class="selectedPlantel === 'ALL' ? 'text-white/70' : 'text-slate-400 group-hover:text-brand-500'" />
              Toda la institución
            </div>
          </button>

          <div class="my-3 border-t border-white/60 mx-4"></div>

          <button
            v-for="plantel in planteles"
            :key="plantel"
            @click="setPlantel(plantel)"
            class="w-full text-left px-5 py-3.5 rounded-2xl font-bold text-sm transition-all outline-none flex items-center justify-between group"
            :class="selectedPlantel === plantel ? 'bg-white shadow-md text-brand-800 border-white' : 'text-slate-600 hover:bg-white/60 border border-transparent hover:shadow-sm'"
          >
            <span class="truncate">{{ plantel }}</span>
            <ChevronRight class="w-4 h-4" :class="selectedPlantel === plantel ? 'text-brand-500' : 'text-transparent group-hover:text-slate-300'" />
          </button>
        </div>
      </aside>

      <main class="flex-1 min-w-0 flex flex-col xl:flex-row gap-6 min-h-0">
        <section class="flex-1 min-w-0 glass-panel rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
          <div class="p-6 border-b border-white/70 bg-white/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-black text-slate-900 tracking-tight">
                {{ selectedPlantel === 'ALL' ? 'Overrides globales por puesto' : selectedPlantel }}
              </h2>
              <p class="text-xs font-bold text-slate-500 mt-1">{{ selectedPlantel === 'ALL' ? 'Reglas de puesto aplicables a toda la institución.' : 'Matriz puesto × autorizador para este plantel.' }}</p>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
              <div class="relative min-w-[260px]">
                <Search class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input v-model="searchQuery" type="search" placeholder="Buscar puesto, autorizador..." class="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/80 border border-white focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold text-slate-800 shadow-sm" />
              </div>
              <select v-model="statusFilter" class="px-4 py-3 rounded-2xl bg-white/80 border border-white focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-xs font-black text-slate-700 shadow-sm">
                <option value="ALL">Todos</option>
                <option value="PROTECTED">Solo protegidos</option>
                <option value="INCOMPLETE">Incompletos</option>
                <option value="OVERRIDES">Overrides</option>
              </select>
            </div>
          </div>

          <div v-if="loading" class="flex-1 flex items-center justify-center p-16">
            <Loader2 class="w-12 h-12 animate-spin text-iedis-teal" />
          </div>

          <div v-else class="flex-1 overflow-auto custom-scrollbar">
            <table class="w-full min-w-[960px] text-left">
              <thead class="sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-slate-100">
                <tr class="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th class="px-6 py-4 w-12">
                    <input type="checkbox" :checked="allVisibleSelected" @change="toggleAllVisible" class="w-4 h-4 rounded border-slate-300 text-iedis-teal focus:ring-iedis-teal" />
                  </th>
                  <th class="px-4 py-4">Puesto</th>
                  <th class="px-4 py-4">Usuarios</th>
                  <th class="px-4 py-4">Autorizador obligatorio</th>
                  <th class="px-4 py-4">Canal</th>
                  <th class="px-4 py-4">Estado</th>
                  <th class="px-4 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/70">
                <tr
                  v-for="row in rows"
                  :key="row.key"
                  @click="selectedRow = row"
                  class="group transition-all cursor-pointer"
                  :class="selectedRow?.key === row.key ? 'bg-iedis-teal/10' : 'hover:bg-white/60'"
                >
                  <td class="px-6 py-4" @click.stop>
                    <input type="checkbox" :checked="selectedKeys.includes(row.key)" @change="toggleRow(row)" class="w-4 h-4 rounded border-slate-300 text-iedis-teal focus:ring-iedis-teal" />
                  </td>
                  <td class="px-4 py-4">
                    <div class="max-w-[320px]">
                      <p class="text-sm font-black text-slate-900 leading-tight">{{ row.puesto }}</p>
                      <p class="text-[10px] font-bold text-slate-500 mt-1">{{ row.sourceLabel }}</p>
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-white shadow-sm text-xs font-black text-slate-700">
                      <Users class="w-3.5 h-3.5 text-slate-400" /> {{ row.userCount }} usuarios
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    <div v-if="row.targets?.length" class="flex flex-col gap-1.5">
                      <p class="text-sm font-black text-slate-800 truncate max-w-[280px]">{{ targetLabel(row) }}</p>
                      <p class="text-[10px] font-bold text-slate-500 truncate max-w-[280px]">{{ targetEmails(row) }}</p>
                    </div>
                    <div v-else>
                      <p class="text-sm font-black text-slate-500">Sin autorizador configurado</p>
                      <p class="text-[10px] font-bold text-slate-400">No se enviará enlace de autorización.</p>
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex flex-wrap gap-1.5">
                      <span v-for="channel in rowChannels(row)" :key="channel" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-white/80 shadow-sm" :class="channel === 'WHATSAPP' ? 'text-casita-green-dark border-casita-green/30' : 'text-iedis-blue-dark border-iedis-blue/20'">
                        <MessageCircle v-if="channel === 'WHATSAPP'" class="w-3 h-3" />
                        <Mail v-else class="w-3 h-3" />
                        {{ channel === 'WHATSAPP' ? 'WA' : 'Email' }}
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest" :class="stateClass(row.state)">
                      <span class="w-2 h-2 rounded-full" :class="stateDotClass(row.state)"></span>
                      {{ stateLabel(row.state) }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-right" @click.stop>
                    <button @click="editRow(row)" class="px-3 py-2 bg-white/80 hover:bg-white text-brand-700 rounded-xl border border-white shadow-sm text-[10px] font-black uppercase tracking-widest transition-all">Editar</button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="!rows.length" class="p-16 text-center">
              <div class="w-16 h-16 rounded-2xl bg-white border border-white shadow-sm flex items-center justify-center mx-auto mb-4">
                <Search class="w-7 h-7 text-slate-400" />
              </div>
              <p class="text-base font-black text-slate-700">Sin grupos visibles</p>
              <p class="text-sm font-bold text-slate-500 mt-1">Ajusta la búsqueda o el filtro de estado.</p>
            </div>
          </div>
        </section>

        <aside class="w-full xl:w-[380px] 2xl:w-[420px] shrink-0 glass-panel rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col min-h-[420px] xl:min-h-0">
          <div class="p-6 border-b border-white/70 bg-white/50">
            <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <ClipboardCheck class="w-4 h-4 text-brand-500" /> Inspector
            </h3>
          </div>

          <div v-if="selectedRow" class="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
            <div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Grupo seleccionado</p>
              <h4 class="text-xl font-black text-slate-900 leading-tight">{{ selectedRow.puesto }}</h4>
              <p class="text-xs font-bold text-slate-500 mt-1">{{ selectedPlantel === 'ALL' ? 'Toda la institución' : selectedPlantel }} · {{ selectedRow.userCount }} usuarios</p>
            </div>

            <div class="p-5 bg-white/75 rounded-2xl border border-white shadow-sm">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Regla activa</p>
              <p class="text-sm font-black text-slate-900">Este pase solo puede ser autorizado por:</p>
              <p class="text-sm font-bold text-brand-700 mt-2">{{ selectedRow.targets?.length ? targetLabel(selectedRow) : 'Sin autorizador configurado' }}</p>
              <p v-if="selectedRow.targets?.length" class="text-[11px] font-bold text-slate-500 mt-1">{{ targetEmails(selectedRow) }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="p-4 bg-white/60 rounded-2xl border border-white">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precedencia</p>
                <p class="text-xs font-black text-slate-800">{{ selectedRow.sourceLabel }}</p>
              </div>
              <div class="p-4 bg-white/60 rounded-2xl border border-white">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                <p class="text-xs font-black text-slate-800">{{ stateLabel(selectedRow.state) }}</p>
              </div>
            </div>

            <div v-if="selectedRow.targets?.length" class="space-y-3">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contactos</p>
              <div v-for="target in selectedRow.targets" :key="target.email" class="p-4 bg-white/70 rounded-2xl border border-white shadow-sm">
                <div class="flex items-start gap-3">
                  <PremiumAvatar :src="target.photoUrl" :name="target.name || target.email" size="sm" class="shrink-0 ring-2 ring-white shadow-sm bg-white" />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-black text-slate-900 truncate">{{ target.name }}</p>
                    <p class="text-[10px] font-bold text-slate-500 truncate">{{ target.email }}</p>
                    <p class="text-[10px] font-bold mt-2 flex items-center gap-1.5" :class="target.phone ? 'text-slate-600' : 'text-casita-gold-dark'">
                      <Smartphone class="w-3.5 h-3.5" /> {{ formatPhoneDisplay(target.phone) || 'Sin celular registrado' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-3 pt-2">
              <button @click="editRow(selectedRow)" class="w-full px-5 py-3 bg-gradient-to-r from-iedis-teal to-iedis-teal-dark text-white text-xs font-black rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <UserCheck class="w-4 h-4" /> Editar regla
              </button>
              <button v-if="selectedRow.ruleIds?.length" @click="clearEffectiveRule(selectedRow)" class="w-full px-5 py-3 bg-white text-casita-red text-xs font-black rounded-2xl shadow-sm border border-white hover:border-casita-red/30 transition-all flex items-center justify-center gap-2">
                <Trash2 class="w-4 h-4" /> Eliminar regla activa
              </button>
            </div>
          </div>

          <div v-else class="p-10 flex-1 flex flex-col items-center justify-center text-center">
            <div class="w-16 h-16 bg-white rounded-2xl border border-white shadow-sm flex items-center justify-center mb-4">
              <ShieldCheck class="w-7 h-7 text-slate-400" />
            </div>
            <p class="text-base font-black text-slate-700">Selecciona un grupo</p>
            <p class="text-sm font-bold text-slate-500 mt-1 max-w-sm">Verás el autorizador obligatorio, la precedencia y los teléfonos faltantes.</p>
          </div>
        </aside>
      </main>
    </div>

    <div v-if="drawerOpen" class="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm" @click.self="closeDrawer">
      <div class="w-full max-w-xl h-full bg-white/95 backdrop-blur-xl shadow-2xl border-l border-white flex flex-col">
        <header class="p-8 border-b border-slate-100">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[10px] font-black text-iedis-teal-dark uppercase tracking-widest mb-2">{{ drawerModeLabel }}</p>
              <h3 class="text-2xl font-black text-slate-900 tracking-tight">Asignar autorizador obligatorio</h3>
              <p class="text-sm font-bold text-slate-500 mt-2">Se reemplazarán las reglas existentes para el alcance seleccionado.</p>
            </div>
            <button @click="closeDrawer" class="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition-all">
              <X class="w-5 h-5" />
            </button>
          </div>
        </header>

        <div class="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">
          <section class="space-y-3">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alcance</p>
            <div class="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <p class="text-sm font-black text-slate-900">{{ form.plantel === 'ALL' ? 'Toda la institución' : form.plantel }}</p>
              <p class="text-xs font-bold text-slate-500 mt-1">{{ form.puestos.length === 1 && form.puestos[0] === 'ALL' ? 'Default general del plantel' : `${form.puestos.length} puesto(s) seleccionado(s)` }}</p>
            </div>

            <div v-if="drawerMode === 'CUSTOM'" class="space-y-2">
              <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Agregar puestos manualmente</label>
              <select v-model="manualPuesto" @change="addManualPuesto" class="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold text-slate-700">
                <option value="">Seleccionar puesto...</option>
                <option v-for="puesto in availablePuestos" :key="puesto" :value="puesto">{{ puesto }}</option>
              </select>
            </div>

            <div v-if="form.puestos.length && !(form.puestos.length === 1 && form.puestos[0] === 'ALL')" class="flex flex-wrap gap-2">
              <span v-for="puesto in form.puestos" :key="puesto" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[10px] font-black text-slate-700 shadow-sm">
                {{ puesto }}
                <button @click="removePuesto(puesto)" class="text-slate-400 hover:text-casita-red"><X class="w-3 h-3" /></button>
              </span>
            </div>
          </section>

          <section class="space-y-3">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autorizador obligatorio</p>
            <div v-if="!form.email" class="relative">
              <Search class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input v-model="gwSearchQuery" @input="searchGw" placeholder="Buscar en Workspace por nombre o correo..." class="w-full pl-11 pr-4 py-4 rounded-2xl bg-white border border-slate-200 focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold text-slate-800" />
              <div v-if="gwResults.length" class="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-dropdown overflow-hidden z-20 max-h-72 overflow-y-auto custom-scrollbar">
                <button v-for="result in gwResults" :key="result.email" @click="selectGw(result)" class="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors">
                  <PremiumAvatar :src="result.photoUrl" :name="result.name" size="sm" class="shrink-0 bg-white" />
                  <div class="min-w-0">
                    <p class="text-sm font-black text-slate-900 truncate">{{ result.name }}</p>
                    <p class="text-[10px] font-bold text-slate-500 truncate">{{ result.email }}</p>
                  </div>
                </button>
              </div>
            </div>

            <div v-else class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <PremiumAvatar :src="selectedGwPhoto" :name="selectedGwName || form.email" size="md" class="shrink-0 ring-2 ring-white shadow-sm bg-white" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-black text-slate-900 truncate">{{ selectedGwName || form.email }}</p>
                <p class="text-[10px] font-bold text-slate-500 truncate">{{ form.email }}</p>
              </div>
              <button @click="clearGw" class="p-2 rounded-xl text-slate-400 hover:text-casita-red hover:bg-slate-50 transition-all">
                <X class="w-4 h-4" />
              </button>
            </div>
          </section>

          <section class="space-y-3">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Canales autorizados</p>
            <div class="grid grid-cols-2 gap-3">
              <button @click="toggleChannel('EMAIL')" class="px-4 py-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2" :class="form.channels.includes('EMAIL') ? 'bg-iedis-blue/10 text-iedis-blue-dark border-iedis-blue/30' : 'bg-white text-slate-500 border-slate-200'">
                <Mail class="w-4 h-4" /> Email
              </button>
              <button @click="toggleChannel('WHATSAPP')" class="px-4 py-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2" :class="form.channels.includes('WHATSAPP') ? 'bg-casita-green/10 text-casita-green-dark border-casita-green/30' : 'bg-white text-slate-500 border-slate-200'">
                <MessageCircle class="w-4 h-4" /> WhatsApp
              </button>
            </div>
          </section>

          <section v-if="form.channels.includes('WHATSAPP')" class="space-y-3">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Celular WhatsApp</p>
            <div class="flex rounded-2xl shadow-sm">
              <span class="px-4 py-4 bg-slate-100 border border-r-0 border-slate-200 rounded-l-2xl text-sm font-black text-slate-500">+52</span>
              <input v-model="form.phone" @input="enforcePhoneDigits" maxlength="10" placeholder="10 dígitos" class="flex-1 px-4 py-4 rounded-r-2xl bg-white border border-slate-200 focus:border-casita-green focus:ring-2 focus:ring-casita-green/20 outline-none text-sm font-black text-slate-900" />
            </div>
            <p class="text-[10px] font-bold" :class="form.phone.length === 10 ? 'text-casita-green-dark' : 'text-casita-gold-dark'">
              {{ form.phone.length === 10 ? 'Número válido. Se sincronizará con Workspace.' : 'Requerido para habilitar WhatsApp.' }}
            </p>
          </section>

          <section class="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resumen antes de guardar</p>
            <p class="text-sm font-bold text-slate-700">
              Se actualizarán {{ form.puestos.length }} grupo(s). {{ affectedUsersForForm }} usuario(s) quedan cubiertos por esta asignación. Las reglas previas del mismo grupo serán reemplazadas.
            </p>
          </section>
        </div>

        <footer class="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
          <button @click="closeDrawer" class="px-5 py-3 rounded-2xl bg-slate-100 text-slate-600 text-xs font-black hover:text-slate-900 transition-all">Cancelar</button>
          <button @click="saveRules" :disabled="saving || !formValid" class="px-6 py-3 rounded-2xl bg-gradient-to-r from-iedis-teal to-iedis-teal-dark text-white text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" /> Guardar autorización
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ShieldCheck, Building2, Globe, ChevronRight, Search, Loader2, Users, Mail, MessageCircle, Smartphone, CheckCircle2, AlertTriangle, Plus, Trash2, X, Layers, LockKeyhole, UserCheck, ClipboardCheck } from 'lucide-vue-next'
import PremiumAvatar from '~/components/PremiumAvatar.vue'

const selectedPlantel = ref('ALL')
const searchQuery = ref('')
const statusFilter = ref('ALL')
const loading = ref(true)
const saving = ref(false)
const matrix = ref({ rows: [], planteles: [], catalogPuestos: [], summary: { protectedGroups: 0, affectedUsers: 0, incompleteRules: 0, activeOverrides: 0 } })
const selectedRow = ref(null)
const selectedKeys = ref([])
let loadTimer = null

const drawerOpen = ref(false)
const drawerMode = ref('CUSTOM')
const manualPuesto = ref('')
const gwSearchQuery = ref('')
const gwResults = ref([])
const selectedGwName = ref('')
const selectedGwPhoto = ref('')
let gwTimeout = null

const form = reactive({
  plantel: 'ALL',
  puestos: [],
  email: '',
  channels: ['EMAIL'],
  phone: ''
})

const planteles = computed(() => matrix.value.planteles || [])
const rows = computed(() => matrix.value.rows || [])
const availablePuestos = computed(() => (matrix.value.catalogPuestos || []).filter((puesto) => !form.puestos.includes(puesto)))

const summaryCards = computed(() => [
  { label: 'Grupos protegidos', value: matrix.value.summary.protectedGroups, icon: ShieldCheck },
  { label: 'Colaboradores afectados', value: matrix.value.summary.affectedUsers, icon: Users },
  { label: 'Reglas incompletas', value: matrix.value.summary.incompleteRules, icon: AlertTriangle },
  { label: 'Overrides activos', value: matrix.value.summary.activeOverrides, icon: Layers }
])

const allVisibleSelected = computed(() => rows.value.length > 0 && rows.value.every((row) => selectedKeys.value.includes(row.key)))
const drawerModeLabel = computed(() => {
  if (drawerMode.value === 'PLANTEL_DEFAULT') return 'Regla de plantel'
  if (drawerMode.value === 'ROW') return 'Override de puesto'
  return 'Asignación masiva'
})

const formValid = computed(() => {
  if (!form.plantel || !form.puestos.length || !form.email || !form.channels.length) return false
  if (form.channels.includes('WHATSAPP') && form.phone.length !== 10) return false
  return true
})

const affectedUsersForForm = computed(() => {
  if (form.puestos.includes('ALL')) {
    return rows.value.reduce((sum, row) => sum + row.userCount, 0)
  }
  return rows.value.filter((row) => form.puestos.includes(row.puesto)).reduce((sum, row) => sum + row.userCount, 0)
})

const loadMatrix = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/authorizations/matrix', {
      query: {
        plantel: selectedPlantel.value,
        search: searchQuery.value,
        status: statusFilter.value
      }
    })
    matrix.value = data
    selectedKeys.value = selectedKeys.value.filter((key) => data.rows.some((row) => row.key === key))
    if (selectedRow.value) {
      selectedRow.value = data.rows.find((row) => row.key === selectedRow.value.key) || null
    }
  } catch (error) {
    alert(error?.data?.message || 'No se pudo cargar la matriz de autorizaciones.')
  } finally {
    loading.value = false
  }
}

const scheduleLoad = () => {
  if (loadTimer) clearTimeout(loadTimer)
  loadTimer = setTimeout(loadMatrix, 250)
}

watch([searchQuery, statusFilter], scheduleLoad)

const setPlantel = (plantel) => {
  selectedPlantel.value = plantel
  selectedKeys.value = []
  selectedRow.value = null
  loadMatrix()
}

const toggleRow = (row) => {
  if (selectedKeys.value.includes(row.key)) {
    selectedKeys.value = selectedKeys.value.filter((key) => key !== row.key)
  } else {
    selectedKeys.value = [...selectedKeys.value, row.key]
  }
}

const toggleAllVisible = () => {
  if (allVisibleSelected.value) {
    selectedKeys.value = []
  } else {
    selectedKeys.value = rows.value.map((row) => row.key)
  }
}

const resetForm = () => {
  form.plantel = selectedPlantel.value
  form.puestos = []
  form.email = ''
  form.channels = ['EMAIL']
  form.phone = ''
  selectedGwName.value = ''
  selectedGwPhoto.value = ''
  gwSearchQuery.value = ''
  gwResults.value = []
  manualPuesto.value = ''
}

const openBulkAssignment = () => {
  resetForm()
  drawerMode.value = 'CUSTOM'
  const selectedRows = rows.value.filter((row) => selectedKeys.value.includes(row.key))
  form.puestos = selectedRows.map((row) => row.puesto)
  drawerOpen.value = true
}

const openPlantelDefault = () => {
  resetForm()
  drawerMode.value = 'PLANTEL_DEFAULT'
  form.plantel = selectedPlantel.value
  form.puestos = ['ALL']
  drawerOpen.value = true
}

const editRow = (row) => {
  resetForm()
  drawerMode.value = 'ROW'
  form.plantel = selectedPlantel.value === 'ALL' ? 'ALL' : selectedPlantel.value
  form.puestos = [row.puesto]
  if (row.targets?.length) {
    const target = row.targets[0]
    form.email = target.email
    form.channels = target.channels?.length ? [...target.channels] : ['EMAIL']
    form.phone = target.phone ? target.phone.replace(/\D/g, '').slice(-10) : ''
    selectedGwName.value = target.name
    selectedGwPhoto.value = target.photoUrl || ''
  }
  drawerOpen.value = true
}

const closeDrawer = () => {
  drawerOpen.value = false
}

const addManualPuesto = () => {
  if (manualPuesto.value && !form.puestos.includes(manualPuesto.value)) {
    form.puestos = [...form.puestos, manualPuesto.value]
  }
  manualPuesto.value = ''
}

const removePuesto = (puesto) => {
  form.puestos = form.puestos.filter((item) => item !== puesto)
}

const searchGw = () => {
  if (gwTimeout) clearTimeout(gwTimeout)
  if (gwSearchQuery.value.length < 2) {
    gwResults.value = []
    return
  }
  gwTimeout = setTimeout(async () => {
    try {
      const data = await $fetch('/api/workspace/search', { params: { q: gwSearchQuery.value } })
      gwResults.value = data || []
    } catch {
      gwResults.value = []
    }
  }, 300)
}

const selectGw = (result) => {
  form.email = result.email
  selectedGwName.value = result.name
  selectedGwPhoto.value = result.photoUrl

  let cleanPhone = ''
  if (result.phone) {
    cleanPhone = result.phone.replace(/\D/g, '')
    if (cleanPhone.startsWith('521') && cleanPhone.length >= 13) cleanPhone = cleanPhone.substring(3)
    if (cleanPhone.length > 10) cleanPhone = cleanPhone.substring(cleanPhone.length - 10)
  }
  form.phone = cleanPhone
  gwSearchQuery.value = ''
  gwResults.value = []
}

const clearGw = () => {
  form.email = ''
  selectedGwName.value = ''
  selectedGwPhoto.value = ''
  form.phone = ''
}

const toggleChannel = (channel) => {
  if (form.channels.includes(channel)) {
    form.channels = form.channels.filter((item) => item !== channel)
  } else {
    form.channels = [...form.channels, channel]
  }
}

const enforcePhoneDigits = () => {
  form.phone = form.phone.replace(/\D/g, '').substring(0, 10)
}

const saveRules = async () => {
  if (saving.value || !formValid.value) return
  saving.value = true
  try {
    await $fetch('/api/authorizations/rules', {
      method: 'POST',
      body: {
        plantel: form.plantel,
        puestos: form.puestos,
        email: form.email,
        channels: form.channels,
        phone: form.phone,
        replaceExisting: true
      }
    })
    closeDrawer()
    await loadMatrix()
  } catch (error) {
    alert(error?.data?.message || 'No se pudo guardar la autorización.')
  } finally {
    saving.value = false
  }
}

const clearEffectiveRule = async (row) => {
  const plantel = row.configuredPlantel || (selectedPlantel.value === 'ALL' ? 'ALL' : selectedPlantel.value)
  const puesto = row.configuredPuesto || row.puesto
  if (!confirm(`¿Eliminar la regla activa para ${puesto} en ${plantel}?`)) return

  try {
    await $fetch('/api/authorizations/group', {
      method: 'DELETE',
      query: { plantel, puesto }
    })
    await loadMatrix()
  } catch (error) {
    alert(error?.data?.message || 'No se pudo eliminar la regla.')
  }
}

const targetLabel = (row) => row.targets.map((target) => target.name || target.email).join(', ')
const targetEmails = (row) => row.targets.map((target) => target.email).join(', ')
const rowChannels = (row) => Array.from(new Set((row.targets || []).flatMap((target) => target.channels || [])))

const stateLabel = (state) => ({
  STANDARD: 'Normal',
  OVERRIDE: 'Override',
  GLOBAL_OVERRIDE: 'Override global',
  INHERITED: 'Heredado',
  INCOMPLETE: 'Incompleto',
  UNCONFIGURED: 'Sin destino'
}[state] || state)

const stateClass = (state) => ({
  STANDARD: 'bg-slate-50 text-slate-600 border-slate-200',
  OVERRIDE: 'bg-purple-50 text-purple-700 border-purple-200',
  GLOBAL_OVERRIDE: 'bg-purple-50 text-purple-700 border-purple-200',
  INHERITED: 'bg-blue-50 text-blue-700 border-blue-200',
  INCOMPLETE: 'bg-amber-50 text-amber-700 border-amber-200',
  UNCONFIGURED: 'bg-red-50 text-red-700 border-red-200'
}[state] || 'bg-slate-50 text-slate-600 border-slate-200')

const stateDotClass = (state) => ({
  STANDARD: 'bg-slate-400',
  OVERRIDE: 'bg-purple-500',
  GLOBAL_OVERRIDE: 'bg-purple-500',
  INHERITED: 'bg-blue-500',
  INCOMPLETE: 'bg-amber-500',
  UNCONFIGURED: 'bg-red-500'
}[state] || 'bg-slate-400')

const formatPhoneDisplay = (phoneRaw) => {
  if (!phoneRaw) return ''
  const digits = phoneRaw.replace(/\D/g, '')
  if (digits.length >= 10) {
    const num = digits.slice(-10)
    return `+52 1 ${num.slice(0, 2)} ${num.slice(2, 6)} ${num.slice(6)}`
  }
  return phoneRaw
}

onMounted(loadMatrix)
</script>
