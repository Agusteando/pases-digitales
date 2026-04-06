<template>
  <div class="p-6 md:p-10 max-w-[1600px] mx-auto h-full flex flex-col relative z-10">
    
    <header class="mb-8 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Configurar Notificaciones</h1>
        <p class="text-slate-500 mt-2 text-sm font-bold">Gestión de canales y reglas de distribución por plantel.</p>
      </div>
    </header>

    <div v-if="pendingContacts || pendingRules || pendingPlanteles" class="flex-1 flex items-center justify-center">
      <Loader2 class="w-12 h-12 animate-spin text-brand-600" />
    </div>

    <div v-else class="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
      
      <!-- Left Sidebar: Planteles List -->
      <aside class="w-full lg:w-72 xl:w-80 flex flex-col shrink-0 min-h-0 bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div class="p-5 border-b border-slate-200/60 bg-white">
          <h2 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Building2 class="w-4 h-4 text-brand-500" /> Planteles
          </h2>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          <button 
            @click="selectedPlantel = 'ALL'"
            class="w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all outline-none flex items-center justify-between group"
            :class="selectedPlantel === 'ALL' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'"
          >
            <div class="flex items-center gap-3">
              <Globe class="w-4 h-4" :class="selectedPlantel === 'ALL' ? 'text-brand-200' : 'text-slate-400 group-hover:text-brand-500'" />
              Nivel Institucional
            </div>
          </button>
          
          <div class="my-2 border-t border-slate-200/60 mx-4"></div>
          
          <button 
            v-for="plantel in dynamicPlanteles" :key="plantel"
            @click="selectedPlantel = plantel"
            class="w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all outline-none flex items-center justify-between group"
            :class="selectedPlantel === plantel ? 'bg-brand-50 border-brand-200 text-brand-800 shadow-sm border' : 'text-slate-600 hover:bg-slate-100 border border-transparent'"
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
            <span v-if="selectedPlantel === 'ALL'">Notificaciones a Nivel Institucional</span>
            <span v-else>Plantel: {{ selectedPlantel }}</span>
          </h2>
          <p class="text-sm font-medium text-slate-500 mt-1">
            {{ selectedPlantel === 'ALL' ? 'Reglas maestras que se evaluarán para toda la organización.' : 'Responsables y reglas específicas para este plantel.' }}
          </p>
        </div>

        <!-- Section: Responsables Base -->
        <section v-if="selectedPlantel !== 'ALL'" class="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users class="w-4 h-4" /> Responsables Base del Plantel
            </h3>
            <button @click="openAddModal('DIRECTORY')" class="px-4 py-2 bg-white border border-slate-200 text-brand-600 text-xs font-black rounded-xl shadow-sm hover:border-brand-300 hover:bg-brand-50 transition-all flex items-center gap-2 outline-none">
              <Plus class="w-3.5 h-3.5" /> Agregar Responsable
            </button>
          </div>

          <div v-if="!currentContacts.length" class="bg-white/60 border border-slate-200/80 border-dashed rounded-3xl p-10 flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <UserX class="w-6 h-6 text-slate-400" />
            </div>
            <p class="text-base font-black text-slate-700">Sin responsables asignados</p>
            <p class="text-sm font-medium text-slate-500 mt-1 max-w-sm">Este plantel carece de responsables base. Agrega un contacto para que reciba las notificaciones por defecto.</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <div v-for="contact in currentContacts" :key="contact.id" class="glass-card p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative group">
              <div class="flex items-start gap-4">
                <div class="relative shrink-0">
                  <img v-if="contact.gw?.photoUrl" :src="contact.gw.photoUrl" class="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm bg-white" />
                  <div v-else class="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-400 text-lg">
                    {{ getInitials(contact.gw?.name || contact.email) }}
                  </div>
                </div>
                
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-black text-slate-900 truncate tracking-tight">{{ contact.gw?.name || 'Sincronizando...' }}</p>
                  <p class="text-[10px] font-bold text-slate-500 truncate mt-0.5" :title="contact.email">{{ contact.email }}</p>
                  <div class="mt-2 flex gap-2 items-center flex-wrap">
                    <span class="inline-block px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase border bg-slate-50 border-slate-200 text-slate-600">
                      Rol: {{ contact.role }}
                    </span>
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase border shadow-sm"
                          :class="contact.channel === 'WHATSAPP' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-brand-50 text-brand-700 border-brand-200'">
                      <MessageCircle v-if="contact.channel === 'WHATSAPP'" class="w-3 h-3" />
                      <Mail v-else class="w-3 h-3" />
                      {{ contact.channel === 'WHATSAPP' ? 'WhatsApp' : 'Correo' }}
                    </span>
                  </div>
                </div>
              </div>

              <button v-if="isAdmin" @click="deleteContact(contact.id)" class="absolute top-4 right-4 text-slate-300 hover:text-red-600 bg-white p-2 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-slate-100 focus:outline-none" title="Remover Responsable">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        <!-- Section: Reglas de Notificación -->
        <section class="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Network class="w-4 h-4" /> Reglas Específicas
            </h3>
            <button @click="openAddModal('RULE')" class="px-4 py-2 bg-white border border-slate-200 text-brand-600 text-xs font-black rounded-xl shadow-sm hover:border-brand-300 hover:bg-brand-50 transition-all flex items-center gap-2 outline-none">
              <Plus class="w-3.5 h-3.5" /> Agregar Regla
            </button>
          </div>

          <div v-if="!currentRules.length" class="bg-white/60 border border-slate-200/80 border-dashed rounded-3xl p-10 flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <GitMerge class="w-6 h-6 text-slate-400" />
            </div>
            <p class="text-base font-black text-slate-700">Comportamiento estándar</p>
            <p class="text-sm font-medium text-slate-500 mt-1 max-w-sm">No existen reglas específicas de enrutamiento aquí. Las notificaciones fluirán hacia los Responsables Base.</p>
          </div>

          <div v-else class="space-y-4">
            <div v-for="rule in currentRules" :key="rule.id" class="glass-card p-5 rounded-3xl border border-slate-200/80 shadow-sm bg-white flex flex-col sm:flex-row items-center gap-5 group relative">
              
              <!-- Logical Flow Representation -->
              <div class="flex-1 flex flex-col sm:flex-row items-center gap-4 w-full">
                <!-- Condition Box -->
                <div class="flex items-center gap-3 px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 flex-1 w-full sm:w-auto relative overflow-hidden">
                  <div class="absolute left-0 top-0 bottom-0 w-1 bg-slate-300"></div>
                  <Filter class="w-5 h-5 text-slate-400 shrink-0" />
                  <div class="flex flex-col min-w-0">
                    <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest">Condición (Puesto)</span>
                    <span class="text-sm font-black text-slate-800 truncate mt-0.5" :class="rule.condition_puesto === 'ALL' ? 'text-brand-600' : ''">
                      {{ rule.condition_puesto === 'ALL' ? 'Aplica a todos los puestos' : rule.condition_puesto }}
                    </span>
                  </div>
                </div>
                
                <ArrowRight class="hidden sm:block w-6 h-6 text-slate-300 shrink-0" />
                <ArrowDown class="sm:hidden w-6 h-6 text-slate-300 shrink-0" />

                <!-- Action Box -->
                <div class="flex items-center gap-4 px-5 py-4 rounded-2xl border flex-1 w-full sm:w-auto relative overflow-hidden"
                     :class="rule.channel === 'WHATSAPP' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-brand-50/50 border-brand-100'">
                  <div class="absolute left-0 top-0 bottom-0 w-1" :class="rule.channel === 'WHATSAPP' ? 'bg-emerald-500' : 'bg-brand-500'"></div>
                  
                  <div v-if="rule.gw_photo" class="w-10 h-10 rounded-xl border-2 border-white shadow-sm shrink-0 overflow-hidden bg-white">
                    <img :src="rule.gw_photo" class="w-full h-full object-cover" />
                  </div>
                  <div v-else class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border"
                       :class="rule.channel === 'WHATSAPP' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-brand-100 text-brand-600 border-brand-200'">
                    <User class="w-5 h-5" />
                  </div>
                  
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="text-[9px] font-black uppercase tracking-widest" :class="rule.channel === 'WHATSAPP' ? 'text-emerald-600' : 'text-brand-600'">Destinatario Específico</span>
                      <span class="text-[9px] font-black tracking-widest px-1.5 rounded uppercase border"
                            :class="rule.channel === 'WHATSAPP' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-brand-100 text-brand-700 border-brand-200'">
                        {{ rule.channel === 'WHATSAPP' ? 'WA' : 'Mail' }}
                      </span>
                    </div>
                    <p class="text-sm font-black truncate" :class="rule.channel === 'WHATSAPP' ? 'text-emerald-900' : 'text-brand-900'" :title="rule.gw_name || rule.target_val">
                      {{ rule.gw_name || rule.target_val }}
                    </p>
                  </div>
                </div>
              </div>

              <button @click="deleteRule(rule.id)" class="text-slate-300 hover:text-red-600 p-3 rounded-2xl hover:bg-red-50 transition-colors focus:outline-none opacity-100 sm:opacity-0 group-hover:opacity-100 shrink-0 absolute top-4 right-4 sm:static sm:top-auto sm:right-auto border border-slate-100 bg-white shadow-sm" title="Eliminar regla">
                <Trash2 class="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>

    <!-- Interactive Backdrops -->
    <div v-if="uiState.showPuesto" @click="uiState.showPuesto = false" class="fixed inset-0 z-40"></div>

    <!-- Unified Modal for Directory/Rule Linkage -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 relative">
        <header class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white relative">
          <div>
            <h3 class="text-xl font-black text-slate-900 tracking-tight">{{ modalType === 'DIRECTORY' ? 'Agregar Responsable' : 'Agregar Regla Específica' }}</h3>
            <p class="text-xs font-bold text-slate-500 mt-1">Plantel: <span class="text-brand-600">{{ form.plantel === 'ALL' ? 'Nivel Institucional' : form.plantel }}</span></p>
          </div>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors focus:outline-none">
            <X class="w-5 h-5" />
          </button>
        </header>

        <form @submit.prevent="submitForm" id="linkageForm" class="p-8 space-y-8 bg-slate-50/30 overflow-y-auto max-h-[70vh] custom-scrollbar">
          
          <!-- Only for Rules: Puesto selection -->
          <div v-if="modalType === 'RULE'" class="space-y-3 relative z-50">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Condición (Si el colaborador tiene el puesto)</label>
            <div class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white cursor-pointer flex items-center justify-between group hover:border-brand-300 transition-colors shadow-sm" @click="uiState.showPuesto = true">
              <span class="text-sm font-bold text-slate-800 truncate">{{ form.puesto === 'ALL' ? 'Aplica a todos los puestos' : form.puesto }}</span>
              <ChevronDown class="w-4 h-4 text-slate-400 group-hover:text-brand-500" />
            </div>
            <div v-if="uiState.showPuesto" class="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 flex flex-col">
              <div class="p-3 border-b border-slate-100 bg-slate-50/50">
                <input v-model="uiState.searchPuesto" ref="puestoInput" placeholder="Buscar catálogo..." class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              </div>
              <div class="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-1">
                <button type="button" @click="selectPuesto('ALL')" class="w-full text-left px-3 py-2.5 rounded-xl text-sm font-black text-brand-600 hover:bg-brand-50 transition-colors">
                  Aplica a todos los puestos
                </button>
                <button type="button" v-for="p in filteredPuestos" :key="p" @click="selectPuesto(p)" class="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                  {{ p }}
                </button>
                <p v-if="!filteredPuestos.length" class="text-center text-xs text-slate-400 py-4 font-bold">Sin coincidencias.</p>
              </div>
            </div>
          </div>

          <!-- WS User Identity Search -->
          <div class="space-y-3 relative">
            <label class="block text-[11px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-2">
              <Search class="w-3 h-3" /> Seleccionar Destinatario (Workspace)
            </label>
            <input v-model="gwSearchQuery" @input="searchGw" placeholder="Nombre o correo institucional..." class="w-full px-4 py-3 rounded-xl border border-brand-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold shadow-sm transition-all bg-white" autocomplete="off" />
            
            <div v-if="gwResults.length" class="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar py-2">
              <button type="button" v-for="res in gwResults" :key="res.email" @click="selectGw(res)" class="w-full text-left px-5 py-3 hover:bg-brand-50 border-b border-slate-50 flex items-center gap-4 last:border-0 transition-colors group">
                 <img v-if="res.photoUrl" :src="res.photoUrl" class="w-10 h-10 rounded-full border border-slate-200 object-cover" />
                 <div v-else class="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-400 text-sm group-hover:bg-brand-100 group-hover:text-brand-600">{{ res.name.slice(0,2).toUpperCase() }}</div>
                 <div class="flex-1 min-w-0">
                   <p class="text-sm font-black text-slate-900 truncate">{{ res.name }}</p>
                   <p class="text-[10px] font-bold text-slate-500 truncate">{{ res.email }}</p>
                 </div>
              </button>
            </div>
            
            <div v-if="form.email" class="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4 shadow-sm animate-in zoom-in-95">
              <div class="w-12 h-12 rounded-xl bg-white border border-emerald-200 overflow-hidden shrink-0 shadow-sm">
                <img v-if="selectedGwPhoto" :src="selectedGwPhoto" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center font-black text-emerald-500 text-lg">{{ selectedGwName.slice(0,2).toUpperCase() }}</div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-black text-emerald-900 truncate">{{ selectedGwName }}</p>
                <p class="text-xs font-bold text-emerald-700 truncate mt-0.5">{{ form.email }}</p>
              </div>
              <button type="button" @click="clearGw" class="text-emerald-500 hover:text-red-600 hover:bg-white p-2 rounded-full transition-colors focus:outline-none shadow-sm">
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <!-- Only for Directory: Role selection -->
          <div v-if="modalType === 'DIRECTORY'" class="space-y-3">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Nivel de Responsabilidad</label>
            <select v-model="form.role" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold bg-white shadow-sm transition-all">
              <option value="Director">Director</option>
              <option value="Administrador">Administrador</option>
              <option value="Lead/Manager">Lead/Manager</option>
            </select>
          </div>

          <!-- Channel Selection -->
          <div class="space-y-3 pt-2 border-t border-slate-100">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Canal de Entrega</label>
            <div class="grid grid-cols-2 gap-3">
              <button type="button" @click="form.channel = 'EMAIL'" class="p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all outline-none"
                      :class="form.channel === 'EMAIL' ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-brand-200 hover:bg-slate-50'">
                <Mail class="w-6 h-6" :class="form.channel === 'EMAIL' ? 'text-brand-600' : 'text-slate-400'" />
                <span class="text-xs font-black">Correo Seguro</span>
              </button>
              <button type="button" @click="form.channel = 'WHATSAPP'" class="p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all outline-none"
                      :class="form.channel === 'WHATSAPP' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:bg-slate-50'">
                <MessageCircle class="w-6 h-6" :class="form.channel === 'WHATSAPP' ? 'text-emerald-600' : 'text-slate-400'" />
                <span class="text-xs font-black">WhatsApp API</span>
              </button>
            </div>
          </div>

          <!-- Mandatory Phone check if WHATSAPP is selected -->
          <div v-if="form.channel === 'WHATSAPP'" class="space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-200/80 animate-in fade-in slide-in-from-top-4 duration-300">
            <label class="block text-[11px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
              <Smartphone class="w-3.5 h-3.5" /> Número de Teléfono
            </label>
            <div class="flex items-center">
              <div class="bg-emerald-100 border border-emerald-200 border-r-0 px-4 py-3 rounded-l-xl text-emerald-800 font-black text-sm flex items-center gap-1.5 shadow-sm">
                +52 1
              </div>
              <input v-model="form.displayPhone" type="tel" maxlength="10" placeholder="10 dígitos..." @input="enforcePhoneDigits" class="flex-1 px-4 py-3 rounded-r-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-black text-slate-900 shadow-sm transition-all bg-white placeholder:text-slate-400 placeholder:font-medium" />
            </div>
            <p v-if="!form.displayPhone || form.displayPhone.length < 10" class="text-[10px] font-bold text-amber-600">Requerido para la ruta de entrega vía WhatsApp.</p>
            <p v-else class="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 class="w-3 h-3" /> Formato válido para sincronización Workspace.</p>
          </div>

        </form>

        <footer class="px-8 py-5 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
          <button type="button" @click="closeModal" class="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none border border-transparent hover:border-slate-200">Cancelar</button>
          <button type="submit" form="linkageForm" :disabled="isSaving || !isValid" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-black rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 outline-none disabled:opacity-70">
            <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
            <span>{{ modalType === 'DIRECTORY' ? 'Vincular Responsable' : 'Guardar Regla' }}</span>
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Building2, Globe, ChevronRight, ChevronDown, Filter, Users, Network, Search, X, UserX, Mail, MessageCircle, Plus, Smartphone, Trash2, GitMerge, ArrowRight, ArrowDown, User, Loader2, CheckCircle2 } from 'lucide-vue-next'

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

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

