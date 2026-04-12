<template>
  <!-- 
    CONTENEDOR RAÍZ
    Aislado y con OVERFLOW HIDDEN estricto. Absolutamente nada puede escapar 
    de los límites físicos (círculo o rectángulo redondeado) del avatar.
  -->
  <div
    class="relative inline-flex items-center justify-center isolate group select-none overflow-hidden"
    :class="[sizeClasses, $attrs.class]"
    ref="containerRef"
  >
    
    <!-- ========================================================= -->
    <!-- CAPA 1: FONDO BASE (El cristal suave detrás del retrato)  -->
    <!-- ========================================================= -->
    <div 
      class="absolute inset-0 rounded-[inherit] z-0 bg-gradient-to-b from-white/50 to-white/10 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-white/60"
    >
      <img
        v-if="baseSrc"
        :src="baseSrc"
        class="w-full h-full object-cover transition-all duration-1000 ease-in-out"
        :class="enhancedSrc ? 'opacity-0 scale-105 filter blur-sm' : 'opacity-100 scale-100 filter blur-0'"
        style="object-position: center 15%;"
        :alt="name"
      />
      <div
        v-else-if="!isProcessing"
        class="w-full h-full bg-gradient-to-br from-slate-50 to-slate-200/50 flex items-center justify-center font-black text-slate-400 shadow-[inset_0_2px_8px_rgba(255,255,255,0.8)]"
        :class="textClass"
      >
        {{ initials }}
      </div>
    </div>


    <!-- ========================================================= -->
    <!-- CAPA 2: AURA DEFINIDA Y ESTRUCTURADA (Main Event)         -->
    <!-- ========================================================= -->
    <!-- 
      Máscara lineal conservada para evitar cortes rectos arriba, 
      pero calibrada al 85% para no devorar la silueta de los hombros/cabeza.
    -->
    <div 
      v-if="enhancedSrc && !isProcessing" 
      class="absolute inset-0 z-[5] pointer-events-none animate-aura-fade-in aura-container"
    >
      <!-- Premium 1: Heat Shimmer (Vibración térmica perimetral) -->
      <img 
        :src="enhancedSrc" 
        class="absolute inset-0 w-full h-full object-cover aura-shimmer" 
        style="object-position: center 15%;" 
        aria-hidden="true" 
      />

      <!-- Premium 2: Fluid Trails (Llamas estructuradas que pelan la silueta) -->
      <img :src="enhancedSrc" class="absolute inset-0 w-full h-full object-cover aura-trail trail-teal" style="object-position: center 15%;" aria-hidden="true" />
      <img :src="enhancedSrc" class="absolute inset-0 w-full h-full object-cover aura-trail trail-peach" style="object-position: center 15%;" aria-hidden="true" />
      <img :src="enhancedSrc" class="absolute inset-0 w-full h-full object-cover aura-trail trail-green" style="object-position: center 15%;" aria-hidden="true" />

      <!-- Baseline 1: Core Edge (Línea de contorno sólida y nítida) -->
      <img 
        :src="enhancedSrc" 
        class="absolute inset-0 w-full h-full object-cover aura-core" 
        style="object-position: center 15%;" 
        aria-hidden="true" 
      />

      <!-- Baseline 2: Sparse Embers (Partículas mínimas y de apoyo) -->
      <div class="absolute inset-0">
        <div class="ember e1"></div>
        <div class="ember e2"></div>
        <div class="ember e3"></div>
      </div>
    </div>


    <!-- ========================================================= -->
    <!-- CAPA 3: IMAGEN PROCESADA PERFECTAMENTE LIMPIA             -->
    <!-- ========================================================= -->
    <img
      v-if="enhancedSrc"
      :src="enhancedSrc"
      class="relative z-10 w-full h-full object-cover rounded-[inherit] animate-avatar-materialize"
      style="object-position: center 15%; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.12));"
      :alt="name"
    />

    <!-- Capa de Seguimiento Ocular -->
    <div
      v-if="enhancedSrc && activeEyeData && !isProcessing"
      class="absolute inset-0 z-[15] pointer-events-none rounded-[inherit] overflow-hidden"
    >
      <img
        v-for="(eye, i) in activeEyeData"
        :key="i"
        :ref="el => setEyeRef(el)"
        :src="eye.src"
        class="absolute origin-center will-change-transform drop-shadow-[0_2px_3px_rgba(0,0,0,0.15)]"
        :style="{
          left: eye.left,
          top: eye.top,
          width: eye.sizePercent,
          height: eye.sizePercent,
          transform: 'translate(-50%, -50%)'
        }"
        aria-hidden="true"
      />
    </div>


    <!-- ========================================================= -->
    <!-- CAPA 4: BISEL DE CRISTAL (ANCLA LA COMPOSICIÓN FÍSICA)    -->
    <!-- ========================================================= -->
    <div 
      class="absolute inset-0 z-20 rounded-[inherit] border-[1.5px] border-white/70 shadow-[inset_0_2px_8px_rgba(255,255,255,0.8)] pointer-events-none mix-blend-overlay"
    ></div>


    <!-- ========================================================= -->
    <!-- HERRAMIENTAS DE DEPURACIÓN (MANTENIDAS INTACTAS)          -->
    <!-- ========================================================= -->
    <div v-if="isDebug && !isProcessing" class="absolute inset-0 z-50 pointer-events-none rounded-[inherit] overflow-hidden">
      <div
        v-if="debugInfo.faceRect"
        class="absolute border border-red-500/80 bg-red-500/10"
        :style="{ left: debugInfo.faceRect.left + '%', top: debugInfo.faceRect.top + '%', width: debugInfo.faceRect.width + '%', height: debugInfo.faceRect.height + '%' }"
      />
      <div
        v-for="(eye, i) in debugInfo.eyeRects"
        :key="'eyebox' + i"
        class="absolute border border-yellow-400/80 bg-yellow-400/20"
        :style="{ left: eye.left + '%', top: eye.top + '%', width: eye.width + '%', height: eye.height + '%' }"
      />
      <div
        v-for="(pt, i) in debugInfo.irisPoints"
        :key="'iris' + i"
        class="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 border border-white/80 -translate-x-1/2 -translate-y-1/2"
        :style="{ left: pt.left + '%', top: pt.top + '%' }"
      />
    </div>

    <!-- Tooltip de depuración -->
    <div
      v-if="isDebug && !isProcessing"
      class="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-[100] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 scale-95 group-hover:scale-100 flex justify-center"
    >
      <div class="w-64 bg-slate-900/95 backdrop-blur-md text-slate-200 text-xs font-mono p-4 rounded-2xl shadow-2xl select-text cursor-auto border border-slate-700/80">
        <div class="font-black text-brand-400 mb-3 uppercase tracking-widest text-[10px]">
          Depuración de Visión
        </div>
        <div class="space-y-2">
          <div class="flex justify-between border-b border-slate-700/50 pb-1.5">
            <span class="text-slate-400">Rostro</span>
            <span :class="debugInfo.faceOK ? 'text-emerald-400' : 'text-red-400'">
              {{ debugInfo.faceOK ? 'OK' : 'FALLA' }}
              <span v-if="debugInfo.faceConf" class="text-[9px] opacity-70">({{ Math.round(debugInfo.faceConf * 100) }}%)</span>
            </span>
          </div>
          <div class="flex justify-between border-b border-slate-700/50 pb-1.5">
            <span class="text-slate-400">Ojos</span>
            <span :class="debugInfo.eyesOK ? 'text-emerald-400' : 'text-amber-400'">
              {{ debugInfo.eyesOK ? 'OK' : 'OMITIR' }}
              <span v-if="debugInfo.eyeConf" class="text-[9px] opacity-70">({{ Math.round(debugInfo.eyeConf * 100) }}%)</span>
            </span>
          </div>
          <div class="flex flex-col border-b border-slate-700/50 pb-1.5">
            <span class="text-slate-400 mb-1">Fondo</span>
            <span
              class="text-[10px] leading-relaxed break-words"
              :class="debugInfo.bgStatus.includes('REMOVED') ? 'text-emerald-400' : 'text-amber-400'"
            >
              {{ debugInfo.bgStatus }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Efecto Seguimiento</span>
            <span :class="debugInfo.followActive ? 'text-emerald-400' : 'text-slate-500'">
              {{ debugInfo.followActive ? 'ACTIVO' : 'INACTIVO' }}
            </span>
          </div>
        </div>
        <div class="mt-3 pt-2 border-t border-slate-700/80 text-[9px] text-slate-500 text-center uppercase tracking-widest font-sans">
          Seleccione el texto para copiar
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUpdate, onUnmounted } from 'vue'
import { useRuntimeConfig } from '#imports'

