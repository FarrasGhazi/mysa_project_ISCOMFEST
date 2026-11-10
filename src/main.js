import './style.css'
import * as THREE from 'three'

// ---------- 1. Ukuran ruangan (1 unit = 1 meter) ----------
const ROOM_W = 3      // lebar  (sumbu X)
const ROOM_D = 3      // dalam  (sumbu Z)
const ROOM_H = 2.5    // tinggi dinding (sumbu Y)
const WALL_T = 0.12   // tebal dinding

// ---------- 2. Scene dan renderer ----------
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x5b6770)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.getElementById('app').appendChild(renderer.domElement)

// ---------- 3. Kamera isometrik ----------
const VIEW_SIZE = 6 // makin kecil makin zoom-in
const target = new THREE.Vector3(ROOM_W / 2, 0.8, ROOM_D / 2)

const camera = new THREE.OrthographicCamera(0, 0, 0, 0, 0.1, 100)
camera.position.set(target.x + 10, target.y + 10, target.z + 10)
camera.lookAt(target)

function updateCamera() {
  const aspect = window.innerWidth / window.innerHeight
  camera.left = (-VIEW_SIZE * aspect) / 2
  camera.right = (VIEW_SIZE * aspect) / 2
  camera.top = VIEW_SIZE / 2
  camera.bottom = -VIEW_SIZE / 2
  camera.updateProjectionMatrix()
}
updateCamera()

// ---------- 4. Cahaya ----------
scene.add(new THREE.AmbientLight(0xffffff, 0.9))

const sun = new THREE.DirectionalLight(0xffffff, 1.6)
sun.position.set(6, 10, 4)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
scene.add(sun)

// ---------- 5. Fungsi pembuat kotak ----------
function makeBox(w, h, d, color, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color })
  )
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  scene.add(mesh)
  return mesh
}

// ---------- 6. Ruangan: lantai + 2 dinding ----------
const FLOOR_COLOR = 0xa57c5b
const WALL_COLOR = 0xff6b5e

// lantai: permukaan atas di y = 0, mencakup area 0..ROOM_W x 0..ROOM_D
makeBox(ROOM_W, 0.2, ROOM_D, FLOOR_COLOR, ROOM_W / 2, -0.1, ROOM_D / 2)

// dinding belakang (sepanjang X, di sisi z = 0)
makeBox(ROOM_W + WALL_T, ROOM_H, WALL_T, WALL_COLOR,
  (ROOM_W - WALL_T) / 2, ROOM_H / 2, -WALL_T / 2)

// dinding kiri (sepanjang Z, di sisi x = 0)
makeBox(WALL_T, ROOM_H, ROOM_D, WALL_COLOR,
  -WALL_T / 2, ROOM_H / 2, ROOM_D / 2)

// ---------- 7. Render ----------
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  updateCamera()
})

function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
animate()