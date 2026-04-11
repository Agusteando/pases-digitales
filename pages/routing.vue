## pages/routing.vue

<template>
  <div class="p-6 md:p-10 max-w-[1600px] mx-auto h-full flex flex-col relative z-10">
    
    <header class="mb-8 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Configuración de envíos</h1>
        <p class="text-slate-500 mt-2 text-sm font-bold">Distribución de avisos por plantel.</p>
      </div>
    </header>

    <div v-if="pendingContacts || pendingRules || pendingPlanteles" class="flex-1 flex items-center justify-center">
      <Loader2 class="w-12 h-12 animate-spin text-brand-600" />
    </div>

    <div v-else class="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
      
      <!-- Left Sidebar: Planteles List -->
      <aside class="w-full lg:w-72 xl:w-80 flex flex-col shrink-0 min-h-0 glass-panel rounded-[2.5rem] overflow-hidden shadow-sm">
        <div class="p-6 border-b border-white/60 bg-white/40">
          <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Building2 class="w-4 h-4 text-brand-500" /> Planteles
          </h2>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 bg-white/20">
          <button 
            @click="selectedPlantel = 'ALL'"
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
            v-for="plantel in (dynamicPlanteles || [])" :key="plantel"
            @click="selectedPlantel = plantel"
            class="w-full text-left px-5 py-3.5 rounded-2xl font-bold text-sm transition-all outline-none flex items-center justify-between group"
            :class="selectedPlantel === plantel ? 'bg-white shadow-md text-brand-800 border-white' : 'text-slate-600 hover:bg-white/60 border border-transparent hover:shadow-sm'"
          >
            <span class="truncate">{{ plantel }}</span>
            <ChevronRight class="w-4 h-4" :class="selectedPlantel === plantel ? 'text-brand-500' : 'text-transparent group-hover:text-slate-300'" />
          </button>
        </div>
      </aside>

      <!-- Right Main Panel: Detail View -->
      <main class="flex-1 flex flex-col min-h-0 custom-scrollbar overflow-y-auto pb-10">
        
        <div class="mb-8">
          <h2 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span v-if="selectedPlantel === 'ALL'">Toda la institución</span>
            <span v-else>Plantel: {{ selectedPlantel }}</span>
          </h2>
          <p class="text-sm font-medium text-slate-500 mt-1">
            {{ selectedPlantel === 'ALL' ? 'Reglas aplicables a toda la organización.' : 'Responsables y reglas específicas para este plantel.' }}
          </p>
        </div>

        <!-- Section: Responsables Base -->
        <section v-if="selectedPlantel !== 'ALL'" class="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users class="w-4 h-4" /> Responsables
            </h3>
            <button @click="openAddModal('DIRECTORY')" class="px-5 py-2.5 bg-white border border-white text-brand-600 text-xs font-black rounded-xl shadow-sm hover:border-brand-300 hover:bg-brand-50 transition-all flex items-center gap-2 outline-none">
              <Plus class="w-3.5 h-3.5" /> Agregar Responsable
            </button>
          </div>

          <div v-if="!currentContacts.length" class="glass-panel border-dashed rounded-[2.5rem] p-12 flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-white">
              <UserX class="w-6 h-6 text-slate-400" />
            </div>
            <p class="text-base font-black text-slate-700">Sin responsables asignados</p>
            <p class="text-sm font-medium text-slate-500 mt-1 max-w-sm">Este plantel carece de responsables. Agrega un contacto para que reciba las notificaciones por defecto.</p>
          </div>

          <div v-else class="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
            <div v-for="contact in currentContacts" :key="contact.id" class="glass-panel p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all relative group">
              <div class="flex items-start gap-4">
                <PremiumAvatar :src="contact.gw?.photoUrl" :name="contact.gw?.name || contact.email" size="md" class="shrink-0 ring-2 ring-white shadow-sm bg-white" />
                
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-black text-slate-900 truncate tracking-tight">{{ contact.gw?.name || 'Sincronizando...' }}</p>
                  <p class="text-[10px] font-bold text-slate-500 truncate mt-0.5" :title="contact.email">{{ contact.email }}</p>
                  <div class="mt-3 flex gap-2 items-center flex-wrap">
                    <span class="inline-block px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase border bg-white/80 border-white text-slate-600 shadow-sm">
                      Rol: {{ contact.role }}
                    </span>
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase border shadow-sm"
                          :class="contact.channel === 'WHATSAPP' ? 'bg-casita-green-light/20 text-casita-green-dark border-casita-green/30' : 'bg-iedis-blue/10 text-iedis-blue-dark border-iedis-blue/20'">
                      <MessageCircle v-if="contact.channel === 'WHATSAPP'" class="w-3.5 h-3.5" />
                      <Mail v-else class="w-3.5 h-3.5" />
                      {{ contact.channel === 'WHATSAPP' ? 'WhatsApp' : 'Correo' }}
                    </span>
                  </div>
                  
                  <div class="mt-4 pt-3 border-t border-white/60 flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Smartphone class="w-4 h-4 text-slate-400" />
                    {{ formatPhoneDisplay(contact.gw?.phone) || 'Sin celular registrado' }}
                  </div>
                </div>
              </div>

              <div class="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button v-if="isAdmin" @click="openEditModal(contact)" class="text-slate-400 hover:text-brand-600 bg-white/80 p-2 rounded-full hover:bg-white transition-all shadow-sm border border-white focus:outline-none" title="Editar configuración">
                  <Edit2 class="w-4 h-4" />
                </button>
                <button v-if="isAdmin" @click="deleteContact(contact.id)" class="text-slate-400 hover:text-casita-red bg-white/80 p-2 rounded-full hover:bg-white transition-all shadow-sm border border-white focus:outline-none" title="Remover responsable">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Section: Reglas de Notificación -->
        <section class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Network class="w-4 h-4" /> Opciones de envío directo
            </h3>
            <button @click="openAddModal('RULE')" class="px-5 py-2.5 bg-white border border-white text-brand-600 text-xs font-black rounded-xl shadow-sm hover:border-brand-300 hover:bg-brand-50 transition-all flex items-center gap-2 outline-none">
              <Plus class="w-3.5 h-3.5" /> Agregar Regla
            </button>
          </div>

          <div v-if="!currentRules.length" class="glass-panel border-dashed rounded-[2.5rem] p-12 flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-white">
              <GitMerge class="w-6 h-6 text-slate-400" />
            </div>
            <p class="text-base font-black text-slate-700">Comportamiento estándar</p>
            <p class="text-sm font-medium text-slate-500 mt-1 max-w-sm">No existen reglas específicas de enrutamiento aquí. Los avisos fluirán hacia los responsables del plantel.</p>
          </div>

          <div v-else class="space-y-4">
            <div v-for="rule in currentRules" :key="rule.id" class="glass-panel p-6 rounded-[2rem] shadow-sm flex flex-col sm:flex-row items-center gap-6 group relative">
              
              <!-- Logical Flow Representation -->
              <div class="flex-1 flex flex-col sm:flex-row items-center gap-5 w-full">
                <!-- Condition Box -->
                <div class="flex items-center gap-4 px-6 py-4 bg-white/70 rounded-2xl border border-white flex-1 w-full sm:w-auto relative overflow-hidden shadow-sm">
                  <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-300"></div>
                  <Filter class="w-5 h-5 text-slate-400 shrink-0" />
                  <div class="flex flex-col min-w-0">
                    <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest">Aplica para el puesto</span>
                    <span class="text-sm font-black text-slate-800 truncate mt-0.5" :class="rule.condition_puesto === 'ALL' ? 'text-brand-600' : ''">
                      {{ rule.condition_puesto === 'ALL' ? 'Aplica a todos los puestos' : rule.condition_puesto }}
                    </span>
                  </div>
                </div>
                
                <ArrowRight class="hidden sm:block w-6 h-6 text-slate-300 shrink-0" />
                <ArrowDown class="sm:hidden w-6 h-6 text-slate-300 shrink-0" />

                <!-- Action Box -->
                <div class="flex items-center gap-4 px-6 py-4 rounded-2xl border flex-1 w-full sm:w-auto relative overflow-hidden shadow-sm"
                     :class="rule.channel === 'WHATSAPP' ? 'bg-casita-green-light/10 border-casita-green/20' : 'bg-iedis-blue/10 border-iedis-blue/20'">
                  <div class="absolute left-0 top-0 bottom-0 w-1.5" :class="rule.channel === 'WHATSAPP' ? 'bg-casita-green' : 'bg-iedis-blue'"></div>
                  
                  <PremiumAvatar v-if="rule.gw_photo" :src="rule.gw_photo" :name="rule.gw_name || rule.target_val" size="sm" class="shrink-0 border border-white shadow-sm bg-white" />
                  <div v-else class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border bg-white shadow-sm"
                       :class="rule.channel === 'WHATSAPP' ? 'text-casita-green border-casita-green/30' : 'text-iedis-blue border-iedis-blue/30'">
                    <User class="w-5 h-5" />
                  </div>
                  
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="text-[9px] font-black uppercase tracking-widest" :class="rule.channel === 'WHATSAPP' ? 'text-casita-green-dark' : 'text-iedis-blue-dark'">Destinatario</span>
                      <span class="text-[9px] font-black tracking-widest px-2 rounded-md uppercase border bg-white/60 shadow-sm"
                            :class="rule.channel === 'WHATSAPP' ? 'text-casita-green-dark border-casita-green/30' : 'text-iedis-blue-dark border-iedis-blue/30'">
                        {{ rule.channel === 'WHATSAPP' ? 'WA' : 'Mail' }}
                      </span>
                    </div>
                    <p class="text-sm font-black truncate" :class="rule.channel === 'WHATSAPP' ? 'text-casita-green-dark' : 'text-iedis-blue-dark'" :title="rule.gw_name || rule.target_val">
                      {{ rule.gw_name || rule.target_val }}
                    </p>
                  </div>
                </div>
              </div>

              <button @click="deleteRule(rule.id)" class="text-slate-400 hover:text-casita-red p-3 rounded-xl hover:bg-white transition-colors focus:outline-none opacity-100 sm:opacity-0 group-hover:opacity-100 shrink-0 absolute top-4 right-4 sm:static sm:top-auto sm:right-auto border border-white shadow-sm bg-white/80 backdrop-blur-md" title="Eliminar regla">
                <Trash2 class="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>

    <!-- Interactive Backdrops -->
    <div v-if="uiState.showPuesto" @click="uiState.showPuesto = false" class="fixed inset-0 z-40"></div>

    <!-- Unified Modal for Directory/Rule Linkage & Editing -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div class="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-white/50 relative">
        <header class="px-8 py-6 border-b border-white/60 bg-white/40 relative">
          <div>
            <h3 class="text-xl font-black text-slate-900 tracking-tight">
              {{ 
                modalType === 'DIRECTORY' ? 'Agregar Responsable' : 
                modalType === 'EDIT_DIRECTORY' ? 'Configurar Destinatario' : 
                'Agregar Regla Específica'
              }}
            </h3>
            <p class="text-xs font-bold text-slate-500 mt-1">Plantel: <span class="text-brand-600">{{ form.plantel === 'ALL' ? 'Toda la institución' : form.plantel }}</span></p>
          </div>
          <button @click="closeModal" class="absolute right-8 top-8 text-slate-400 hover:text-slate-700 bg-white shadow-sm hover:shadow-md p-2.5 rounded-full transition-all focus:outline-none border border-slate-100">
            <X class="w-5 h-5" />
          </button>
        </header>

        <form @submit.prevent="submitForm" id="linkageForm" class="p-8 space-y-8 bg-slate-50/30 overflow-y-auto max-h-[70vh] custom-scrollbar">
          
          <!-- Only for Rules: Puesto selection -->
          <div v-if="modalType === 'RULE'" class="space-y-3 relative z-50">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Aplica para el puesto</label>
            <div class="w-full px-5 py-4 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm cursor-pointer flex items-center justify-between group hover:border-brand-300 transition-all shadow-sm" @click="uiState.showPuesto = true">
              <span class="text-sm font-bold text-slate-800 truncate">{{ form.puesto === 'ALL' ? 'Aplica a todos los puestos' : form.puesto }}</span>
              <ChevronDown class="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-transform" :class="{'rotate-180': uiState.showPuesto}" />
            </div>
            <div v-if="uiState.showPuesto" class="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-white rounded-[1.5rem] shadow-2xl z-50 overflow-hidden max-h-64 flex flex-col">
              <div class="p-4 border-b border-slate-100 bg-slate-50/50">
                <input v-model="uiState.searchPuesto" ref="puestoInput" placeholder="Buscar catálogo..." class="w-full px-4 py-3 bg-white border border-slate-200/80 rounded-xl text-sm font-bold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 shadow-sm" />
              </div>
              <div class="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-1">
                <button type="button" @click="selectPuesto('ALL')" class="w-full text-left px-4 py-3 rounded-xl text-sm font-black text-brand-600 hover:bg-brand-50 transition-colors">
                  Aplica a todos los puestos
                </button>
                <button type="button" v-for="p in (filteredPuestos || [])" :key="p" @click="selectPuesto(p)" class="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                  {{ p }}
                </button>
                <p v-if="!filteredPuestos.length" class="text-center text-xs text-slate-400 py-6 font-bold">Sin coincidencias.</p>
              </div>
            </div>
          </div>

          <!-- WS User Identity Search -->
          <div v-if="modalType !== 'EDIT_DIRECTORY'" class="space-y-3 relative">
            <label class="block text-[11px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
              <Search class="w-3 h-3" /> Seleccionar destinatario (Workspace)
            </label>
            <input v-model="gwSearchQuery" @input="searchGw" placeholder="Nombre o correo institucional..." class="w-full px-5 py-4 rounded-2xl border border-brand-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold shadow-sm transition-all bg-white" autocomplete="off" />
            
            <div v-if="gwResults.length" class="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-white shadow-2xl rounded-[1.5rem] z-50 max-h-64 overflow-y-auto custom-scrollbar p-2">
              <button type="button" v-for="res in (gwResults || [])" :key="res.email" @click="selectGw(res)" class="w-full text-left px-4 py-3 hover:bg-brand-50 rounded-xl flex items-center gap-4 transition-colors group">
                 <img v-if="res.photoUrl" :src="res.photoUrl" class="w-10 h-10 rounded-full border border-white shadow-sm object-cover" />
                 <div v-else class="w-10 h-10 rounded-full bg-slate-100 border border-white shadow-sm flex items-center justify-center font-black text-slate-400 text-sm group-hover:bg-brand-100 group-hover:text-brand-600">{{ res.name.slice(0,2).toUpperCase() }}</div>
                 <div class="flex-1 min-w-0">
                   <p class="text-sm font-black text-slate-900 truncate">{{ res.name }}</p>
                   <p class="text-[10px] font-bold text-slate-500 truncate">{{ res.email }}</p>
                 </div>
              </button>
            </div>
          </div>
          
          <!-- Selected Identity Locked Block -->
          <div v-if="form.email" class="p-5 bg-casita-green-light/10 border border-casita-green/30 rounded-3xl flex items-center gap-4 shadow-sm animate-in zoom-in-95">
            <div class="w-14 h-14 rounded-[1.25rem] bg-white border border-casita-green/30 overflow-hidden shrink-0 shadow-sm p-1">
              <img v-if="selectedGwPhoto" :src="selectedGwPhoto" class="w-full h-full object-cover rounded-xl" />
              <div v-else class="w-full h-full flex items-center justify-center font-black text-casita-green-dark text-xl bg-casita-green/10 rounded-xl">{{ selectedGwName.slice(0,2).toUpperCase() }}</div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-base font-black text-casita-green-dark truncate">{{ selectedGwName }}</p>
              <p class="text-xs font-bold text-casita-green truncate mt-0.5">{{ form.email }}</p>
            </div>
            <button v-if="modalType !== 'EDIT_DIRECTORY'" type="button" @click="clearGw" class="text-casita-green hover:text-casita-red bg-white shadow-sm p-2.5 rounded-full transition-all focus:outline-none border border-casita-green/20 hover:border-casita-red/30">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Only for Directory: Role selection -->
          <div v-if="modalType === 'DIRECTORY' || modalType === 'EDIT_DIRECTORY'" class="space-y-3">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Nivel de responsabilidad</label>
            <select v-model="form.role" required class="w-full px-5 py-4 rounded-2xl border border-white/80 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold bg-white/70 shadow-sm transition-all cursor-pointer">
              <option value="Director">Director</option>
              <option value="Administrador">Administrador</option>
              <option value="Lead/Manager">Lead/Manager</option>
            </select>
          </div>

          <!-- Channel Selection -->
          <div class="space-y-3 pt-4 border-t border-white/60">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Canal de entrega</label>
            <div class="grid grid-cols-2 gap-4">
              <button type="button" @click="form.channel = 'EMAIL'" class="p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all outline-none"
                      :class="form.channel === 'EMAIL' ? 'border-iedis-blue bg-iedis-blue/10 text-iedis-blue-dark shadow-md' : 'border-white bg-white/60 text-slate-500 hover:border-iedis-blue/30 hover:bg-white'">
                <Mail class="w-7 h-7" :class="form.channel === 'EMAIL' ? 'text-iedis-blue' : 'text-slate-400'" />
                <span class="text-sm font-black">Correo Seguro</span>
              </button>
              <button type="button" @click="form.channel = 'WHATSAPP'" class="p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all outline-none"
                      :class="form.channel === 'WHATSAPP' ? 'border-casita-green bg-casita-green/10 text-casita-green-dark shadow-md' : 'border-white bg-white/60 text-slate-500 hover:border-casita-green/30 hover:bg-white'">
                <MessageCircle class="w-7 h-7" :class="form.channel === 'WHATSAPP' ? 'text-casita-green' : 'text-slate-400'" />
                <span class="text-sm font-black">WhatsApp API</span>
              </button>
            </div>
          </div>

          <!-- Phone capture -->
          <div class="space-y-3 p-6 bg-casita-green-light/10 rounded-3xl border border-casita-green/20 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm">
            <label class="block text-[11px] font-black text-casita-green-dark uppercase tracking-widest flex items-center gap-2">
              <Smartphone class="w-4 h-4" /> Teléfono celular
            </label>
            <div class="flex items-center shadow-sm rounded-2xl">
              <div class="bg-white/80 border border-white border-r-0 px-5 py-4 rounded-l-2xl text-casita-green-dark font-black text-sm flex items-center gap-1.5">
                +52 1
              </div>
              <input v-model="form.displayPhone" type="tel" maxlength="10" placeholder="10 dígitos..." @input="enforcePhoneDigits" class="flex-1 px-5 py-4 rounded-r-2xl border border-white focus:border-casita-green focus:ring-2 focus:ring-casita-green/20 outline-none text-sm font-black text-slate-900 transition-all bg-white/90 placeholder:text-slate-400 placeholder:font-medium" />
            </div>
            <p v-if="form.channel === 'WHATSAPP' && (!form.displayPhone || form.displayPhone.length < 10)" class="text-[10px] font-bold text-casita-gold-dark mt-2">Requerido para habilitar entrega vía WhatsApp.</p>
            <p v-else-if="form.displayPhone && form.displayPhone.length === 10" class="text-[10px] font-bold text-casita-green mt-2 flex items-center gap-1"><CheckCircle2 class="w-3.5 h-3.5" /> Formato válido para sincronización Workspace.</p>
          </div>
        </form>

        <footer class="px-8 py-6 bg-white/60 border-t border-white/80 flex items-center justify-end gap-4 rounded-b-[2.5rem]">
          <button type="button" @click="closeModal" class="px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all outline-none border border-transparent hover:border-slate-200 shadow-sm">Cancelar</button>
          
          <button type="submit" form="linkageForm" :disabled="isSaving || !isValid" class="px-8 py-3 bg-gradient-to-r from-iedis-teal to-iedis-teal-dark text-white text-sm font-black rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 outline-none disabled:opacity-70 disabled:shadow-none">
            <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
            <span>Guardar configuración</span>
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Building2, Globe, ChevronRight, ChevronDown, Filter, Users, Network, Search, X, UserX, Mail, MessageCircle, Plus, Smartphone, Trash2, Edit2, GitMerge, ArrowRight, ArrowDown, User, Loader2, CheckCircle2 } from 'lucide-vue-next'
import PremiumAvatar from '~/components/PremiumAvatar.vue'

