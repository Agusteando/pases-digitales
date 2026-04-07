<template>
  <!-- Root container maintains size classes and acts as hover trigger/ref -->
  <div class="relative inline-flex items-center justify-center isolate group select-none" :class="[sizeClasses, $attrs.class]" ref="containerRef">
    
    <!-- Clipping Wrapper: replaces the previous overflow-hidden on the root -->
    <div class="absolute inset-0 overflow-hidden rounded-[inherit] z-0">
      
      <!-- Ambient Loading State / Background Shell -->
      <div class="absolute inset-0 bg-slate-50/80 rounded-[inherit]">
        <div v-if="isProcessing" class="absolute inset-0 bg-gradient-to-tr from-brand-100/40 via-slate-100 to-indigo-100/40 animate-pulse"></div>
      </div>
      
      <!-- Aura Layer (A softly blurred multiplied clone that creates the premium glow from the image's own colors) -->
      <img 
        v-if="activeSrc" 
        :src="activeSrc" 
        class="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-125 rounded-[inherit] mix-blend-multiply transition-opacity duration-700 pointer-events-none" 
        aria-hidden="true" 
      />
      
      <!-- Core Image Layer -->
      <img 
        v-if="activeSrc" 
        :src="activeSrc" 
        class="relative z-10 w-full h-full object-cover rounded-[inherit] transition-all duration-700 ease-out" 
        :class="{'opacity-0 scale-90': isProcessing, 'opacity-100 scale-100': !isProcessing}" 
        :style="!usedCanvas ? 'object-position: center 15%;' : ''" 
        :alt="name" 
      />

      <!-- Fallback Initials Layer -->
      <div 
        v-else-if="!isProcessing" 
        class="relative z-10 w-full h-full rounded-[inherit] bg-gradient-to-br from-brand-50 to-indigo-100 flex items-center justify-center font-black text-brand-600 shadow-inner border border-brand-200/50" 
        :class="textClass"
      >
        {{ initials }}
      </div>

      <!-- Eye Follow Layers -->
      <div v-if="activeSrc && activeEyeData && !isProcessing" class="absolute inset-0 z-15 pointer-events-none rounded-[inherit] overflow-hidden">
        <img v-for="(eye, i) in activeEyeData" :key="i"
             :ref="el => setEyeRef(el)"
             :src="eye.src"
             class="absolute origin-center will-change-transform"
             :style="{ left: eye.left, top: eye.top, width: eye.sizePercent, height: eye.sizePercent }"
             style="transform: translate(-50%, -50%);"
             aria-hidden="true" />
      </div>

      <!-- Inner Glass / Lighting Ring -->
      <div class="absolute inset-0 z-20 rounded-[inherit] border border-white/60 shadow-[inset_0_2px_8px_rgba(255,255,255,0.7),inset_0_-1px_3px_rgba(0,0,0,0.04)] pointer-events-none transition-all"></div>

      <!-- Pipeline Debug Overlay Bounds (Only visible when DEBUG_FACE is true) -->
      <div v-if="isDebug && !isProcessing" class="absolute inset-0 z-50 pointer-events-none">
        
        <!-- Safe Face Detection Bounds -->
        <div v-if="debugInfo.faceRect" class="absolute border border-red-500/80 bg-red-500/10" 
             :style="{ left: debugInfo.faceRect.left + '%', top: debugInfo.faceRect.top + '%', width: debugInfo.faceRect.width + '%', height: debugInfo.faceRect.height + '%' }">
        </div>

        <!-- Eye Boxes -->
        <div v-for="(eye, i) in debugInfo.eyeRects" :key="'eye'+i" 
             class="absolute border border-yellow-400/80 bg-yellow-400/20 shadow-sm" 
             :style="{ left: eye.left + '%', top: eye.top + '%', width: eye.width + '%', height: eye.height + '%' }">
        </div>
      </div>
    </div>

    <!-- Interactive Hover Tooltip that breaks out of the overflow clipping mask -->
    <div v-if="isDebug && !isProcessing" 
         class="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-[100] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 scale-95 group-hover:scale-100 flex justify-center">
      
      <div class="w-56 bg-slate-900/95 backdrop-blur-md text-slate-200 text-xs font-mono p-4 rounded-2xl shadow-2xl select-text cursor-auto border border-slate-700/80">
        <div class="font-black text-brand-400 mb-3 uppercase tracking-widest text-[10px] flex items-center justify-between">
          <span>Vision API Debug</span>
        </div>
        
        <div class="space-y-2">
          <div class="flex justify-between border-b border-slate-700/50 pb-1.5">
            <span class="text-slate-400">Face</span>
            <span :class="debugInfo.faceOK ? 'text-emerald-400' : 'text-red-400'">
              {{ debugInfo.faceOK ? 'OK' : 'FAIL' }}
              <span v-if="debugInfo.faceConf" class="text-[9px] opacity-70">({{ Math.round(debugInfo.faceConf * 100) }}%)</span>
            </span>
          </div>
          
          <div class="flex justify-between border-b border-slate-700/50 pb-1.5">
            <span class="text-slate-400">Eyes</span>
            <span :class="debugInfo.eyesOK ? 'text-emerald-400' : 'text-amber-400'">
              {{ debugInfo.eyesOK ? 'OK' : 'SKIP' }}
              <span v-if="debugInfo.eyeConf" class="text-[9px] opacity-70">({{ Math.round(debugInfo.eyeConf * 100) }}%)</span>
            </span>
          </div>
          
          <div class="flex flex-col border-b border-slate-700/50 pb-1.5">
            <span class="text-slate-400 mb-1">Background</span>
            <span class="text-[10px] leading-relaxed break-words" :class="debugInfo.bgStatus === 'REMOVED' || debugInfo.bgStatus === 'MASK_READY' ? 'text-emerald-400' : 'text-amber-400'">
              {{ debugInfo.bgStatus }}
            </span>
          </div>
          
          <div class="flex justify-between">
            <span class="text-slate-400">Follow Fx</span>
            <span :class="debugInfo.followActive ? 'text-emerald-400' : 'text-slate-500'">{{ debugInfo.followActive ? 'ACTIVE' : 'OFF' }}</span>
          </div>
        </div>
        
        <div class="mt-3 pt-2 border-t border-slate-700/80 text-[9px] text-slate-500 text-center uppercase tracking-widest font-sans">
          Select text to copy
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUpdate, onUnmounted } from 'vue'
import { useRuntimeConfig } from '#imports'