const props = defineProps({
  src:  { type: String, default: null },
  name: { type: String, default: 'Usuario' },
  size: { type: String, default: 'lg' } // sm | md | lg
})

const config  = useRuntimeConfig()
const isDebug = computed(() => config.public?.debugFace === true)

const sizeClasses = computed(() => {
  if (props.size === 'sm') return 'w-12 h-12 rounded-full'
  if (props.size === 'md') return 'w-16 h-16 rounded-[1rem]'
  return 'w-24 h-24 md:w-28 md:h-28 rounded-[1.5rem] md:rounded-[1.75rem]'
})

const textClass = computed(() => {
  if (props.size === 'sm') return 'text-xs'
  if (props.size === 'md') return 'text-lg'
  return 'text-2xl'
})

const initials = computed(() => {
  if (!props.name) return '?'
  const parts = props.name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : props.name.slice(0, 2).toUpperCase()
})

// ─── reactive state ────────────────────────────────────────────────────────────
const baseSrc       = ref(null)
const enhancedSrc   = ref(null)
const activeEyeData = ref(null)
const isProcessing  = ref(false)

const debugInfo = ref({
  faceOK: false, faceConf: null,
  eyesOK: false, eyeConf: null,
  bgStatus: 'PENDING',
  followActive: false,
  faceRect: null,
  eyeRects: [],
  irisPoints: []
})

