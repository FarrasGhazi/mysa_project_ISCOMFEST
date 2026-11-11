import './style.css'
import * as THREE from 'three'

// ---------- 1. Ukuran ruangan dan pintu (1 unit = 1 meter) ----------
const ROOM_W = 3
const ROOM_D = 3
const ROOM_H = 2.5
const WALL_T = 0.12

const DOOR_W = 0.9
const DOOR_X = 2.35 // pusat pintu di sepanjang dinding belakang
// area ayun pintu: persegi 90 x 90 cm di depan pintu (tidak boleh ditempati furnitur)
const DOOR_ZONE = { x: DOOR_X, z: DOOR_W / 2, hw: DOOR_W / 2, hd: DOOR_W / 2 }

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

// ---------- 5. Ruangan dan pintu ----------
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

// pintu di dinding belakang (z = 0) + gagang
makeBox(DOOR_W, 2.0, 0.04, 0xf4efe6, DOOR_X, 1.0, 0.02)
makeBox(0.06, 0.06, 0.06, 0xd9a441, DOOR_X - 0.32, 1.0, 0.07)

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

// ---------- 7. Furnitur: geometri lantai, tabrakan, buat, hapus ----------
const furniture = []   // semua furnitur di ruangan
let selected = null
let dirty = true       // true = analisis jalur perlu dihitung ulang
const SNAP = 0.05

// Setengah lebar dan setengah dalam jejak furnitur di lantai (memperhitungkan putaran)
function halfSize(obj) {
  const { w, d } = obj.userData
  const turned = Math.abs(Math.round(obj.rotation.y / (Math.PI / 2))) % 2 === 1
  return turned ? { hw: d / 2, hd: w / 2 } : { hw: w / 2, hd: d / 2 }
}

// Batasi posisi (x, z) agar furnitur tetap di dalam dinding
function clampXZ(obj, x, z) {
  const { hw, hd } = halfSize(obj)
  return {
    x: Math.min(Math.max(x, hw), ROOM_W - hw),
    z: Math.min(Math.max(z, hd), ROOM_D - hd),
  }
}

// Apakah obj di posisi (x, z) bertabrakan dengan furnitur lain atau area pintu?
function collides(obj, x, z) {
  const { hw, hd } = halfSize(obj)
  const EPS = 0.001
  const overlap = (r) =>
    Math.abs(x - r.x) < hw + r.hw - EPS && Math.abs(z - r.z) < hd + r.hd - EPS
  if (overlap(DOOR_ZONE)) return true
  for (const other of furniture) {
    if (other === obj) continue
    const s = halfSize(other)
    if (overlap({ x: other.position.x, z: other.position.z, hw: s.hw, hd: s.hd })) return true
  }
  return false
}

// Cari tempat kosong terdekat dari tengah ruangan
function findFreeSpot(obj) {
  const { hw, hd } = halfSize(obj)
  let best = null
  let bestDist = Infinity
  for (let x = hw; x <= ROOM_W - hw + 1e-6; x += SNAP) {
    for (let z = hd; z <= ROOM_D - hd + 1e-6; z += SNAP) {
      if (collides(obj, x, z)) continue
      const dist = Math.hypot(x - ROOM_W / 2, z - ROOM_D / 2)
      if (dist < bestDist) { bestDist = dist; best = { x, z } }
    }
  }
  return best
}

function disposeChildren(group) {
  for (const child of [...group.children]) {
    group.remove(child)
    child.geometry.dispose()
    child.material.dispose()
  }
}