const props = defineProps({
  src: { type: String, default: null },
  name: { type: String, default: 'User' },
  size: { type: String, default: 'lg' } // sm, md, lg
})

const config = useRuntimeConfig()
const isDebug = computed(() => config.public?.debugFace === true)

const sizeClasses = computed(() => {
  if (props.size === 'sm') return 'w-10 h-10 rounded-full'
  if (props.size === 'md') return 'w-14 h-14 rounded-2xl'
  return 'w-20 h-20 rounded-[1.25rem] md:w-24 md:h-24 md:rounded-3xl' // lg
})

const textClass = computed(() => {
  if (props.size === 'sm') return 'text-xs'
  if (props.size === 'md') return 'text-lg'
  return 'text-2xl'
})

const initials = computed(() => {
  if (!props.name) return '?'
  const parts = props.name.trim().split(' ')
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : props.name.slice(0, 2).toUpperCase()
})

const activeSrc = ref(null)
const activeEyeData = ref(null)
const isProcessing = ref(false)
const usedCanvas = ref(false)

const debugInfo = ref({
  faceOK: false,
  faceConf: null,
  eyesOK: false,
  eyeConf: null,
  bgStatus: 'PENDING',
  followActive: false,
  faceRect: null,
  eyeRects: []
})

// Hardware-accelerated pointer tracking system
const containerRef = ref(null)
let eyeDOMElements = []
let targetShift = { x: 0, y: 0 }
let currentShift = { x: 0, y: 0 }
let rafId = null

onBeforeUpdate(() => {
  eyeDOMElements = []
})

const setEyeRef = (el) => {
  if (el) eyeDOMElements.push(el)
}

const updateLoop = () => {
  if (eyeDOMElements.length > 0) {
    const dx = targetShift.x - currentShift.x
    const dy = targetShift.y - currentShift.y
    
    // Only execute DOM manipulations if the visual change is perceptible to save CPU
    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
      // Lerp logic creates an organic spring-like physics drag on the eyeball
      currentShift.x += dx * 0.12
      currentShift.y += dy * 0.12
      
      const transformStr = `translate(calc(-50% + ${currentShift.x}px), calc(-50% + ${currentShift.y}px))`
      for (let i = 0; i < eyeDOMElements.length; i++) {
        eyeDOMElements[i].style.transform = transformStr
      }
    }
  }
  rafId = requestAnimationFrame(updateLoop)
}

