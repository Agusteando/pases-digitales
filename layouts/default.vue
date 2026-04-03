<template>
  <div class="h-[100dvh] bg-[#f8fafc] flex flex-col md:flex-row text-slate-900 overflow-hidden">
    <!-- Desktop Sidebar -->
    <aside class="hidden md:flex w-20 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex-col items-center py-6 gap-6 z-40 shrink-0 shadow-[4px_0_24px_-8px_rgba(0,0,0,0.05)]">
      <div class="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg flex items-center justify-center text-white font-black text-xl hover:scale-105 transition-transform cursor-pointer">
        PD
      </div>
      
      <nav class="flex flex-col gap-4 mt-6 w-full px-3 flex-1">
        <NuxtLink to="/" class="p-3 w-full rounded-xl flex justify-center transition-all group relative" active-class="bg-slate-100 text-slate-900 shadow-inner border border-slate-200/50" :class="$route.path === '/' ? '' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'" title="Operación">
          <Plus class="w-6 h-6 group-hover:scale-110 transition-transform" />
        </NuxtLink>
        <NuxtLink to="/analytics" class="p-3 w-full rounded-xl flex justify-center transition-all group" active-class="bg-slate-100 text-slate-900 shadow-inner border border-slate-200/50" :class="$route.path === '/analytics' ? '' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'" title="Métricas">
          <PieChart class="w-6 h-6 group-hover:scale-110 transition-transform" />
        </NuxtLink>
      </nav>

      <div class="mt-auto pb-4 w-full px-3">
        <button @click="logout" class="p-3 w-full text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl flex justify-center transition-all group" title="Cerrar Sesión">
          <LogOut class="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-50">
      <slot />
    </main>

    <!-- Mobile Bottom Nav -->
    <nav class="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200/60 pb-safe pt-2 px-6 flex justify-between items-center z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      <NuxtLink to="/" class="p-3 rounded-2xl flex flex-col items-center gap-1 transition-all" active-class="text-slate-900" :class="$route.path === '/' ? '' : 'text-slate-400'">
        <Plus class="w-6 h-6" />
        <span class="text-[10px] font-bold">Emitir</span>
      </NuxtLink>
      <NuxtLink to="/analytics" class="p-3 rounded-2xl flex flex-col items-center gap-1 transition-all" active-class="text-slate-900" :class="$route.path === '/analytics' ? '' : 'text-slate-400'">
        <PieChart class="w-6 h-6" />
        <span class="text-[10px] font-bold">Métricas</span>
      </NuxtLink>
      <button @click="logout" class="p-3 rounded-2xl flex flex-col items-center gap-1 text-slate-400 transition-all hover:text-red-600">
        <LogOut class="w-6 h-6" />
        <span class="text-[10px] font-bold">Salir</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { Plus, PieChart, LogOut } from 'lucide-vue-next'
const { logout } = useAuth()
</script>