function rebuild(group) {
  const { type, w, d, h } = group.userData
  disposeChildren(group)
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

function addFurniture(type, at) {
  const def = CATALOG[type]
  const group = new THREE.Group()
  group.userData = { type, w: def.w, d: def.d, h: def.h }
  rebuild(group)

  let spot = null
  if (at) {
    const c = clampXZ(group, at.x, at.z)
    if (!collides(group, c.x, c.z)) spot = c
  }
  if (!spot) spot = findFreeSpot(group)
  if (!spot) {
    disposeChildren(group)
    toast('Ruangan penuh, tidak ada tempat kosong')
    return null
  }

  group.position.set(spot.x, 0, spot.z)
  scene.add(group)
  furniture.push(group)
  select(group)
  dirty = true
  return group
}

function removeFurniture(group) {
  scene.remove(group)
  disposeChildren(group)
  furniture.splice(furniture.indexOf(group), 1)
  select(null)
  dirty = true
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
  marker.position.set(selected.position.x, 0.007, selected.position.z)
  marker.rotation.y = selected.rotation.y
  marker.scale.set(w + 0.1, 1, d + 0.1)
}

// ---------- 9. Panel UI ----------
const editBox = document.getElementById('edit')
const selName = document.getElementById('sel-name')
const inW = document.getElementById('in-w')
const inD = document.getElementById('in-d')
const inH = document.getElementById('in-h')
const inWalk = document.getElementById('in-walk')
const chkHeat = document.getElementById('chk-heat')
const verdictEl = document.getElementById('verdict')
const scoreEl = document.getElementById('score')
const notesEl = document.getElementById('notes')
const toastEl = document.getElementById('toast')

let toastTimer
function toast(message) {
  toastEl.textContent = message
  toastEl.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200)
}

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
  const oldSize = { ...u }
  const oldPos = selected.position.clone()

  u.w = readSize(inW, 30, 300, u.w)
  u.d = readSize(inD, 30, 300, u.d)
  u.h = readSize(inH, 10, 300, u.h)
  rebuild(selected)
  const c = clampXZ(selected, selected.position.x, selected.position.z)
  selected.position.x = c.x
  selected.position.z = c.z

  if (collides(selected, c.x, c.z)) {
    Object.assign(u, oldSize)       // batalkan: ukuran baru bertabrakan
    rebuild(selected)
    selected.position.copy(oldPos)
    toast('Ukuran baru bertabrakan, dibatalkan')
  }
  select(selected)
  dirty = true
}
for (const input of [inW, inD, inH]) input.addEventListener('change', applySize)

document.getElementById('btn-rotate').addEventListener('click', () => {
  if (!selected) return
  selected.rotation.y += Math.PI / 2
  const c = clampXZ(selected, selected.position.x, selected.position.z)
  if (collides(selected, c.x, c.z)) {
    selected.rotation.y -= Math.PI / 2
    toast('Tidak muat kalau diputar di sini')
    return
  }
  selected.position.x = c.x
  selected.position.z = c.z
  dirty = true
})
document.getElementById('btn-delete').addEventListener('click', () => {
  if (selected) removeFurniture(selected)
})
document.querySelectorAll('[data-type]').forEach((btn) => {
  btn.addEventListener('click', () => addFurniture(btn.dataset.type))
})
inWalk.addEventListener('change', () => { dirty = true })
chkHeat.addEventListener('change', () => { heatMesh.visible = chkHeat.checked })

// ---------- 10. Drag furnitur ----------
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
  const nx = Math.round((hitPoint.x + grabOffset.x) / SNAP) * SNAP
  const nz = Math.round((hitPoint.z + grabOffset.z) / SNAP) * SNAP
  const c = clampXZ(dragging, nx, nz)
  const p = dragging.position
  // coba gerak penuh; kalau tabrakan, coba hanya sumbu X, lalu hanya sumbu Z
  if (!collides(dragging, c.x, c.z)) { p.x = c.x; p.z = c.z }
  else if (!collides(dragging, c.x, p.z)) { p.x = c.x }
  else if (!collides(dragging, p.x, c.z)) { p.z = c.z }
  dirty = true
})

function endDrag(event) {
  if (!dragging) return
  dragging = null
  renderer.domElement.releasePointerCapture(event.pointerId)
  renderer.domElement.style.cursor = 'grab'
}
renderer.domElement.addEventListener('pointerup', endDrag)
renderer.domElement.addEventListener('pointercancel', endDrag)

// ---------- 11. Analisis jalur gerak (BFS) dan peta ----------
const CELL = 0.05
const NX = Math.round(ROOM_W / CELL)
const NZ = Math.round(ROOM_D / CELL)

const heatCanvas = document.createElement('canvas')
heatCanvas.width = NX
heatCanvas.height = NZ
const heatCtx = heatCanvas.getContext('2d')
const heatTex = new THREE.CanvasTexture(heatCanvas)
heatTex.magFilter = THREE.NearestFilter
heatTex.minFilter = THREE.NearestFilter
heatTex.colorSpace = THREE.SRGBColorSpace

const heatMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM_W, ROOM_D),
  new THREE.MeshBasicMaterial({ map: heatTex, transparent: true, depthWrite: false })
)
heatMesh.rotation.x = -Math.PI / 2
heatMesh.position.set(ROOM_W / 2, 0.005, ROOM_D / 2)
scene.add(heatMesh)

// jarak dari titik (px, pz) ke persegi r (0 jika di dalam)
function distToRect(px, pz, r) {
  const dx = Math.max(Math.abs(px - r.x) - r.hw, 0)
  const dz = Math.max(Math.abs(pz - r.z) - r.hd, 0)
  return Math.hypot(dx, dz)
}