const handleMouseMove = (e) => {
  if (eyeDOMElements.length === 0 || !containerRef.value) return
  
  const rect = containerRef.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  
  const dx = e.clientX - centerX
  const dy = e.clientY - centerY
  
  const dist = Math.sqrt(dx * dx + dy * dy)
  const maxDist = window.innerWidth > 800 ? 800 : 400
  const intensity = Math.min(dist / maxDist, 1)
  const easeIntensity = intensity * (2 - intensity)
  
  // Cap extreme movements rigidly (2.5% of total avatar width) to preserve anatomy
  const maxMove = rect.width * 0.025
  
  const angle = Math.atan2(dy, dx)
  targetShift.x = Math.cos(angle) * easeIntensity * maxMove
  targetShift.y = Math.sin(angle) * easeIntensity * maxMove
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove, { passive: true })
  rafId = requestAnimationFrame(updateLoop)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
})

// Global memory cache to keep UI lighting-fast during navigation
const globalImageCache = new Map()

// Safe cross-origin image loader
function loadImage(url, useCors) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (useCors) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })
}

async function processPremiumImage(url) {
  if (!url) {
    activeSrc.value = null
    activeEyeData.value = null
    return
  }

  const visionBase = config.public.visionApiBaseUrl || 'https://vision.casitaapps.com'

  debugInfo.value = { faceOK: false, faceConf: null, eyesOK: false, eyeConf: null, bgStatus: 'PENDING', followActive: false, faceRect: null, eyeRects: [] }

  // Ensure full URL formatting
  let fullUrl = url
  if (!fullUrl.startsWith('http') && !fullUrl.startsWith('data:')) {
    fullUrl = `https://signia.casitaapps.com/${url.replace(/^\//, '')}`
  }

  if (globalImageCache.has(fullUrl)) {
    const cached = globalImageCache.get(fullUrl)
    activeSrc.value = cached.src
    usedCanvas.value = cached.usedCanvas
    activeEyeData.value = cached.eyeData || null
    if (cached.debugInfo) debugInfo.value = cached.debugInfo
    return
  }

  isProcessing.value = true

  try {
    const formData = new FormData()
    formData.append('imageUrl', fullUrl)

    // Call external vision service for authoritative analysis
    const analyzeRes = await fetch(`${visionBase}/analyze`, {
      method: 'POST',
      body: formData
    }).catch(() => null)

    let data = null
    if (analyzeRes && analyzeRes.ok) {
      data = await analyzeRes.json()
    }

    if (!data || !data.ok) {
       throw new Error('Vision service failed or returned not-ok')
    }

    // Populate debug stats directly from service response
    debugInfo.value.faceOK = !!data.faceDetected
    debugInfo.value.faceConf = data.faceConfidence || null
    debugInfo.value.eyesOK = !!data.eyesDetected
    debugInfo.value.eyeConf = data.eyeConfidence || null
    debugInfo.value.bgStatus = data.backgroundRemoved ? 'REMOVED' : (data.maskAvailable ? 'MASK_READY' : 'SKIP')

    // Safe retrieval of the original image from the vision proxy to avoid client CORS constraints
    const safeImgUrl = `${visionBase}/image/${data.imageKey}`
    const img = await loadImage(safeImgUrl, true)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    // 1. Precise Cropping driven by server AI
    let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height
    if (data.cropBox) {
      sx = data.cropBox.x
      sy = data.cropBox.y
      sWidth = data.cropBox.width
      sHeight = data.cropBox.height
    }

    // Limit canvas compute dimensions to prevent blocking the main thread (max 256px resolution)
    const maxRes = 256
    const scale = Math.min(1, maxRes / sWidth, maxRes / sHeight)
    const cWidth = Math.floor(sWidth * scale)
    const cHeight = Math.floor(sHeight * scale)
    
    canvas.width = cWidth
    canvas.height = cHeight
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cWidth, cHeight)

    // Debug mapping for Face Overlay
    if (data.faceBox) {
       debugInfo.value.faceRect = {
         left: ((data.faceBox.x - sx) / sWidth) * 100,
         top: ((data.faceBox.y - sy) / sHeight) * 100,
         width: (data.faceBox.width / sWidth) * 100,
         height: (data.faceBox.height / sHeight) * 100
       }
    }

    // 2. Intelligent Background Application
    if (data.maskAvailable) {
       const maskUrl = data.maskUrl || `${visionBase}/mask/${data.imageKey}`
       const maskImg = await loadImage(maskUrl, true).catch(() => null)
       if (maskImg) {
          ctx.globalCompositeOperation = 'destination-in'
          ctx.drawImage(maskImg, sx, sy, sWidth, sHeight, 0, 0, cWidth, cHeight)
          ctx.globalCompositeOperation = 'source-over'
       } else {
          debugInfo.value.bgStatus = 'MASK_LOAD_FAIL'
       }
    }

    // 3. Eye Topology extraction for premium illusion
    let patches = null
    if (data.eyesDetected && data.eyeBoxes && data.eyeBoxes.length >= 2) {
       patches = []
       for (const eye of data.eyeBoxes.slice(0, 2)) {
          // Debug mapping for Eye Overlays
          debugInfo.value.eyeRects.push({
             left: ((eye.x - sx) / sWidth) * 100,
             top: ((eye.y - sy) / sHeight) * 100,
             width: (eye.width / sWidth) * 100,
             height: (eye.height / sHeight) * 100
          })

          const ecx = eye.x + eye.width / 2
          const ecy = eye.y + eye.height / 2
          const cx_c = (ecx - sx) * scale
          const cy_c = (ecy - sy) * scale
          
          // 150% of the detected eye width provides a clean localized mask for the iris and eyelid
          const pSize = Math.max(12, Math.floor(eye.width * scale * 1.5))
          const pR = pSize / 2

          // Ensure eye is securely within the cropped bounds before isolating it
          if (cx_c - pR >= 0 && cy_c - pR >= 0 && cx_c + pR <= cWidth && cy_c + pR <= cHeight) {
            const eyeCanvas = document.createElement('canvas')
            eyeCanvas.width = pSize
            eyeCanvas.height = pSize
            const eyeCtx = eyeCanvas.getContext('2d', { willReadFrequently: true })
            
            eyeCtx.drawImage(canvas, cx_c - pR, cy_c - pR, pSize, pSize, 0, 0, pSize, pSize)
            
            // Multiply the crop with a soft radial mask to avoid harsh edges that cause double-vision
            eyeCtx.globalCompositeOperation = 'destination-in'
            const grad = eyeCtx.createRadialGradient(pR, pR, pR * 0.1, pR, pR, pR)
            grad.addColorStop(0, 'rgba(0,0,0,1)')
            grad.addColorStop(0.5, 'rgba(0,0,0,0.8)')
            grad.addColorStop(1, 'rgba(0,0,0,0)')
            eyeCtx.fillStyle = grad
            eyeCtx.fillRect(0, 0, pSize, pSize)
            
            patches.push({
              src: eyeCanvas.toDataURL('image/png'),
              left: `${(cx_c / cWidth) * 100}%`,
              top: `${(cy_c / cHeight) * 100}%`,
              sizePercent: `${(pSize / cWidth) * 100}%`
            })
          }
       }
       
       // Safety reset: if one eye fails bounds, kill the illusion to preserve realism
       if (patches.length === 2) {
         debugInfo.value.followActive = true
       } else {
         patches = null
       }
    }

    const processedDataUrl = canvas.toDataURL('image/png')
    
    globalImageCache.set(fullUrl, { src: processedDataUrl, usedCanvas: true, eyeData: patches, debugInfo: { ...debugInfo.value } })
    activeSrc.value = processedDataUrl
    usedCanvas.value = true
    activeEyeData.value = patches

  } catch (e) {
    debugInfo.value.faceOK = false
    debugInfo.value.bgStatus = 'FAIL_FALLBACK'
    
    // 4. Graceful fallback: If external analysis drops, just map the raw image
    globalImageCache.set(fullUrl, { src: fullUrl, usedCanvas: false, eyeData: null, debugInfo: { ...debugInfo.value } })
    activeSrc.value = fullUrl
    usedCanvas.value = false
    activeEyeData.value = null
  } finally {
    isProcessing.value = false
  }
}

watch(() => props.src, (newSrc) => {
  processPremiumImage(newSrc)
}, { immediate: true })
</script>