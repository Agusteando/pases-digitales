<template>
  <div ref="canvasContainer" class="fixed inset-0 z-0 pointer-events-none opacity-50"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'

const canvasContainer = ref(null)
let scene, camera, renderer, animationId
const objects = []

onMounted(() => {
  if (!canvasContainer.value) return

  // Scene Setup
  scene = new THREE.Scene()
  
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.z = 15

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Limit pixel ratio for performance
  canvasContainer.value.appendChild(renderer.domElement)

  // Institutional Colors
  const colors = [
    0x618B2F, // Casita Green
    0x8EC152, // Casita Light Green
    0x007F92, // IEDIS Teal
    0x5FB4A9, // IEDIS Light Teal
    0x66A8D8, // IEDIS Blue
    0xF49A6D, // Casita Peach
    0xFCBF2C  // IEDIS Yellow
  ]

  // Arrow Geometry (Upward flowing abstract arrow)
  const arrowShape = new THREE.Shape()
  arrowShape.moveTo(0, 0.5)
  arrowShape.lineTo(0.5, 0)
  arrowShape.lineTo(0.2, 0)
  arrowShape.lineTo(0.2, -0.5)
  arrowShape.lineTo(-0.2, -0.5)
  arrowShape.lineTo(-0.2, 0)
  arrowShape.lineTo(-0.5, 0)
  arrowShape.closePath()

  const extrudeSettings = {
    depth: 0.15,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.05,
    bevelThickness: 0.05
  }
  const arrowGeo = new THREE.ExtrudeGeometry(arrowShape, extrudeSettings)
  arrowGeo.center()

  // Campus/Rounded Box Geometry
  const boxGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8)
  const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32)
  const capsuleGeo = new THREE.CapsuleGeometry(0.3, 0.6, 4, 16)

  const geometries = [arrowGeo, arrowGeo, capsuleGeo, boxGeo, sphereGeo]

  // Create Particles
  for (let i = 0; i < 20; i++) {
    const geometry = geometries[Math.floor(Math.random() * geometries.length)]
    const color = colors[Math.floor(Math.random() * colors.length)]

    // Beautiful soft glassy/translucent material
    const material = new THREE.MeshPhysicalMaterial({
      color: color,
      metalness: 0.1,
      roughness: 0.3,
      transmission: 0.9, // glass-like
      thickness: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.8
    })

    const mesh = new THREE.Mesh(geometry, material)
    
    // Spread across a wide area
    mesh.position.x = (Math.random() - 0.5) * 30
    mesh.position.y = (Math.random() - 0.5) * 20 - 5
    mesh.position.z = (Math.random() - 0.5) * 10 - 5

    // Random initial rotation
    mesh.rotation.x = Math.random() * Math.PI
    mesh.rotation.y = Math.random() * Math.PI
    mesh.rotation.z = Math.random() * Math.PI

    // Custom animation data
    mesh.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.005,
        Math.random() * 0.015 + 0.005, // Always float up slowly
        (Math.random() - 0.5) * 0.005
      ),
      rotSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01
      )
    }

    scene.add(mesh)
    objects.push(mesh)
  }

  // Soft Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.0)
  scene.add(ambientLight)

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.5)
  dirLight1.position.set(5, 10, 7)
  scene.add(dirLight1)

  const dirLight2 = new THREE.DirectionalLight(0xeef2ff, 1.5)
  dirLight2.position.set(-5, -5, -5)
  scene.add(dirLight2)

  // Animation Loop
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    objects.forEach(mesh => {
      // Move
      mesh.position.add(mesh.userData.velocity)
      // Rotate
      mesh.rotation.x += mesh.userData.rotSpeed.x
      mesh.rotation.y += mesh.userData.rotSpeed.y
      mesh.rotation.z += mesh.userData.rotSpeed.z

      // Reset to bottom if it floats too high
      if (mesh.position.y > 15) {
        mesh.position.y = -15
        mesh.position.x = (Math.random() - 0.5) * 30
      }
    })

    // Slight gentle camera breathing
    camera.position.y = Math.sin(Date.now() * 0.0005) * 0.5
    camera.lookAt(0, 0, 0)

    renderer.render(scene, camera)
  }

  animate()

  // Resize Handler
  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onWindowResize)

  // Cleanup attachment to prevent memory leaks
  canvasContainer.value._cleanup = () => {
    window.removeEventListener('resize', onWindowResize)
    cancelAnimationFrame(animationId)
    renderer.dispose()
    scene.clear()
  }
})

onBeforeUnmount(() => {
  if (canvasContainer.value && canvasContainer.value._cleanup) {
    canvasContainer.value._cleanup()
  }
})
</script>