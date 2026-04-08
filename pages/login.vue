<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans relative overflow-hidden edu-pattern">
    
    <!-- Premium Decorative Educational Blurs -->
    <div class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-casita-green-light/20 rounded-full blur-[120px] pointer-events-none animate-breathe"></div>
    <div class="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-iedis-blue-light/20 rounded-full blur-[100px] pointer-events-none animate-breathe-slow"></div>
    <div class="absolute top-[20%] left-[60%] w-[400px] h-[400px] bg-iedis-teal/15 rounded-full blur-[100px] pointer-events-none animate-breathe" style="animation-delay: -5s;"></div>

    <div class="w-full max-w-[420px] glass-panel p-12 rounded-[3rem] shadow-2xl border border-white/80 relative z-10 text-center transition-all duration-500">
      
      <div v-if="isProcessing" class="absolute inset-0 bg-white/95 backdrop-blur-md rounded-[3rem] flex flex-col items-center justify-center z-20">
        <Loader2 class="w-10 h-10 animate-spin text-iedis-teal mb-5" />
        <span class="text-sm font-black text-inst-gray-dark tracking-tight">Validando credenciales...</span>
      </div>

      <div class="w-28 h-28 mx-auto mb-8 relative group">
        <div class="absolute inset-0 bg-gradient-to-tr from-casita-green-light/20 to-iedis-teal/20 rounded-[1.75rem] transform rotate-6 animate-pulse blur-md"></div>
        <div class="absolute inset-0 bg-white rounded-[1.75rem] shadow-xl flex items-center justify-center p-4 ring-1 ring-white/50 relative z-10">
          <img src="/pases.png" alt="Pases Digitales" class="w-full h-full object-contain" />
        </div>
      </div>
      
      <h1 class="text-3xl font-black text-inst-gray-dark mb-3 tracking-tight">Pases Digitales</h1>
      <p class="text-inst-gray text-sm font-bold mb-12 leading-relaxed">
        Acceso al sistema de gestión de incidencias.
      </p>
      
      <div class="flex justify-center min-h-[44px] mb-8">
        <div id="google-btn-container" class="w-full flex justify-center drop-shadow-sm"></div>
      </div>

      <div class="pt-8 border-t border-slate-200/60 flex justify-center opacity-50 hover:opacity-100 transition-opacity">
        <img src="/id.png" alt="Identidad Institucional" class="h-8 object-contain" />
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
  const initGoogle = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
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
            
            const redirectCookie = useCookie('auth-redirect')
            const redirect = redirectCookie.value || '/'
            redirectCookie.value = null
            
            await navigateTo(redirect, { replace: true })
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
    } else {
      setTimeout(initGoogle, 100)
    }
  }

  initGoogle()
})
</script>