const { user } = useAuth()
const isAdmin = computed(() => user.value?.is_admin || false)

const { data: dynamicPlanteles, pending: pendingPlanteles } = useFetch('/api/catalogs/planteles', { default: () => [] })
const { data: contacts, pending: pendingContacts, refresh: refreshContacts } = useFetch('/api/directory', { default: () => [] })
const { data: rules, pending: pendingRules, refresh: refreshRules } = useFetch('/api/routing/rules', { default: () => [] })
const { data: catalogPuestos } = useFetch('/api/catalogs/puestos', { default: () => [] })

const selectedPlantel = ref('ALL')

const currentContacts = computed(() => {
  if (selectedPlantel.value === 'ALL') return []
  return contacts.value.filter(c => c.plantel === selectedPlantel.value)
})

const currentRules = computed(() => {
  return rules.value.filter(r => r.condition_plantel === selectedPlantel.value)
})

const formatPhoneDisplay = (phoneRaw) => {
  if (!phoneRaw) return ''
  const digits = phoneRaw.replace(/\D/g, '')
  if (digits.length >= 10) {
    const num = digits.slice(-10)
    return `+52 1 ${num.slice(0,2)} ${num.slice(2,6)} ${num.slice(6)}`
  }
  return phoneRaw
}

const uiState = reactive({
  showPuesto: false,
  searchPuesto: ''
})

