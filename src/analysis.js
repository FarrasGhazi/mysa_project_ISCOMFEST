// analysis.js — menghitung jalur gerak (BFS), skor, dan menggambar peta warna di lantai.
import * as THREE from 'three'
import { scene } from './scene.js'
import { room, door, doorZone, CELL, CATALOG } from './config.js'
import { furniture, halfSize } from './furniture.js'

// ---------- Peta warna di lantai ----------
let heat = null          // { nx, nz, ctx, tex, mesh }
let heatVisible = false  // peta nonaktif saat halaman dibuka

export function setHeatVisible(visible) {
  heatVisible = visible
  if (heat) heat.mesh.visible = visible
}

// Buat peta baru kalau ukuran grid berubah (misalnya ruangan diubah ukurannya)
function ensureHeat(nx, nz) {
  if (heat && heat.nx === nx && heat.nz === nz) return heat
  if (heat) {
    scene.remove(heat.mesh)
    heat.mesh.geometry.dispose()
    heat.mesh.material.dispose()
    heat.tex.dispose()
  }
  const canvas = document.createElement('canvas')
  canvas.width = nx
  canvas.height = nz
  const tex = new THREE.CanvasTexture(canvas)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.colorSpace = THREE.SRGBColorSpace

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(room.w, room.d),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(room.w / 2, 0.005, room.d / 2)
  mesh.visible = heatVisible
  scene.add(mesh)

  heat = { nx, nz, ctx: canvas.getContext('2d'), tex, mesh }
  return heat
}

// jarak dari titik (px, pz) ke persegi r (0 jika di dalam)
function distToRect(px, pz, r) {
  const dx = Math.max(Math.abs(px - r.x) - r.hw, 0)
  const dz = Math.max(Math.abs(pz - r.z) - r.hd, 0)
  return Math.hypot(dx, dz)
}

// Hitung jalur gerak. Mengembalikan { status, text, score, notes } untuk ditampilkan panel.
export function analyze(walkMinCm) {
  const walkMin = Math.min(Math.max(walkMinCm || 60, 40), 80)
  const r = walkMin / 200 // jari-jari badan = setengah lebar jalur (meter)

  const nx = Math.round(room.w / CELL)
  const nz = Math.round(room.d / CELL)
  const zone = doorZone()

  const rects = furniture.map((f) => {
    const s = halfSize(f)
    return { x: f.position.x, z: f.position.z, hw: s.hw, hd: s.hd, label: CATALOG[f.userData.type].label }
  })

  const total = nx * nz
  const isFurn = new Uint8Array(total)
  const walkable = new Uint8Array(total)
  let emptyWalkable = 0

  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const px = (i + 0.5) * CELL
      const pz = (j + 0.5) * CELL
      const idx = j * nx + i
      const wallOK = px >= r && px <= room.w - r && pz >= r && pz <= room.d - r
      if (wallOK) emptyWalkable++
      let minDist = Infinity
      for (const rect of rects) minDist = Math.min(minDist, distToRect(px, pz, rect))
      isFurn[idx] = minDist === 0 ? 1 : 0
      walkable[idx] = wallOK && minDist >= r ? 1 : 0
    }
  }

  // BFS dari tengah area ayun pintu
  const si = Math.floor(door.x / CELL)
  const sj = Math.floor(Math.max(door.w / 2, r) / CELL)
  const start = sj * nx + si
  const reach = new Uint8Array(total)
  let reachCount = 0
  const doorOK = walkable[start] === 1
  if (doorOK) {
    const queue = [start]
    reach[start] = 1
    for (let head = 0; head < queue.length; head++) {
      const cur = queue[head]
      reachCount++
      const ci = cur % nx
      const cj = (cur - ci) / nx
      const neighbors = [
        ci > 0 ? cur - 1 : -1,
        ci < nx - 1 ? cur + 1 : -1,
        cj > 0 ? cur - nx : -1,
        cj < nz - 1 ? cur + nx : -1,
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
      const i = idx % nx
      const j = (idx - i) / nx
      if (distToRect((i + 0.5) * CELL, (j + 0.5) * CELL, rect) < r + CELL * 1.5) ok = true
    }
    if (!ok) blocked.push(rect.label)
  }

  const score = emptyWalkable ? Math.min(100, Math.round((100 * reachCount) / emptyWalkable)) : 0

  // Gambar peta: hijau = jalur, biru = area pintu, merah = ruang kosong terkurung
  const h = ensureHeat(nx, nz)
  const img = h.ctx.createImageData(nx, nz)
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const idx = j * nx + i
      const px = (i + 0.5) * CELL
      const pz = (j + 0.5) * CELL
      let color = null
      if (isFurn[idx]) color = null
      else if (Math.abs(px - zone.x) < zone.hw && pz < zone.z + zone.hd) color = [90, 150, 255, 120]
      else if (reach[idx]) color = [70, 200, 110, 110]
      else if (walkable[idx]) color = [230, 70, 60, 130]
      if (color) img.data.set(color, idx * 4)
    }
  }
  h.ctx.putImageData(img, 0, 0)
  h.tex.needsUpdate = true

  // Ringkasan untuk panel
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
  return { status, text, score: doorOK ? score : 0, notes }
}