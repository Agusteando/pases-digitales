<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-brand-50 p-6 font-sans relative overflow-hidden">
    
    <!-- Decorative Blurs -->
    <div class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-200/50 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="w-full max-w-sm glass-card bg-white/80 p-10 rounded-3xl shadow-xl border border-white relative z-10 text-center transition-all duration-500">
      
      <div v-if="isProcessing" class="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-20">
        <Loader2 class="w-8 h-8 animate-spin text-brand-600 mb-4" />
        <span class="text-sm font-bold text-slate-800 tracking-tight">Validando credenciales...</span>
      </div>

      <div class="w-20 h-20 bg-gradient-to-br from-brand-600 to-indigo-800 rounded-2xl shadow-lg shadow-brand-500/30 flex items-center justify-center text-white font-black text-3xl mx-auto mb-8 select-none ring-4 ring-brand-50">
        PD
      </div>
      
      <h1 class="text-3xl font-black text-slate-900 mb-3 tracking-tight">Pases Digitales</h1>
      <p class="text-slate-500 text-sm font-medium mb-10 leading-relaxed">
        Accede con tu cuenta institucional para generar y administrar pases.
      </p>
      
      <div class="flex justify-center min-h-[44px]">
        <div id="google-btn-container" class="w-full flex justify-center drop-shadow-sm"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const config = useRuntimeConfig()
const isProcessing = ref(false)

definePageMeta({ layout: false })

onMounted(() => {
  if (window.google) {
    window.google.accounts.id.initialize({
      client_id: config.public.googleClientIdPublic,
      callback: async (response) => {
        isProcessing.value = true
        try {
          await $fetch('/api/auth/login', {
            method: 'POST',
            body: { credential: response.credential }
          })
          const { fetchUser } = useAuth()
          await fetchUser()
          await navigateTo('/', { replace: true })
        } catch (error) {
          console.error('Auth error:', error)
          isProcessing.value = false
        }
      }
    })
    
    window.google.accounts.id.renderButton(
      document.getElementById('google-btn-container'),
      { theme: 'outline', size: 'large', width: 280, text: 'continue_with', shape: 'pill' }
    )
  }
})
</script>