const filteredPuestos = computed(() => {
  const q = uiState.searchPuesto.toLowerCase()
  if (!q) return catalogPuestos.value || []
  return (catalogPuestos.value || []).filter(p => p.toLowerCase().includes(q))
})

const selectPuesto = (val) => {
  form.value.puesto = val
  uiState.showPuesto = false
  uiState.searchPuesto = ''
}

// Unified Modal Logic
const showModal = ref(false)
const modalType = ref('DIRECTORY') // 'DIRECTORY', 'EDIT_DIRECTORY', 'RULE'
const isSaving = ref(false)

const form = ref({
  id: null,
  plantel: '',
  email: '',
  role: 'Director',
  puesto: 'ALL',
  channel: 'EMAIL',
  displayPhone: ''
})

const gwSearchQuery = ref('')
const gwResults = ref([])
const selectedGwName = ref('')
const selectedGwPhoto = ref('')
let gwTimeout = null

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
    } catch(e) {
      gwResults.value = []
    }
  }, 300)
}

const selectGw = (res) => {
  form.value.email = res.email
  selectedGwName.value = res.name
  selectedGwPhoto.value = res.photoUrl
  
  let cleanPhone = ''
  if (res.phone) {
    cleanPhone = res.phone.replace(/\D/g, '')
    if (cleanPhone.startsWith('521') && cleanPhone.length >= 13) {
      cleanPhone = cleanPhone.substring(3)
    }
    if (cleanPhone.length > 10) cleanPhone = cleanPhone.substring(cleanPhone.length - 10)
  }
  form.value.displayPhone = cleanPhone

  gwSearchQuery.value = ''
  gwResults.value = []
}

