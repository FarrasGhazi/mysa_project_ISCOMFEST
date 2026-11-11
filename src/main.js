import './style.css'
import * as THREE from 'three'

// ---------- 1. Ukuran ruangan (1 unit = 1 meter) ----------
const ROOM_W = 3
const ROOM_D = 3
const ROOM_H = 2.5
const WALL_T = 0.12

// ---------- 2. Scene dan renderer ----------
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x5b6770)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.getElementById('app').appendChild(renderer.domElement)

// ---------- 3. Kamera isometrik ----------
const VIEW_SIZE = 6
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
scene.add(new THREE.AmbientLight(0xffffff, 1.3))
const sun = new THREE.DirectionalLight(0xffffff, 1.6)
sun.position.set(6, 10, 4)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
scene.add(sun)

// ---------- 5. Ruangan ----------
const FLOOR_COLOR = 0xb98b66
const WALL_COLOR = 0xff7566

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

makeBox(ROOM_W, 0.2, ROOM_D, FLOOR_COLOR, ROOM_W / 2, -0.1, ROOM_D / 2)
makeBox(ROOM_W + WALL_T, ROOM_H, WALL_T, WALL_COLOR,
  (ROOM_W - WALL_T) / 2, ROOM_H / 2, -WALL_T / 2)
makeBox(WALL_T, ROOM_H, ROOM_D, WALL_COLOR,
  -WALL_T / 2, ROOM_H / 2, ROOM_D / 2)

// ---------- 6. Katalog furnitur (ukuran bawaan, meter) ----------
const CATALOG = {
  bed:      { label: 'Kasur',        w: 0.9, d: 2.0, h: 0.5 },
  desk:     { label: 'Meja belajar', w: 1.2, d: 0.6, h: 0.75 },
  wardrobe: { label: 'Lemari',       w: 0.9, d: 0.5, h: 1.8 },
  chair:    { label: 'Kursi',        w: 0.4, d: 0.4, h: 0.9 },
}

// Daftar kotak penyusun tiap furnitur. Posisi relatif ke pusat di lantai.
function getParts(type, w, d, h) {
  if (type === 'bed') {
    const fh = h * 0.5
    const mh = h * 0.5
    return [
      { w, h: fh, d, x: 0, y: fh / 2, z: 0, color: 0x6b4a32 },
      { w: w - 0.06, h: mh, d: d - 0.06, x: 0, y: fh + mh / 2, z: 0, color: 0xf2ead8 },
      { w: Math.max(w - 0.3, 0.2), h: 0.1, d: 0.35, x: 0, y: fh + mh + 0.05,
        z: -d / 2 + 0.3, color: 0xffffff },
    ]
  }
  if (type === 'desk') {
    const t = 0.04, leg = 0.05, lh = h - t
    const ix = w / 2 - leg / 2 - 0.02
    const iz = d / 2 - leg / 2 - 0.02
    const parts = [{ w, h: t, d, x: 0, y: h - t / 2, z: 0, color: 0xd9b382 }]
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        parts.push({ w: leg, h: lh, d: leg, x: sx * ix, y: lh / 2, z: sz * iz, color: 0x5a4030 })
      }
    }
    return parts
  }
  if (type === 'wardrobe') {
    return [
      { w, h, d, x: 0, y: h / 2, z: 0, color: 0xefe6d2 },
      { w: 0.02, h: h * 0.92, d: 0.01, x: 0, y: h / 2, z: d / 2 + 0.005, color: 0x8a7a62 },
    ]
  }
  // kursi
  const t = 0.05, seatY = h * 0.5, leg = 0.04, lh = seatY - t
  const ix = w / 2 - leg / 2
  const iz = d / 2 - leg / 2
  const parts = [
    { w, h: t, d, x: 0, y: seatY - t / 2, z: 0, color: 0xc9a06c },
    { w, h: h - seatY, d: 0.05, x: 0, y: seatY + (h - seatY) / 2, z: -d / 2 + 0.025, color: 0xc9a06c },
  ]
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      parts.push({ w: leg, h: lh, d: leg, x: sx * ix, y: lh / 2, z: sz * iz, color: 0x5a4030 })
    }
  }
  return parts
}

// ---------- 7. Furnitur: buat, bangun ulang, hapus ----------
const furniture = []   // semua furnitur di ruangan
let selected = null

function rebuild(group) {
  const { type, w, d, h } = group.userData
  for (const child of [...group.children]) {
    group.remove(child)
    child.geometry.dispose()
    child.material.dispose()
  }
  for (const p of getParts(type, w, d, h)) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(p.w, p.h, p.d),
      new THREE.MeshStandardMaterial({ color: p.color })
    )
    mesh.position.set(p.x, p.y, p.z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }
}

function addFurniture(type, x = ROOM_W / 2, z = ROOM_D / 2) {
  const def = CATALOG[type]
  const group = new THREE.Group()
  group.userData = { type, w: def.w, d: def.d, h: def.h }
  rebuild(group)
  group.position.set(x, 0, z)
  scene.add(group)
  furniture.push(group)
  clampToRoom(group)
  select(group)
  return group
}