// ─── motion system ─────────────────────────────────────────────────────────────
const containerRef = ref(null)
let eyeDOMElements = []
let targetShift  = { x: 0, y: 0 }
let currentShift = { x: 0, y: 0 }
let rafId = null

onBeforeUpdate(() => { eyeDOMElements = [] })

const setEyeRef = (el) => { if (el) eyeDOMElements.push(el) }

const updateLoop = () => {
  if (eyeDOMElements.length > 0) {
    const dx = targetShift.x - currentShift.x
    const dy = targetShift.y - currentShift.y

    if (Math.abs(dx) > 0.005 || Math.abs(dy) > 0.005) {
      currentShift.x += dx * 0.09
      currentShift.y += dy * 0.09

      const tx = currentShift.x
      const ty = currentShift.y
      const t  = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`

      for (let i = 0; i < eyeDOMElements.length; i++) {
        eyeDOMElements[i].style.transform = t
      }
    }
  }
  rafId = requestAnimationFrame(updateLoop)
}

const handleMouseMove = (e) => {
  if (eyeDOMElements.length === 0 || !containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const cx   = rect.left + rect.width  / 2
  const cy   = rect.top  + rect.height / 2

  const rawDx = e.clientX - cx
  const rawDy = e.clientY - cy
  const dist  = Math.sqrt(rawDx * rawDx + rawDy * rawDy)

  const R = window.innerWidth > 800 ? 600 : 300
  const t = Math.min(dist / R, 1.0)
  const eased = t * t * (3 - 2 * t)

  const maxMove = rect.width * 0.038

  const angle = Math.atan2(rawDy, rawDx)
  targetShift.x = Math.cos(angle) * eased * maxMove
  targetShift.y = Math.sin(angle) * eased * maxMove
}

const handleMouseLeave = () => {
  targetShift.x = 0
  targetShift.y = 0
}

onMounted(() => {
  window.addEventListener('mousemove',    handleMouseMove,  { passive: true })
  document.addEventListener('mouseleave', handleMouseLeave, { passive: true })
  rafId = requestAnimationFrame(updateLoop)
})

onUnmounted(() => {
  window.removeEventListener('mousemove',    handleMouseMove)
  document.removeEventListener('mouseleave', handleMouseLeave)
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
})

// ─── image pipeline ────────────────────────────────────────────────────────────

const globalImageCache = new Map()

function loadImage(url, useCors) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (useCors) img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })
}

function locateIris(ctx, eyeCx, eyeCy, eyeWidthPx, canvasW, canvasH) {
  const hw = Math.max(5, Math.floor(eyeWidthPx * 0.45))
  const hh = Math.max(4, Math.floor(eyeWidthPx * 0.36))

  const sx = Math.max(0, Math.round(eyeCx - hw))
  const sy = Math.max(0, Math.round(eyeCy - hh))
  const sw = Math.min(canvasW - sx, hw * 2)
  const sh = Math.min(canvasH - sy, hh * 2)

  const irisRadius = Math.max(4, Math.round(eyeWidthPx * 0.36))

  if (sw < 6 || sh < 6) {
    return { cx: eyeCx, cy: eyeCy, irisRadius }
  }

  const px = ctx.getImageData(sx, sy, sw, sh).data

  let minLum = 1.0
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 64) continue
    const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255
    if (lum < minLum) minLum = lum
  }

  const threshold = Math.min(minLum + 0.28, 0.50)
  let totalW = 0, wX = 0, wY = 0

  for (let row = 0; row < sh; row++) {
    for (let col = 0; col < sw; col++) {
      const idx = (row * sw + col) * 4
      if (px[idx + 3] < 64) continue
      const lum = (0.299 * px[idx] + 0.587 * px[idx + 1] + 0.114 * px[idx + 2]) / 255
      if (lum <= threshold) {
        const w = Math.pow((threshold - lum) / threshold, 2)
        wX += col * w
        wY += row * w
        totalW += w
      }
    }
  }

  if (totalW < 8) {
    return { cx: eyeCx, cy: eyeCy, irisRadius }
  }

  return {
    cx: sx + wX / totalW,
    cy: sy + wY / totalW,
    irisRadius
  }
}

function buildIrisPatch(sourceCanvas, iris) {
  const { cx, cy, irisRadius } = iris
  const cW = sourceCanvas.width
  const cH = sourceCanvas.height

  const patchR    = Math.ceil(irisRadius * 1.75)
  const patchSize = patchR * 2

  const left = Math.round(cx - patchR)
  const top  = Math.round(cy - patchR)

  if (left < 0 || top < 0 || left + patchSize > cW || top + patchSize > cH) {
    return null
  }

  const pc  = document.createElement('canvas')
  pc.width  = patchSize
  pc.height = patchSize
  const pCtx = pc.getContext('2d')

  pCtx.drawImage(sourceCanvas, left, top, patchSize, patchSize, 0, 0, patchSize, patchSize)

  pCtx.globalCompositeOperation = 'destination-in'
  const pr         = patchSize / 2
  const irisRatio  = irisRadius / patchR

  const grad = pCtx.createRadialGradient(pr, pr, 0, pr, pr, pr)
  grad.addColorStop(0,                  'rgba(0,0,0,1.00)')
  grad.addColorStop(irisRatio * 0.35,   'rgba(0,0,0,1.00)')
  grad.addColorStop(irisRatio * 0.75,   'rgba(0,0,0,0.90)')
  grad.addColorStop(irisRatio * 1.00,   'rgba(0,0,0,0.55)')
  grad.addColorStop(Math.min(0.88, irisRatio * 1.25), 'rgba(0,0,0,0.10)')
  grad.addColorStop(0.96,               'rgba(0,0,0,0.00)')

  pCtx.fillStyle = grad
  pCtx.fillRect(0, 0, patchSize, patchSize)

  return {
    src:         pc.toDataURL('image/png'),
    left:        `${(cx / cW) * 100}%`,
    top:         `${(cy / cH) * 100}%`,
    sizePercent: `${(patchSize / cW) * 100}%`
  }
}

// ─── main processing entry point ───────────────────────────────────────────────

async function processPremiumImage(url) {
  if (!url) {
    baseSrc.value       = null
    enhancedSrc.value   = null
    activeEyeData.value = null
    return
  }

  const visionBase = config.public.visionApiBaseUrl || 'https://vision.casitaapps.com'

  debugInfo.value = {
    faceOK: false, faceConf: null,
    eyesOK: false, eyeConf: null,
    bgStatus: 'PENDING',
    followActive: false,
    faceRect: null,
    eyeRects: [],
    irisPoints: []
  }

  let fullUrl = url
  if (!fullUrl.startsWith('http') && !fullUrl.startsWith('data:')) {
    fullUrl = `https://signia.casitaapps.com/${url.replace(/^\//, '')}`
  }

  // Carga inicial inmediata
  baseSrc.value       = fullUrl
  enhancedSrc.value   = null
  activeEyeData.value = null
  isProcessing.value  = true

  if (globalImageCache.has(fullUrl)) {
    const cached = globalImageCache.get(fullUrl)
    if (cached.usedCanvas) {
      enhancedSrc.value   = cached.src
      activeEyeData.value = cached.eyeData || null
    }
    if (cached.debugInfo) debugInfo.value = cached.debugInfo
    isProcessing.value = false
    return
  }

  try {
    const formData = new FormData()
    formData.append('imageUrl', fullUrl)

    const analyzeRes = await fetch(`${visionBase}/analyze`, {
      method: 'POST',
      body: formData
    }).catch(() => null)

    let data = null
    if (analyzeRes?.ok) data = await analyzeRes.json()
    if (!data || data.ok !== true) throw new Error('Vision service failed or returned not-ok')

    debugInfo.value.faceOK  = !!data.faceDetected
    debugInfo.value.faceConf = data.faceConfidence || null
    debugInfo.value.eyesOK  = !!data.eyesDetected
    debugInfo.value.eyeConf = data.eyeConfidence  || null
    debugInfo.value.bgStatus = data.maskAvailable ? 'MASK_AVAILABLE' : 'SKIP'

    const img = await loadImage(`${visionBase}/image/${data.imageKey}`, true)

    const canvas = document.createElement('canvas')
    const ctx    = canvas.getContext('2d', { willReadFrequently: true })

    // ── Recorte ──────────────────────────────────────────────────────────────────
    let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height
    if (data.cropBox) {
      sx      = data.cropBox.xMin * img.width
      sy      = data.cropBox.yMin * img.height
      sWidth  = (data.cropBox.xMax - data.cropBox.xMin) * img.width
      sHeight = (data.cropBox.yMax - data.cropBox.yMin) * img.height
    }

    const maxRes = 256
    const scale  = Math.min(1, maxRes / sWidth, maxRes / sHeight)
    const cW     = Math.floor(sWidth  * scale)
    const cH     = Math.floor(sHeight * scale)
    canvas.width  = cW
    canvas.height = cH
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cW, cH)

    if (data.faceBox) {
      const fx = data.faceBox.xMin * img.width
      const fy = data.faceBox.yMin * img.height
      const fw = (data.faceBox.xMax - data.faceBox.xMin) * img.width
      const fh = (data.faceBox.yMax - data.faceBox.yMin) * img.height
      debugInfo.value.faceRect = {
        left:   ((fx - sx) / sWidth)  * 100,
        top:    ((fy - sy) / sHeight) * 100,
        width:  (fw / sWidth)  * 100,
        height: (fh / sHeight) * 100
      }
    }

    // ── Remoción de Fondo ────────────────────────────────────────────────────
    if (data.maskAvailable && data.maskUrl) {
      const maskImg = await loadImage(data.maskUrl, true).catch(() => null)
      if (maskImg) {
        const mc  = document.createElement('canvas')
        mc.width  = cW
        mc.height = cH
        const mCtx = mc.getContext('2d', { willReadFrequently: true })

        const mScaleX = maskImg.width  / img.width
        const mScaleY = maskImg.height / img.height
        mCtx.drawImage(
          maskImg,
          sx * mScaleX, sy * mScaleY, sWidth * mScaleX, sHeight * mScaleY,
          0, 0, cW, cH
        )

        const mainData = ctx.getImageData(0, 0, cW, cH)
        const maskData = mCtx.getImageData(0, 0, cW, cH)

        let usesAlpha = false
        for (let i = 3; i < maskData.data.length; i += 16) {
          if (maskData.data[i] < 255) { usesAlpha = true; break }
        }

        for (let i = 0; i < mainData.data.length; i += 4) {
          const mi = usesAlpha ? maskData.data[i + 3] : maskData.data[i]
          mainData.data[i + 3] = (mainData.data[i + 3] * mi) / 255
        }
        ctx.putImageData(mainData, 0, 0)
        debugInfo.value.bgStatus = 'REMOVED'

        // ── 1. Safety Check (Lienzo vacío) ─────────────
        let visiblePixels = 0
        for (let i = 3; i < mainData.data.length; i += 4) {
          if (mainData.data[i] > 15) visiblePixels++ 
        }
        if (visiblePixels / (cW * cH) < 0.15) {
          throw new Error('SAFETY_CHECK_FAIL_EMPTY_CROP')
        }

        // ── 2. Safety Check (Detección Nativa) ─────────────────
        if ('FaceDetector' in window) {
          debugInfo.value.bgStatus = 'VERIFYING_MASK'
          try {
            const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 })
            const faces = await detector.detect(canvas)
            if (faces.length === 0) throw new Error('SAFETY_CHECK_FAIL_NO_FACE')
            debugInfo.value.bgStatus = 'REMOVED_AND_VERIFIED'
          } catch (err) {
            if (err.message.includes('SAFETY_CHECK_FAIL')) throw err
            debugInfo.value.bgStatus = 'REMOVED_UNVERIFIED'
          }
        } else {
          debugInfo.value.bgStatus = 'REMOVED_UNVERIFIED'
        }

      } else {
        debugInfo.value.bgStatus = 'MASK_LOAD_FAIL'
      }
    }

    // ── Extracción del Iris (Ilusión de Mirada Premium) ────────────────────
    let patches = null

    if (data.eyesDetected && Array.isArray(data.eyeBoxes) && data.eyeBoxes.length >= 2) {
      patches = []

      for (const eye of data.eyeBoxes.slice(0, 2)) {
        const ex      = eye.xMin * img.width
        const eyTop   = eye.yMin * img.height
        const ew      = (eye.xMax - eye.xMin) * img.width
        const eh      = (eye.yMax - eye.yMin) * img.height

        debugInfo.value.eyeRects.push({
          left:   ((ex - sx) / sWidth)  * 100,
          top:    ((eyTop - sy) / sHeight) * 100,
          width:  (ew / sWidth)  * 100,
          height: (eh / sHeight) * 100
        })

        const eyeCx = ((ex + ew / 2) - sx) * scale
        const eyeCy = ((eyTop + eh / 2) - sy) * scale
        const ewScaled = ew * scale

        const iris = locateIris(ctx, eyeCx, eyeCy, ewScaled, cW, cH)

        debugInfo.value.irisPoints.push({
          left: (iris.cx / cW) * 100,
          top:  (iris.cy / cH) * 100
        })

        const patch = buildIrisPatch(canvas, iris)
        if (patch) patches.push(patch)
      }

      if (patches.length === 2) {
        debugInfo.value.followActive = true
      } else {
        patches = null
        debugInfo.value.followActive = false
      }
    }

    const processedDataUrl = canvas.toDataURL('image/png')

    globalImageCache.set(fullUrl, {
      src: processedDataUrl,
      usedCanvas: true,
      eyeData: patches,
      debugInfo: { ...debugInfo.value }
    })

    enhancedSrc.value   = processedDataUrl
    activeEyeData.value = patches

  } catch (e) {
    if (e.message.includes('SAFETY_CHECK_FAIL')) {
      debugInfo.value.bgStatus = e.message === 'SAFETY_CHECK_FAIL_EMPTY_CROP' 
        ? 'REJECTED_FALSE_CROP' 
        : 'REJECTED_FACE_LOST'
      debugInfo.value.faceOK = true 
    } else {
      debugInfo.value.faceOK   = false
      debugInfo.value.bgStatus = 'FAIL_FALLBACK'
    }

    globalImageCache.set(fullUrl, {
      src: fullUrl,
      usedCanvas: false,
      eyeData: null,
      debugInfo: { ...debugInfo.value }
    })

    enhancedSrc.value   = null
    activeEyeData.value = null
  } finally {
    isProcessing.value = false
  }
}