const clearGw = () => {
  form.value.email = ''
  selectedGwName.value = ''
  selectedGwPhoto.value = ''
  form.value.displayPhone = ''
}

const enforcePhoneDigits = () => {
  form.value.displayPhone = form.value.displayPhone.replace(/\D/g, '').substring(0, 10)
}

const isValid = computed(() => {
  if (modalType.value === 'RULE' && !form.value.email) return false
  if ((modalType.value === 'DIRECTORY' || modalType.value === 'EDIT_DIRECTORY') && !form.value.email) return false
  if (form.value.channel === 'WHATSAPP' && form.value.displayPhone.length !== 10) return false
  return true
})

const openAddModal = (type) => {
  modalType.value = type
  form.value.id = null
  form.value.plantel = selectedPlantel.value
  form.value.email = ''
  form.value.role = 'Director'
  form.value.puesto = 'ALL'
  form.value.channel = 'EMAIL' 
  form.value.displayPhone = ''
  clearGw()
  showModal.value = true
}

const openEditModal = (contact) => {
  modalType.value = 'EDIT_DIRECTORY'
  form.value.id = contact.id
  form.value.plantel = contact.plantel
  form.value.email = contact.email
  form.value.role = contact.role
  form.value.channel = contact.channel || 'EMAIL'
  form.value.displayPhone = contact.gw?.phone ? contact.gw.phone.replace(/\D/g, '').slice(-10) : ''
  selectedGwName.value = contact.gw?.name || contact.email
  selectedGwPhoto.value = contact.gw?.photoUrl || ''
  showModal.value = true
}

