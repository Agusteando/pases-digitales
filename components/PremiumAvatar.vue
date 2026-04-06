<template>
  <div class="relative inline-flex items-center justify-center isolate select-none overflow-hidden" :class="[sizeClasses, $attrs.class]">
    
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

    <!-- Inner Glass / Lighting Ring -->
    <div class="absolute inset-0 z-20 rounded-[inherit] border border-white/60 shadow-[inset_0_2px_8px_rgba(255,255,255,0.7),inset_0_-1px_3px_rgba(0,0,0,0.04)] pointer-events-none transition-all"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  src: { type: String, default: null },
  name: { type: String, default: 'User' },
  size: { type: String, default: 'lg' } // sm, md, lg
})

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
const isProcessing = ref(false)
const usedCanvas = ref(false)

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
    return
  }

  // Ensure full URL formatting
  let fullUrl = url
  if (!fullUrl.startsWith('http') && !fullUrl.startsWith('data:')) {
    fullUrl = `https://signia.casitaapps.com/${url.replace(/^\//, '')}`
  }

  if (globalImageCache.has(fullUrl)) {
    const cached = globalImageCache.get(fullUrl)
    activeSrc.value = cached.src
    usedCanvas.value = cached.usedCanvas
    return
  }

  isProcessing.value = true

  try {
    const img = await loadImage(fullUrl, true)
    
    // Virtual rendering buffer
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    
    let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height

    // 1. Intelligent Face Detection & Reframing
    if ('FaceDetector' in window) {
      try {
        const detector = new window.FaceDetector({ maxDetectedFaces: 1 })
        const faces = await detector.detect(img)
        
        if (faces.length > 0) {
          const box = faces[0].boundingBox
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
    const data = imgData.data
    const tolerance = 15 // Tight RGB tolerance to protect white/grey clothing

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

    ctx.putImageData(imgData, 0, 0)

    const processedDataUrl = canvas.toDataURL('image/png')
    
    globalImageCache.set(fullUrl, { src: processedDataUrl, usedCanvas: true })
    activeSrc.value = processedDataUrl
    usedCanvas.value = true

  } catch (e) {
    // 3. Graceful fallback on CORS restriction or extreme failure 
    // The CSS object-position wrapper will still make it look visually stunning
    globalImageCache.set(fullUrl, { src: fullUrl, usedCanvas: false })
    activeSrc.value = fullUrl
    usedCanvas.value = false
  } finally {
    isProcessing.value = false
  }
}

watch(() => props.src, (newSrc) => {
  processPremiumImage(newSrc)
}, { immediate: true })
</script>