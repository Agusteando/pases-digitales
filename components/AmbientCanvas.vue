<template>
  <div ref="canvasContainer" class="fixed inset-0 z-0 pointer-events-none"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'

const canvasContainer = ref(null)
let scene, camera, renderer, animationId
const particles = []
const orbs = []
const flowLines = []
const geometryMeshes = []

onMounted(() => {
  if (!canvasContainer.value) return

  // Scene Setup
  scene = new THREE.Scene()
  
  // Use Orthographic camera for a flatter, more 2D/graphic design feel
  const aspect = window.innerWidth / window.innerHeight
  const viewSize = 30
  camera = new THREE.OrthographicCamera(
    -viewSize * aspect / 2, viewSize * aspect / 2, 
    viewSize / 2, -viewSize / 2, 
    0.1, 100
  )
  camera.position.z = 10

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  canvasContainer.value.appendChild(renderer.domElement)

  // Institutional Colors
  const colors = [
    0x8EC152, // Casita Light Green
    0x5FB4A9, // IEDIS Light Teal
    0x66A8D8, // IEDIS Blue
    0xF49A6D  // Casita Peach
  ]

  // Create soft circular texture for particles and orbs
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  const softTexture = new THREE.CanvasTexture(canvas)

  // 1. Fine Drifting Particles (Dust/Bubbles)
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.25,
    map: softTexture,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    color: 0xffffff
  })

  const particleCount = 150
  const pGeometry = new THREE.BufferGeometry()
  const pPositions = new Float32Array(particleCount * 3)
  const pData = []

  for (let i = 0; i < particleCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 60
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * 40
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * 5

    pData.push({
      speed: Math.random() * 0.02 + 0.01,
      phaseX: Math.random() * Math.PI * 2,
      phaseSpeedX: Math.random() * 0.01 + 0.005,
      ampX: Math.random() * 0.02 + 0.01
    })
  }

  pGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3))
  const particleSystem = new THREE.Points(pGeometry, particleMaterial)
  scene.add(particleSystem)

  // 2. Soft Background Orbs (Bokeh)
  for (let i = 0; i < 6; i++) {
    const orbMaterial = new THREE.SpriteMaterial({
      map: softTexture,
      color: colors[i % colors.length],
      transparent: true,
      opacity: 0.15,
      blending: THREE.NormalBlending,
      depthWrite: false
    })
    const orb = new THREE.Sprite(orbMaterial)
    
    const scale = 15 + Math.random() * 20
    orb.scale.set(scale, scale, 1)
    
    orb.position.set(
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 30,
      -5 - Math.random() * 2
    )

    orb.userData = {
      speedX: (Math.random() - 0.5) * 0.01,
      speedY: (Math.random() - 0.5) * 0.01,
      originX: orb.position.x,
      originY: orb.position.y,
      angle: Math.random() * Math.PI * 2,
      colorPhase: Math.random() * Math.PI * 2,
      baseColorIdx: i % colors.length
    }
    
    scene.add(orb)
    orbs.push(orb)
  }

  // 3. Abstract Flow Lines (Climbing Tendrils)
  const lineCount = 4
  for (let i = 0; i < lineCount; i++) {
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: colors[i % colors.length], 
      transparent: true, 
      opacity: 0.1,
      blending: THREE.AdditiveBlending 
    })
    
    const points = []
    for (let j = 0; j < 60; j++) {
      points.push(new THREE.Vector3(0, (j * 0.8) - 20, -2))
    }
    
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(lineGeo, lineMaterial)
    
    line.userData = {
      xOffset: (Math.random() - 0.5) * 40,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.005 + 0.005,
      frequency: Math.random() * 0.1 + 0.1,
      amplitude: Math.random() * 2 + 1
    }
    
    scene.add(line)
    flowLines.push(line)
  }

  // 4. Floating Abstract Glass Geometry
  const geometries = [
    new THREE.IcosahedronGeometry(6, 0),
    new THREE.OctahedronGeometry(8, 0),
    new THREE.TetrahedronGeometry(10, 0)
  ]

  for (let i = 0; i < 5; i++) {
    const geo = geometries[i % geometries.length]
    
    // Transparent soft faces
    const faceMat = new THREE.MeshBasicMaterial({
      color: colors[i % colors.length],
      transparent: true,
      opacity: 0.02,
      blending: THREE.NormalBlending,
      depthWrite: false,
      wireframe: false
    })
    
    // Elegant glowing edges
    const edgeMat = new THREE.LineBasicMaterial({
      color: colors[(i + 1) % colors.length],
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending
    })
    
    const mesh = new THREE.Mesh(geo, faceMat)
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat)
    mesh.add(edges)
    
    const scale = 1 + Math.random() * 1.5
    mesh.scale.set(scale, scale, scale)

    mesh.position.set(
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 40,
      -8 - Math.random() * 4
    )
    
    mesh.userData = {
      rotSpeedX: (Math.random() - 0.5) * 0.003,
      rotSpeedY: (Math.random() - 0.5) * 0.003,
      rotSpeedZ: (Math.random() - 0.5) * 0.003,
      moveSpeedY: Math.random() * 0.015 + 0.005,
      colorPhase: Math.random() * Math.PI * 2,
      baseColorIdx: i % colors.length
    }
    
    scene.add(mesh)
    geometryMeshes.push(mesh)
  }

  // Animation Loop
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    // Update Particles
    const positions = particleSystem.geometry.attributes.position.array
    for (let i = 0; i < particleCount; i++) {
      const data = pData[i]
      positions[i * 3 + 1] += data.speed
      data.phaseX += data.phaseSpeedX
      positions[i * 3] += Math.sin(data.phaseX) * data.ampX
      if (positions[i * 3 + 1] > 25) {
        positions[i * 3 + 1] = -25
        positions[i * 3] = (Math.random() - 0.5) * 60
      }
    }
    particleSystem.geometry.attributes.position.needsUpdate = true

    // Update Orbs & Color Morphing
    orbs.forEach(orb => {
      orb.userData.angle += 0.002
      orb.position.x = orb.userData.originX + Math.sin(orb.userData.angle) * 5
      orb.position.y = orb.userData.originY + Math.cos(orb.userData.angle * 0.8) * 5
      
      orb.userData.colorPhase += 0.002
      const c1 = new THREE.Color(colors[orb.userData.baseColorIdx])
      const c2 = new THREE.Color(colors[(orb.userData.baseColorIdx + 1) % colors.length])
      const mix = (Math.sin(orb.userData.colorPhase) + 1) / 2
      orb.material.color.lerpColors(c1, c2, mix)
    })

    // Update Flow Lines
    flowLines.forEach(line => {
      line.userData.phase -= line.userData.speed
      const linePositions = line.geometry.attributes.position.array
      for (let j = 0; j < 60; j++) {
        const y = linePositions[j * 3 + 1]
        linePositions[j * 3] = line.userData.xOffset + Math.sin(y * line.userData.frequency + line.userData.phase) * line.userData.amplitude
      }
      line.geometry.attributes.position.needsUpdate = true
    })

    // Update Geometric Forms & Color Interpolation
    geometryMeshes.forEach(mesh => {
      mesh.rotation.x += mesh.userData.rotSpeedX
      mesh.rotation.y += mesh.userData.rotSpeedY
      mesh.rotation.z += mesh.userData.rotSpeedZ
      mesh.position.y += mesh.userData.moveSpeedY
      
      if (mesh.position.y > 30) {
        mesh.position.y = -30
        mesh.position.x = (Math.random() - 0.5) * 50
      }

      mesh.userData.colorPhase += 0.002
      const c1 = new THREE.Color(colors[mesh.userData.baseColorIdx])
      const c2 = new THREE.Color(colors[(mesh.userData.baseColorIdx + 1) % colors.length])
      const mix = (Math.sin(mesh.userData.colorPhase) + 1) / 2
      
      mesh.material.color.lerpColors(c1, c2, mix)
      // Edge color inverses the gradient for soft contrast
      mesh.children[0].material.color.lerpColors(c2, c1, mix)
    })

    renderer.render(scene, camera)
  }

  animate()

  // Resize Handler
  const onWindowResize = () => {
    const aspect = window.innerWidth / window.innerHeight
    camera.left = -viewSize * aspect / 2
    camera.right = viewSize * aspect / 2
    camera.top = viewSize / 2
    camera.bottom = -viewSize / 2
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onWindowResize)

  // Proper Disposal to prevent memory leaks in SPA navigation
  canvasContainer.value._cleanup = () => {
    window.removeEventListener('resize', onWindowResize)
    cancelAnimationFrame(animationId)
    renderer.dispose()
    
    particleSystem.geometry.dispose()
    particleMaterial.dispose()
    softTexture.dispose()
    
    orbs.forEach(orb => orb.material.dispose())
    flowLines.forEach(line => {
      line.geometry.dispose()
      line.material.dispose()
    })
    geometryMeshes.forEach(mesh => {
      mesh.geometry.dispose()
      mesh.material.dispose()
      mesh.children[0].geometry.dispose()
      mesh.children[0].material.dispose()
    })

    scene.clear()
  }
})

onBeforeUnmount(() => {
  if (canvasContainer.value && canvasContainer.value._cleanup) {
    canvasContainer.value._cleanup()
  }
})
</script>