function removeFurniture(group) {
  scene.remove(group)
  for (const child of group.children) {
    child.geometry.dispose()
    child.material.dispose()
  }
  furniture.splice(furniture.indexOf(group), 1)
  select(null)
}

function clampToRoom(obj) {
  const box = new THREE.Box3().setFromObject(obj)
  const halfW = (box.max.x - box.min.x) / 2
  const halfD = (box.max.z - box.min.z) / 2
  obj.position.x = Math.min(Math.max(obj.position.x, halfW), ROOM_W - halfW)
  obj.position.z = Math.min(Math.max(obj.position.z, halfD), ROOM_D - halfD)
}

// ---------- 8. Bingkai penanda furnitur terpilih ----------
const marker = new THREE.Mesh(
  new THREE.BoxGeometry(1, 0.01, 1),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false })
)
marker.visible = false
scene.add(marker)

function updateMarker() {
  if (!selected) { marker.visible = false; return }
  const { w, d } = selected.userData
  marker.visible = true
  marker.position.set(selected.position.x, 0.006, selected.position.z)
  marker.rotation.y = selected.rotation.y
  marker.scale.set(w + 0.1, 1, d + 0.1)
}

// ---------- 9. Panel UI ----------
const editBox = document.getElementById('edit')
const selName = document.getElementById('sel-name')
const inW = document.getElementById('in-w')
const inD = document.getElementById('in-d')
const inH = document.getElementById('in-h')

function select(obj) {
  selected = obj
  if (!obj) { editBox.hidden = true; return }
  const { type, w, d, h } = obj.userData
  editBox.hidden = false
  selName.textContent = CATALOG[type].label
  inW.value = Math.round(w * 100)
  inD.value = Math.round(d * 100)
  inH.value = Math.round(h * 100)
}

function readSize(input, min, max, fallback) {
  const cm = parseFloat(input.value)
  if (Number.isNaN(cm)) return fallback
  return Math.min(Math.max(cm, min), max) / 100
}

function applySize() {
  if (!selected) return
  const u = selected.userData
  u.w = readSize(inW, 30, 300, u.w)
  u.d = readSize(inD, 30, 300, u.d)
  u.h = readSize(inH, 10, 300, u.h)
  rebuild(selected)
  clampToRoom(selected)
  select(selected) // segarkan isi kolom (setelah dibatasi min/max)
}
for (const input of [inW, inD, inH]) input.addEventListener('change', applySize)

document.getElementById('btn-rotate').addEventListener('click', () => {
  if (!selected) return
  selected.rotation.y += Math.PI / 2
  clampToRoom(selected)
})
document.getElementById('btn-delete').addEventListener('click', () => {
  if (selected) removeFurniture(selected)
})
document.querySelectorAll('[data-type]').forEach((btn) => {
  btn.addEventListener('click', () => addFurniture(btn.dataset.type))
})

// ---------- 10. Drag furnitur ----------
const SNAP = 0.05
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const hitPoint = new THREE.Vector3()
let dragging = null
const grabOffset = new THREE.Vector3()

function setPointer(event) {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  setPointer(event)
  const hits = raycaster.intersectObjects(furniture, true)
  if (hits.length === 0) { select(null); return }
  let obj = hits[0].object
  while (obj.parent && !furniture.includes(obj)) obj = obj.parent
  select(obj)
  dragging = obj
  raycaster.ray.intersectPlane(floorPlane, hitPoint)
  grabOffset.set(obj.position.x - hitPoint.x, 0, obj.position.z - hitPoint.z)
  renderer.domElement.setPointerCapture(event.pointerId)
  renderer.domElement.style.cursor = 'grabbing'
})

renderer.domElement.addEventListener('pointermove', (event) => {
  setPointer(event)
  if (!dragging) {
    renderer.domElement.style.cursor =
      raycaster.intersectObjects(furniture, true).length > 0 ? 'grab' : 'default'
    return
  }
  if (!raycaster.ray.intersectPlane(floorPlane, hitPoint)) return
  dragging.position.x = Math.round((hitPoint.x + grabOffset.x) / SNAP) * SNAP
  dragging.position.z = Math.round((hitPoint.z + grabOffset.z) / SNAP) * SNAP
  clampToRoom(dragging)
})

function endDrag(event) {
  if (!dragging) return
  dragging = null
  renderer.domElement.releasePointerCapture(event.pointerId)
  renderer.domElement.style.cursor = 'grab'
}
renderer.domElement.addEventListener('pointerup', endDrag)
renderer.domElement.addEventListener('pointercancel', endDrag)

// ---------- 11. Isi awal dan render ----------
addFurniture('bed', 0.45, 1.0)
select(null)

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  updateCamera()
})

function animate() {
  requestAnimationFrame(animate)
  updateMarker()
  renderer.render(scene, camera)
}
animate()