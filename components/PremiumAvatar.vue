<template>
  <div class="relative inline-flex items-center justify-center isolate select-none overflow-hidden" :class="[sizeClasses, $attrs.class]" ref="containerRef">
    
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

    <!-- Pipeline Debug Overlay (Only visible when DEBUG_FACE is true) -->
    <div v-if="isDebug && !isProcessing" class="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-[inherit]">
      
      <!-- Safe Face Detection Bounds -->
      <div v-if="debugInfo.faceRect" class="absolute border border-red-500/80 bg-red-500/10" 
           :style="{ left: debugInfo.faceRect.left + '%', top: debugInfo.faceRect.top + '%', width: debugInfo.faceRect.width + '%', height: debugInfo.faceRect.height + '%' }">
      </div>

      <!-- Live Landmarks Mapping -->
      <div v-for="(lm, i) in debugInfo.landmarks" :key="'lm'+i" 
           class="absolute w-1 h-1 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-sm" 
           :style="{ left: lm.x + '%', top: lm.y + '%' }">
      </div>

      <!-- State Readout -->
      <div class="absolute bottom-0 inset-x-0 bg-black/80 text-[7px] text-green-400 font-mono p-1 leading-tight flex flex-col backdrop-blur-md">
        <span>F: {{ debugInfo.faceOK ? 'OK' : 'FAIL' }} | E: {{ debugInfo.eyesOK ? 'OK' : 'SKIP' }}</span>
        <span>B: {{ debugInfo.bgStatus }}</span>
        <span>X: {{ debugInfo.followActive ? 'ACTIVE' : 'OFF' }}</span>
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
  eyesOK: false,
  bgStatus: 'PENDING',
  followActive: false,
  faceRect: null,
  landmarks: []
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

  debugInfo.value = { faceOK: false, eyesOK: false, bgStatus: 'PENDING', followActive: false, faceRect: null, landmarks: [] }

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
    const img = await loadImage(fullUrl, true)
    
    // Virtual rendering buffer
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    
    let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height
    let eyePoints = []

    // 1. Intelligent Face Detection & Reframing
    if ('FaceDetector' in window) {
      try {
        const detector = new window.FaceDetector({ maxDetectedFaces: 1 })
        const faces = await detector.detect(img)
        
        if (faces.length > 0) {
          debugInfo.value.faceOK = true
          
          const face = faces[0]
          const box = face.boundingBox
          const cx = box.x + box.width / 2
          const cy = box.y + box.height / 2
          
          // Compose a cinematic portrait crop. Padding ~2.2x the face
          const faceSize = Math.max(box.width, box.height)
          const size = Math.min(img.width, img.height, faceSize * 2.2)
          
          // Shift focal point down slightly (places eyes at pleasant upper-third ratio)
          const targetY = cy - (size * 0.15)
          
          sx = Math.max(0, cx - size / 2)
          sy = Math.max(0, targetY - size / 2)
          sWidth = Math.min(img.width - sx, size)
          sHeight = Math.min(img.height - sy, size)
          
          // Enforce square bounds
          const minDim = Math.min(sWidth, sHeight)
          sWidth = minDim
          sHeight = minDim

          debugInfo.value.faceRect = {
            left: ((box.x - sx) / sWidth) * 100,
            top: ((box.y - sy) / sHeight) * 100,
            width: (box.width / sWidth) * 100,
            height: (box.height / sHeight) * 100
          }

          // Isolate exact geometry constraints from the eye landmarks structure
          if (face.landmarks) {
            for (const lm of face.landmarks) {
              if (lm.locations && lm.locations.length > 0) {
                let sumX = 0, sumY = 0
                for (const loc of lm.locations) {
                  sumX += loc.x
                  sumY += loc.y
                  debugInfo.value.landmarks.push({
                     x: ((loc.x - sx) / sWidth) * 100,
                     y: ((loc.y - sy) / sHeight) * 100
                  })
                }
                if (lm.type === 'eye') {
                  eyePoints.push({
                    x: sumX / lm.locations.length,
                    y: sumY / lm.locations.length
                  })
                }
              }
            }
          }
        } else {
          // Salience Fallback: Top-center alignment
          const size = Math.min(img.width, img.height)
          sx = (img.width - size) / 2
          sy = img.height > size ? img.height * 0.1 : 0
          sWidth = size
          sHeight = size
        }
      } catch (e) { /* proceed to fallback math */ }
    } else {
      // Salience Fallback: Portrait upper-body framing
      const size = Math.min(img.width, img.height)
      sx = (img.width - size) / 2
      sy = img.height > size ? img.height * 0.1 : 0
      sWidth = size
      sHeight = size
    }

    // Limit canvas compute dimensions to prevent blocking the main thread (max 256px resolution)
    const maxRes = 256
    const scale = Math.min(1, maxRes / sWidth, maxRes / sHeight)
    const cWidth = Math.floor(sWidth * scale)
    const cHeight = Math.floor(sHeight * scale)
    
    canvas.width = cWidth
    canvas.height = cHeight
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cWidth, cHeight)

    // 2. Intelligent Background Removal via Magic Wand / Flood-Fill Algorithm
    const imgData = ctx.getImageData(0, 0, cWidth, cHeight)
    const originalData = new Uint8ClampedArray(imgData.data) // Secure clone for safe rollback
    const data = imgData.data
    const tolerance = 25 // Safer tolerance mapping
    let removedPixels = 0

    function floodFillFrom(startX, startY) {
      const stack = [[startX, startY]]
      const visited = new Uint8Array(cWidth * cHeight)
      
      const startPos = (startY * cWidth + startX) * 4
      const r = data[startPos], g = data[startPos+1], b = data[startPos+2], a = data[startPos+3]
      
      if (a === 0) return

      while (stack.length > 0) {
        const [x, y] = stack.pop()
        const idx = y * cWidth + x
        if (visited[idx]) continue
        visited[idx] = 1

        const p = idx * 4
        // Calculate max color channel distance
        const dist = Math.max(Math.abs(data[p]-r), Math.abs(data[p+1]-g), Math.abs(data[p+2]-b))

        if (dist <= tolerance) {
          data[p+3] = 0 // Drop alpha channel completely
          removedPixels++
          
          if (x > 0) stack.push([x-1, y])
          if (x < cWidth - 1) stack.push([x+1, y])
          if (y > 0) stack.push([x, y-1])
          if (y < cHeight - 1) stack.push([x, y+1])
        }
      }
    }

    // Launch flood-fill passes from the four absolute corners
    floodFillFrom(0, 0)
    floodFillFrom(cWidth - 1, 0)
    floodFillFrom(0, cHeight - 1)
    floodFillFrom(cWidth - 1, cHeight - 1)

    // Safety constraint: Prevent background removal from eating the subject if tones are too similar
    const totalPixels = cWidth * cHeight
    if (removedPixels > totalPixels * 0.45) {
      data.set(originalData) // Trigger graceful degradation rollback
      debugInfo.value.bgStatus = 'ROLLBACK (Too aggressive)'
    } else {
      debugInfo.value.bgStatus = removedPixels > 0 ? 'OK' : 'SKIP'
    }

    ctx.putImageData(imgData, 0, 0)

    // 3. Eye Topology extraction for premium illusion
    let patches = null
    if (eyePoints.length === 2) {
      const eyeDist = Math.sqrt(Math.pow(eyePoints[1].x - eyePoints[0].x, 2) + Math.pow(eyePoints[1].y - eyePoints[0].y, 2))
      const eyeDistCropped = eyeDist * scale
      
      // 65% of the eye distance provides a clean localized mask for the iris and eyelid
      const pSize = Math.max(12, Math.floor(eyeDistCropped * 0.65))
      const pR = pSize / 2
      
      patches = []
      for (const pt of eyePoints) {
        const cx_c = (pt.x - sx) * scale
        const cy_c = (pt.y - sy) * scale
        
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
         debugInfo.value.eyesOK = true
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
    debugInfo.value.bgStatus = 'FAIL'
    
    // 4. Graceful fallback on CORS restriction or extreme failure 
    // The CSS object-position wrapper will still make it look visually stunning
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