const deleteContact = async (id) => {
  if (!confirm('¿Desvincular permanentemente a este responsable del plantel?')) return
  try {
    await $fetch(`/api/directory/${id}`, { method: 'DELETE' })
    refreshContacts()
  } catch (error) {
    alert(error?.data?.message || 'Error al desvincular.')
  }
}

const closeModal = () => {
  showModal.value = false
}

const submitForm = async () => {
  if (isSaving.value || !isValid.value) return
  isSaving.value = true
  
  const payload = {
    channel: form.value.channel,
    phone: form.value.displayPhone || undefined
  }

  try {
    if (modalType.value === 'EDIT_DIRECTORY') {
      await $fetch(`/api/directory/${form.value.id}`, { 
        method: 'PUT', 
        body: { ...payload, email: form.value.email, role: form.value.role } 
      })
      refreshContacts()
    } 
    else if (modalType.value === 'DIRECTORY') {
      await $fetch('/api/directory', { 
        method: 'POST', 
        body: { ...payload, plantel: form.value.plantel, email: form.value.email, role: form.value.role } 
      })
      refreshContacts()
    } else {
      await $fetch('/api/routing/rules', {
        method: 'POST',
        body: { ...payload, condition_plantel: form.value.plantel, condition_puesto: form.value.puesto, target_val: form.value.email }
      })
      refreshRules()
    }
    closeModal()
  } catch (error) {
    alert(error?.data?.message || 'Error al guardar la configuración.')
  } finally {
    isSaving.value = false
  }
}

const deleteRule = async (id) => {
  if (!confirm('¿Eliminar permanentemente esta regla de envío?')) return
  try {
    await $fetch(`/api/routing/rules/${id}`, { method: 'DELETE' })
    refreshRules()
  } catch (error) {
    alert('Error al eliminar regla.')
  }
}

onMounted(() => {
  if (!selectedPlantel.value && dynamicPlanteles.value?.length) {
    selectedPlantel.value = dynamicPlanteles.value[0]
  }
})
</script>