function analyze() {
  const walkMin = Math.min(Math.max(parseFloat(inWalk.value) || 60, 40), 80)
  const r = walkMin / 200 // jari-jari badan = setengah lebar jalur (meter)

  const rects = furniture.map((f) => {
    const s = halfSize(f)
    return { x: f.position.x, z: f.position.z, hw: s.hw, hd: s.hd, label: CATALOG[f.userData.type].label }
  })

  const total = NX * NZ
  const isFurn = new Uint8Array(total)
  const walkable = new Uint8Array(total)
  let emptyWalkable = 0

  for (let j = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++) {
      const px = (i + 0.5) * CELL
      const pz = (j + 0.5) * CELL
      const idx = j * NX + i
      const wallOK = px >= r && px <= ROOM_W - r && pz >= r && pz <= ROOM_D - r
      if (wallOK) emptyWalkable++
      let minDist = Infinity
      for (const rect of rects) minDist = Math.min(minDist, distToRect(px, pz, rect))
      isFurn[idx] = minDist === 0 ? 1 : 0
      walkable[idx] = wallOK && minDist >= r ? 1 : 0
    }
  }

  // BFS dari tengah area ayun pintu
  const si = Math.floor(DOOR_X / CELL)
  const sj = Math.floor(Math.max(DOOR_W / 2, r) / CELL)
  const start = sj * NX + si
  const reach = new Uint8Array(total)
  let reachCount = 0
  const doorOK = walkable[start] === 1
  if (doorOK) {
    const queue = [start]
    reach[start] = 1
    for (let head = 0; head < queue.length; head++) {
      const cur = queue[head]
      reachCount++
      const ci = cur % NX
      const cj = (cur - ci) / NX
      const neighbors = [
        ci > 0 ? cur - 1 : -1,
        ci < NX - 1 ? cur + 1 : -1,
        cj > 0 ? cur - NX : -1,
        cj < NZ - 1 ? cur + NX : -1,
      ]
      for (const n of neighbors) {
        if (n >= 0 && walkable[n] && !reach[n]) { reach[n] = 1; queue.push(n) }
      }
    }
  }

  // Furnitur terjangkau jika ada sel jalur di sampingnya
  const blocked = []
  for (const rect of rects) {
    let ok = false
    for (let idx = 0; idx < total && !ok; idx++) {
      if (!reach[idx]) continue
      const i = idx % NX
      const j = (idx - i) / NX
      if (distToRect((i + 0.5) * CELL, (j + 0.5) * CELL, rect) < r + CELL * 1.5) ok = true
    }
    if (!ok) blocked.push(rect.label)
  }

  const score = emptyWalkable ? Math.min(100, Math.round((100 * reachCount) / emptyWalkable)) : 0

  // Gambar peta: hijau = jalur, biru = area pintu, merah = ruang kosong terkurung
  const img = heatCtx.createImageData(NX, NZ)
  for (let j = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++) {
      const idx = j * NX + i
      const px = (i + 0.5) * CELL
      const pz = (j + 0.5) * CELL
      let color = null
      if (isFurn[idx]) color = null
      else if (Math.abs(px - DOOR_ZONE.x) < DOOR_ZONE.hw && pz < DOOR_W) color = [90, 150, 255, 120]
      else if (reach[idx]) color = [70, 200, 110, 110]
      else if (walkable[idx]) color = [230, 70, 60, 130]
      if (color) img.data.set(color, idx * 4)
    }
  }
  heatCtx.putImageData(img, 0, 0)
  heatTex.needsUpdate = true

  // Hasil di panel
  let status, text
  const notes = [`Jalur dianggap muat jika lebarnya minimal ${walkMin} cm`]
  if (!doorOK) {
    status = 'bad'; text = 'Pintu terhalang'
    notes.push('Tidak ada ruang untuk melangkah masuk dari pintu')
  } else if (blocked.length > 0) {
    status = 'bad'; text = 'Ada yang tak terjangkau'
    for (const label of blocked) notes.push(`${label} tidak bisa dijangkau dari pintu`)
  } else if (score >= 50) {
    status = 'good'; text = 'Lega'
  } else if (score >= 30) {
    status = 'warn'; text = 'Cukup padat'
  } else {
    status = 'bad'; text = 'Sesak'
  }
  verdictEl.className = `badge ${status}`
  verdictEl.textContent = text
  scoreEl.textContent = `Skor kelegaan: ${doorOK ? score : 0}%`
  notesEl.innerHTML = notes.map((n) => `<li>${n}</li>`).join('')
}

// ---------- 12. Isi awal dan render ----------
addFurniture('bed', { x: 0.45, z: 1.0 })
select(null)

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  updateCamera()
})

function animate() {
  requestAnimationFrame(animate)
  if (dirty) { analyze(); dirty = false }
  updateMarker()
  renderer.render(scene, camera)
}
animate()