// Custom Selects Logic
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
const modalType = ref('DIRECTORY') // 'DIRECTORY' or 'RULE'
const isSaving = ref(false)

const form = ref({
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
  
  // Clean phone logic for the input mask
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
  if (!form.value.email) return false
  if (form.value.channel === 'WHATSAPP' && form.value.displayPhone.length !== 10) return false
  return true
})

const openAddModal = (type) => {
  modalType.value = type
  form.value.plantel = selectedPlantel.value
  form.value.email = ''
  form.value.role = 'Director'
  form.value.puesto = 'ALL'
  form.value.channel = 'EMAIL'
  form.value.displayPhone = ''
  clearGw()
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const submitForm = async () => {
  if (isSaving.value || !isValid.value) return
  isSaving.value = true
  
  const payload = {
    channel: form.value.channel,
    phone: form.value.channel === 'WHATSAPP' ? form.value.displayPhone : undefined
  }

  try {
    if (modalType.value === 'DIRECTORY') {
      await $fetch('/api/directory', { 
        method: 'POST', 
        body: { 
          ...payload, 
          plantel: form.value.plantel, 
          email: form.value.email, 
          role: form.value.role 
        } 
      })
      refreshContacts()
    } else {
      await $fetch('/api/routing/rules', {
        method: 'POST',
        body: {
          ...payload,
          condition_plantel: form.value.plantel,
          condition_puesto: form.value.puesto,
          target_val: form.value.email
        }
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

const deleteContact = async (id) => {
  if (!confirm('¿Desvincular permanentemente este responsable del plantel?')) return
  try {
    await $fetch(`/api/directory/${id}`, { method: 'DELETE' })
    refreshContacts()
  } catch (error) {
    alert(error?.data?.message || 'Error al desvincular.')
  }
}

const deleteRule = async (id) => {
  if (!confirm('¿Eliminar permanentemente esta regla de notificación?')) return
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