watch(() => props.src, (newSrc) => {
  processPremiumImage(newSrc)
}, { immediate: true })
</script>

<style scoped>
/* Entrada rápida garantizada (<1s) */
.animate-aura-fade-in {
  animation: auraFadeIn 0.8s ease-out 0.1s forwards;
  opacity: 0;
}
@keyframes auraFadeIn {
  to { opacity: 1; }
}

/* 
  Contención segura: Máscara lineal calibrada al 85% para desvanecer la punta,
  permitiendo que la silueta y los hombros se vean completos al 100%. 
*/
.aura-container {
  mask-image: linear-gradient(to top, black 85%, transparent 100%);
  -webkit-mask-image: linear-gradient(to top, black 85%, transparent 100%);
}

/* =======================================================
   BASELINE PRESERVADA (Límites y Visibilidad Clara)
   ======================================================= */
/* Línea de contorno sólida que ancla la visibilidad en fondos blancos */
.aura-core {
  filter: brightness(0) invert(1) blur(0.5px) drop-shadow(0 0 3px rgba(255, 255, 255, 0.9));
  animation: core-breathe 2.5s infinite alternate ease-in-out;
  transform-origin: bottom center;
}
@keyframes core-breathe {
  0% { transform: scale(1.015); opacity: 0.7; }
  100% { transform: scale(1.03); opacity: 1; }
}

/* Partículas mínimas y de apoyo (escasas, secundarias) */
.ember {
  position: absolute;
  border-radius: 50%;
  opacity: 0;
}
.e1 { width: 1.5px; height: 1.5px; background: #007F92; box-shadow: 0 0 2px #007F92; left: 25%; top: 75%; animation: ember-float 4s infinite ease-in; --dx: -10px; --dy: -20px; }
.e2 { width: 2px; height: 2px; background: #8EC152; box-shadow: 0 0 3px #8EC152; left: 75%; top: 65%; animation: ember-float 5s infinite ease-in 1.5s; --dx: 12px; --dy: -25px; }
.e3 { width: 2.5px; height: 2.5px; background: #F49A6D; box-shadow: 0 0 4px #F49A6D; left: 40%; top: 70%; animation: ember-float 4.5s infinite ease-in 2.5s; --dx: 5px; --dy: -18px; }

@keyframes ember-float {
  0% { transform: translate(0, 0); opacity: 0; }
  20% { opacity: 0.8; }
  80% { opacity: 0.6; }
  100% { transform: translate(var(--dx), var(--dy)); opacity: 0; }
}

/* =======================================================
   CAPAS PREMIUM (Estructura, Forma y Movimiento Interno)
   ======================================================= */

/* 1. Heat Shimmer: Alta frecuencia, poco desenfoque, movimiento ajustado a la piel */
.aura-shimmer {
  filter: brightness(0) invert(1) blur(1px) drop-shadow(0 0 2px rgba(255, 255, 255, 0.6));
  animation: shimmer-wobble 1.2s infinite alternate ease-in-out;
  transform-origin: center center;
}
@keyframes shimmer-wobble {
  0% { transform: scale(1.02) skewX(0.5deg) translateY(0); opacity: 0.4; }
  100% { transform: scale(1.025) skewX(-0.5deg) translateY(-1%); opacity: 0.65; }
}

/* 2. Fluid Trails (Silhouette Peeling) 
   Adiós al blur extremo (ahora 1px-1.5px). Retienen la forma geométrica de la persona 
   mientras se expanden asimétricamente y "pelan" la silueta original.
*/
.aura-trail {
  transform-origin: bottom center;
}
.trail-teal {
  filter: brightness(0) invert(1) blur(1px) drop-shadow(0 0 4px #007F92);
  animation: peel-left 3s infinite cubic-bezier(0.25, 0.1, 0.25, 1);
}
.trail-peach {
  filter: brightness(0) invert(1) blur(1px) drop-shadow(0 0 4px #F49A6D);
  animation: peel-right 3.5s infinite cubic-bezier(0.25, 0.1, 0.25, 1) 0.8s;
}
.trail-green {
  filter: brightness(0) invert(1) blur(1.5px) drop-shadow(0 0 4px #8EC152);
  animation: peel-up 2.8s infinite cubic-bezier(0.25, 0.1, 0.25, 1) 1.6s;
}

/* Los trails nacen ocultos (scale 1), cobran fuerza rápido (opacity 0.85 al 15%) 
   y se estiran físicamente hacia los costados/arriba, creando el efecto de flamas/ondas de contorno. */
@keyframes peel-left {
  0% { transform: scale(1) translate(0, 0); opacity: 0; }
  15% { opacity: 0.85; }
  80% { opacity: 0; }
  100% { transform: scaleX(1.04) scaleY(1.08) translate(-3%, -5%); opacity: 0; }
}
@keyframes peel-right {
  0% { transform: scale(1) translate(0, 0); opacity: 0; }
  15% { opacity: 0.85; }
  80% { opacity: 0; }
  100% { transform: scaleX(1.04) scaleY(1.08) translate(3%, -5%); opacity: 0; }
}
@keyframes peel-up {
  0% { transform: scale(1) translate(0, 0); opacity: 0; }
  15% { opacity: 0.8; }
  80% { opacity: 0; }
  100% { transform: scaleX(1.02) scaleY(1.1) translate(0, -7%); opacity: 0; }
}

/* Materialización final del retrato nítido */
.animate-avatar-materialize {
  animation: avatarMaterialize 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes avatarMaterialize {
  0% { opacity: 0; transform: scale(0.92); }
  100% { opacity: 1; transform: scale(1); }
}
</style>